/**
 * Medida do exercício: o que a ficha prescreve e o que o treino registra.
 *
 * - WEIGHT_REPS   → carga (kg) × repetições (padrão do catálogo)
 * - TIME_DISTANCE → tempo × distância (cardio de locomoção e máquinas)
 *
 * A classificação é caso a caso, não por categoria: na categoria "cardio" do
 * dataset há burpee com halteres, polichinelo, escalador… que continuam em
 * peso × repetições. Só entram aqui os que de fato se medem em tempo/distância.
 */

export type ExerciseMeasure = "WEIGHT_REPS" | "TIME_DISTANCE";

/** Ids do catálogo (dataset) medidos em tempo × distância. Fonte da seed e da migration. */
export const TIME_DISTANCE_EXERCISE_IDS: ReadonlySet<string> = new Set([
  // corrida / caminhada
  "0685", // run — corrida
  "0684", // run (equipment) — corrida na esteira
  "3656", // short stride run — corrida com passada curta
  "3637", // wheel run — corrida na roda
  "3666", // walking on incline treadmill — caminhada na esteira inclinada
  "2311", // walking on stepmill — caminhada no simulador de escada
  // bike / elíptico
  "0798", // stationary bike walk — bike estacionária caminhada
  "2138", // stationary bike run v. 3 — bike estacionária corrida
  "2331", // cycle cross trainer — transport elíptico
  "2141", // walk elliptical cross trainer — caminhada no elíptico
  // ergômetros
  "2139", // hands bike — bicicleta de braços (ergômetro de braço)
  "2142", // ski ergometer — ergômetro de esqui
  // corda / deslocamento
  "2612", // jump rope — pular corda
  "0128", // battling ropes — corda naval
  "3360", // bear crawl — caminhada do urso
]);

export function measureFor(exerciseId: string): ExerciseMeasure {
  return TIME_DISTANCE_EXERCISE_IDS.has(exerciseId) ? "TIME_DISTANCE" : "WEIGHT_REPS";
}

export const isTimeDistance = (measure: ExerciseMeasure) => measure === "TIME_DISTANCE";

/** Tempo alvo inicial de um item de cardio na ficha (10 min por série). */
export const DEFAULT_CARDIO_DURATION_S = 600;

// ── formatação (pt-BR) ────────────────────────────────────────────

/** 600 → "10 min" · 5400 → "1h30" · 45 → "45s" · 630 → "10:30" */
export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return s === 0 ? `${h}h${m === 0 ? "" : String(m).padStart(2, "0")}` : `${h}:${pad(m)}:${pad(s)}`;
  return s === 0 ? `${m} min` : `${m}:${pad(s)}`;
}

/** Sempre M:SS (ou H:MM:SS) — para colunas em mono, onde a largura importa. */
export function formatDurationClock(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** 5000 → "5 km" · 2500 → "2,5 km" · 800 → "800 m" */
export function formatDistance(meters: number) {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
}

/** Valor para um input de tempo: "10" (min inteiros) ou "10:30". */
export function durationInputValue(seconds: number | null) {
  if (seconds === null) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? String(m) : `${m}:${pad(s)}`;
}

/** Valor para um input de distância em km: "5" ou "2,5". */
export function distanceInputValue(meters: number | null) {
  if (meters === null) return "";
  return (meters / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

// ── parsing de entrada ────────────────────────────────────────────

/**
 * Tempo digitado → segundos. Aceita minutos ("10", "12,5") ou relógio
 * ("10:30", "1:05:00"). Vazio → null; inválido → NaN.
 */
export function parseDurationInput(raw: string): number | null {
  const v = raw.trim().replace(",", ".");
  if (!v) return null;
  if (/^\d+(\.\d+)?$/.test(v)) return Math.round(Number(v) * 60);
  const parts = v.split(":");
  if (parts.length < 2 || parts.length > 3 || !parts.every((p) => /^\d{1,2}$/.test(p)))
    return NaN;
  const nums = parts.map(Number);
  if (nums.slice(1).some((n) => n >= 60)) return NaN;
  return nums.length === 3 ? nums[0] * 3600 + nums[1] * 60 + nums[2] : nums[0] * 60 + nums[1];
}

/** Distância digitada em km ("5", "2,5") → metros. Vazio → null; inválido → NaN. */
export function parseDistanceInput(raw: string): number | null {
  const v = raw.trim().replace(",", ".");
  if (!v) return null;
  if (!/^\d+(\.\d+)?$/.test(v)) return NaN;
  return Math.round(Number(v) * 1000);
}

const pad = (n: number) => String(n).padStart(2, "0");
