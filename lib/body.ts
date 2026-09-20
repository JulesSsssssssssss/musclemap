import { BODY_DATA } from "./body-data";

export type MuscleKey =
  | "trapezes" | "epaules" | "pectoraux" | "biceps" | "triceps" | "avantbras"
  | "abdominaux" | "obliques" | "dorsaux" | "lombaires" | "fessiers"
  | "quadriceps" | "ischios" | "mollets";

export const MUSCLES: Record<MuscleKey, string> = {
  trapezes: "Trapèzes", epaules: "Épaules", pectoraux: "Pectoraux", biceps: "Biceps",
  triceps: "Triceps", avantbras: "Avant-bras", abdominaux: "Abdominaux", obliques: "Obliques",
  dorsaux: "Dorsaux", lombaires: "Lombaires", fessiers: "Fessiers", quadriceps: "Quadriceps",
  ischios: "Ischio-jambiers", mollets: "Mollets",
};

export const VIEWBOX_FRONT = "0 0 724 1448";
export const VIEWBOX_BACK = "724 0 724 1448";
export const viewBoxFor = (face: boolean) => (face ? VIEWBOX_FRONT : VIEWBOX_BACK);

export const FRONT_MUSCLES = Object.keys(BODY_DATA.front.muscles) as MuscleKey[];
export const BACK_MUSCLES = Object.keys(BODY_DATA.back.muscles) as MuscleKey[];

/** Tracés SVG d'un muscle pour la face (true) ou le dos (false). */
export function pathsFor(muscle: MuscleKey, face: boolean): string[] {
  const m = (face ? BODY_DATA.front : BODY_DATA.back).muscles as Record<string, string[]>;
  return m[muscle] ?? [];
}

export const bodyFor = (face: boolean) => (face ? BODY_DATA.front : BODY_DATA.back);
