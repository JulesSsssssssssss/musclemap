import type { MuscleKey } from "./body";

/** Partie pure du générateur de séance (sans base de données), donc testable telle quelle. */

export type Candidate = {
  id: string;
  slug: string;
  name: string;
  muscle: string;
  subCode: string;
  equipment: string;
  scheme: string;
  popularity: number;
};

/** Grands groupes : seuls candidats quand les muscles sont choisis automatiquement. */
export const MAJOR_MUSCLES: MuscleKey[] = [
  "pectoraux", "dorsaux", "epaules", "quadriceps", "ischios", "fessiers", "biceps", "triceps", "abdominaux", "mollets",
];

/** Les mouvements polyarticulaires avec charge passent avant l'isolation et le poids du corps. */
const EQUIPMENT_WEIGHT: Record<string, number> = {
  BARRE: 3, "HALTÈRES": 2.5, "SMITH MACHINE": 2, MACHINE: 2, POULIE: 2, LANDMINE: 2, KETTLEBELL: 1.2,
  "POIDS DU CORPS": 1, SANGLES: 1, "ÉLASTIQUE": 0.5, AUTRE: 0.5,
};
export const equipmentWeight = (equipment: string) => EQUIPMENT_WEIGHT[equipment] ?? 0.5;

/** Générateur pseudo-aléatoire déterministe : la même graine redonne la même séance. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nombre d'exercices pour une durée : environ 11 minutes chacun, séries et repos compris. */
export const exerciseCountFor = (minutes: number) => Math.min(9, Math.max(3, Math.round(minutes / 11)));

/**
 * Choisit `quota` exercices parmi les candidats d'un muscle : favoris et exercices déjà pratiqués
 * d'abord, charges lourdes avant l'isolation, sans répéter le même faisceau tant qu'on peut l'éviter.
 */
export function pickForMuscle(
  candidates: Candidate[],
  quota: number,
  ctx: { favorites: Set<string>; recent: Set<string>; rng: () => number },
) {
  const scored = candidates.map((c) => ({
    c,
    base:
      (ctx.favorites.has(c.id) ? 3 : 0) +
      (ctx.recent.has(c.id) ? 2 : 0) +
      c.popularity / 30 +
      equipmentWeight(c.equipment) +
      ctx.rng() * 2.5,
  }));

  const picked: Candidate[] = [];
  const subs = new Set<string>();
  while (picked.length < quota && scored.length > 0) {
    const score = (k: number) => scored[k].base - (subs.has(scored[k].c.subCode) ? 3 : 0);
    let best = 0;
    for (let i = 1; i < scored.length; i++) if (score(i) > score(best)) best = i;
    const [{ c }] = scored.splice(best, 1);
    picked.push(c);
    subs.add(c.subCode);
  }
  return picked;
}
