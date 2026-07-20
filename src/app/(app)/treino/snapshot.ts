import { prisma } from "@/lib/prisma";
import { sentenceCase } from "@/lib/catalog";

/*
 * Prescrição congelada no ato de finalizar — o histórico é imutável; edições
 * posteriores na ficha não podem reescrever sessões passadas.
 */

export type WorkoutSnapshotRow = {
  exerciseId: string;
  name: string;
  sets: number;
  order: number;
};

/** Fotografa a prescrição atual da ficha do log (null se a ficha já sumiu). */
export async function buildSnapshot(logId: string): Promise<WorkoutSnapshotRow[] | null> {
  const log = await prisma.workoutLog.findUnique({
    where: { id: logId },
    select: {
      ficha: {
        select: {
          exercises: {
            orderBy: { order: "asc" },
            select: {
              exerciseId: true,
              sets: true,
              order: true,
              exercise: { select: { name: true, namePt: true } },
            },
          },
        },
      },
    },
  });
  if (!log?.ficha) return null;
  return log.ficha.exercises.map((fe) => ({
    exerciseId: fe.exerciseId,
    name: sentenceCase(fe.exercise.namePt ?? fe.exercise.name),
    sets: fe.sets,
    order: fe.order,
  }));
}

/** Lê o snapshot de um log, validando o formato (Json não tipado no banco). */
export function parseSnapshot(value: unknown): WorkoutSnapshotRow[] | null {
  if (!Array.isArray(value)) return null;
  const rows: WorkoutSnapshotRow[] = [];
  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as { exerciseId?: unknown }).exerciseId !== "string" ||
      typeof (item as { name?: unknown }).name !== "string" ||
      typeof (item as { sets?: unknown }).sets !== "number" ||
      typeof (item as { order?: unknown }).order !== "number"
    ) {
      return null;
    }
    rows.push(item as WorkoutSnapshotRow);
  }
  return rows;
}
