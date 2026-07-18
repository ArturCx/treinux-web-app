import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { fichaStats, splitFichaName } from "@/lib/ficha-stats";
import {
  BarbellViz,
  MiniStamp,
  Overprint,
  Plates,
  SectionLabel,
  Stamp,
  Tape,
} from "@/components/zine";
import { ArchivedActions, CardActions } from "./card-actions";

const LETTERS = "ABCDEFGHIJ";

export default async function FichasPage() {
  const session = await requireSession();
  // eslint-disable-next-line react-hooks/purity -- server component por request: o ticker mostra a janela real de 7 dias
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [fichas, weekSets, lastLog] = await Promise.all([
    prisma.ficha.findMany({
      where: { userId: session.user.id },
      orderBy: [{ archived: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        archived: true,
        createdAt: true,
        updatedAt: true,
        exercises: { select: { sets: true, restSeconds: true } },
      },
    }),
    prisma.workoutLogEntry.count({
      where: { log: { userId: session.user.id, startedAt: { gte: weekAgo } } },
    }),
    prisma.workoutLog.findFirst({
      where: { userId: session.user.id, finishedAt: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { finishedAt: true, ficha: { select: { id: true, name: true } } },
    }),
  ]);

  if (fichas.length === 0) return <FirstRun />;

  const active = fichas.filter((f) => !f.archived);
  const archived = fichas.filter((f) => f.archived);

  // rotação: próxima ficha após a última treinada, em ordem de criação
  const nextInRotation = suggestNext(active, lastLog?.ficha?.id ?? null);

  return (
    <div>
      {/* ── capa ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b-2 border-ink px-[18px] pt-4 pb-[30px] lg:px-10 lg:pb-10">
        <div className="relative mx-auto max-w-[1240px]">
          <Plates />
          <Stamp
            text="FICHA DE TREINO ★ TREINUX ★"
            className="absolute top-11 right-0.5 z-[3] size-[118px] opacity-90 lg:top-14 lg:right-10 lg:size-[170px]"
          />
          <h1 className="shout relative z-[2] mt-[52px] text-[clamp(64px,19vw,150px)] lg:mt-16">
            <Overprint plate text="Suas fichas" />
          </h1>
          <div className="relative z-[2] mt-3.5 flex flex-wrap items-center gap-2.5 text-[12.5px] font-medium tracking-[0.1em] uppercase tabular-nums">
            <span className="border border-ink bg-paper px-2 py-[3px]">
              {active.length} {active.length === 1 ? "ativa" : "ativas"}
            </span>
            <span aria-hidden="true" className="size-[7px] rounded-full bg-ember" />
            <span className="border border-ink bg-paper px-2 py-[3px]">
              {archived.length} {archived.length === 1 ? "arquivada" : "arquivadas"}
            </span>
          </div>
        </div>
      </section>

      <Ticker
        items={[
          `${active.length} ${active.length === 1 ? "ficha ativa" : "fichas ativas"}`,
          `${weekSets} séries na semana`,
          lastLog?.finishedAt
            ? `último treino: ${formatTickerDate(lastLog.finishedAt)}${lastLog.ficha ? ` · ${tickerFichaLabel(lastLog.ficha.name)}` : ""}`
            : "nenhum treino registrado ainda",
          ...(nextInRotation
            ? [`próximo da rotação: ${tickerFichaLabel(nextInRotation.name)}`]
            : []),
        ]}
      />

      {/* ── lista ────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1240px] px-[18px] pt-[30px] pb-[70px] lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-x-12 lg:px-10 lg:pt-11 lg:pb-[90px]">
        <SectionLabel title="Em circulação" count={active.length} className="lg:col-span-2" />

        <div className="mt-6 flex flex-col gap-[26px]">
          {active.map((ficha, i) => {
            const [head, tail] = splitFichaName(ficha.name);
            const stats = fichaStats(ficha.exercises);
            const blue = i % 2 === 0;

            return (
              <article
                key={ficha.id}
                // entrada escalonada: cada card "assenta" logo após o anterior
                style={{ animationDelay: `${Math.min(i, 6) * 55}ms` }}
                className={`animate-rise relative border-2 border-ink bg-paper px-4 pt-[18px] transition-transform duration-200 ease-out ${
                  blue
                    ? "shadow-[7px_7px_0_var(--color-riso)] hover:-rotate-1"
                    : "shadow-[7px_7px_0_var(--color-ember)] hover:rotate-1"
                }`}
              >
                <Tape
                  className={`-top-[13px] left-1/2 ${blue ? "-translate-x-1/2 -rotate-2" : "-translate-x-[58%] rotate-[1.6deg]"}`}
                />
                <div
                  aria-hidden="true"
                  className={`shout pointer-events-none absolute -top-1 right-2 z-0 text-[92px] leading-none tracking-[-0.02em] mix-blend-multiply select-none tabular-nums ${
                    blue ? "text-riso opacity-[0.22]" : "text-ember opacity-[0.24]"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
                  Ficha {LETTERS[i] ?? i + 1} · atual. {formatShortDate(ficha.updatedAt)}
                </div>
                <h2 className="relative z-[1] mt-1.5 pr-14 text-[24px] leading-[1.08] font-bold tracking-[-0.025em] lg:text-[28px]">
                  {head}
                  {tail && <span className="text-ember"> {tail}</span>}
                </h2>

                <div className="relative z-[1] mt-4 flex border-t-2 border-ink tabular-nums">
                  <CardStat
                    value={stats.exercises}
                    label={stats.exercises === 1 ? "Exercício" : "Exercícios"}
                  />
                  <CardStat value={stats.sets} label="Séries" />
                  <CardStat value={stats.minutes > 0 ? `~${stats.minutes}` : "—"} label="Min" last />
                </div>

                <div className="relative z-[1] flex items-center gap-2.5 pt-2.5 pb-3.5">
                  <BarbellViz sets={stats.sets} className="h-[30px] w-auto" />
                  <span className="text-[10px] font-medium tracking-[0.12em] text-clay uppercase tabular-nums">
                    1 anilha = 4 séries
                  </span>
                </div>

                <CardActions id={ficha.id} name={ficha.name} />
              </article>
            );
          })}
        </div>

        {/* CTAs — coluna sticky no desktop */}
        <div className="mt-[38px] flex flex-col gap-4 lg:sticky lg:top-7 lg:mt-6">
          <Link
            href="/fichas/nova"
            className="shout flex min-h-16 items-center justify-between gap-3 border-2 border-ink bg-ember px-5 text-[19px] tracking-[0.05em] text-paper shadow-[7px_7px_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[5px_5px_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Nova ficha
            <span aria-hidden="true" className="text-[22px]">
              →
            </span>
          </Link>
          <div className="relative">
            <Link
              href="/fichas/gerar"
              className="shout flex min-h-16 items-center justify-between gap-3 border-2 border-ink bg-paper px-5 text-[19px] tracking-[0.05em] text-ink shadow-[7px_7px_0_var(--color-riso)] transition-[transform,box-shadow,color] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:text-riso hover:shadow-[5px_5px_0_var(--color-riso)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              Gerar ficha automaticamente
              <span aria-hidden="true" className="text-[22px]">
                ↻
              </span>
            </Link>
            <span className="absolute right-3.5 -bottom-[11px] rotate-[2.5deg] bg-fluo px-2 py-[3px] text-[11px] font-bold tracking-[0.14em] text-ink uppercase">
              novo!
            </span>
          </div>
        </div>

        {/* ── arquivadas ───────────────────────────────────────── */}
        {archived.length > 0 && (
          <section className="mt-14 lg:col-span-2">
            <SectionLabel title="Fora de catálogo" dim />
            <div className="mt-4 flex flex-col gap-3">
              {archived.map((ficha) => (
                <div
                  key={ficha.id}
                  className="relative flex flex-wrap items-center gap-x-3.5 gap-y-2 border-2 border-dashed border-clay px-4 py-3.5 text-muted"
                >
                  <h3 className="min-w-0 flex-1 text-[18px] font-bold tracking-[-0.02em] text-ink-soft opacity-70">
                    {ficha.name}
                  </h3>
                  <MiniStamp className="-rotate-[8deg] text-[13px]">Arquivada</MiniStamp>
                  <ArchivedActions id={ficha.id} name={ficha.name} />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

function CardStat({
  value,
  label,
  last = false,
}: {
  value: number | string;
  label: string;
  last?: boolean;
}) {
  return (
    <div className={`flex-1 py-2.5 ${last ? "" : "border-r border-dashed border-clay"}`}>
      <div className="text-[26px] leading-none font-bold tracking-[-0.03em] lg:text-[30px]">
        {value}
      </div>
      <div className="mt-[3px] text-[10px] font-medium tracking-[0.14em] text-muted uppercase">
        {label}
      </div>
    </div>
  );
}

/**
 * Marquee de dados reais entre réguas de tinta — nunca frase motivacional.
 * Dois grupos idênticos, cada um com min-w-full: emenda sem corte mesmo com
 * poucos itens (o grupo nunca fica mais estreito que a tela).
 */
function Ticker({ items }: { items: string[] }) {
  const group = (
    <div className="shout flex min-w-full shrink-0 animate-marquee-full items-center justify-around whitespace-nowrap text-[15px] tracking-[0.14em] tabular-nums">
      {items.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center gap-2.5 px-3">
          {item}
          <span aria-hidden="true" className={i % 2 === 0 ? "text-ember" : "text-riso"}>
            ★
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      aria-hidden="true"
      className="flex overflow-hidden border-b-2 border-ink py-[9px]"
    >
      {group}
      {group}
    </div>
  );
}

/** Primeira visita (Z-05): cartaz tipográfico do zine. */
function FirstRun() {
  return (
    <div className="mx-auto max-w-[1240px] px-[18px] py-14 lg:px-10 lg:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <span
          aria-hidden="true"
          className="shout block text-[clamp(110px,32vw,190px)] leading-[0.9] tracking-[-0.03em] text-paper-edge select-none tabular-nums"
        >
          00<span className="text-ember">1</span>
        </span>

        <div className="mt-5 border-t-2 border-ink pt-4">
          <h1 className="max-w-xl text-[26px] leading-[1.1] font-bold tracking-[-0.03em] lg:text-[34px]">
            Toda rotina séria começa com uma ficha.
          </h1>
          <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">
            Monte seu plano com exercícios do catálogo — +1300 movimentos com
            foto, músculos-alvo e instruções passo a passo.
          </p>
        </div>

        <div className="mt-8 flex max-w-md flex-col gap-4">
          <Link
            href="/fichas/nova"
            className="shout flex min-h-16 items-center justify-between gap-3 border-2 border-ink bg-ember px-5 text-[19px] tracking-[0.05em] text-paper shadow-[7px_7px_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[5px_5px_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Criar primeira ficha
            <span aria-hidden="true" className="text-[22px]">
              →
            </span>
          </Link>
          <Link
            href="/fichas/gerar"
            className="shout flex min-h-14 items-center justify-between gap-3 border-2 border-ink bg-paper px-5 text-[17px] tracking-[0.05em] text-ink shadow-[7px_7px_0_var(--color-riso)] transition-[transform,box-shadow,color] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:text-riso hover:shadow-[5px_5px_0_var(--color-riso)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Gerar ficha automaticamente
            <span aria-hidden="true" className="text-[20px]">
              ↻
            </span>
          </Link>
          <Link
            href="/exercicios"
            className="mt-1 block text-center text-[14px] font-medium text-muted underline decoration-ember underline-offset-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Explorar o catálogo primeiro
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(date)
    .replace(".", "");
}

function formatTickerDate(date: Date) {
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");
  return `${weekday} ${date.getDate()}`;
}

/** Rótulo curto da ficha no ticker: o "assunto" (tail) quando existir. */
function tickerFichaLabel(name: string) {
  const [head, tail] = splitFichaName(name);
  return tail ?? head;
}

/**
 * Próxima ficha da rotação: a que vem depois da última treinada, em ordem de
 * criação (cíclico). Sem última treinada, sugere a primeira. Só faz sentido
 * com 2+ fichas ativas.
 */
function suggestNext<T extends { id: string; name: string; createdAt: Date }>(
  active: T[],
  lastTrainedId: string | null,
): T | null {
  if (active.length < 2) return null;
  const rotation = [...active].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const idx = lastTrainedId ? rotation.findIndex((f) => f.id === lastTrainedId) : -1;
  return idx >= 0 ? rotation[(idx + 1) % rotation.length] : rotation[0];
}
