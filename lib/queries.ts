import "server-only";
import { prisma } from "./prisma";
import { e1rm } from "./format";
import type { MuscleKey } from "./body";
import type { Guide } from "./catalog";

export type ActiveWorkout = NonNullable<Awaited<ReturnType<typeof getActiveWorkout>>>;

const workoutInclude = {
  entries: {
    orderBy: { position: "asc" as const },
    include: {
      exercise: true,
      sets: { orderBy: { position: "asc" as const } },
    },
  },
};

export function getActiveWorkout(userId: string) {
  return prisma.workout.findFirst({
    where: { userId, status: "active" },
    orderBy: { startedAt: "desc" },
    include: workoutInclude,
  });
}

export function getWorkout(userId: string, id: string) {
  return prisma.workout.findFirst({ where: { id, userId }, include: workoutInclude });
}

/** Nombre d'exercices par groupe musculaire et par faisceau. */
export async function exerciseCounts() {
  const rows = await prisma.exercise.groupBy({
    by: ["muscle", "subCode"],
    _count: { _all: true },
  });
  const byMuscle: Record<string, number> = {};
  const bySub: Record<string, number> = {};
  for (const r of rows) {
    byMuscle[r.muscle] = (byMuscle[r.muscle] ?? 0) + r._count._all;
    bySub[`${r.muscle}:${r.subCode}`] = r._count._all;
  }
  return { byMuscle, bySub };
}

export function listExercises(opts: {
  muscle?: string;
  subCode?: string;
  equipment?: string;
  level?: string;
  search?: string;
  take?: number;
}) {
  const where: Record<string, unknown> = {};
  if (opts.muscle) where.muscle = opts.muscle;
  if (opts.subCode) where.subCode = opts.subCode;
  if (opts.equipment) where.equipment = opts.equipment.toUpperCase();
  if (opts.level) where.level = opts.level.toUpperCase();
  if (opts.search) where.name = { contains: opts.search };
  return prisma.exercise.findMany({
    where,
    orderBy: [{ popularity: "desc" }, { name: "asc" }],
    take: opts.take,
  });
}

export function getExercise(slug: string) {
  return prisma.exercise.findUnique({ where: { slug } });
}

export function parseGuide(raw: string): Guide {
  try {
    return JSON.parse(raw) as Guide;
  } catch {
    return {};
  }
}

export function parseSecondary(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Dernière performance enregistrée sur un exercice. */
export async function lastPerformance(userId: string, exerciseId: string) {
  const entry = await prisma.workoutExercise.findFirst({
    where: { exerciseId, workout: { userId, status: "done" } },
    orderBy: { workout: { startedAt: "desc" } },
    include: { workout: true, sets: { where: { done: true }, orderBy: { position: "asc" } } },
  });
  if (!entry || entry.sets.length === 0) return null;
  const top = entry.sets.reduce((a, b) => (b.weight > a.weight ? b : a));
  return {
    date: entry.workout.startedAt,
    sets: entry.sets.length,
    reps: top.reps,
    weight: top.weight,
  };
}

export function listHistory(userId: string, take = 20) {
  return prisma.workout.findMany({
    where: { userId, status: "done" },
    orderBy: { startedAt: "desc" },
    take,
    include: { entries: { include: { sets: true } } },
  });
}

/** Série « charge max par séance » pour le graphe de progression. */
export async function progressionSeries(userId: string, exerciseId: string, months: number) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const entries = await prisma.workoutExercise.findMany({
    where: { exerciseId, workout: { userId, status: "done", startedAt: { gte: since } } },
    orderBy: { workout: { startedAt: "asc" } },
    include: { workout: { select: { startedAt: true } }, sets: { where: { done: true } } },
  });

  return entries
    .map((e) => ({
      date: e.workout.startedAt,
      max: e.sets.reduce((a, s) => Math.max(a, s.weight), 0),
      volume: e.sets.reduce((a, s) => a + s.weight * s.reps, 0),
    }))
    .filter((p) => p.max > 0);
}

/** Volume soulevé par groupe musculaire sur une période. */
export async function muscleDistribution(userId: string, months: number) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const entries = await prisma.workoutExercise.findMany({
    where: { workout: { userId, status: "done", startedAt: { gte: since } } },
    include: { exercise: { select: { muscle: true } }, sets: { where: { done: true } } },
  });

  const volume: Partial<Record<MuscleKey, number>> = {};
  for (const e of entries) {
    const key = e.exercise.muscle as MuscleKey;
    volume[key] = (volume[key] ?? 0) + e.sets.reduce((a, s) => a + s.weight * s.reps, 0);
  }
  const max = Math.max(1, ...Object.values(volume));
  return { volume, max };
}

export async function listRecords(userId: string, exerciseId: string) {
  const rows = await prisma.personalRecord.findMany({ where: { userId, exerciseId } });
  return Object.fromEntries(rows.map((r) => [r.kind, r.value])) as Partial<Record<"weight" | "reps" | "volume" | "e1rm", number>>;
}

/** Exercices déjà travaillés, pour le sélecteur de l'écran progression. */
export async function trainedExercises(userId: string) {
  const rows = await prisma.workoutExercise.findMany({
    where: { workout: { userId, status: "done" } },
    distinct: ["exerciseId"],
    include: { exercise: true },
    orderBy: { workout: { startedAt: "desc" } },
  });
  return rows.map((r) => r.exercise);
}

export async function profileStats(userId: string) {
  const [workouts, records, agg] = await Promise.all([
    prisma.workout.count({ where: { userId, status: "done" } }),
    prisma.personalRecord.count({ where: { userId, kind: "weight" } }),
    prisma.workout.aggregate({ where: { userId, status: "done" }, _sum: { volumeKg: true } }),
  ]);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
  const months = user ? Math.max(1, Math.round((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30))) : 1;
  return { workouts, records, totalKg: agg._sum.volumeKg ?? 0, months };
}

/** Records battus pendant une séance, calculés à la clôture. */
export function computeWorkoutBests(
  entries: { exerciseId: string; sets: { weight: number; reps: number; done: boolean }[] }[],
) {
  return entries
    .map((e) => {
      const done = e.sets.filter((s) => s.done);
      if (!done.length) return null;
      const top = done.reduce((a, b) => (b.weight > a.weight ? b : a));
      return {
        exerciseId: e.exerciseId,
        weight: top.weight,
        reps: Math.max(...done.map((s) => s.reps)),
        volume: done.reduce((a, s) => a + s.weight * s.reps, 0),
        e1rm: e1rm(top.weight, top.reps),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/**
 * Séries de la dernière séance terminée, par exercice — sert de colonne
 * « précédent » dans l'écran séance.
 */
export async function previousSets(userId: string, exerciseIds: string[]) {
  if (exerciseIds.length === 0) return {} as Record<string, { weight: number; reps: number }[]>;

  const entries = await prisma.workoutExercise.findMany({
    where: { exerciseId: { in: exerciseIds }, workout: { userId, status: "done" } },
    orderBy: { workout: { startedAt: "desc" } },
    include: { sets: { where: { done: true }, orderBy: { position: "asc" } } },
  });

  const out: Record<string, { weight: number; reps: number }[]> = {};
  for (const e of entries) {
    if (out[e.exerciseId]) continue; // la plus récente gagne
    out[e.exerciseId] = e.sets.map((s) => ({ weight: s.weight, reps: s.reps }));
  }
  return out;
}
