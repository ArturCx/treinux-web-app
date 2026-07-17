"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { sentenceCase } from "@/lib/catalog";

export type ActionState = { error?: string } | null;

const NAME_MAX = 80;
const NOTES_MAX = 500;

/**
 * Carrega uma ficha garantindo que ela pertence ao usuário da sessão.
 * Ficha de outro dono responde como inexistente — não vazamos que existe.
 */
async function ownedFicha(fichaId: string, userId: string) {
  const ficha = await prisma.ficha.findFirst({
    where: { id: fichaId, userId },
    select: { id: true },
  });
  if (!ficha) throw new Error("Ficha não encontrada.");
  return ficha;
}

export async function createFicha(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) return { error: "Dê um nome para a ficha." };
  if (name.length > NAME_MAX)
    return { error: `O nome deve ter no máximo ${NAME_MAX} caracteres.` };
  if (notes.length > NOTES_MAX)
    return { error: `As observações devem ter no máximo ${NOTES_MAX} caracteres.` };

  const ficha = await prisma.ficha.create({
    data: { userId: session.user.id, name, notes: notes || null },
    select: { id: true },
  });

  revalidatePath("/fichas");
  redirect(`/fichas/${ficha.id}`);
}

export async function updateFicha(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");

  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) return { error: "Dê um nome para a ficha." };
  if (name.length > NAME_MAX)
    return { error: `O nome deve ter no máximo ${NAME_MAX} caracteres.` };

  await ownedFicha(id, session.user.id);
  await prisma.ficha.update({
    where: { id },
    data: { name, notes: notes || null },
  });

  revalidatePath("/fichas");
  revalidatePath(`/fichas/${id}`);
  return null;
}

export async function deleteFicha(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");

  await ownedFicha(id, session.user.id);
  await prisma.ficha.delete({ where: { id } });

  revalidatePath("/fichas");
  redirect("/fichas");
}

export async function toggleArchive(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");

  const ficha = await prisma.ficha.findFirst({
    where: { id, userId: session.user.id },
    select: { archived: true },
  });
  if (!ficha) throw new Error("Ficha não encontrada.");

  await prisma.ficha.update({
    where: { id },
    data: { archived: !ficha.archived },
  });

  revalidatePath("/fichas");
  revalidatePath(`/fichas/${id}`);
}

/** Lê `sets` do form; fora de 1–20 (ou ausente) cai no padrão do schema (3). */
function parseSets(formData: FormData) {
  const sets = Number(formData.get("sets"));
  return Number.isInteger(sets) && sets >= 1 && sets <= 20 ? sets : 3;
}

export async function addExercise(formData: FormData) {
  const session = await requireSession();
  const fichaId = String(formData.get("fichaId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");

  await ownedFicha(fichaId, session.user.id);

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true },
  });
  if (!exercise) throw new Error("Exercício não encontrado.");

  const last = await prisma.fichaExercise.findFirst({
    where: { fichaId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.fichaExercise.create({
    data: {
      fichaId,
      exerciseId,
      order: (last?.order ?? 0) + 1,
      sets: parseSets(formData),
    },
  });

  revalidatePath(`/fichas/${fichaId}`);
  revalidatePath("/fichas");
}

/**
 * Adiciona o exercício à ficha escolhida e volta para ela.
 * Usada na tela de detalhe, onde o usuário escolhe entre suas fichas.
 */
export async function addExerciseToFicha(formData: FormData) {
  const session = await requireSession();
  const fichaId = String(formData.get("fichaId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");

  await ownedFicha(fichaId, session.user.id);

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { id: true },
  });
  if (!exercise) throw new Error("Exercício não encontrado.");

  const existing = await prisma.fichaExercise.findFirst({
    where: { fichaId, exerciseId },
    select: { id: true },
  });

  if (!existing) {
    const last = await prisma.fichaExercise.findFirst({
      where: { fichaId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    await prisma.fichaExercise.create({
      data: {
        fichaId,
        exerciseId,
        order: (last?.order ?? 0) + 1,
        sets: parseSets(formData),
      },
    });
  }

  revalidatePath(`/fichas/${fichaId}`);
  revalidatePath("/fichas");
  redirect(`/fichas/${fichaId}`);
}

export async function removeExercise(formData: FormData) {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") ?? "");

  const item = await prisma.fichaExercise.findFirst({
    where: { id: itemId, ficha: { userId: session.user.id } },
    select: { id: true, fichaId: true },
  });
  if (!item) throw new Error("Exercício não encontrado na ficha.");

  await prisma.fichaExercise.delete({ where: { id: itemId } });

  revalidatePath(`/fichas/${item.fichaId}`);
  revalidatePath("/fichas");
}

export async function updatePrescription(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") ?? "");

  const item = await prisma.fichaExercise.findFirst({
    where: { id: itemId, ficha: { userId: session.user.id } },
    select: { id: true, fichaId: true },
  });
  if (!item) return { error: "Exercício não encontrado na ficha." };

  const sets = Number(formData.get("sets"));
  const reps = String(formData.get("reps") ?? "").trim();
  const weightRaw = String(formData.get("weightKg") ?? "").trim().replace(",", ".");
  const restRaw = String(formData.get("restSeconds") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isInteger(sets) || sets < 1 || sets > 20)
    return { error: "Séries deve ser um número entre 1 e 20." };
  if (!reps) return { error: "Informe as repetições (ex.: 8-12, AMRAP, 30s)." };
  if (reps.length > 20) return { error: "Repetições: máximo de 20 caracteres." };

  const weightKg = weightRaw ? Number(weightRaw) : null;
  if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 9999))
    return { error: "Peso deve ser um número entre 0 e 9999 kg." };

  const restSeconds = restRaw ? Number(restRaw) : null;
  if (restSeconds !== null && (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 900))
    return { error: "Descanso deve ser entre 0 e 900 segundos." };

  await prisma.fichaExercise.update({
    where: { id: itemId },
    data: { sets, reps, weightKg, restSeconds, notes: notes || null },
  });

  revalidatePath(`/fichas/${item.fichaId}`);
  return null;
}

export type ReplaceState = {
  swapped?: {
    itemId: string;
    newName: string;
    prevExerciseId: string;
    prevNotes: string;
  };
} | null;

/**
 * Troca o exercício por outro sorteado do mesmo membro (bodyPart), mantendo
 * posição e prescrição. Prefere o mesmo equipamento — ficha de calistenia
 * recebe outro exercício de peso corporal — e abre para o membro inteiro se
 * não houver opção. A observação é limpa: ela descrevia o exercício antigo.
 *
 * Uma só action para os dois sentidos: com `restoreTo` no form, desfaz a troca
 * (volta exercício + observação anteriores) e retorna null; senão, sorteia e
 * retorna o que trocou, para o card oferecer "desfazer".
 */
export async function replaceExercise(
  _prev: ReplaceState,
  formData: FormData,
): Promise<ReplaceState> {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") ?? "");
  const restoreTo = String(formData.get("restoreTo") ?? "");

  const item = await prisma.fichaExercise.findFirst({
    where: { id: itemId, ficha: { userId: session.user.id } },
    select: {
      id: true,
      fichaId: true,
      exerciseId: true,
      notes: true,
      exercise: { select: { bodyPart: true, equipment: true } },
    },
  });
  if (!item) throw new Error("Exercício não encontrado na ficha.");

  // desfazer: restaura o exercício e a observação anteriores
  if (restoreTo) {
    const restoreNotes = String(formData.get("restoreNotes") ?? "");
    const prev = await prisma.exercise.findUnique({
      where: { id: restoreTo },
      select: { id: true },
    });
    if (prev) {
      await prisma.fichaExercise.update({
        where: { id: item.id },
        data: { exerciseId: restoreTo, notes: restoreNotes || null },
      });
      revalidatePath(`/fichas/${item.fichaId}`);
    }
    return null;
  }

  const inFicha = await prisma.fichaExercise.findMany({
    where: { fichaId: item.fichaId },
    select: { exerciseId: true },
  });

  const base = {
    bodyPart: item.exercise.bodyPart,
    id: { notIn: inFicha.map((e) => e.exerciseId) },
  };
  let candidatos = await prisma.exercise.findMany({
    where: { ...base, equipment: item.exercise.equipment },
    select: { id: true, name: true, namePt: true },
  });
  if (candidatos.length === 0)
    candidatos = await prisma.exercise.findMany({
      where: base,
      select: { id: true, name: true, namePt: true },
    });
  if (candidatos.length === 0) return null; // membro esgotado — nada a trocar

  const sorteado = candidatos[Math.floor(Math.random() * candidatos.length)];
  const prevExerciseId = item.exerciseId;
  const prevNotes = item.notes ?? "";

  await prisma.fichaExercise.update({
    where: { id: item.id },
    data: { exerciseId: sorteado.id, notes: null },
  });

  revalidatePath(`/fichas/${item.fichaId}`);

  return {
    swapped: {
      itemId,
      newName: sentenceCase(sorteado.namePt ?? sorteado.name),
      prevExerciseId,
      prevNotes,
    },
  };
}

/** Move um exercício uma posição para cima ou para baixo, trocando com o vizinho. */
export async function moveExercise(formData: FormData) {
  const session = await requireSession();
  const itemId = String(formData.get("itemId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const item = await prisma.fichaExercise.findFirst({
    where: { id: itemId, ficha: { userId: session.user.id } },
    select: { id: true, fichaId: true, order: true },
  });
  if (!item) throw new Error("Exercício não encontrado na ficha.");

  const neighbor = await prisma.fichaExercise.findFirst({
    where: {
      fichaId: item.fichaId,
      order: direction === "up" ? { lt: item.order } : { gt: item.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbor) return; // já está na ponta

  await prisma.$transaction([
    prisma.fichaExercise.update({
      where: { id: item.id },
      data: { order: neighbor.order },
    }),
    prisma.fichaExercise.update({
      where: { id: neighbor.id },
      data: { order: item.order },
    }),
  ]);

  revalidatePath(`/fichas/${item.fichaId}`);
}
