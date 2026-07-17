import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sentenceCase } from "@/lib/catalog";
import { WorkoutSession } from "./workout-session";

export default async function TreinoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const log = await prisma.workoutLog.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      startedAt: true,
      finishedAt: true,
      ficha: {
        select: {
          id: true,
          name: true,
          exercises: {
            orderBy: { order: "asc" },
            select: {
              exerciseId: true,
              sets: true,
              reps: true,
              weightKg: true,
              exercise: {
                select: { name: true, namePt: true, imageUrl: true },
              },
            },
          },
        },
      },
      entries: {
        select: { exerciseId: true, setNumber: true, weightKg: true, reps: true },
      },
    },
  });

  if (!log) notFound();

  if (log.finishedAt) {
    return <Summary log={log} />;
  }

  const exercises = (log.ficha?.exercises ?? []).map((fe) => ({
    exerciseId: fe.exerciseId,
    name: sentenceCase(fe.exercise.namePt ?? fe.exercise.name),
    imageUrl: fe.exercise.imageUrl,
    sets: fe.sets,
    reps: fe.reps,
    weightKg: fe.weightKg === null ? null : Number(fe.weightKg),
  }));

  const initialEntries = log.entries.map((e) => ({
    exerciseId: e.exerciseId,
    setNumber: e.setNumber,
    weightKg: e.weightKg === null ? "" : String(Number(e.weightKg)),
    reps: e.reps === null ? "" : String(e.reps),
  }));

  return (
    <WorkoutSession
      logId={log.id}
      fichaName={log.ficha?.name ?? "Treino"}
      exercises={exercises}
      initialEntries={initialEntries}
    />
  );
}

type SummaryLog = {
  id: string;
  startedAt: Date;
  finishedAt: Date | null;
  ficha: { id: string; name: string } | null;
  entries: {
    exerciseId: string;
    setNumber: number;
    weightKg: unknown;
    reps: number | null;
  }[];
};

async function Summary({ log }: { log: SummaryLog }) {
  const ids = [...new Set(log.entries.map((e) => e.exerciseId))];
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, namePt: true },
  });
  const nameOf = new Map(
    exercises.map((e) => [e.id, sentenceCase(e.namePt ?? e.name)]),
  );

  // agrupa séries por exercício, na ordem em que aparecem
  const groups: { exerciseId: string; sets: SummaryLog["entries"] }[] = [];
  for (const e of [...log.entries].sort((a, b) => a.setNumber - b.setNumber)) {
    let g = groups.find((x) => x.exerciseId === e.exerciseId);
    if (!g) {
      g = { exerciseId: e.exerciseId, sets: [] };
      groups.push(g);
    }
    g.sets.push(e);
  }

  const totalSets = log.entries.length;
  const volume = log.entries.reduce(
    (s, e) => s + (e.weightKg ? Number(e.weightKg) : 0) * (e.reps ?? 0),
    0,
  );
  const minutes = log.finishedAt
    ? Math.max(
        1,
        Math.round((log.finishedAt.getTime() - log.startedAt.getTime()) / 60000),
      )
    : 0;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/treino"
        className="text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        ← Histórico
      </Link>

      <div className="mt-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-ember">
        TREINO CONCLUÍDO
      </div>
      <h1 className="mt-1 text-[32px] leading-[1.02] font-bold tracking-[-0.03em] lg:text-[42px]">
        {log.ficha?.name ?? "Treino"}
        <span className="text-ember">.</span>
      </h1>

      <dl className="mt-6 grid grid-cols-3 border-t-2 border-ink">
        <Spec label="SÉRIES" value={String(totalSets)} />
        <Spec label="VOLUME" value={`${Math.round(volume)} kg`} accent />
        <Spec label="DURAÇÃO" value={minutes > 0 ? `${minutes} min` : "—"} />
      </dl>

      <ul className="mt-8 flex flex-col">
        {groups.map((g) => (
          <li key={g.exerciseId} className="border-b border-paper-edge py-4">
            <h2 className="text-[16px] font-bold tracking-[-0.01em]">
              {nameOf.get(g.exerciseId) ?? g.exerciseId}
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {g.sets.map((s) => (
                <span
                  key={s.setNumber}
                  className="border border-paper-edge px-2 py-1 text-[12.5px] text-muted tabular-nums"
                >
                  {s.weightKg ? `${Number(s.weightKg)}kg` : "PC"}
                  {s.reps ? ` × ${s.reps}` : ""}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {log.ficha && (
        <Link
          href={`/fichas/${log.ficha.id}`}
          className="mt-8 inline-flex h-12 items-center bg-ink px-6 text-[14px] font-bold text-paper transition-colors hover:bg-ink-soft active:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Voltar à ficha
        </Link>
      )}
    </div>
  );
}

function Spec({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="border-r border-b border-paper-edge px-3 py-3 last:border-r-0">
      <dt className="text-[10.5px] font-medium tracking-[0.1em] text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[18px] leading-tight font-bold tracking-[-0.01em] tabular-nums ${accent ? "text-ember" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
