/** Jours et semaines « à la française » : fuseau de Paris, semaine du lundi au dimanche. */

const TZ = "Europe/Paris";
const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** 2026-09-21T23:30Z → "2026-09-22" (jour civil à Paris). */
export const dayKey = (d: Date) => parts.format(d);

const noon = (key: string) => new Date(`${key}T12:00:00Z`);
const toKey = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (key: string, n: number) => toKey(new Date(noon(key).getTime() + n * 86_400_000));

/** Lundi de la semaine contenant ce jour. */
export const weekKey = (key: string) => addDays(key, -((noon(key).getUTCDay() + 6) % 7));

/** Jour de la semaine, lundi = 0. */
export const weekday = (key: string) => (noon(key).getUTCDay() + 6) % 7;

export const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** "2026-09" → { y: 2026, m: 9 } ; valeur invalide → mois courant. */
export function parseMonth(raw: string | undefined, today: string) {
  const m = raw?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const [y, mo] = m ? [Number(m[1]), Number(m[2])] : [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  return { y, m: mo };
}

export const monthKey = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
export const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
export const shiftMonth = (y: number, m: number, delta: number) => {
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 };
};
