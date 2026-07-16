import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { fichaStats } from "@/lib/ficha-stats";
import { ExerciseRow } from "./exercise-row";
import { FichaHeader } from "./ficha-header";

export default async function FichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  // Escopo por userId: ficha de outro dono responde 404, não 403 —
  // não confirmamos a existência de recursos alheios.
  const ficha = await prisma.ficha.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      name: true,
      notes: true,
      archived: true,
      updatedAt: true,
      exercises: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          order: true,
          sets: true,
          reps: true,
          restSeconds: true,
          notes: true,
          exercise: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              bodyPart: true,
              equipment: true,
              target: true,
            },
          },
        },
      },
    },
  });

  if (!ficha) notFound();

  const stats = fichaStats(ficha.exercises);
  const isEmpty = ficha.exercises.length === 0;

  return (
    <div className="-mx-6 -my-8 grid min-h-[calc(100dvh-65px)] lg:-mx-10 lg:-my-12 lg:grid-cols-[420px_1fr]">
      <FichaHeader ficha={ficha} stats={stats} />

      <div className="flex flex-col">
        {isEmpty ? (
          <EmptyExercises fichaId={ficha.id} />
        ) : (
          <>
            <ul className="flex-1">
              {ficha.exercises.map((item, i) => (
                <ExerciseRow
                  key={item.id}
                  item={item}
                  index={i}
                  total={ficha.exercises.length}
                  last={i === ficha.exercises.length - 1}
                />
              ))}
            </ul>
            <Link
              href={`/fichas/${ficha.id}/adicionar`}
              className="group flex h-15 shrink-0 items-center justify-between bg-ink px-5 text-[15px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ember lg:px-8"
            >
              <span>Adicionar exercício</span>
              <span
                aria-hidden="true"
                className="text-[20px] text-ember transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyExercises({ fichaId }: { fichaId: string }) {
  return (
    <div className="flex flex-1 flex-col justify-center px-5 py-14 lg:px-8">
      <span
        aria-hidden="true"
        className="text-[clamp(96px,22vw,148px)] leading-[0.85] font-bold tracking-[-0.06em] text-paper-edge select-none tabular-nums"
      >
        0<span className="text-ember">0</span>
      </span>
      <div className="mt-4 border-t-2 border-ink pt-4">
        <h2 className="text-[26px] leading-[1.1] font-bold tracking-[-0.03em]">
          Uma ficha vazia não treina ninguém.
        </h2>
        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
          Escolha os movimentos no catálogo — 1.324 exercícios com foto,
          músculos-alvo e instruções passo a passo.
        </p>
      </div>
      <Link
        href={`/fichas/${fichaId}/adicionar`}
        className="group mt-7 flex h-15 max-w-md items-center justify-between bg-ink px-5 text-[16px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <span>Escolher exercícios</span>
        <span
          aria-hidden="true"
          className="text-[20px] text-ember transition-transform duration-200 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>
    </div>
  );
}
