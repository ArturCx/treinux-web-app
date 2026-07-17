import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { ExerciseCatalog, type CatalogParams } from "@/components/exercise-catalog";

export default async function AdicionarExercicioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<CatalogParams>;
}) {
  const [{ id }, catalogParams, session] = await Promise.all([
    params,
    searchParams,
    requireSession(),
  ]);

  const ficha = await prisma.ficha.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      name: true,
      exercises: { select: { exerciseId: true } },
    },
  });

  if (!ficha) notFound();

  const inFicha = new Set(ficha.exercises.map((e) => e.exerciseId));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/fichas/${ficha.id}`}
          className="min-w-0 truncate text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          ← {ficha.name}
        </Link>
        <Link
          href={`/fichas/${ficha.id}`}
          className="group flex h-11 shrink-0 items-center gap-3 bg-ink px-4 text-[14px] font-bold text-paper transition-colors hover:bg-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Concluir
          <span
            aria-hidden="true"
            className="text-ember transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>

      <p className="mt-4 text-[13px] text-muted">
        {inFicha.size === 0 ? (
          <>
            Toque num exercício para escolher as séries e adicionar à ficha.
          </>
        ) : (
          <>
            <span className="font-bold text-ember tabular-nums">
              {inFicha.size}
            </span>{" "}
            {inFicha.size === 1
              ? "exercício nesta ficha"
              : "exercícios nesta ficha"}{" "}
            · toque num card para adicionar mais.
          </>
        )}
      </p>

      <div className="mt-5">
        <ExerciseCatalog
          params={catalogParams}
          basePath={`/fichas/${ficha.id}/adicionar`}
          fichaId={ficha.id}
          inFicha={inFicha}
        />
      </div>
    </div>
  );
}
