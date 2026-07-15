import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const API_HOST = process.env.EXERCISEDB_API_HOST!;
const API_KEY = process.env.RAPIDAPI_KEY!;
const BASE_URL = `https://${API_HOST}/api/v1`;

const headers = {
  "x-rapidapi-key": API_KEY,
  "x-rapidapi-host": API_HOST,
};

// espera entre requests (rate limit por hora do plano BASIC)
const REQUEST_DELAY_MS = 300;
// ao tomar 429, dorme e tenta de novo (quota reseta por hora)
const RATE_LIMIT_WAIT_MS = 10 * 60 * 1000;
const MAX_RATE_LIMIT_RETRIES = 12; // ~2h de espera no total

type ApiExercise = {
  exerciseId: string;
  name: string;
  exerciseType?: string;
  bodyParts?: string[];
  equipments?: string[];
  targetMuscles?: string[];
  secondaryMuscles?: string[];
  keywords?: string[];
  overview?: string;
  instructions?: string[];
  exerciseTips?: string[];
  variations?: string[];
  imageUrl?: string;
  videoUrl?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiGet<T>(url: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers });

    if (res.status === 429) {
      if (attempt >= MAX_RATE_LIMIT_RETRIES) {
        throw new Error(
          "Rate limit persistente. Rode `npm run db:seed` de novo mais tarde — ele continua de onde parou."
        );
      }
      console.log(
        `  rate limit (429) — aguardando ${RATE_LIMIT_WAIT_MS / 60000}min antes de continuar...`
      );
      await sleep(RATE_LIMIT_WAIT_MS);
      continue;
    }

    if (!res.ok) throw new Error(`${res.status} ${res.statusText} em ${url}`);
    return (await res.json()) as T;
  }
}

function baseData(e: ApiExercise) {
  return {
    name: e.name.trim(),
    exerciseType: e.exerciseType ?? null,
    bodyParts: e.bodyParts ?? [],
    equipments: e.equipments ?? [],
    targetMuscles: e.targetMuscles ?? [],
    secondaryMuscles: e.secondaryMuscles ?? [],
    keywords: e.keywords ?? [],
    imageUrl: e.imageUrl ?? null,
  };
}

// Fase 1: pagina o catálogo e salva os dados básicos (a lista já traz quase tudo)
async function importList() {
  const seen = new Set<string>(
    (await prisma.exercise.findMany({ select: { id: true } })).map((e) => e.id)
  );
  console.log(`Fase 1: listando catálogo (${seen.size} já no banco)...`);

  let cursor: string | undefined;
  let pages = 0;
  const seenCursors = new Set<string>();

  while (true) {
    const url = new URL(`${BASE_URL}/exercises`);
    url.searchParams.set("limit", "25");
    if (cursor) url.searchParams.set("after", cursor);

    const body = await apiGet<{
      data: ApiExercise[];
      meta: { hasNextPage: boolean; nextCursor?: string };
    }>(url.toString());

    const fresh = body.data.filter((e) => !seen.has(e.exerciseId));

    await prisma.exercise.createMany({
      data: fresh.map((e) => ({ id: e.exerciseId, ...baseData(e) })),
      skipDuplicates: true,
    });
    fresh.forEach((e) => seen.add(e.exerciseId));

    pages++;
    if (pages % 10 === 0) console.log(`  ${seen.size} exercícios salvos...`);

    if (!body.meta.hasNextPage || !body.meta.nextCursor) break;
    // cursor repetido = API entrou em ciclo, catálogo completo
    if (seenCursors.has(body.meta.nextCursor)) {
      console.log("  cursor repetido — catálogo completo (ciclo detectado).");
      break;
    }
    seenCursors.add(body.meta.nextCursor);
    cursor = body.meta.nextCursor;
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`Fase 1 concluída: ${seen.size} exercícios no banco.`);
}

// Fase 2: busca detalhes (instruções, vídeo, dicas) do que ainda não tem
async function importDetails() {
  const pending = await prisma.exercise.findMany({
    where: { overview: null },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  console.log(`Fase 2: buscando detalhes de ${pending.length} exercícios...`);

  let done = 0;
  for (const { id } of pending) {
    const { data: d } = await apiGet<{ data: ApiExercise }>(
      `${BASE_URL}/exercises/${id}`
    );

    await prisma.exercise.update({
      where: { id },
      data: {
        ...baseData(d),
        overview: d.overview ?? "",
        instructions: d.instructions ?? [],
        exerciseTips: d.exerciseTips ?? [],
        variations: d.variations ?? [],
        videoUrl: d.videoUrl ?? null,
      },
    });

    done++;
    if (done % 50 === 0) console.log(`  detalhes: ${done}/${pending.length}`);
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(`Fase 2 concluída: ${done} detalhes importados.`);
}

async function main() {
  if (!API_KEY) throw new Error("RAPIDAPI_KEY não definida no .env");
  await importList();
  await importDetails();
  console.log("Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
