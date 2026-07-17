import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { fichaStats } from "@/lib/ficha-stats";
import { SectionLabel } from "@/components/zine";
import { ExerciseRow, ExerciseRowGroup } from "./exercise-row";
import { FichaCover, Housekeeping } from "./ficha-cover";

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
          weightKg: true,
          restSeconds: true,
          notes: true,
          exercise: {
            select: { id: true, name: true, namePt: true },
          },
        },
      },
    },
  });

  if (!ficha) notFound();

  // treino em andamento desta ficha (para "Retomar" em vez de iniciar outro)
  const activeLog = await prisma.workoutLog.findFirst({
    where: { userId: session.user.id, fichaId: id, finishedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  // Serializa no boundary RSC→client: Decimal não atravessa para client
  // components, então weightKg vira number aqui, uma única vez.
  const items = ficha.exercises.map((item) => ({
    ...item,
    weightKg: item.weightKg === null ? null : Number(item.weightKg),
  }));

  const stats = fichaStats(items);
  const restLabel = modalRest(items);

  return (
    <div>
      <FichaCover
        ficha={{
          id: ficha.id,
          name: ficha.name,
          notes: ficha.notes,
          archived: ficha.archived,
          updatedAt: ficha.updatedAt,
        }}
        stats={stats}
        activeLogId={activeLog?.id ?? null}
        restLabel={restLabel}
      />

      <main className="mx-auto max-w-[900px] px-[18px] pt-[30px] pb-[70px] lg:px-6 lg:pt-11 lg:pb-[90px]">
        {items.length === 0 ? (
          <EmptyExercises fichaId={ficha.id} />
        ) : (
          <>
            <SectionLabel title="A sequência" count={items.length} className="mb-2" />
            <ExerciseRowGroup>
              {items.map((item, i) => (
                <ExerciseRow
                  key={item.id}
                  item={item}
                  index={i}
                  first={i === 0}
                  last={i === items.length - 1}
                />
              ))}
            </ExerciseRowGroup>

            <Link
              href={`/fichas/${ficha.id}/adicionar`}
              className="shout mt-[26px] flex min-h-[60px] items-center justify-between gap-3 border-2 border-ink bg-paper px-5 text-[18px] tracking-[0.05em] text-ink shadow-[7px_7px_0_var(--color-ember)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ember)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              Adicionar exercícios
              <span aria-hidden="true" className="text-[22px] text-ember">
                →
              </span>
            </Link>
          </>
        )}

        <Housekeeping id={ficha.id} name={ficha.name} archived={ficha.archived} />

      </main>
    </div>
  );
}

/** Descanso "modal" da ficha (o mais comum) para o subtítulo do CTA escuro. */
function modalRest(items: { restSeconds: number | null }[]) {
  const counts = new Map<number, number>();
  for (const i of items) {
    if (i.restSeconds !== null)
      counts.set(i.restSeconds, (counts.get(i.restSeconds) ?? 0) + 1);
  }
  let best: number | null = null;
  let bestCount = 0;
  for (const [rest, count] of counts) {
    if (count > bestCount) {
      best = rest;
      bestCount = count;
    }
  }
  return best === null ? null : `${best}s`;
}

function EmptyExercises({ fichaId }: { fichaId: string }) {
  return (
    <div className="py-6">
      <span
        aria-hidden="true"
        className="shout block text-[clamp(96px,22vw,148px)] leading-[0.9] tracking-[-0.03em] text-paper-edge select-none tabular-nums"
      >
        0<span className="text-ember">0</span>
      </span>
      <div className="mt-4 border-t-2 border-ink pt-4">
        <h2 className="text-[26px] leading-[1.1] font-bold tracking-[-0.03em]">
          Uma ficha vazia não treina ninguém.
        </h2>
        <p className="mt-3 max-w-md text-[14.5px] leading-relaxed text-muted">
          Escolha os movimentos no catálogo — +1300 exercícios com foto,
          músculos-alvo e instruções passo a passo.
        </p>
      </div>
      <Link
        href={`/fichas/${fichaId}/adicionar`}
        className="shout mt-7 flex min-h-16 max-w-md items-center justify-between gap-3 border-2 border-ink bg-ember px-5 text-[19px] tracking-[0.05em] text-paper shadow-[7px_7px_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        Escolher exercícios
        <span aria-hidden="true" className="text-[22px]">
          →
        </span>
      </Link>
    </div>
  );
}
