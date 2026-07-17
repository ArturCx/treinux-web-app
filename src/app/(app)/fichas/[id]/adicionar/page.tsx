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
    <div>
      {/* contexto: para qual ficha este catálogo está adicionando */}
      <div className="border-b border-paper-edge bg-paper-deep">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 gap-y-1 px-[18px] py-2.5 text-[12.5px] font-medium tracking-[0.08em] text-muted uppercase lg:px-10">
          <span className="min-w-0 truncate">
            Adicionando à ficha: <b className="font-bold text-ink">{ficha.name}</b>
            {inFicha.size > 0 && (
              <span className="tabular-nums">
                {" "}
                · {inFicha.size} {inFicha.size === 1 ? "exercício" : "exercícios"}
              </span>
            )}
          </span>
          <Link
            href={`/fichas/${ficha.id}`}
            className="ml-auto shrink-0 py-1.5 font-bold text-ember-deep transition-colors hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            ← voltar à ficha
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-[18px] pt-[22px] pb-[70px] lg:px-10 lg:pt-[30px] lg:pb-[90px]">
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
