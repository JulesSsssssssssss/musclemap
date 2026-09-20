import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EXERCISES } from "./exercises";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@musclemap.app";
const DEMO_PASSWORD = "demo1234";

/** Modèles de séance utilisés pour fabriquer l'historique de démonstration. */
const TEMPLATES: { name: string; slugs: string[] }[] = [
  { name: "Push Day", slugs: ["developpe-militaire-barre", "developpe-incline-halteres", "elevations-laterales-halteres", "extension-poulie-haute", "dips-triceps"] },
  { name: "Pull Day", slugs: ["tractions-pronation", "rowing-barre", "tirage-horizontal-poulie", "face-pull", "curl-barre", "curl-marteau"] },
  { name: "Jambes", slugs: ["back-squat", "souleve-de-terre-roumain", "presse-a-cuisses", "leg-curl-allonge", "mollets-debout"] },
];

/** Charge de départ par exercice, en kg (0 = poids du corps). */
const BASE_LOAD: Record<string, number> = {
  "developpe-militaire-barre": 32.5, "developpe-incline-halteres": 20, "elevations-laterales-halteres": 9,
  "extension-poulie-haute": 25, "dips-triceps": 0, "tractions-pronation": 0, "rowing-barre": 50,
  "tirage-horizontal-poulie": 45, "face-pull": 20, "curl-barre": 25, "curl-marteau": 12,
  "back-squat": 70, "souleve-de-terre-roumain": 60, "presse-a-cuisses": 120, "leg-curl-allonge": 35,
  "mollets-debout": 60,
};

async function seedExercises() {
  for (const e of EXERCISES) {
    const data = {
      name: e.name,
      equipment: e.equipment,
      level: e.level,
      muscle: e.muscle,
      subCode: e.subCode,
      primaryMuscle: e.primaryMuscle,
      secondaryMuscles: JSON.stringify(e.secondaryMuscles),
      scheme: e.scheme ?? "4 × 8-10",
      guide: JSON.stringify(e.guide ?? {}),
      popularity: e.popularity ?? 50,
    };
    await prisma.exercise.upsert({ where: { slug: e.slug }, create: { slug: e.slug, ...data }, update: data });
  }
  console.log(`✓ ${EXERCISES.length} exercices`);
}

async function seedDemoUser() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log("✓ utilisateur de démo déjà présent");
    return existing;
  }
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Camille R.",
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 11),
    },
  });
  console.log(`✓ utilisateur de démo ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return user;
}

async function seedHistory(userId: string) {
  if (await prisma.workout.count({ where: { userId } })) {
    console.log("✓ historique déjà présent");
    return;
  }

  const bySlug = new Map((await prisma.exercise.findMany()).map((e) => [e.slug, e]));
  const best: Record<string, { weight: number; reps: number; volume: number }> = {};

  // 36 séances sur ~3 mois, 3 par semaine, charges progressives.
  const total = 36;
  for (let i = total - 1; i >= 0; i--) {
    const template = TEMPLATES[i % TEMPLATES.length];
    const daysAgo = i * 2 + Math.floor(i / 3);
    const startedAt = new Date();
    startedAt.setDate(startedAt.getDate() - daysAgo);
    startedAt.setHours(18, 30, 0, 0);

    const progress = (total - 1 - i) / (total - 1); // 0 → 1
    let volume = 0;
    const entries: { exerciseId: string; position: number; note: string | null; sets: { position: number; weight: number; reps: number; done: boolean }[] }[] = [];

    template.slugs.forEach((slug, position) => {
      const exercise = bySlug.get(slug);
      if (!exercise) return;
      const base = BASE_LOAD[slug] ?? 20;
      const step = base >= 60 ? 5 : base >= 25 ? 2.5 : base > 0 ? 1 : 0;
      const weight = base + Math.round((base * 0.28 * progress) / (step || 1)) * step;
      const setCount = position < 2 ? 4 : 3;
      const sets = Array.from({ length: setCount }, (_, s) => {
        const reps = 12 - Math.min(4, s) - (base >= 60 ? 2 : 0);
        return { position: s, weight, reps, done: true };
      });
      volume += sets.reduce((a, s) => a + (s.weight || 70) * s.reps, 0);

      const b = best[exercise.id];
      const setVolume = sets.reduce((a, s) => a + s.weight * s.reps, 0);
      const topReps = Math.max(...sets.map((s) => s.reps));
      if (!b || weight > b.weight) best[exercise.id] = { weight, reps: topReps, volume: Math.max(setVolume, b?.volume ?? 0) };
      else best[exercise.id] = { ...b, reps: Math.max(b.reps, topReps), volume: Math.max(b.volume, setVolume) };

      entries.push({ exerciseId: exercise.id, position, note: null, sets });
    });

    const endedAt = new Date(startedAt);
    const durationSec = 2700 + ((i * 137) % 900);
    endedAt.setSeconds(endedAt.getSeconds() + durationSec);

    await prisma.workout.create({
      data: {
        userId, name: template.name, status: "done",
        startedAt, endedAt, durationSec, volumeKg: Math.round(volume),
        entries: { create: entries.map((e) => ({ ...e, sets: { create: e.sets } })) },
      },
    });
  }

  for (const [exerciseId, b] of Object.entries(best)) {
    for (const [kind, value] of [["weight", b.weight], ["reps", b.reps], ["volume", b.volume], ["e1rm", b.weight * (1 + b.reps / 30)]] as const) {
      if (!value) continue;
      await prisma.personalRecord.upsert({
        where: { userId_exerciseId_kind: { userId, exerciseId, kind } },
        create: { userId, exerciseId, kind, value },
        update: { value },
      });
    }
  }
  console.log(`✓ ${total} séances d'historique + records`);
}

async function main() {
  await seedExercises();
  const user = await seedDemoUser();
  await seedHistory(user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
