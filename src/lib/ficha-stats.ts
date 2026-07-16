/** Tempo médio de execução de uma série, usado só para estimar a duração do treino. */
const SECONDS_PER_SET = 40;
const DEFAULT_REST = 60;

export type PrescriptionLike = { sets: number; restSeconds: number | null };

/**
 * Números do cabeçalho da ficha. `minutes` é uma estimativa grosseira
 * (execução + descanso) — por isso a UI mostra "~".
 */
export function fichaStats(exercises: PrescriptionLike[]) {
  const sets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const seconds = exercises.reduce(
    (sum, e) => sum + e.sets * (SECONDS_PER_SET + (e.restSeconds ?? DEFAULT_REST)),
    0,
  );
  return {
    exercises: exercises.length,
    sets,
    minutes: Math.round(seconds / 60),
  };
}

/**
 * "Treino A — Puxar" vira duas linhas: a segunda ganha o laranja.
 * Nomes sem separador ficam inteiros na primeira linha (sem inventar quebra).
 */
export function splitFichaName(name: string): [string, string | null] {
  const match = name.match(/^(.+?)\s*[—–:-]\s*(.+)$/);
  if (!match) return [name, null];
  return [match[1].trim(), match[2].trim()];
}

/** "PU" para Pull-Up — usado como placeholder quando o exercício não tem foto. */
export function initials(name: string) {
  const words = name.replace(/[^\p{L}\s-]/gu, "").split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
