import { addDays, dayKey, weekKey } from "./dates";

/**
 * Objectif hebdomadaire et série de semaines consécutives.
 * `sessions` : dates des séances terminées. Une semaine « réussie » compte au moins `target` séances.
 * La semaine en cours ne casse jamais la série tant qu'elle n'est pas terminée.
 */
export function weeklyGoal(sessions: Date[], target: number, now = new Date()) {
  const perWeek = new Map<string, number>();
  for (const s of sessions) {
    const wk = weekKey(dayKey(s));
    perWeek.set(wk, (perWeek.get(wk) ?? 0) + 1);
  }

  const current = weekKey(dayKey(now));
  const done = perWeek.get(current) ?? 0;
  const met = (wk: string) => (perWeek.get(wk) ?? 0) >= target;

  let streak = met(current) ? 1 : 0;
  for (let wk = addDays(current, -7); met(wk); wk = addDays(wk, -7)) streak++;

  // Record : plus longue série de semaines réussies.
  let best = 0;
  let run = 0;
  const weeks = [...perWeek.keys()].sort();
  let previous: string | null = null;
  for (const wk of weeks) {
    if (!met(wk)) {
      run = 0;
    } else {
      run = previous && addDays(previous, 7) === wk && met(previous) ? run + 1 : 1;
      best = Math.max(best, run);
    }
    previous = wk;
  }

  return { done, target, streak, best: Math.max(best, streak) };
}
