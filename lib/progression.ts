export type SetValues = { weight: number; reps: number };

/** Incrément de charge proposé quand la fourchette de reps est atteinte (en kg). */
export const WEIGHT_STEP = 2.5;

/** Arrondi à 2,5 kg — le plus petit incrément d'une paire de disques. */
export const roundToStep = (kg: number) => Math.round(kg / WEIGHT_STEP) * WEIGHT_STEP;

/** Échauffements successifs : 50 % × 10, 70 % × 6, 85 % × 3 de la charge de travail. */
const WARMUP_STEPS = [
  { ratio: 0.5, reps: 10 },
  { ratio: 0.7, reps: 6 },
  { ratio: 0.85, reps: 3 },
];

/** Prochaine série d'échauffement, sachant combien il y en a déjà et la charge de travail. */
export function nextWarmup(existing: number, workWeight: number): SetValues {
  const step = WARMUP_STEPS[Math.min(existing, WARMUP_STEPS.length - 1)];
  return { weight: workWeight > 0 ? Math.max(0, roundToStep(workWeight * step.ratio)) : 0, reps: step.reps };
}

/** Recale des échauffements sur une nouvelle charge de travail (même proportion). */
export function scaleWarmups(warmups: SetValues[], oldTop: number, newTop: number): SetValues[] {
  return warmups.map((w) => ({
    weight: oldTop > 0 && newTop > 0 ? Math.max(0, roundToStep((w.weight / oldTop) * newTop)) : w.weight,
    reps: w.reps,
  }));
}

/** « 4 × 8-10 » →{ sets: 4, min: 8, max: 10 } ; « 3 × 12 » → { sets: 3, min: 12, max: 12 }. */
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
