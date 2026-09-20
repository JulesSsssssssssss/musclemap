/** Géométrie du corps — extraite telle quelle du template MuscleMap. */

export type Shape =
  | { t: "p"; d: string }
  | { t: "r"; x: number; y: number; w: number; h: number; rx: number }
  | { t: "e"; cx: number; cy: number; rx: number; ry: number };

const p = (d: string): Shape => ({ t: "p", d });
const r = (x: number, y: number, w: number, h: number, rx: number): Shape => ({ t: "r", x, y, w, h, rx });
const e = (cx: number, cy: number, rx: number, ry: number): Shape => ({ t: "e", cx, cy, rx, ry });

export const VIEWBOX = "0 0 260 620";

/** Silhouette de fond, commune aux deux vues — ordre de rendu du template. */
export const SILHOUETTE: Shape[] = [
  e(130, 42, 26, 34),
  p("M116 66h28v32h-28z"),
  p("M114 90q16-8 32 0l42 20q10 6 12 18H60q2-12 12-18z"),
  p("M68 124h124c2 30-2 62-10 86-6 20-12 38-16 54H94c-4-16-10-34-16-54-8-24-12-56-10-86z"),
  p("M92 258h76q8 26 2 46H90q-6-20 2-46z"),
  p("M62 126q-14 32-16 74-2 28 4 52l26-4q-4-38 0-72 2-24 8-42z"),
  p("M198 126q14 32 16 74 2 28-4 52l-26-4q4-38 0-72-2-24-8-42z"),
  p("M50 252q-8 38-10 74l22 4q4-38 10-74z"),
  p("M210 252q8 38 10 74l-22 4q-4-38-10-74z"),
  p("M40 326q-8 28-2 48 12 12 26 2 6-24 4-46z"),
  p("M220 326q8 28 2 48-12 12-26 2-6-24-4-46z"),
  p("M90 300h36q4 44 2 84-2 30-6 52H92q-6-24-8-56-2-42 6-80z"),
  p("M170 300h-36q-4 44-2 84 2 30 6 52h30q6-24 8-56 2-42-6-80z"),
  e(108, 444, 20, 16),
  e(152, 444, 20, 16),
  p("M92 440h30q4 40 2 76-2 32-6 58H96q-6-30-8-62-2-38 4-72z"),
  p("M168 440h-30q-4 40-2 76 2 32 6 58h22q6-30 8-62 2-38-4-72z"),
  p("M96 572h22q2 16 8 24 4 8-4 10H98q-6 0-6-8z"),
  p("M164 572h-22q-2 16-8 24-4 8 4 10h22q6 0 6-8z"),
];

/** Traits d'ombrage par-dessus la silhouette (vue de face). */
export const DETAIL_FRONT: string[] = [
  "M120 70l6 26M140 70l-6 26",
  "M116 98l-24 14M144 98l24 14",
  "M130 132v50M130 186v70",
  "M108 178q22 18 44 0",
  "M56 272v48M204 272v48",
  "M44 350l-4 26M51 354l-2 26M58 354v26M216 350l4 26M209 354l2 26M202 354v26",
  "M108 320v110M152 320v110",
  "M108 464v90M152 464v90",
];

/** Traits d'ombrage par-dessus la silhouette (vue de dos). */
export const DETAIL_BACK: string[] = [
  "M130 116v146",
  "M104 128l18 34M156 128l-18 34",
  "M130 264v38",
  "M56 272v48M204 272v48",
  "M108 320v110M152 320v110",
  "M108 464v78M152 464v78",
];

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

const ARM_UPPER: Shape[] = [
  p("M60 150q-10 28-10 56 0 24 4 40l18-2q-4-34-2-58 2-22 6-34z"),
  p("M200 150q10 28 10 56 0 24-4 40l-18-2q4-34 2-58-2-22-6-34z"),
];
const ARM_FORE: Shape[] = [
  p("M52 256q-8 34-10 66l18 4q4-34 10-68z"),
  p("M208 256q8 34 10 66l-18 4q-4-34-10-68z"),
];
const DELTS: Shape[] = [
  p("M84 122q-16 2-22 18-6 20-2 42 14-2 22-16 4-20 8-34z"),
  p("M176 122q16 2 22 18 6 20 2 42-14-2-22-16-4-20-8-34z"),
];

export const FRONT_SHAPES: Partial<Record<MuscleKey, Shape[]>> = {
  trapezes: [p("M116 88q14-7 28 0l42 22-12 14q-28-12-44-12t-44 12l-12-14z")],
  epaules: DELTS,
  pectoraux: [
    p("M94 128q22-6 34 2v50q-16 10-32 0-8-24-2-52z"),
    p("M166 128q-22-6-34 2v50q16 10 32 0 8-24 2-52z"),
  ],
  biceps: ARM_UPPER,
  avantbras: ARM_FORE,
  obliques: [
    p("M96 184q-6 28-2 56l14 8v-64z"),
    p("M164 184q6 28 2 56l-14 8v-64z"),
  ],
  abdominaux: [
    r(112, 186, 16, 20, 5), r(132, 186, 16, 20, 5),
    r(112, 210, 16, 20, 5), r(132, 210, 16, 20, 5),
    r(112, 234, 16, 20, 5), r(132, 234, 16, 20, 5),
    p("M114 258h32q-2 18-16 24-14-6-16-24z"),
  ],
  quadriceps: [
    p("M94 306h30q4 40 2 76-2 26-6 46H96q-6-22-8-50-2-38 6-72z"),
    p("M166 306h-30q-4 40-2 76 2 26 6 46h24q6-22 8-50 2-38-6-72z"),
  ],
  mollets: [
    p("M98 452h20q2 34-2 62h-16q-4-28-2-62z"),
    p("M162 452h-20q-2 34 2 62h16q4-28 2-62z"),
  ],
};

export const BACK_SHAPES: Partial<Record<MuscleKey, Shape[]>> = {
  trapezes: [p("M130 86l48 24-10 40-38 26-38-26-10-40z")],
  epaules: DELTS,
  dorsaux: [
    p("M98 138q-12 30-6 66l32 26 2-80z"),
    p("M162 138q12 30 6 66l-32 26-2-80z"),
  ],
  triceps: ARM_UPPER,
  avantbras: ARM_FORE,
  lombaires: [p("M106 224q24-8 48 0 2 24-24 32-26-8-24-32z")],
  fessiers: [
    p("M92 262q-6 26 6 42 20 8 30-4v-38z"),
    p("M168 262q6 26-6 42-20 8-30-4v-38z"),
  ],
  ischios: [
    p("M94 308h28q4 40 2 74-2 24-6 42H96q-6-22-8-48-2-36 6-68z"),
    p("M166 308h-28q-4 40-2 74 2 24 6 42h24q6-22 8-48 2-36-6-68z"),
  ],
  mollets: [
    p("M94 450q-6 34 2 62 10 10 20 0 6-30 2-62z"),
    p("M166 450q6 34-2 62-10 10-20 0-6-30-2-62z"),
  ],
};

export const FRONT_MUSCLES = Object.keys(FRONT_SHAPES) as MuscleKey[];
export const BACK_MUSCLES = Object.keys(BACK_SHAPES) as MuscleKey[];

export function shapesFor(muscle: MuscleKey, face: boolean): Shape[] {
  return (face ? FRONT_SHAPES : BACK_SHAPES)[muscle] ?? FRONT_SHAPES[muscle] ?? BACK_SHAPES[muscle] ?? [];
}
