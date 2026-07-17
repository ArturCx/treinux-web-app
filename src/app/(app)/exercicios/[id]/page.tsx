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
  sentenceCase,
} from "@/lib/catalog";
import { Overprint, SectionLabel } from "@/components/zine";
import { ExerciseMedia } from "./exercise-media";
import { AddToFicha } from "./add-to-ficha";

/**
 * Página de enciclopédia do espécime (50-exercicio): prancha em duotone com
 * ficha técnica em hairlines, execução como legendas impressas numeradas e
 * o seletor de ficha.
 */
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

  // Passos em pt-BR quando disponíveis; senão cai para o inglês do dataset.
  const instructions =
    exercise.instructionsPt.length > 0
      ? exercise.instructionsPt
      : exercise.instructions;
  const instructionsInEnglish = exercise.instructionsPt.length === 0;

  const fichaOptions = fichas.map((f) => ({
    id: f.id,
    name: f.name,
    hasExercise: f.exercises.length > 0,
  }));

  const displayName = sentenceCase(exercise.namePt ?? exercise.name);
  const number = `Nº ${exercise.id}`;

  return (
    <div className="mx-auto max-w-[1240px] px-[18px] pt-6 pb-20 lg:grid lg:grid-cols-[520px_minmax(0,1fr)] lg:items-start lg:gap-x-14 lg:px-10 lg:pt-8 lg:pb-[100px]">
      <div className="lg:sticky lg:top-7">
        <Link
          href="/exercicios"
          className="text-[13px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          ← Catálogo
        </Link>
        <div className="mt-3.5 text-[11px] font-bold tracking-[0.16em] text-muted uppercase tabular-nums">
          Espécime <b className="text-ember">{number}</b> ·{" "}
          {label(BODY_PART_LABELS, exercise.bodyPart)}
        </div>
        <h1 className="shout mt-1 text-[38px] lg:text-[46px]">
          <Overprint text={displayName} />
        </h1>
        {exercise.namePt && (
          <p className="mt-1.5 text-[13px] text-muted italic">
            {sentenceCase(exercise.name)}
          </p>
        )}

        <div className="mt-[18px]">
          <ExerciseMedia
            name={displayName}
            number={number}
            imageUrl={exercise.imageUrl}
            gifUrl={exercise.gifUrl}
          />
        </div>

        {/* ficha técnica */}
        <div className="mt-[22px] border-t-2 border-ink">
          <DataRow k="Alvo">
            <span className="inline-block bg-ember px-2.5 py-0.5 font-bold text-paper">
              {label(TARGET_LABELS, exercise.target)}
            </span>
          </DataRow>
          <DataRow k="Equipamento">{label(EQUIPMENT_LABELS, exercise.equipment)}</DataRow>
          {exercise.secondaryMuscles.length > 0 && (
            <DataRow k="Secundários">
              {exercise.secondaryMuscles.map((m) => muscleLabel(m)).join(" · ")}
            </DataRow>
          )}
          <DataRow k="Grupo">{label(BODY_PART_LABELS, exercise.bodyPart)}</DataRow>
        </div>
      </div>

      <div className="mt-9 lg:mt-0">
        {instructions.length > 0 && (
          <>
            <SectionLabel title="Execução" className="mb-1.5" />
            {instructions.map((step, i) => (
              <div
                key={i}
                className={`py-[18px] pb-4 ${
                  i === instructions.length - 1
                    ? "border-b-2 border-ink"
                    : "border-b border-paper-edge"
                }`}
              >
                <div className="flex items-baseline gap-3.5">
                  <span className="shout flex-none text-[20px] text-ember tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="max-w-[520px] text-[14.5px] leading-[1.55] text-ink-soft">
                    {step}
                  </p>
                </div>
              </div>
            ))}
            {instructionsInEnglish && (
              <p className="mt-3 text-[12px] text-clay">
                Instruções em inglês, como no catálogo original.
              </p>
            )}
          </>
        )}

        <div className="mt-9">
          <AddToFicha exerciseId={exercise.id} fichas={fichaOptions} />
        </div>
      </div>

    </div>
  );
}

function DataRow({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3.5 border-b border-paper-edge py-3">
      <span className="w-[120px] flex-none text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase">
        {k}
      </span>
      <span className="text-[14.5px] font-medium">{children}</span>
    </div>
  );
}
