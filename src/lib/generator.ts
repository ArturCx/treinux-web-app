/**
 * Gerador automático de fichas — regras determinísticas sobre o catálogo local.
 * Puro (sem I/O): o chamador consulta o pool de exercícios e recebe o plano.
 * Importado tanto pelo server action quanto pelo form (labels, estimativas).
 */

export type Modalidade = "musculacao" | "calistenia";

export type GeneratorGroup = {
  key: string;
  label: string;
  bodyParts: string[]; // valores de Exercise.bodyPart cobertos pelo grupo
};

/** Membros de musculação — bodyParts disjuntos, seleção livre. */
export const MUSCULACAO_GROUPS: GeneratorGroup[] = [
  { key: "peito", label: "Peito", bodyParts: ["chest"] },
  { key: "costas", label: "Costas", bodyParts: ["back"] },
  { key: "ombros", label: "Ombros", bodyParts: ["shoulders"] },
  { key: "bracos", label: "Braços", bodyParts: ["upper arms", "lower arms"] },
  { key: "pernas", label: "Pernas", bodyParts: ["upper legs", "lower legs"] },
  { key: "core", label: "Core", bodyParts: ["waist"] },
];

/** Categorização própria da calistenia (padrão da modalidade). */
export const CALISTENIA_GROUPS: GeneratorGroup[] = [
  {
    key: "empurrar",
    label: "Empurrar",
    bodyParts: ["chest", "shoulders", "upper arms"],
  },
  { key: "puxar", label: "Puxar", bodyParts: ["back"] },
  { key: "pernas", label: "Pernas", bodyParts: ["upper legs", "lower legs"] },
  { key: "core", label: "Core", bodyParts: ["waist"] },
];

export function groupsFor(modalidade: Modalidade) {
  return modalidade === "calistenia" ? CALISTENIA_GROUPS : MUSCULACAO_GROUPS;
}

/** Equipamentos de academia — o que entra numa ficha de musculação. */
export const MUSCULACAO_EQUIPMENT = [
  "barbell",
  "dumbbell",
  "cable",
  "leverage machine",
  "smith machine",
  "kettlebell",
  "ez barbell",
  "olympic barbell",
  "trap bar",
  "weighted",
  "sled machine", // leg press e variações
];

/**
 * Equipamentos escolhíveis na musculação — para quem treina em casa com
 * poucas coisas. Nenhuma seleção = academia completa (MUSCULACAO_EQUIPMENT).
 */
export type EquipmentOption = {
  key: string;
  label: string;
  equipments: string[]; // valores de Exercise.equipment cobertos
};

export const EQUIPMENT_OPTIONS: EquipmentOption[] = [
  { key: "barra", label: "Barra", equipments: ["barbell"] },
  { key: "barra-hexagonal", label: "Barra hexagonal", equipments: ["trap bar"] },
  { key: "barra-olimpica", label: "Barra olímpica", equipments: ["olympic barbell"] },
  { key: "barra-w", label: "Barra W", equipments: ["ez barbell"] },
  { key: "bike", label: "Bike", equipments: ["stationary bike"] },
  { key: "bola-medicinal", label: "Bola medicinal", equipments: ["medicine ball"] },
  { key: "bola-suica", label: "Bola suíça", equipments: ["stability ball"] },
  { key: "bosu", label: "Bosu", equipments: ["bosu ball"] },
  { key: "cabo", label: "Cabo", equipments: ["cable"] },
  { key: "com-carga", label: "Com carga", equipments: ["weighted"] },
  { key: "corda", label: "Corda", equipments: ["rope"] },
  { key: "elastico", label: "Elástico", equipments: ["band"] },
  { key: "eliptico", label: "Elíptico", equipments: ["elliptical machine"] },
  {
    key: "ergometro-de-braco",
    label: "Ergômetro de braço",
    equipments: ["upper body ergometer"],
  },
  { key: "escada", label: "Escada", equipments: ["stepmill machine"] },
  {
    key: "faixa-elastica",
    label: "Faixa elástica",
    equipments: ["resistance band"],
  },
  { key: "halter", label: "Halter", equipments: ["dumbbell"] },
  { key: "kettlebell", label: "Kettlebell", equipments: ["kettlebell"] },
  { key: "marreta", label: "Marreta", equipments: ["hammer"] },
  { key: "pneu", label: "Pneu", equipments: ["tire"] },
  { key: "roda-abdominal", label: "Roda abdominal", equipments: ["wheel roller"] },
  { key: "rolo", label: "Rolo", equipments: ["roller"] },
];

/** Traduz as chaves marcadas em valores de equipment; vazio = academia completa. */
export function equipmentsFor(keys: string[]): string[] {
  const picked = EQUIPMENT_OPTIONS.filter((o) => keys.includes(o.key));
  if (picked.length === 0) return MUSCULACAO_EQUIPMENT;
  return [...new Set(picked.flatMap((o) => o.equipments))];
}

export const DURATIONS = [30, 45, 60, 90] as const;
export const MAX_FICHAS = 5;

/** Prescrição padrão aplicada aos exercícios gerados (editável depois). */
export const PRESCRIPTION: Record<
  Modalidade,
  { sets: number; reps: string; restSeconds: number }
> = {
  musculacao: { sets: 3, reps: "8-12", restSeconds: 90 },
  calistenia: { sets: 3, reps: "8-15", restSeconds: 60 },
};

/**
 * Quantos exercícios cabem em `minutes`, usando o mesmo modelo de tempo do
 * fichaStats (40s de execução por série + descanso da prescrição).
 */
export function exercisesPerFicha(minutes: number, modalidade: Modalidade) {
  const p = PRESCRIPTION[modalidade];
  const minutesPerExercise = (p.sets * (40 + p.restSeconds)) / 60;
  return Math.min(12, Math.max(3, Math.round(minutes / minutesPerExercise)));
}

export type PoolExercise = { id: string; bodyPart: string; target: string };

export type FichaPlan = { name: string; exerciseIds: string[] };

export const LETTERS = ["A", "B", "C", "D", "E"];

/** Grupos → fichas em round-robin, na ordem canônica. Usado também no preview do form. */
export function distributeGroups<T>(groups: T[], count: number): T[][] {
  const out: T[][] = Array.from({ length: count }, () => []);
  groups.forEach((g, i) => out[i % count].push(g));
  return out;
}

/**
 * Monta os planos: grupos distribuídos entre as fichas em round-robin (na
 * ordem em que o usuário escolheu) e exercícios sorteados espalhando entre
 * músculos-alvo distintos, para variar o estímulo dentro do grupo.
 */
export function planFichas({
  modalidade,
  groups,
  minutes,
  count,
  pool,
}: {
  modalidade: Modalidade;
  groups: GeneratorGroup[];
  minutes: number;
  count: number;
  pool: PoolExercise[];
}): FichaPlan[] {
  const perFicha = exercisesPerFicha(minutes, modalidade);
  const fichaGroups = distributeGroups(groups, count);

  // classifica o pool: cada exercício pertence ao primeiro grupo que o cobre
  const byGroup = new Map<string, PoolExercise[]>(groups.map((g) => [g.key, []]));
  for (const ex of pool) {
    const g = groups.find((g) => g.bodyParts.includes(ex.bodyPart));
    if (g) byGroup.get(g.key)!.push(ex);
  }

  return fichaGroups.map((gs, i) => {
    // round-robin entre os grupos da ficha: equilibra e cobre déficit de um
    // grupo raso com os demais, sem passar da cota total
    const queues = gs.map((g) => diverseOrder(byGroup.get(g.key) ?? []));
    const picked: { ex: PoolExercise; groupIdx: number }[] = [];
    for (;;) {
      let took = false;
      for (let j = 0; j < queues.length && picked.length < perFicha; j++) {
        const ex = queues[j].shift();
        if (ex) {
          picked.push({ ex, groupIdx: j });
          took = true;
        }
      }
      if (!took || picked.length >= perFicha) break;
    }
    // agrupa por membro na ordem da ficha (sort estável preserva a diversidade)
    picked.sort((a, b) => a.groupIdx - b.groupIdx);

    return {
      name: `Treino ${LETTERS[i]} — ${gs.map((g) => g.label).join(" · ")}`,
      exerciseIds: picked.map((p) => p.ex.id),
    };
  });
}

/** Ordena o pool alternando músculos-alvo (round-robin sobre alvos embaralhados). */
function diverseOrder(pool: PoolExercise[]): PoolExercise[] {
  const byTarget = new Map<string, PoolExercise[]>();
  for (const ex of shuffle(pool)) {
    const bucket = byTarget.get(ex.target);
    if (bucket) bucket.push(ex);
    else byTarget.set(ex.target, [ex]);
  }
  const buckets = shuffle([...byTarget.values()]);
  const out: PoolExercise[] = [];
  for (let k = 0; out.length < pool.length; k++) {
    for (const bucket of buckets) {
      if (bucket[k]) out.push(bucket[k]);
    }
  }
  return out;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
