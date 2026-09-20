import type { MuscleKey } from "./body";

export type Sub = { code: string; name: string; hint: string };

/** Faisceaux par groupe musculaire — repris du template. */
export const SUBS: Partial<Record<MuscleKey, Sub[]>> = {
  epaules: [
    { code: "ANT", name: "Deltoïde antérieur", hint: "Faisceau avant · poussée" },
    { code: "MOY", name: "Deltoïde moyen", hint: "Faisceau latéral · largeur" },
    { code: "POST", name: "Deltoïde postérieur", hint: "Faisceau arrière · posture" },
  ],
  pectoraux: [
    { code: "SUP", name: "Pectoral supérieur", hint: "Faisceau claviculaire" },
    { code: "MED", name: "Pectoral médian", hint: "Faisceau sterno-costal" },
    { code: "INF", name: "Pectoral inférieur", hint: "Faisceau abdominal" },
  ],
  dorsaux: [
    { code: "GD", name: "Grand dorsal", hint: "Largeur du dos" },
    { code: "RHO", name: "Rhomboïdes", hint: "Entre les omoplates" },
    { code: "TRP", name: "Trapèzes", hint: "Haut / milieu / bas" },
    { code: "LOM", name: "Lombaires", hint: "Bas du dos · gainage" },
  ],
  quadriceps: [
    { code: "VL", name: "Vaste latéral", hint: "Extérieur de la cuisse" },
    { code: "VM", name: "Vaste médial", hint: "Intérieur · genou" },
    { code: "RF", name: "Droit fémoral", hint: "Centre · flexion hanche" },
  ],
  biceps: [
    { code: "LON", name: "Chef long", hint: "Extérieur · pic du biceps" },
    { code: "CRT", name: "Chef court", hint: "Intérieur · épaisseur" },
    { code: "BRA", name: "Brachial", hint: "Sous le biceps" },
  ],
  triceps: [
    { code: "LON", name: "Chef long", hint: "Masse arrière du bras" },
    { code: "LAT", name: "Chef latéral", hint: "Extérieur · fer à cheval" },
    { code: "MED", name: "Chef médial", hint: "Profond · verrouillage" },
  ],
  abdominaux: [
    { code: "HAU", name: "Grand droit — haut", hint: "Flexion du buste" },
    { code: "BAS", name: "Grand droit — bas", hint: "Relevé de bassin" },
    { code: "TRA", name: "Transverse", hint: "Gainage profond" },
  ],
  trapezes: [
    { code: "SUP", name: "Trapèze supérieur", hint: "Haussement d'épaules" },
    { code: "MED", name: "Trapèze moyen", hint: "Rétraction scapulaire" },
    { code: "INF", name: "Trapèze inférieur", hint: "Abaissement · posture" },
  ],
  avantbras: [
    { code: "FLE", name: "Fléchisseurs", hint: "Face interne · grip" },
    { code: "EXT", name: "Extenseurs", hint: "Face externe" },
    { code: "BRR", name: "Brachio-radial", hint: "Marteau · épaisseur" },
  ],
  obliques: [
    { code: "EXT", name: "Oblique externe", hint: "Rotation du buste" },
    { code: "INT", name: "Oblique interne", hint: "Inclinaison latérale" },
  ],
  lombaires: [
    { code: "ERE", name: "Érecteurs du rachis", hint: "Extension du dos" },
    { code: "MUL", name: "Multifides", hint: "Stabilité profonde" },
  ],
  fessiers: [
    { code: "MAX", name: "Grand fessier", hint: "Extension de hanche" },
    { code: "MOY", name: "Moyen fessier", hint: "Abduction · stabilité" },
    { code: "MIN", name: "Petit fessier", hint: "Rotation interne" },
  ],
  ischios: [
    { code: "BIF", name: "Biceps fémoral", hint: "Extérieur de la cuisse" },
    { code: "SMT", name: "Semi-membraneux", hint: "Intérieur · profond" },
    { code: "STD", name: "Semi-tendineux", hint: "Intérieur · superficiel" },
  ],
  mollets: [
    { code: "GAS", name: "Gastrocnémien", hint: "Volume · debout" },
    { code: "SOL", name: "Soléaire", hint: "Endurance · assis" },
  ],
};

export const DEFAULT_SUBS: Sub[] = [
  { code: "SUP", name: "Faisceau supérieur", hint: "Partie haute" },
  { code: "MED", name: "Faisceau moyen", hint: "Partie centrale" },
  { code: "INF", name: "Faisceau inférieur", hint: "Partie basse" },
];

export function subsFor(muscle: MuscleKey): Sub[] {
  return SUBS[muscle] ?? DEFAULT_SUBS;
}

export const EQUIPMENTS = ["Tous", "Barre", "Haltères", "Poulie", "Machine", "Poids du corps", "Kettlebell", "Élastique", "Smith machine", "Landmine", "Sangles", "Autre"];
export const PERIODS = [
  { label: "1 M", months: 1 },
  { label: "3 M", months: 3 },
  { label: "6 M", months: 6 },
  { label: "1 AN", months: 12 },
];

/** Fiche d'un exercice : étapes numérotées + conseils (sous-titres et paragraphes). */
export type GuideBlock = { kind: "h" | "p"; text: string };
export type Guide = { steps?: string[]; tips?: GuideBlock[] };

/** Résout un libellé de muscle ("Deltoïde ant.", "Grand dorsal") vers une clé de la carte. */
const LABEL_RULES: [RegExp, string][] = [
  [/deltoïde|épaule/i, "epaules"],
  [/pector/i, "pectoraux"],
  [/trapèze/i, "trapezes"],
  [/dorsal|rhomboïde/i, "dorsaux"],
  [/triceps|chef (latéral|médial)/i, "triceps"],
  [/biceps fémoral|ischio|semi-/i, "ischios"],
  [/biceps|brachial|chef (long|court)/i, "biceps"],
  [/brachio-radial|fléchisseur|extenseur|avant-bras/i, "avantbras"],
  [/oblique/i, "obliques"],
  [/abdomin|transverse|grand droit/i, "abdominaux"],
  [/lombaire|érecteur|multifide/i, "lombaires"],
  [/fessier/i, "fessiers"],
  [/quadriceps|vaste|droit fémoral/i, "quadriceps"],
  [/mollet|gastrocn|soléaire/i, "mollets"],
];

export function muscleFromLabel(label: string): string | null {
  for (const [re, key] of LABEL_RULES) if (re.test(label)) return key;
  return null;
}
