/**
 * O dataset traz a taxonomia em inglês minúsculo ("upper arms", "body weight").
 * Traduzimos na borda de exibição e mantemos o valor original no banco — é a
 * chave usada nos filtros.
 */

export const BODY_PART_LABELS: Record<string, string> = {
  chest: "Peito",
  back: "Costas",
  shoulders: "Ombros",
  "upper arms": "Braços",
  "lower arms": "Antebraços",
  waist: "Core",
  "upper legs": "Coxas",
  "lower legs": "Panturrilhas",
  neck: "Pescoço",
  cardio: "Cardio",
};

/** Ordem de exibição: de cima do corpo para baixo, como numa ficha. */
export const BODY_PART_ORDER = [
  "chest",
  "back",
  "shoulders",
  "upper arms",
  "lower arms",
  "waist",
  "upper legs",
  "lower legs",
  "neck",
  "cardio",
];

export const EQUIPMENT_LABELS: Record<string, string> = {
  "body weight": "Peso corporal",
  dumbbell: "Halter",
  barbell: "Barra",
  "ez barbell": "Barra W",
  "olympic barbell": "Barra olímpica",
  "trap bar": "Barra hexagonal",
  cable: "Cabo",
  "leverage machine": "Máquina",
  "smith machine": "Smith",
  "sled machine": "Leg press",
  kettlebell: "Kettlebell",
  band: "Elástico",
  "resistance band": "Faixa elástica",
  "medicine ball": "Bola medicinal",
  "stability ball": "Bola suíça",
  "bosu ball": "Bosu",
  rope: "Corda",
  roller: "Rolo",
  "wheel roller": "Roda abdominal",
  hammer: "Marreta",
  tire: "Pneu",
  weighted: "Com carga",
  assisted: "Assistido",
  "stationary bike": "Bike",
  "elliptical machine": "Elíptico",
  "stepmill machine": "Escada",
  "skierg machine": "SkiErg",
  "upper body ergometer": "Ergômetro de braço",
};

/**
 * Equipamentos sem carga externa: o peso vem do próprio corpo. No modo treino,
 * exercícios com esse equipamento já entram com o campo de peso em N/A.
 */
export const BODYWEIGHT_EQUIPMENT = new Set(["body weight"]);

/** Músculos-alvo, usados na linha da ficha e no card. */
export const TARGET_LABELS: Record<string, string> = {
  abs: "Abdômen",
  abductors: "Abdutores",
  adductors: "Adutores",
  biceps: "Bíceps",
  triceps: "Tríceps",
  calves: "Panturrilhas",
  "cardiovascular system": "Cardiovascular",
  delts: "Deltoides",
  forearms: "Antebraços",
  glutes: "Glúteos",
  hamstrings: "Posteriores",
  lats: "Dorsais",
  "levator scapulae": "Elevador da escápula",
  pectorals: "Peitorais",
  quads: "Quadríceps",
  "serratus anterior": "Serrátil",
  spine: "Coluna",
  traps: "Trapézio",
  "upper back": "Costas superiores",
};

/**
 * Vocabulário anatômico de `secondaryMuscles` e `muscleGroup` — distinto do de
 * `target`, com 40 termos. Sinônimos (lats/latissimus dorsi, traps/trapezius)
 * convergem para o mesmo rótulo de propósito.
 */
export const MUSCLE_LABELS: Record<string, string> = {
  abdominals: "Abdômen",
  "lower abs": "Abdômen inferior",
  core: "Core",
  obliques: "Oblíquos",
  "hip flexors": "Flexores do quadril",
  groin: "Virilha",
  "inner thighs": "Adutores",
  back: "Costas",
  "upper back": "Costas superiores",
  "lower back": "Lombar",
  lats: "Dorsais",
  "latissimus dorsi": "Dorsais",
  rhomboids: "Romboides",
  traps: "Trapézio",
  trapezius: "Trapézio",
  "rotator cuff": "Manguito rotador",
  sternocleidomastoid: "Esternocleidomastoideo",
  chest: "Peito",
  "upper chest": "Peito superior",
  shoulders: "Ombros",
  deltoids: "Deltoides",
  "rear deltoids": "Deltoide posterior",
  biceps: "Bíceps",
  brachialis: "Braquial",
  triceps: "Tríceps",
  forearms: "Antebraços",
  "wrist flexors": "Flexores do punho",
  "wrist extensors": "Extensores do punho",
  wrists: "Punhos",
  hands: "Mãos",
  "grip muscles": "Pegada",
  glutes: "Glúteos",
  quadriceps: "Quadríceps",
  hamstrings: "Posteriores",
  calves: "Panturrilhas",
  soleus: "Sóleo",
  shins: "Tibiais",
  ankles: "Tornozelos",
  "ankle stabilizers": "Estabilizadores do tornozelo",
  feet: "Pés",
};

/** Todos os vocabulários juntos: o primeiro que tiver o termo ganha. */
const ALL_LABELS = [MUSCLE_LABELS, TARGET_LABELS, BODY_PART_LABELS];

/** Rótulo em pt para qualquer termo anatômico, venha de que campo vier. */
export function muscleLabel(value: string) {
  for (const dict of ALL_LABELS) {
    if (dict[value]) return dict[value];
  }
  return titleCase(value);
}

export function label(dict: Record<string, string>, value: string) {
  return dict[value] ?? titleCase(value);
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Só a inicial em maiúscula, preservando o resto (nomes de exercícios). */
export function sentenceCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Atribuição exigida pelos termos do dataset — precisa aparecer onde a mídia aparece. */
export const MEDIA_ATTRIBUTION = "© Gym visual — gymvisual.com";
