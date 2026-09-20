import type { Guide } from "../lib/catalog";

export type SeedExercise = {
  slug: string;
  name: string;
  equipment: string;
  level: string;
  muscle: string;
  subCode: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  scheme?: string;
  popularity?: number;
  guide?: Guide;
};

const militaire: Guide = {
  execution: [
    { title: "Position de départ", body: "Debout ou assis, barre en pronation un peu plus large que les épaules, coudes sous la barre, abdos gainés, fessiers serrés." },
    { title: "Montée", body: "Pousse la barre à la verticale en dégageant légèrement la tête en arrière, puis replace le buste sous la barre en fin de mouvement." },
    { title: "Respiration", body: "Inspire en bas, bloque pendant la poussée, expire une fois les bras tendus." },
    { title: "Amplitude", body: "Descends jusqu'au menton sans rebondir sur les clavicules. Contrôle 2 secondes à la descente." },
  ],
  tips: [
    { title: "Serre la barre", body: "Une prise ferme active davantage le deltoïde antérieur et stabilise le poignet sous la charge." },
    { title: "Gaine le tronc", body: "Sans gainage, le bas du dos compense et la charge quitte l'épaule. Côtes basses, bassin neutre." },
    { title: "Charge progressive", body: "Vise +2,5 kg dès que tu boucles 3×10 propres deux séances d'affilée." },
  ],
  mistakes: [
    { title: "Cambrer le dos", body: "Le mouvement devient un développé incliné : les pectoraux prennent le travail, plus l'épaule." },
    { title: "Coudes trop écartés", body: "Met l'articulation en conflit. Garde les avant-bras verticaux." },
    { title: "Amplitude coupée", body: "S'arrêter à mi-course limite la tension sur le faisceau antérieur." },
  ],
  variants: [
    { title: "Développé assis", body: "Dossier vertical : moins de triche, plus d'isolation sur l'épaule." },
    { title: "Développé haltères", body: "Amplitude libre, corrige les déséquilibres droite / gauche." },
    { title: "Push press", body: "Impulsion des jambes pour passer plus lourd — variante force." },
  ],
};

const g = (
  execution: [string, string][],
  mistakes: [string, string][],
  tips: [string, string][] = [],
  variants: [string, string][] = [],
): Guide => ({
  execution: execution.map(([title, body]) => ({ title, body })),
  tips: tips.map(([title, body]) => ({ title, body })),
  mistakes: mistakes.map(([title, body]) => ({ title, body })),
  variants: variants.map(([title, body]) => ({ title, body })),
});

export const EXERCISES: SeedExercise[] = [
  // ── Épaules ───────────────────────────────────────────────────────────────
  {
    slug: "developpe-militaire-barre", name: "Développé militaire à la barre",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "epaules", subCode: "ANT",
    primaryMuscle: "Deltoïde ant.", secondaryMuscles: ["Triceps", "Trapèzes"],
    scheme: "4 × 8-10", popularity: 98, guide: militaire,
  },
  {
    slug: "elevations-frontales-halteres", name: "Élévations frontales haltères",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "epaules", subCode: "ANT",
    primaryMuscle: "Deltoïde ant.", secondaryMuscles: ["Pectoral sup."],
    scheme: "3 × 12-15", popularity: 74,
    guide: g(
      [["Départ", "Debout, haltères devant les cuisses en pronation, coudes légèrement fléchis."],
       ["Montée", "Lève les bras devant toi jusqu'à hauteur d'épaules, sans à-coup."]],
      [["Balancer le buste", "Si tu recules les épaules pour lancer la charge, l'exercice devient un mouvement de dos."],
       ["Monter trop haut", "Au-delà de l'horizontale, le trapèze prend le relais."]],
      [["Alterne les bras", "Un bras à la fois permet de mieux sentir le faisceau antérieur."]],
      [["À la poulie basse", "Tension constante sur toute l'amplitude."]],
    ),
  },
  {
    slug: "developpe-arnold", name: "Développé Arnold",
    equipment: "HALTÈRES", level: "INTERMÉDIAIRE", muscle: "epaules", subCode: "ANT",
    primaryMuscle: "Deltoïde ant.", secondaryMuscles: ["Deltoïde moy.", "Triceps"],
    scheme: "4 × 10", popularity: 81,
    guide: g(
      [["Départ", "Assis, haltères devant le visage en supination, coudes serrés."],
       ["Rotation", "Ouvre les bras en tournant les poignets vers la pronation pendant la poussée."]],
      [["Rotation trop rapide", "La rotation doit accompagner la montée, pas la précéder."],
       ["Dossier trop incliné", "Un dossier en arrière transfère le travail sur les pectoraux."]],
    ),
  },
  {
    slug: "developpe-epaules-machine", name: "Développé épaules machine",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "epaules", subCode: "ANT",
    primaryMuscle: "Deltoïde ant.", secondaryMuscles: ["Triceps"],
    scheme: "3 × 12", popularity: 66,
    guide: g(
      [["Réglage", "Poignées à hauteur d'épaules, dos entièrement plaqué au dossier."],
       ["Poussée", "Tends les bras sans verrouiller violemment les coudes."]],
      [["Décoller le dos", "Perd la stabilité et déplace la charge sur les lombaires."],
       ["Siège trop bas", "Force l'épaule à travailler en fin d'amplitude articulaire."]],
    ),
  },
  {
    slug: "elevation-frontale-poulie", name: "Élévation frontale à la poulie",
    equipment: "POULIE", level: "INTERMÉDIAIRE", muscle: "epaules", subCode: "ANT",
    primaryMuscle: "Deltoïde ant.", secondaryMuscles: ["Obliques"],
    scheme: "3 × 12-15", popularity: 58,
  },
  {
    slug: "pompes-piquees", name: "Pompes piquées",
    equipment: "POIDS DU CORPS", level: "AVANCÉ", muscle: "epaules", subCode: "ANT",
    primaryMuscle: "Deltoïde ant.", secondaryMuscles: ["Triceps", "Abdominaux"],
    scheme: "4 × 8", popularity: 52,
  },
  {
    slug: "elevations-laterales-halteres", name: "Élévations latérales haltères",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "epaules", subCode: "MOY",
    primaryMuscle: "Deltoïde moy.", secondaryMuscles: ["Trapèzes"],
    scheme: "4 × 12-15", popularity: 95,
    guide: g(
      [["Départ", "Debout, haltères le long du corps, coudes très légèrement fléchis et figés."],
       ["Montée", "Écarte les bras sur les côtés jusqu'à l'horizontale, petit doigt légèrement plus haut."],
       ["Descente", "3 secondes de descente contrôlée — c'est là que le muscle travaille le plus."]],
      [["Trop lourd", "Le trapèze remonte l'épaule et vole le travail au deltoïde moyen."],
       ["Élan des jambes", "Un rebond sur les genoux annule la tension."]],
      [["Léger et propre", "Ce muscle répond au volume, pas à la charge. Reste sous 12 kg au début."]],
      [["À la poulie", "Tension continue, surtout en bas de l'amplitude."],
       ["Penché en avant", "Déplace l'accent vers le deltoïde postérieur."]],
    ),
  },
  {
    slug: "elevations-laterales-poulie", name: "Élévations latérales à la poulie",
    equipment: "POULIE", level: "INTERMÉDIAIRE", muscle: "epaules", subCode: "MOY",
    primaryMuscle: "Deltoïde moy.", secondaryMuscles: ["Trapèzes"], scheme: "3 × 15", popularity: 70,
  },
  {
    slug: "elevations-laterales-machine", name: "Élévations latérales machine",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "epaules", subCode: "MOY",
    primaryMuscle: "Deltoïde moy.", secondaryMuscles: [], scheme: "3 × 15", popularity: 49,
  },
  {
    slug: "face-pull", name: "Face pull",
    equipment: "POULIE", level: "DÉBUTANT", muscle: "epaules", subCode: "POST",
    primaryMuscle: "Deltoïde post.", secondaryMuscles: ["Rhomboïdes", "Trapèzes"],
    scheme: "3 × 15-20", popularity: 88,
    guide: g(
      [["Réglage", "Corde à hauteur du visage, recule d'un pas pour mettre le câble en tension."],
       ["Tirage", "Tire la corde vers le front en écartant les mains, coudes hauts."]],
      [["Coudes qui tombent", "Le mouvement devient un tirage dorsaux."],
       ["Trop lourd", "Le buste recule pour compenser et le postérieur ne travaille plus."]],
      [["Fin de séance", "Excellent en finisher pour rééquilibrer une séance de poussée."]],
    ),
  },
  {
    slug: "oiseau-halteres", name: "Oiseau haltères",
    equipment: "HALTÈRES", level: "INTERMÉDIAIRE", muscle: "epaules", subCode: "POST",
    primaryMuscle: "Deltoïde post.", secondaryMuscles: ["Rhomboïdes"], scheme: "3 × 12-15", popularity: 72,
  },
  {
    slug: "reverse-pec-deck", name: "Reverse pec-deck",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "epaules", subCode: "POST",
    primaryMuscle: "Deltoïde post.", secondaryMuscles: ["Trapèzes"], scheme: "3 × 15", popularity: 61,
  },

  // ── Pectoraux ─────────────────────────────────────────────────────────────
  {
    slug: "developpe-incline-barre", name: "Développé incliné à la barre",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "pectoraux", subCode: "SUP",
    primaryMuscle: "Pectoral sup.", secondaryMuscles: ["Deltoïde ant.", "Triceps"],
    scheme: "4 × 8-10", popularity: 92,
    guide: g(
      [["Réglage", "Banc à 30°. Au-delà, l'épaule prend la majorité du travail."],
       ["Descente", "Barre vers le haut des pectoraux, coudes à 45° du buste."],
       ["Poussée", "Pousse en gardant les omoplates serrées et basses."]],
      [["Banc trop incliné", "45° et plus transforme l'exercice en développé épaules."],
       ["Rebond sur la poitrine", "Supprime la tension et met les côtes en danger."]],
      [["Pieds au sol", "L'ancrage au sol donne de la stabilité et permet de pousser plus lourd."]],
      [["Aux haltères", "Meilleure amplitude, corrige les déséquilibres."]],
    ),
  },
  {
    slug: "developpe-incline-halteres", name: "Développé incliné haltères",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "pectoraux", subCode: "SUP",
    primaryMuscle: "Pectoral sup.", secondaryMuscles: ["Deltoïde ant."], scheme: "4 × 10", popularity: 90,
  },
  {
    slug: "ecarte-incline-poulie", name: "Écarté incliné à la poulie",
    equipment: "POULIE", level: "INTERMÉDIAIRE", muscle: "pectoraux", subCode: "SUP",
    primaryMuscle: "Pectoral sup.", secondaryMuscles: [], scheme: "3 × 12-15", popularity: 55,
  },
  {
    slug: "developpe-couche", name: "Développé couché",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "pectoraux", subCode: "MED",
    primaryMuscle: "Pectoral médian", secondaryMuscles: ["Triceps", "Deltoïde ant."],
    scheme: "5 × 5", popularity: 100,
    guide: g(
      [["Placement", "Omoplates serrées et basses, léger arc lombaire naturel, pieds ancrés."],
       ["Descente", "Barre vers le bas des pectoraux, coudes à 45-60°, 2 secondes de contrôle."],
       ["Poussée", "Pousse le sol avec les pieds et remonte la barre en léger arc vers les épaules."]],
      [["Coudes à 90°", "Position la plus traumatisante pour l'épaule. Garde 45-60°."],
       ["Fesses décollées", "Réduit l'amplitude et change l'angle de travail — série non valide."],
       ["Barre qui rebondit", "Le rebond triche la partie la plus difficile du mouvement."]],
      [["Serre fort la barre", "Plus la prise est ferme, plus le système nerveux autorise de force."],
       ["Pareur obligatoire", "Au-delà de 80 % du max, ne travaille jamais seul sans rack de sécurité."]],
      [["Prise serrée", "Accent sur les triceps et le pectoral interne."],
       ["Au sol (floor press)", "Amplitude réduite, plus sûr pour les épaules sensibles."]],
    ),
  },
  {
    slug: "developpe-couche-halteres", name: "Développé couché haltères",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "pectoraux", subCode: "MED",
    primaryMuscle: "Pectoral médian", secondaryMuscles: ["Triceps"], scheme: "4 × 10", popularity: 87,
  },
  {
    slug: "pec-deck", name: "Pec-deck",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "pectoraux", subCode: "MED",
    primaryMuscle: "Pectoral médian", secondaryMuscles: [], scheme: "3 × 12-15", popularity: 76,
  },
  {
    slug: "pompes", name: "Pompes",
    equipment: "POIDS DU CORPS", level: "DÉBUTANT", muscle: "pectoraux", subCode: "MED",
    primaryMuscle: "Pectoral médian", secondaryMuscles: ["Triceps", "Abdominaux"],
    scheme: "4 × max", popularity: 94,
    guide: g(
      [["Placement", "Mains un peu plus larges que les épaules, corps aligné de la tête aux talons."],
       ["Descente", "Poitrine à quelques centimètres du sol, coudes à 45°."]],
      [["Bassin qui s'affaisse", "Signe d'un gainage insuffisant — passe sur les genoux."],
       ["Amplitude partielle", "Descends jusqu'en bas ou la série ne compte pas."]],
      [["Progression", "Pieds surélevés pour durcir, mains sur un banc pour alléger."]],
    ),
  },
  {
    slug: "dips-pectoraux", name: "Dips penché en avant",
    equipment: "POIDS DU CORPS", level: "AVANCÉ", muscle: "pectoraux", subCode: "INF",
    primaryMuscle: "Pectoral inf.", secondaryMuscles: ["Triceps", "Deltoïde ant."],
    scheme: "4 × 8-12", popularity: 83,
  },
  {
    slug: "ecarte-poulie-haute", name: "Écarté à la poulie haute",
    equipment: "POULIE", level: "INTERMÉDIAIRE", muscle: "pectoraux", subCode: "INF",
    primaryMuscle: "Pectoral inf.", secondaryMuscles: [], scheme: "3 × 15", popularity: 64,
  },
  {
    slug: "developpe-decline", name: "Développé décliné",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "pectoraux", subCode: "INF",
    primaryMuscle: "Pectoral inf.", secondaryMuscles: ["Triceps"], scheme: "4 × 10", popularity: 47,
  },

  // ── Dorsaux ───────────────────────────────────────────────────────────────
  {
    slug: "tractions-pronation", name: "Tractions en pronation",
    equipment: "POIDS DU CORPS", level: "AVANCÉ", muscle: "dorsaux", subCode: "GD",
    primaryMuscle: "Grand dorsal", secondaryMuscles: ["Biceps", "Rhomboïdes"],
    scheme: "4 × 6-10", popularity: 96,
    guide: g(
      [["Prise", "Mains plus larges que les épaules, pouces par-dessus la barre."],
       ["Tirage", "Amène la poitrine vers la barre en descendant les épaules, pas en tirant avec les bras."],
       ["Descente", "Bras quasi tendus en bas, sans relâcher complètement les omoplates."]],
      [["Balancer le corps", "Le kipping change l'exercice — garde les jambes stables."],
       ["Amplitude coupée", "Menton au-dessus de la barre ou la rep ne compte pas."]],
      [["Élastique", "Un élastique sous les pieds permet de construire les premières répétitions."]],
      [["Supination", "Plus de biceps, souvent plus facile."],
       ["Prise neutre", "Plus confortable pour l'épaule."]],
    ),
  },
  {
    slug: "tirage-vertical", name: "Tirage vertical à la poulie",
    equipment: "POULIE", level: "DÉBUTANT", muscle: "dorsaux", subCode: "GD",
    primaryMuscle: "Grand dorsal", secondaryMuscles: ["Biceps"], scheme: "4 × 10-12", popularity: 91,
  },
  {
    slug: "rowing-barre", name: "Rowing barre buste penché",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "dorsaux", subCode: "GD",
    primaryMuscle: "Grand dorsal", secondaryMuscles: ["Rhomboïdes", "Lombaires"],
    scheme: "4 × 8-10", popularity: 89,
    guide: g(
      [["Placement", "Buste à 45°, dos plat, barre sous les épaules, genoux légèrement fléchis."],
       ["Tirage", "Tire la barre vers le nombril en serrant les omoplates."]],
      [["Dos rond", "Risque lombaire direct — allège et regarde 2 m devant toi."],
       ["Buste qui se redresse", "Si le torse remonte à chaque rep, la charge est trop lourde."]],
    ),
  },
  {
    slug: "rowing-halteres", name: "Rowing haltère unilatéral",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "dorsaux", subCode: "GD",
    primaryMuscle: "Grand dorsal", secondaryMuscles: ["Biceps"], scheme: "4 × 10", popularity: 85,
  },
  {
    slug: "rowing-machine", name: "Rowing assis machine",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "dorsaux", subCode: "RHO",
    primaryMuscle: "Rhomboïdes", secondaryMuscles: ["Grand dorsal", "Trapèzes"], scheme: "4 × 12", popularity: 79,
  },
  {
    slug: "tirage-horizontal-poulie", name: "Tirage horizontal à la poulie",
    equipment: "POULIE", level: "DÉBUTANT", muscle: "dorsaux", subCode: "RHO",
    primaryMuscle: "Rhomboïdes", secondaryMuscles: ["Grand dorsal"], scheme: "4 × 12", popularity: 86,
  },
  {
    slug: "shrugs-barre", name: "Shrugs à la barre",
    equipment: "BARRE", level: "DÉBUTANT", muscle: "dorsaux", subCode: "TRP",
    primaryMuscle: "Trapèzes", secondaryMuscles: ["Avant-bras"], scheme: "4 × 12-15", popularity: 68,
  },
  {
    slug: "souleve-de-terre", name: "Soulevé de terre",
    equipment: "BARRE", level: "AVANCÉ", muscle: "dorsaux", subCode: "LOM",
    primaryMuscle: "Lombaires", secondaryMuscles: ["Fessiers", "Ischios", "Trapèzes"],
    scheme: "5 × 5", popularity: 97,
    guide: g(
      [["Placement", "Barre au-dessus du milieu du pied, tibias près de la barre, dos plat, hanches hautes."],
       ["Départ", "Pousse le sol avec les jambes — la barre monte en frôlant les tibias."],
       ["Verrouillage", "Hanches et genoux se verrouillent en même temps, sans hyperextension lombaire."]],
      [["Dos rond", "L'erreur la plus dangereuse. Allège immédiatement."],
       ["Barre qui s'éloigne", "Chaque centimètre d'écart multiplie le bras de levier lombaire."],
       ["Hyperextension en haut", "Se pencher en arrière en fin de rep écrase les disques."]],
      [["Prise mixte ou sangles", "Au-delà d'un certain poids, le grip lâche avant le dos."]],
      [["Sumo", "Prise large, moins de contrainte lombaire, plus de quadriceps."],
       ["Roumain", "Jambes quasi tendues, accent sur les ischios."]],
    ),
  },
  {
    slug: "hyperextensions", name: "Hyperextensions au banc",
    equipment: "POIDS DU CORPS", level: "DÉBUTANT", muscle: "dorsaux", subCode: "LOM",
    primaryMuscle: "Lombaires", secondaryMuscles: ["Fessiers", "Ischios"], scheme: "3 × 15", popularity: 62,
  },

  // ── Biceps ────────────────────────────────────────────────────────────────
  {
    slug: "curl-barre", name: "Curl à la barre",
    equipment: "BARRE", level: "DÉBUTANT", muscle: "biceps", subCode: "CRT",
    primaryMuscle: "Chef court", secondaryMuscles: ["Brachial", "Avant-bras"],
    scheme: "4 × 10", popularity: 93,
    guide: g(
      [["Départ", "Debout, barre en supination largeur d'épaules, coudes collés au buste."],
       ["Montée", "Fléchis les coudes sans avancer les épaules, contracte en haut."]],
      [["Balancer le dos", "Un léger élan est tolérable en fin de série, pas dès la première rep."],
       ["Coudes qui avancent", "Transfère le travail sur le deltoïde antérieur."]],
      [["Descente lente", "3 secondes à l'excentrique double le stimulus."]],
      [["Barre EZ", "Moins de contrainte sur les poignets."]],
    ),
  },
  {
    slug: "curl-incline-halteres", name: "Curl incliné haltères",
    equipment: "HALTÈRES", level: "INTERMÉDIAIRE", muscle: "biceps", subCode: "LON",
    primaryMuscle: "Chef long", secondaryMuscles: ["Brachial"], scheme: "3 × 10-12", popularity: 77,
  },
  {
    slug: "curl-marteau", name: "Curl marteau",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "biceps", subCode: "BRA",
    primaryMuscle: "Brachial", secondaryMuscles: ["Brachio-radial"], scheme: "3 × 12", popularity: 84,
  },
  {
    slug: "curl-pupitre", name: "Curl au pupitre",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "biceps", subCode: "CRT",
    primaryMuscle: "Chef court", secondaryMuscles: [], scheme: "3 × 12", popularity: 65,
  },
  {
    slug: "curl-poulie-basse", name: "Curl à la poulie basse",
    equipment: "POULIE", level: "DÉBUTANT", muscle: "biceps", subCode: "CRT",
    primaryMuscle: "Chef court", secondaryMuscles: ["Avant-bras"], scheme: "3 × 15", popularity: 60,
  },

  // ── Triceps ───────────────────────────────────────────────────────────────
  {
    slug: "barre-au-front", name: "Barre au front",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "triceps", subCode: "LON",
    primaryMuscle: "Chef long", secondaryMuscles: ["Chef latéral"],
    scheme: "4 × 10", popularity: 82,
    guide: g(
      [["Départ", "Allongé, barre EZ bras tendus, coudes pointés vers le plafond."],
       ["Descente", "Fléchis uniquement les coudes, barre vers le front ou légèrement derrière."]],
      [["Coudes qui s'écartent", "Réduit la tension sur le triceps et irrite l'articulation."],
       ["Bras qui bougent", "Les bras restent fixes ; seuls les avant-bras se déplacent."]],
    ),
  },
  {
    slug: "extension-poulie-haute", name: "Extension à la poulie haute",
    equipment: "POULIE", level: "DÉBUTANT", muscle: "triceps", subCode: "LAT",
    primaryMuscle: "Chef latéral", secondaryMuscles: [], scheme: "4 × 12-15", popularity: 90,
  },
  {
    slug: "dips-triceps", name: "Dips buste vertical",
    equipment: "POIDS DU CORPS", level: "INTERMÉDIAIRE", muscle: "triceps", subCode: "MED",
    primaryMuscle: "Chef médial", secondaryMuscles: ["Pectoral inf.", "Deltoïde ant."], scheme: "4 × 8-12", popularity: 80,
  },
  {
    slug: "extension-nuque-haltere", name: "Extension nuque haltère",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "triceps", subCode: "LON",
    primaryMuscle: "Chef long", secondaryMuscles: [], scheme: "3 × 12", popularity: 63,
  },
  {
    slug: "developpe-couche-prise-serree", name: "Développé couché prise serrée",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "triceps", subCode: "MED",
    primaryMuscle: "Chef médial", secondaryMuscles: ["Pectoral médian", "Deltoïde ant."], scheme: "4 × 8", popularity: 73,
  },

  // ── Quadriceps ────────────────────────────────────────────────────────────
  {
    slug: "back-squat", name: "Back squat",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "quadriceps", subCode: "VL",
    primaryMuscle: "Vaste latéral", secondaryMuscles: ["Fessiers", "Lombaires", "Ischios"],
    scheme: "5 × 5", popularity: 99,
    guide: g(
      [["Placement", "Barre sur les trapèzes, pieds largeur d'épaules, pointes légèrement ouvertes."],
       ["Descente", "Casse aux hanches puis aux genoux, dos gainé, genoux dans l'axe des pieds."],
       ["Remontée", "Pousse le sol, hanches et épaules remontent ensemble."]],
      [["Genoux qui rentrent", "Signe de fessiers faibles — travaille l'abduction et allège."],
       ["Talons qui décollent", "Manque de mobilité de cheville : chaussures à talon ou cale."],
       ["Dos qui s'arrondit en bas", "Limite la descente à l'amplitude où le dos reste plat."]],
      [["Respiration", "Grande inspiration en haut, blocage pendant toute la rep, expiration en haut."]],
      [["Front squat", "Barre devant : plus de quadriceps, buste plus vertical."],
       ["Gobelet squat", "Haltère devant la poitrine, idéal pour apprendre le mouvement."]],
    ),
  },
  {
    slug: "presse-a-cuisses", name: "Presse à cuisses",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "quadriceps", subCode: "VL",
    primaryMuscle: "Vaste latéral", secondaryMuscles: ["Fessiers"], scheme: "4 × 12", popularity: 88,
  },
  {
    slug: "leg-extension", name: "Leg extension",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "quadriceps", subCode: "VM",
    primaryMuscle: "Vaste médial", secondaryMuscles: [], scheme: "3 × 15", popularity: 78,
  },
  {
    slug: "fentes-marchees", name: "Fentes marchées",
    equipment: "HALTÈRES", level: "INTERMÉDIAIRE", muscle: "quadriceps", subCode: "RF",
    primaryMuscle: "Droit fémoral", secondaryMuscles: ["Fessiers", "Ischios"], scheme: "3 × 12/jambe", popularity: 75,
  },
  {
    slug: "front-squat", name: "Front squat",
    equipment: "BARRE", level: "AVANCÉ", muscle: "quadriceps", subCode: "RF",
    primaryMuscle: "Droit fémoral", secondaryMuscles: ["Fessiers", "Abdominaux"], scheme: "4 × 6", popularity: 67,
  },

  // ── Ischios / Fessiers ────────────────────────────────────────────────────
  {
    slug: "souleve-de-terre-roumain", name: "Soulevé de terre roumain",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "ischios", subCode: "BIF",
    primaryMuscle: "Biceps fémoral", secondaryMuscles: ["Fessiers", "Lombaires"],
    scheme: "4 × 8-10", popularity: 87,
    guide: g(
      [["Départ", "Debout, barre contre les cuisses, jambes quasi tendues, dos plat."],
       ["Descente", "Recule les hanches en gardant la barre collée aux jambes jusqu'à sentir l'étirement."]],
      [["Plier les genoux", "Le mouvement devient un soulevé de terre classique."],
       ["Descendre trop bas", "Arrête-toi quand le bas du dos commence à s'arrondir."]],
    ),
  },
  {
    slug: "leg-curl-allonge", name: "Leg curl allongé",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "ischios", subCode: "STD",
    primaryMuscle: "Semi-tendineux", secondaryMuscles: ["Mollets"], scheme: "3 × 12-15", popularity: 81,
  },
  {
    slug: "hip-thrust", name: "Hip thrust",
    equipment: "BARRE", level: "INTERMÉDIAIRE", muscle: "fessiers", subCode: "MAX",
    primaryMuscle: "Grand fessier", secondaryMuscles: ["Ischios", "Abdominaux"],
    scheme: "4 × 10-12", popularity: 89,
    guide: g(
      [["Placement", "Haut du dos sur un banc, barre sur le pli de la hanche, pieds à plat."],
       ["Montée", "Pousse les hanches vers le plafond jusqu'à l'alignement genoux-hanches-épaules."]],
      [["Hyperextension lombaire", "Ce sont les fessiers qui montent le bassin, pas le bas du dos."],
       ["Pieds trop loin", "Transfère le travail sur les ischios."]],
    ),
  },
  {
    slug: "abduction-machine", name: "Abduction à la machine",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "fessiers", subCode: "MOY",
    primaryMuscle: "Moyen fessier", secondaryMuscles: [], scheme: "3 × 15-20", popularity: 59,
  },

  // ── Abdominaux / Obliques ─────────────────────────────────────────────────
  {
    slug: "crunch-poulie", name: "Crunch à la poulie",
    equipment: "POULIE", level: "INTERMÉDIAIRE", muscle: "abdominaux", subCode: "HAU",
    primaryMuscle: "Grand droit — haut", secondaryMuscles: ["Obliques"], scheme: "4 × 12-15", popularity: 71,
  },
  {
    slug: "releve-de-jambes-suspendu", name: "Relevé de jambes suspendu",
    equipment: "POIDS DU CORPS", level: "AVANCÉ", muscle: "abdominaux", subCode: "BAS",
    primaryMuscle: "Grand droit — bas", secondaryMuscles: ["Obliques", "Avant-bras"], scheme: "4 × 10-15", popularity: 74,
  },
  {
    slug: "gainage-planche", name: "Gainage planche",
    equipment: "POIDS DU CORPS", level: "DÉBUTANT", muscle: "abdominaux", subCode: "TRA",
    primaryMuscle: "Transverse", secondaryMuscles: ["Lombaires", "Fessiers"],
    scheme: "4 × 45 s", popularity: 86,
    guide: g(
      [["Placement", "Coudes sous les épaules, corps aligné, bassin en rétroversion légère."],
       ["Tenue", "Serre fessiers et abdos comme si tu recevais un coup au ventre."]],
      [["Fesses hautes", "Le gainage se relâche — la position devient du repos."],
       ["Bassin qui tombe", "Contrainte lombaire directe. Arrête la série."]],
    ),
  },
  {
    slug: "aspirateur-abdominal", name: "Aspirateur abdominal",
    equipment: "POIDS DU CORPS", level: "DÉBUTANT", muscle: "abdominaux", subCode: "TRA",
    primaryMuscle: "Transverse", secondaryMuscles: [], scheme: "3 × 20 s", popularity: 42,
  },
  {
    slug: "russian-twist", name: "Russian twist",
    equipment: "KETTLEBELL", level: "INTERMÉDIAIRE", muscle: "obliques", subCode: "EXT",
    primaryMuscle: "Oblique externe", secondaryMuscles: ["Abdominaux"], scheme: "3 × 20", popularity: 69,
  },
  {
    slug: "side-plank", name: "Gainage latéral",
    equipment: "POIDS DU CORPS", level: "DÉBUTANT", muscle: "obliques", subCode: "INT",
    primaryMuscle: "Oblique interne", secondaryMuscles: ["Moyen fessier"], scheme: "3 × 30 s/côté", popularity: 57,
  },

  // ── Mollets / Avant-bras / Trapèzes ───────────────────────────────────────
  {
    slug: "mollets-debout", name: "Extensions mollets debout",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "mollets", subCode: "GAS",
    primaryMuscle: "Gastrocnémien", secondaryMuscles: [], scheme: "4 × 15-20", popularity: 72,
  },
  {
    slug: "mollets-assis", name: "Extensions mollets assis",
    equipment: "MACHINE", level: "DÉBUTANT", muscle: "mollets", subCode: "SOL",
    primaryMuscle: "Soléaire", secondaryMuscles: [], scheme: "4 × 15-20", popularity: 64,
  },
  {
    slug: "curl-poignets", name: "Curl de poignets",
    equipment: "BARRE", level: "DÉBUTANT", muscle: "avantbras", subCode: "FLE",
    primaryMuscle: "Fléchisseurs", secondaryMuscles: [], scheme: "3 × 15-20", popularity: 45,
  },
  {
    slug: "farmer-walk", name: "Farmer walk",
    equipment: "KETTLEBELL", level: "INTERMÉDIAIRE", muscle: "avantbras", subCode: "BRR",
    primaryMuscle: "Brachio-radial", secondaryMuscles: ["Trapèzes", "Abdominaux"], scheme: "4 × 40 m", popularity: 66,
  },
  {
    slug: "shrugs-halteres", name: "Shrugs haltères",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "trapezes", subCode: "SUP",
    primaryMuscle: "Trapèze supérieur", secondaryMuscles: ["Avant-bras"], scheme: "4 × 15", popularity: 70,
  },
  {
    slug: "y-raise", name: "Y-raise au banc incliné",
    equipment: "HALTÈRES", level: "DÉBUTANT", muscle: "trapezes", subCode: "INF",
    primaryMuscle: "Trapèze inférieur", secondaryMuscles: ["Deltoïde post."], scheme: "3 × 15", popularity: 44,
  },
  {
    slug: "kettlebell-swing", name: "Kettlebell swing",
    equipment: "KETTLEBELL", level: "INTERMÉDIAIRE", muscle: "fessiers", subCode: "MAX",
    primaryMuscle: "Grand fessier", secondaryMuscles: ["Ischios", "Lombaires"], scheme: "5 × 20", popularity: 76,
  },
  {
    slug: "good-morning", name: "Good morning",
    equipment: "BARRE", level: "AVANCÉ", muscle: "lombaires", subCode: "ERE",
    primaryMuscle: "Érecteurs du rachis", secondaryMuscles: ["Ischios", "Fessiers"], scheme: "3 × 10", popularity: 48,
  },
  {
    slug: "bird-dog", name: "Bird dog",
    equipment: "POIDS DU CORPS", level: "DÉBUTANT", muscle: "lombaires", subCode: "MUL",
    primaryMuscle: "Multifides", secondaryMuscles: ["Fessiers", "Abdominaux"], scheme: "3 × 10/côté", popularity: 40,
  },
];
