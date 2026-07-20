"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { buildSnapshot } from "./snapshot";

/** Garante que o treino (log) pertence ao usuário; senão, trata como inexistente. */
async function ownedLog(logId: string, userId: string) {
  const log = await prisma.workoutLog.findFirst({
    where: { id: logId, userId },
    select: { id: true, finishedAt: true },
  });
  if (!log) throw new Error("Treino não encontrado.");
  return log;
}

/**
 * Inicia (ou retoma) um treino a partir de uma ficha. Se já houver um treino
 * em andamento (sem finishedAt) para essa ficha, volta para ele em vez de criar
 * outro — evita treinos duplicados abertos.
 */
export async function startWorkout(formData: FormData) {
  const session = await requireSession();
  const fichaId = String(formData.get("fichaId") ?? "");

  const ficha = await prisma.ficha.findFirst({
    where: { id: fichaId, userId: session.user.id },
    select: { id: true },
  });
  if (!ficha) throw new Error("Ficha não encontrada.");

  const existing = await prisma.workoutLog.findFirst({
    where: { userId: session.user.id, fichaId, finishedAt: null },
    orderBy: { startedAt: "desc" },
    select: { id: true },
  });

  const logId =
    existing?.id ??
    (
      await prisma.workoutLog.create({
        data: { userId: session.user.id, fichaId },
        select: { id: true },
      })
    ).id;

  redirect(`/treino/${logId}`);
}

/**
 * Marca/atualiza uma série do treino. done=true faz upsert do registro com o
 * peso/reps informados; done=false remove o registro daquela série.
 */
export async function setEntry(formData: FormData) {
  const session = await requireSession();
  const logId = String(formData.get("logId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const setNumber = Number(formData.get("setNumber"));
  const done = String(formData.get("done") ?? "") === "1";

  const log = await ownedLog(logId, session.user.id);
  if (log.finishedAt) throw new Error("Treino já concluído.");
  if (!Number.isInteger(setNumber) || setNumber < 1) throw new Error("Série inválida.");

  if (!done) {
    await prisma.workoutLogEntry.deleteMany({
      where: { logId, exerciseId, setNumber },
    });
    revalidatePath(`/treino/${logId}`);
    return;
  }

  const weightRaw = String(formData.get("weightKg") ?? "").trim().replace(",", ".");
  const repsRaw = String(formData.get("reps") ?? "").trim();
  const weightKg = weightRaw ? Number(weightRaw) : null;
  const reps = repsRaw ? Number(repsRaw) : null;

  await prisma.workoutLogEntry.upsert({
    where: { logId_exerciseId_setNumber: { logId, exerciseId, setNumber } },
    create: {
      logId,
      exerciseId,
      setNumber,
      weightKg: weightKg !== null && Number.isFinite(weightKg) ? weightKg : null,
      reps: reps !== null && Number.isInteger(reps) ? reps : null,
      completedAt: new Date(),
    },
    // completedAt fica só na criação: editar peso/reps depois não reconta o descanso
    update: {
      weightKg: weightKg !== null && Number.isFinite(weightKg) ? weightKg : null,
      reps: reps !== null && Number.isInteger(reps) ? reps : null,
    },
  });

  revalidatePath(`/treino/${logId}`);
}

/** Conclui o treino (grava finishedAt) e leva para o resumo. */
export async function finishWorkout(formData: FormData) {
  const session = await requireSession();
  const logId = String(formData.get("logId") ?? "");

  const log = await ownedLog(logId, session.user.id);
  if (!log.finishedAt) {
    // congela a prescrição: o histórico não muda se a ficha mudar depois
    const snapshot = await buildSnapshot(logId);
    await prisma.workoutLog.update({
      where: { id: logId },
      data: { finishedAt: new Date(), snapshot: snapshot ?? undefined },
    });
  }

  revalidatePath("/treino");
  revalidatePath(`/treino/${logId}`);
  redirect(`/treino/${logId}`);
}

/** Descarta um treino em andamento (apaga o log e suas séries). */
export async function discardWorkout(formData: FormData) {
  const session = await requireSession();
  const logId = String(formData.get("logId") ?? "");

  await ownedLog(logId, session.user.id);
  await prisma.workoutLog.delete({ where: { id: logId } });

  revalidatePath("/treino");
  redirect("/fichas");
}
