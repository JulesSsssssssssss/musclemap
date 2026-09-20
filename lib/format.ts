export const mmss = (s: number) =>
  `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, "0")}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/** 4820 → "4 820" (espace insécable fine, comme le template). */
export const num = (n: number) =>
  Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ");

/** 42.5 → "42,5" ; 40 → "40" */
export const dec = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");

export const KG_PER_LB = 2.2046226218;
export const toUnit = (kg: number, unit: string) => (unit === "lb" ? kg * KG_PER_LB : kg);
export const fromUnit = (v: number, unit: string) => (unit === "lb" ? v / KG_PER_LB : v);

const MONTHS = ["JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN", "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC"];
export const dayMonth = (d: Date) => ({ d: String(d.getDate()), m: MONTHS[d.getMonth()] });
export const monthLabel = (d: Date) => MONTHS[d.getMonth()];

/** Épley — 1RM estimé. */
export const e1rm = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30));
