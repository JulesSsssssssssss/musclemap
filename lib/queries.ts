import "server-only";
import { prisma } from "./prisma";
import { e1rm } from "./format";
import { weeklyGoal } from "./goal";
import type { MuscleKey } from "./body";
import type { Guide } from "./catalog";

const workoutInclude = {
  entries: {
    orderBy: { position: "asc" as const },
    include: {
      exercise: true,
      sets: { orderBy: { position: "asc" as const } },
    },
  },
};

/** Toutes les séances de l'utilisateur (hors routines), avec le nombre d'exercices. */
export function listWorkouts(userId: string) {
  return prisma.workout.findMany({
    where: { userId, status: { not: "template" } },
    orderBy: { startedAt: "desc" },
    include: { _count: { select: { entries: true } } },
  });
}

/** Séances à venir ou en cours. */
export function countOpenWorkouts(userId: string) {
  return prisma.workout.count({ where: { userId, status: { in: ["planned", "active"] } } });
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
  search?: string;
  take?: number;
}) {
  const where: Record<string, unknown> = {};
  if (opts.muscle) where.muscle = opts.muscle;
  if (opts.subCode) where.subCode = opts.subCode;
  if (opts.equipment) where.equipment = opts.equipment.toUpperCase();
  if (opts.search) where.name = { contains: opts.search, mode: "insensitive" };
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
    const g = JSON.parse(raw) as Guide;
    return { steps: Array.isArray(g.steps) ? g.steps : [], tips: Array.isArray(g.tips) ? g.tips : [] };
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
      e1rm: e.sets.reduce((a, s) => Math.max(a, e1rm(s.weight, s.reps)), 0),
      volume: e.sets.reduce((a, s) => a + s.weight * s.reps, 0),
    }))
    .filter((p) => p.max > 0);
}

/** Objectif hebdomadaire et série de semaines réussies. */
export async function weeklyGoalFor(userId: string, target: number) {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 2);
  const rows = await prisma.workout.findMany({
    where: { userId, status: "done", startedAt: { gte: since } },
    select: { startedAt: true },
  });
  return weeklyGoal(rows.map((r) => r.startedAt), target);
}

/** Séances terminées d'un mois (avec une marge d'un jour pour le fuseau horaire). */
export function workoutsBetween(userId: string, from: Date, to: Date) {
  return prisma.workout.findMany({
    where: { userId, status: "done", startedAt: { gte: from, lt: to } },
    orderBy: { startedAt: "asc" },
    select: { id: true, name: true, startedAt: true, durationSec: true, volumeKg: true, _count: { select: { entries: true } } },
  });
}

/** Relevés corporels, du plus récent au plus ancien — sans les photos (servies à part). */
export function listBodyEntries(userId: string) {
  return prisma.bodyEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: { id: true, date: true, weight: true, chest: true, waist: true, hips: true, arm: true, thigh: true, photoType: true },
  });
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

/**
 * Routines : des séances au statut « template », réutilisables en un tap.
 * Elles n'apparaissent ni dans la liste des séances ni dans les statistiques.
 */
export function listRoutines(userId: string) {
  return prisma.workout.findMany({
    where: { userId, status: "template" },
    orderBy: { startedAt: "desc" },
    include: {
      entries: {
        orderBy: { position: "asc" },
        include: { exercise: { select: { name: true, primaryMuscle: true } }, _count: { select: { sets: true } } },
      },
    },
  });
}

/** Séries validées par groupe musculaire sur les 7 et 30 derniers jours. */
export async function muscleVolume(userId: string) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const entries = await prisma.workoutExercise.findMany({
    where: { workout: { userId, status: "done", startedAt: { gte: new Date(now - 30 * day) } } },
    select: {
      exercise: { select: { muscle: true } },
      workout: { select: { startedAt: true } },
      sets: { where: { done: true }, select: { id: true } },
    },
  });

  const out: Record<7 | 30, Partial<Record<MuscleKey, number>>> = { 7: {}, 30: {} };
  for (const e of entries) {
    const key = e.exercise.muscle as MuscleKey;
    const age = now - e.workout.startedAt.getTime();
    for (const days of [7, 30] as const) {
      if (age <= days * day) out[days][key] = (out[days][key] ?? 0) + e.sets.length;
    }
  }
  return out;
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
