import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  BODY_PART_LABELS,
  EQUIPMENT_LABELS,
  TARGET_LABELS,
  label,
  muscleLabel,
} from "@/lib/catalog";
import { ExerciseMedia } from "./exercise-media";
import { AddToFicha } from "./add-to-ficha";

export default async function ExercicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  const [exercise, fichas] = await Promise.all([
    prisma.exercise.findUnique({ where: { id } }),
    prisma.ficha.findMany({
      where: { userId: session.user.id, archived: false },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        exercises: { where: { exerciseId: id }, select: { id: true } },
      },
    }),
  ]);

  if (!exercise) notFound();

  const fichaOptions = fichas.map((f) => ({
    id: f.id,
    name: f.name,
    hasExercise: f.exercises.length > 0,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/exercicios"
        className="text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        ← Catálogo
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
        {/* coluna esquerda: mídia + ação */}
        <div className="flex flex-col gap-5">
          <ExerciseMedia
            name={exercise.name}
            imageUrl={exercise.imageUrl}
            gifUrl={exercise.gifUrl}
          />
          <div className="lg:hidden">
            <Header exercise={exercise} />
          </div>
          <AddToFicha exerciseId={exercise.id} fichas={fichaOptions} />
        </div>

        {/* coluna direita: identidade + instruções */}
        <div className="flex flex-col">
          <div className="hidden lg:block">
            <Header exercise={exercise} />
          </div>

          <dl className="mt-6 grid grid-cols-2 border-t-2 border-ink sm:grid-cols-3">
            <Spec label="GRUPO" value={label(BODY_PART_LABELS, exercise.bodyPart)} />
            <Spec label="ALVO" value={label(TARGET_LABELS, exercise.target)} accent />
            <Spec
              label="EQUIPAMENTO"
              value={label(EQUIPMENT_LABELS, exercise.equipment)}
            />
          </dl>

          {exercise.secondaryMuscles.length > 0 && (
            <div className="mt-5 flex flex-col gap-2">
              <h2 className="text-[11px] font-medium tracking-[0.14em] text-muted">
                MÚSCULOS SECUNDÁRIOS
              </h2>
              <ul className="flex flex-wrap gap-1.5">
                {exercise.secondaryMuscles.map((m) => (
                  <li
                    key={m}
                    className="border border-paper-edge px-2.5 py-1 text-[12.5px] text-muted"
                  >
                    {muscleLabel(m)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {exercise.instructions.length > 0 && (
            <section className="mt-8">
              <h2 className="border-b-2 border-ink pb-2 text-[11px] font-medium tracking-[0.14em] text-muted">
                EXECUÇÃO
              </h2>
              <ol className="mt-1">
                {exercise.instructions.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-4 border-b border-paper-edge py-4 last:border-b-0"
                  >
                    <span
                      aria-hidden="true"
                      className="w-9 shrink-0 text-[26px] leading-none font-bold tracking-[-0.04em] text-ember tabular-nums"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-[15px] leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-[12px] text-clay">
                Instruções em inglês, como no catálogo original.
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({
  exercise,
}: {
  exercise: { name: string; category: string; muscleGroup: string | null };
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium tracking-[0.14em] text-muted">
        {label(BODY_PART_LABELS, exercise.category)}
        {exercise.muscleGroup && ` · ${muscleLabel(exercise.muscleGroup)}`}
      </span>
      <h1 className="text-[32px] leading-[1.02] font-bold tracking-[-0.03em] lg:text-[44px] lg:tracking-[-0.04em]">
        {exercise.name}
        <span className="text-ember">.</span>
      </h1>
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
        className={`mt-1 text-[16px] leading-tight font-bold tracking-[-0.01em] ${accent ? "text-ember" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
