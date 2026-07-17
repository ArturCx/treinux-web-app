import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { fichaStats, splitFichaName } from "@/lib/ficha-stats";
import { QuickDelete } from "./quick-delete";

export default async function FichasPage() {
  const session = await requireSession();

  const fichas = await prisma.ficha.findMany({
    where: { userId: session.user.id },
    orderBy: [{ archived: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      notes: true,
      archived: true,
      updatedAt: true,
      exercises: { select: { sets: true, restSeconds: true } },
    },
  });

  if (fichas.length === 0) return <FirstRun />;

  const active = fichas.filter((f) => !f.archived);
  const archived = fichas.filter((f) => f.archived);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-[30px] leading-none font-bold tracking-[-0.03em] lg:text-[38px]">
          Suas fichas<span className="text-ember">.</span>
        </h1>
        <div className="text-right">
          <div className="text-[44px] leading-[0.9] font-bold tracking-[-0.04em] text-ember tabular-nums lg:text-[56px]">
            {active.length}
          </div>
          <div className="text-[10.5px] font-medium tracking-[0.1em] text-muted">
            {active.length === 1 ? "ATIVA" : "ATIVAS"}
          </div>
        </div>
      </div>

      <Link
        href="/fichas/nova"
        className="group mt-6 flex h-15 items-center justify-between bg-ink px-5 text-[15px] font-bold text-paper transition-colors hover:bg-ink-soft active:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span>Nova ficha</span>
        <span
          aria-hidden="true"
          className="text-[20px] text-ember transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>

      <Link
        href="/fichas/gerar"
        className="group mt-2.5 flex h-12 items-center justify-between border-2 border-ink px-5 text-[14px] font-bold transition-colors hover:bg-ink/5 active:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span>Gerar ficha automaticamente</span>
        <span
          aria-hidden="true"
          className="text-[18px] text-ember transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>

      {active.length > 0 && <FichaList fichas={active} />}

      {archived.length > 0 && (
        <section className="mt-10">
          <h2 className="border-b-2 border-ink pb-2 text-[11px] font-medium tracking-[0.14em] text-muted">
            ARQUIVADAS
          </h2>
          <FichaList fichas={archived} dimmed />
        </section>
      )}
    </div>
  );
}

type FichaCard = {
  id: string;
  name: string;
  notes: string | null;
  archived: boolean;
  updatedAt: Date;
  exercises: { sets: number; restSeconds: number | null }[];
};

function FichaList({
  fichas,
  dimmed = false,
}: {
  fichas: FichaCard[];
  dimmed?: boolean;
}) {
  return (
    <ul className={dimmed ? "opacity-55" : undefined}>
      {fichas.map((ficha, i) => {
        const [head, tail] = splitFichaName(ficha.name);
        const stats = fichaStats(ficha.exercises);

        return (
          <li key={ficha.id} className="relative overflow-hidden">
            <Link
              href={`/fichas/${ficha.id}`}
              className="group relative block border-b border-paper-edge py-6 transition-colors hover:bg-paper-deep active:bg-paper-deep focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-4 right-1 text-[96px] leading-none font-bold tracking-[-0.05em] text-paper-deep select-none tabular-nums"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="relative flex items-start gap-4 px-1">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[26px] leading-[1.05] font-bold tracking-[-0.03em] lg:text-[30px]">
                    {head}
                    {tail && <span className="text-ember"> {tail}</span>}
                  </h3>

                  {ficha.notes && (
                    <p className="mt-2 line-clamp-1 max-w-lg text-[13.5px] text-muted">
                      {ficha.notes}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-[12px] tracking-[0.06em] text-muted">
                    <span>
                      <span className="font-bold text-ink tabular-nums">
                        {stats.exercises}
                      </span>{" "}
                      {stats.exercises === 1 ? "EXERCÍCIO" : "EXERCÍCIOS"}
                    </span>
                    <span>
                      <span className="font-bold text-ink tabular-nums">
                        {stats.sets}
                      </span>{" "}
                      SÉRIES
                    </span>
                    {stats.minutes > 0 && (
                      <span>
                        <span className="font-bold text-ink tabular-nums">
                          ~{stats.minutes}
                        </span>{" "}
                        MIN
                      </span>
                    )}
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className="self-center text-[20px] text-ember opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                >
                  →
                </span>
              </div>
            </Link>

            {/* atalho de exclusão por cima do link da linha */}
            <div className="absolute top-4 right-1 z-10">
              <QuickDelete id={ficha.id} name={ficha.name} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Primeira visita: cartaz tipográfico, não um card com texto de ajuda. */
function FirstRun() {
  return (
    <div className="-my-8 flex min-h-[calc(100dvh-165px)] flex-col justify-center lg:-my-12 lg:min-h-[calc(100dvh-129px)]">
      <div className="mx-auto w-full max-w-3xl">
        <span
          aria-hidden="true"
          className="block text-[clamp(110px,38vw,190px)] leading-[0.85] font-bold tracking-[-0.06em] select-none tabular-nums"
        >
          00<span className="text-ember">1</span>
        </span>

        <div className="mt-5 border-t-2 border-ink pt-4">
          <h1 className="max-w-xl text-[26px] leading-[1.1] font-bold tracking-[-0.03em] lg:text-[34px]">
            Toda rotina séria começa com uma ficha.
          </h1>
          <p className="mt-3 max-w-lg text-[14.5px] leading-relaxed text-muted">
            Monte seu plano com exercícios do catálogo — +1.300 movimentos com
            foto, músculos-alvo e instruções passo a passo.
          </p>
        </div>

        <div className="mt-8 max-w-md">
          <Link
            href="/fichas/nova"
            className="group flex h-15 items-center justify-between bg-ink px-5 text-[16px] font-bold text-paper transition-colors hover:bg-ink-soft active:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            <span>Criar primeira ficha</span>
            <span
              aria-hidden="true"
              className="text-[20px] text-ember transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
          <Link
            href="/fichas/gerar"
            className="group mt-2.5 flex h-12 items-center justify-between border-2 border-ink px-5 text-[14px] font-bold transition-colors hover:bg-ink/5 active:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            <span>Gerar ficha automaticamente</span>
            <span
              aria-hidden="true"
              className="text-[18px] text-ember transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
          <Link
            href="/exercicios"
            className="mt-3.5 block text-center text-[14px] font-medium text-muted underline decoration-ember underline-offset-3 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            Explorar o catálogo primeiro
          </Link>
        </div>
      </div>
    </div>
  );
}
