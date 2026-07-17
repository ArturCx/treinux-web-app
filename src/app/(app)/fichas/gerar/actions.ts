"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import {
  DURATIONS,
  MAX_FICHAS,
  PRESCRIPTION,
  equipmentsFor,
  groupsFor,
  planFichas,
  type Modalidade,
} from "@/lib/generator";
import type { ActionState } from "../actions";

export async function generateFichas(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();

  const modalidadeRaw = String(formData.get("modalidade") ?? "");
  if (modalidadeRaw !== "musculacao" && modalidadeRaw !== "calistenia")
    return { error: "Escolha a modalidade." };
  const modalidade: Modalidade = modalidadeRaw;

  const allGroups = groupsFor(modalidade);
  const keys = formData.getAll("grupos").map(String);
  // preserva a ordem canônica dos grupos, ignorando chaves desconhecidas
  const groups = allGroups.filter((g) => keys.includes(g.key));
  if (groups.length === 0)
    return {
      error:
        modalidade === "calistenia"
          ? "Escolha pelo menos uma categoria."
          : "Escolha pelo menos um membro.",
    };

  const minutes = Number(formData.get("minutes"));
  if (!DURATIONS.includes(minutes as (typeof DURATIONS)[number]))
    return { error: "Duração inválida." };

  const count = Number(formData.get("count"));
  const maxCount = Math.min(MAX_FICHAS, groups.length);
  if (!Number.isInteger(count) || count < 1 || count > maxCount)
    return {
      error: `Número de fichas deve ser entre 1 e ${maxCount} (uma ficha precisa de pelo menos um grupo).`,
    };

  // musculação: equipamentos marcados (casa) ou academia completa (nenhum)
  const equipKeys = formData.getAll("equipamentos").map(String);

  const pool = await prisma.exercise.findMany({
    where: {
      bodyPart: { in: [...new Set(groups.flatMap((g) => g.bodyParts))] },
      equipment:
        modalidade === "calistenia"
          ? "body weight"
          : { in: equipmentsFor(equipKeys) },
    },
    select: { id: true, bodyPart: true, target: true },
  });

  if (pool.length === 0)
    return {
      error:
        "Nenhum exercício disponível com esses equipamentos — marque mais opções.",
    };

  const plans = planFichas({ modalidade, groups, minutes, count, pool });
  if (plans.some((p) => p.exerciseIds.length === 0))
    return { error: "Não há exercícios suficientes para essa combinação." };

  const p = PRESCRIPTION[modalidade];
  const label = modalidade === "musculacao" ? "musculação" : "calistenia";

  const ids = await prisma.$transaction(async (tx) => {
    const created: string[] = [];
    for (const plan of plans) {
      const ficha = await tx.ficha.create({
        data: {
          userId: session.user.id,
          name: plan.name,
          notes: `Gerada automaticamente · ${label} · ~${minutes} min`,
          exercises: {
            create: plan.exerciseIds.map((exerciseId, i) => ({
              exerciseId,
              order: i + 1,
              sets: p.sets,
              reps: p.reps,
              restSeconds: p.restSeconds,
            })),
          },
        },
        select: { id: true },
      });
      created.push(ficha.id);
    }
    return created;
  });

  revalidatePath("/fichas");
  redirect(ids.length === 1 ? `/fichas/${ids[0]}` : "/fichas");
}
