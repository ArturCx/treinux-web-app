import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sentenceCase } from "@/lib/catalog";
import { splitFichaName } from "@/lib/ficha-stats";
import { parseSnapshot } from "./snapshot";
import { MiniStamp, Tape } from "@/components/zine";

/*
 * A sessão impressa (40-historico): as leituras do instrumento publicadas
 * numa folha de papel — tabela em mono (única aparição de mono sobre papel
 * no sistema) sob o carimbo CONCLUÍDO. O aperto de mão escuro → papel.
 */

export type SessionPrintData = {
  id: string;
  fichaId: string | null;
  fichaName: string;
  startedAt: Date;
  finishedAt: Date | null;
  rows: {
    exerciseId: string;
    name: string;
    done: number;
    prescribed: number;
    reps: string;
    weight: string;
  }[];
  totalDone: number;
  totalPrescribed: number;
  minutes: number;
  volume: number;
  avgRestSeconds: number | null;
};

/** Monta os dados da folha a partir de um log (escopado ao dono). */
export async function loadSessionPrint(
  logId: string,
  userId: string,
): Promise<SessionPrintData | null> {
  const log = await prisma.workoutLog.findFirst({
    where: { id: logId, userId },
    select: {
      id: true,
      startedAt: true,
      finishedAt: true,
      snapshot: true,
      ficha: {
        select: {
          id: true,
          name: true,
          exercises: {
            orderBy: { order: "asc" },
            select: {
              exerciseId: true,
              sets: true,
              exercise: { select: { name: true, namePt: true } },
            },
          },
        },
      },
      entries: {
        orderBy: { setNumber: "asc" },
        select: {
          exerciseId: true,
          setNumber: true,
          weightKg: true,
          reps: true,
          completedAt: true,
        },
      },
    },
  });
  if (!log) return null;

  const byExercise = new Map<string, typeof log.entries>();
  for (const e of log.entries) {
    const list = byExercise.get(e.exerciseId) ?? [];
    list.push(e);
    byExercise.set(e.exerciseId, list);
  }

  // A prescrição da folha: o snapshot congelado ao finalizar. Logs antigos
  // (sem snapshot) caem na ficha atual, mas ignorando exercícios sem nenhuma
  // série — senão itens adicionados à ficha DEPOIS da sessão contariam 0/N.
  const snapshot = parseSnapshot(log.snapshot);
  const prescription =
    snapshot ??
    (log.ficha?.exercises ?? [])
      .filter((fe) => byExercise.has(fe.exerciseId))
      .map((fe) => ({
        exerciseId: fe.exerciseId,
        name: sentenceCase(fe.exercise.namePt ?? fe.exercise.name),
        sets: fe.sets,
      }));

  // nomes de exercícios registrados fora da prescrição da folha
  const prescribedIds = new Set(prescription.map((p) => p.exerciseId));
  const orphanIds = [...byExercise.keys()].filter((id) => !prescribedIds.has(id));
  const orphans = orphanIds.length
    ? await prisma.exercise.findMany({
        where: { id: { in: orphanIds } },
        select: { id: true, name: true, namePt: true },
      })
    : [];
  const orphanName = new Map(
    orphans.map((e) => [e.id, sentenceCase(e.namePt ?? e.name)]),
  );

  const rows: SessionPrintData["rows"] = [];
  for (const p of prescription) {
    const entries = byExercise.get(p.exerciseId) ?? [];
    rows.push({
      exerciseId: p.exerciseId,
      name: p.name,
      done: entries.length,
      prescribed: p.sets,
      reps: formatReps(entries),
      weight: formatWeights(entries),
    });
  }
  for (const id of orphanIds) {
    const entries = byExercise.get(id) ?? [];
    rows.push({
      exerciseId: id,
      name: orphanName.get(id) ?? id,
      done: entries.length,
      prescribed: entries.length,
      reps: formatReps(entries),
      weight: formatWeights(entries),
    });
  }

  const totalDone = log.entries.length;
  const totalPrescribed = rows.reduce((s, r) => s + r.prescribed, 0);
  const volume = log.entries.reduce(
    (s, e) => s + (e.weightKg ? Number(e.weightKg) : 0) * (e.reps ?? 0),
    0,
  );
  const minutes = log.finishedAt
    ? Math.max(1, Math.round((log.finishedAt.getTime() - log.startedAt.getTime()) / 60000))
    : 0;

  return {
    id: log.id,
    fichaId: log.ficha?.id ?? null,
    fichaName: log.ficha?.name ?? "Treino",
    startedAt: log.startedAt,
    finishedAt: log.finishedAt,
    rows,
    totalDone,
    totalPrescribed,
    minutes,
    volume,
    avgRestSeconds: averageRest(log.entries),
  };
}

/**
 * Descanso médio = média dos intervalos entre séries consecutivas (ordem
 * cronológica de registro). Intervalos > 10 min são descartados (pausa longa
 * fora do treino), assim como sessões sem timestamps suficientes.
 */
function averageRest(entries: { completedAt: Date | null }[]): number | null {
  const times = entries
    .map((e) => e.completedAt?.getTime())
    .filter((t): t is number => typeof t === "number")
    .sort((a, b) => a - b);
  if (times.length < 2) return null;

  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++) {
    const gap = (times[i] - times[i - 1]) / 1000;
    if (gap > 0 && gap <= 600) gaps.push(gap);
  }
  if (gaps.length === 0) return null;
  return Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
}

type Entry = { weightKg: unknown; reps: number | null };

function formatReps(entries: Entry[]) {
  if (entries.length === 0) return "—";
  return entries.map((e) => (e.reps === null ? "·—" : String(e.reps))).join("·").replace(/^·/, "");
}

function formatWeights(entries: Entry[]) {
  const weights = entries
    .map((e) => (e.weightKg === null ? null : Number(e.weightKg)))
    .filter((w): w is number => w !== null && Number.isFinite(w) && w > 0);
  if (weights.length === 0) return "corp.";
  const uniq = [...new Set(weights.map((w) => w.toLocaleString("pt-BR", { maximumFractionDigits: 2 })))];
  return `${uniq.join("·")}kg`;
}

/** A folha impressa em si. */
export function SessionPrint({
  data,
  kicker,
  showActions = true,
}: {
  data: SessionPrintData;
  kicker: string;
  showActions?: boolean;
}) {
  const [head, tail] = splitFichaName(data.fichaName);
  const complete = data.totalDone >= data.totalPrescribed && data.totalPrescribed > 0;

  return (
    <section
      aria-label="Resumo da sessão"
      className="relative overflow-hidden border border-paper-edge bg-paper-deep px-[18px] pt-6 pb-5 lg:px-6 lg:pt-7"
    >
      <Tape className="-top-[13px] left-6 z-[2] w-[104px] -rotate-2" />
      <MiniStamp
        className={`absolute top-1.5 -right-3.5 z-[1] rotate-[9deg] border-4 px-[18px] py-1 text-[30px] tracking-[0.18em] opacity-75 ${
          complete ? "" : "border-clay text-clay"
        }`}
      >
        {complete ? "Concluído" : "Parcial"}
      </MiniStamp>

      <div className="text-[11px] font-bold tracking-[0.16em] text-muted uppercase">{kicker}</div>
      <h2 className="mt-1 pr-24 text-[24px] leading-[1.1] font-bold tracking-[-0.02em] lg:text-[27px]">
        {head}
        {tail && <span className="text-ember"> {tail}</span>}
      </h2>
      <div className="mt-2 font-mono text-[12px] text-muted tabular-nums">
        {formatSpan(data.startedAt, data.finishedAt)}
      </div>

      <div className="mt-4 border-t-2 border-ink">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              <Th>Exercício</Th>
              <Th>Séries</Th>
              <Th>Reps</Th>
              <Th right>Peso</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.exerciseId}>
                <td className="w-full border-b border-paper-edge py-2.5 pr-2 align-baseline text-[13.5px] font-bold tracking-[-0.01em]">
                  {r.name}
                </td>
                <td className="border-b border-paper-edge py-2.5 pr-2 align-baseline font-mono text-[12.5px] whitespace-nowrap text-ink-soft tabular-nums">
                  <b className="font-bold text-ink">{r.done}</b>/{r.prescribed}
                </td>
                <td className="border-b border-paper-edge py-2.5 pr-2 align-baseline font-mono text-[12.5px] text-ink-soft tabular-nums">
                  {r.reps}
                </td>
                <td className="border-b border-paper-edge py-2.5 text-right align-baseline font-mono text-[12.5px] text-ink-soft tabular-nums">
                  {r.weight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2.5">
        <Total>
          <i className="text-ember not-italic">{data.totalDone}</i>/{data.totalPrescribed} séries
        </Total>
        {data.minutes > 0 && (
          <Total>
            <i className="text-ember not-italic">{data.minutes}</i> min
          </Total>
        )}
        {data.volume > 0 && (
          <Total>
            volume <i className="text-ember not-italic">{Math.round(data.volume)}</i> kg
          </Total>
        )}
        {data.avgRestSeconds !== null && (
          <Total>
            descanso médio <i className="text-ember not-italic">{formatRest(data.avgRestSeconds)}</i>
          </Total>
        )}
      </div>

      {showActions && (
        <div className="mt-[18px] flex items-center gap-3">
          {data.fichaId && (
            <Link
              href={`/fichas/${data.fichaId}`}
              className="flex min-h-[52px] items-center gap-2 bg-ink px-[22px] text-[14.5px] font-bold text-paper shadow-[5px_5px_0_var(--color-riso)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-riso)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_var(--color-riso)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              Ver ficha <i className="text-ember not-italic">→</i>
            </Link>
          )}
          <Link
            href="/treino"
            className="flex min-h-[52px] items-center px-3 text-[14px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Voltar
          </Link>
        </div>
      )}
    </section>
  );
}

function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={`border-b border-paper-edge py-2.5 pb-1.5 text-[10px] font-bold tracking-[0.14em] text-muted uppercase ${
        right ? "text-right" : "pr-2 text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Total({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-ink bg-paper px-2.5 py-1 font-mono text-[12px] font-bold tabular-nums">
      {children}
    </span>
  );
}

function formatSpan(start: Date, end: Date | null) {
  const day = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(start)
    .replaceAll(".", "");
  const cap = day.charAt(0).toUpperCase() + day.slice(1);
  const time = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);
  return end ? `${cap} · ${time(start)} → ${time(end)}` : `${cap} · iniciado às ${time(start)}`;
}

/** Descanso médio no formato M:SS (ex.: 1:24). */
function formatRest(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
