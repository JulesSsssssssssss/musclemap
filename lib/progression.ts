export type SetValues = { weight: number; reps: number };

/** Incrément de charge proposé quand la fourchette de reps est atteinte (en kg). */
export const WEIGHT_STEP = 2.5;

/** « 4 × 8-10 » → { sets: 4, min: 8, max: 10 } ; « 3 × 12 » → { sets: 3, min: 12, max: 12 }. */
export function parseScheme(scheme: string) {
  const m = scheme.match(/(\d+)\s*[×x]\s*(\d+)(?:\s*[-–]\s*(\d+))?/i);
  if (!m) return { sets: 3, min: 10, max: 10 };
  const min = Number(m[2]);
  return { sets: Math.min(8, Math.max(1, Number(m[1]))), min, max: Math.max(min, Number(m[3] ?? m[2])) };
}

/**
 * Séries proposées pour une prochaine séance, d'après la dernière performance.
 * Surcharge progressive : si toutes les séries ont atteint le haut de la fourchette
 * de reps, on ajoute du poids (ou une rep pour un exercice au poids du corps)
 * et on repart du bas de la fourchette.
 */
export function suggestSets(
  previous: SetValues[],
  scheme: string,
  wantedSets?: number,
): { sets: SetValues[]; overload: boolean } {
  const range = parseScheme(scheme);
  const count = wantedSets ?? (previous.length || range.sets);

  if (previous.length === 0) {
    return { sets: Array.from({ length: count }, () => ({ weight: 0, reps: range.min })), overload: false };
  }

  const overload = previous.every((s) => s.reps >= range.max);
  const bodyweight = previous.every((s) => s.weight === 0);

  const sets = Array.from({ length: count }, (_, i) => {
    const base = previous[Math.min(i, previous.length - 1)];
    if (!overload) return { weight: base.weight, reps: base.reps };
    return bodyweight
      ? { weight: 0, reps: base.reps + 1 }
      : { weight: base.weight + WEIGHT_STEP, reps: range.min };
  });
  return { sets, overload };
}
