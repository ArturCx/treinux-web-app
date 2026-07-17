import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Seed do catálogo a partir do dataset local (hasaneyldrm/exercises-dataset, MIT).
 * Sem rede: o JSON e as imagens vivem no repositório. Idempotente — pode rodar
 * quantas vezes quiser.
 *
 * Mídia © Gym visual (https://gymvisual.com/), 180x180, atribuição obrigatória.
 */

const prisma = new PrismaClient();

type Raw = {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  target: string;
  muscle_group?: string | null;
  secondary_muscles?: string[];
  instructions: Record<string, string>;
  instruction_steps: Record<string, string[]>;
  image: string;
  gif_url?: string;
  attribution: string;
};

const BATCH = 200;

async function main() {
  const path = join(process.cwd(), "prisma", "data", "exercises.json");
  const items: Raw[] = JSON.parse(readFileSync(path, "utf-8"));
  console.log(`Lendo ${items.length} exercícios do dataset local...`);

  // Nomes em pt-BR traduzidos via LLM (id -> nome). Opcional: se o arquivo
  // não existir, o catálogo fica só em inglês.
  let namesPt: Record<string, string> = {};
  try {
    const ptPath = join(process.cwd(), "prisma", "data", "names-pt.json");
    namesPt = JSON.parse(readFileSync(ptPath, "utf-8"));
    console.log(`  ${Object.keys(namesPt).length} nomes em pt-BR carregados.`);
  } catch {
    console.log("  names-pt.json não encontrado — mantendo nomes em inglês.");
  }

  // Passos de execução em pt-BR traduzidos via LLM (id -> string[]). Opcional.
  let stepsPt: Record<string, string[]> = {};
  try {
    const stPath = join(process.cwd(), "prisma", "data", "steps-pt.json");
    stepsPt = JSON.parse(readFileSync(stPath, "utf-8"));
    console.log(`  ${Object.keys(stepsPt).length} conjuntos de passos pt-BR carregados.`);
  } catch {
    console.log("  steps-pt.json não encontrado — mantendo instruções em inglês.");
  }

  const rows = items.map((e) => ({
    id: e.id,
    name: e.name.trim(),
    namePt: namesPt[e.id] ?? null,
    category: e.category,
    bodyPart: e.body_part,
    equipment: e.equipment,
    target: e.target,
    muscleGroup: e.muscle_group || null,
    secondaryMuscles: e.secondary_muscles ?? [],
    instructions: e.instruction_steps?.en ?? [],
    instructionsPt: stepsPt[e.id] ?? [],
    // mídia copiada para public/ mantendo o nome do arquivo do dataset
    imageUrl: `/exercicios/${e.image.split("/").pop()}`,
    // GIF do dataset convertido para WebP animado (scripts/gif-to-webp.mjs)
    gifUrl: e.gif_url
      ? `/exercicios-anim/${e.gif_url.split("/").pop()!.replace(/\.gif$/, ".webp")}`
      : null,
    attribution: e.attribution,
  }));

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    await prisma.$transaction(
      slice.map((data) =>
        prisma.exercise.upsert({
          where: { id: data.id },
          create: data,
          update: data,
        }),
      ),
    );
    done += slice.length;
    console.log(`  ${done}/${rows.length}`);
  }

  console.log(`Seed completo: ${await prisma.exercise.count()} exercícios.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
