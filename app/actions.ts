"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { computeWorkoutBests } from "@/lib/queries";

export type FormState = { error?: string } | undefined;

/* ── Authentification ─────────────────────────────────────────────────────── */

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Indique ton prénom." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Adresse e-mail invalide." };
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Un compte existe déjà avec cette adresse." };
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  redirect("/");
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "E-mail ou mot de passe incorrect." };
  }
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/connexion");
}

/* ── Séances ──────────────────────────────────────────────────────────────── */

/** Séance de l'utilisateur, si elle existe. */
async function ownWorkout(userId: string, id: string) {
  return prisma.workout.findFirst({ where: { id, userId } });
}

const DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const defaultName = () => `Séance ${DAYS[new Date().getDay()]}`;

/** Crée une séance à venir (status « planned »), sans la démarrer. */
export async function createWorkout(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60) || defaultName();
  const workout = await prisma.workout.create({ data: { userId: user.id, name, status: "planned" } });
  revalidatePath("/seance");
  redirect(`/seance/${workout.id}`);
}

/** Démarre une séance planifiée : le chrono part de maintenant. */
export async function startWorkout(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("workoutId") ?? "");
  const workout = await ownWorkout(user.id, id);
  if (!workout) redirect("/seance");
  if (workout.status === "planned") {
    await prisma.workout.update({ where: { id }, data: { status: "active", startedAt: new Date() } });
  }
  revalidatePath("/seance");
  redirect(`/seance/${id}`);
}

export async function deleteWorkout(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("workoutId") ?? "");
  const workout = await ownWorkout(user.id, id);
  if (workout) await prisma.workout.delete({ where: { id } });
  revalidatePath("/seance");
  redirect("/seance");
}

export type EditableWorkout = { id: string; name: string; status: string; exercises: number };

/** Séances auxquelles on peut encore ajouter des exercices (à venir + en cours). */
export async function listEditableWorkouts(): Promise<EditableWorkout[]> {
  const user = await requireUser();
  const rows = await prisma.workout.findMany({
    where: { userId: user.id, status: { in: ["planned", "active"] } },
    orderBy: [{ status: "asc" }, { startedAt: "desc" }],
    include: { _count: { select: { entries: true } } },
  });
  return rows.map((w) => ({ id: w.id, name: w.name, status: w.status, exercises: w._count.entries }));
}

export type AddResult = { workoutId: string; workoutName: string; exercises: number; sets: number };

/** Ajoute un exercice à une séance existante, ou à une nouvelle séance si `newName` est fourni. */
export async function addExerciseToWorkout(
  slug: string,
  target: { workoutId: string } | { newName: string },
): Promise<AddResult | null> {
  const user = await requireUser();
  const exercise = await prisma.exercise.findUnique({ where: { slug } });
  if (!exercise) return null;

  const workout =
    "workoutId" in target
      ? await ownWorkout(user.id, target.workoutId)
      : await prisma.workout.create({
          data: { userId: user.id, name: target.newName.trim().slice(0, 60) || defaultName(), status: "planned" },
        });
  if (!workout || workout.status === "done") return null;

  const count = await prisma.workoutExercise.count({ where: { workoutId: workout.id } });

  // Pré-remplit avec la dernière performance connue sur cet exercice.
  const previous = await prisma.workoutExercise.findFirst({
    where: { exerciseId: exercise.id, workout: { userId: user.id, status: "done" } },
    orderBy: { workout: { startedAt: "desc" } },
    include: { sets: { orderBy: { position: "asc" } } },
  });
  const template = previous?.sets.length
    ? previous.sets.map((s) => ({ weight: s.weight, reps: s.reps }))
    : [
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
        { weight: 0, reps: 10 },
      ];

  await prisma.workoutExercise.create({
    data: {
      workoutId: workout.id,
      exerciseId: exercise.id,
      position: count,
      sets: { create: template.map((s, i) => ({ position: i, weight: s.weight, reps: s.reps, done: false })) },
    },
  });

  const totals = await prisma.workoutExercise.findMany({
    where: { workoutId: workout.id },
    include: { _count: { select: { sets: true } } },
  });

  revalidatePath("/seance");
  revalidatePath("/");
  return {
    workoutId: workout.id,
    workoutName: workout.name,
    exercises: totals.length,
    sets: totals.reduce((a, t) => a + t._count.sets, 0),
  };
}

export async function removeEntry(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  const entry = await prisma.workoutExercise.findFirst({ where: { id: entryId, workout: { userId: user.id } } });
  if (!entry) return;
  await prisma.workoutExercise.delete({ where: { id: entryId } });
  revalidatePath("/seance");
}

/** Enregistre le nouvel ordre des exercices d'une séance. */
export async function reorderEntries(workoutId: string, orderedIds: string[]) {
  const user = await requireUser();
  const entries = await prisma.workoutExercise.findMany({
    where: { workoutId, workout: { userId: user.id } },
    select: { id: true },
  });
  const known = new Set(entries.map((e) => e.id));
  if (orderedIds.length !== known.size || !orderedIds.every((id) => known.has(id))) return;
  await prisma.$transaction(
    orderedIds.map((id, position) => prisma.workoutExercise.update({ where: { id }, data: { position } })),
  );
  revalidatePath("/seance");
}

export async function addSet(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  const entry = await prisma.workoutExercise.findFirst({
    where: { id: entryId, workout: { userId: user.id } },
    include: { sets: { orderBy: { position: "asc" } } },
  });
  if (!entry) return;
  const last = entry.sets.at(-1);
  await prisma.workoutSet.create({
    data: { entryId, position: entry.sets.length, weight: last?.weight ?? 0, reps: last?.reps ?? 10 },
  });
  revalidatePath("/seance");
}

export async function removeSet(formData: FormData) {
  const user = await requireUser();
  const setId = String(formData.get("setId") ?? "");
  const set = await prisma.workoutSet.findFirst({ where: { id: setId, entry: { workout: { userId: user.id } } } });
  if (!set) return;
  await prisma.workoutSet.delete({ where: { id: setId } });
  revalidatePath("/seance");
}

/** Met à jour poids / reps / validation d'une série. */
export async function updateSet(input: { setId: string; weight?: number; reps?: number; done?: boolean }) {
  const user = await requireUser();
  const set = await prisma.workoutSet.findFirst({
    where: { id: input.setId, entry: { workout: { userId: user.id } } },
  });
  if (!set) return { ok: false as const };

  const updated = await prisma.workoutSet.update({
    where: { id: input.setId },
    data: {
      weight: input.weight ?? undefined,
      reps: input.reps ?? undefined,
      done: input.done ?? undefined,
    },
  });
  revalidatePath("/seance");
  return { ok: true as const, done: updated.done };
}

export async function renameWorkout(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const workout = await ownWorkout(user.id, String(formData.get("workoutId") ?? ""));
  if (!workout || !name) return;
  await prisma.workout.update({ where: { id: workout.id }, data: { name } });
  revalidatePath("/seance");
}

export async function setEntryNote(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const entry = await prisma.workoutExercise.findFirst({ where: { id: entryId, workout: { userId: user.id } } });
  if (!entry) return;
  await prisma.workoutExercise.update({ where: { id: entryId }, data: { note: note || null } });
  revalidatePath("/seance");
}

/** Clôture la séance : volume, durée, records. */
export async function finishWorkout(formData: FormData) {
  const user = await requireUser();
  const elapsed = Number(formData.get("elapsed") ?? 0);
  const workout = await prisma.workout.findFirst({
    where: { id: String(formData.get("workoutId") ?? ""), userId: user.id, status: "active" },
    include: { entries: { include: { sets: true } } },
  });
  if (!workout) redirect("/seance");

  const doneSets = workout.entries.flatMap((e) => e.sets.filter((s) => s.done));
  const volume = doneSets.reduce((a, s) => a + s.weight * s.reps, 0);
  const durationSec = Math.max(0, Math.round(elapsed)) || Math.round((Date.now() - workout.startedAt.getTime()) / 1000);

  // Supprime les exercices entièrement non réalisés.
  const empty = workout.entries.filter((e) => e.sets.every((s) => !s.done)).map((e) => e.id);
  if (empty.length) await prisma.workoutExercise.deleteMany({ where: { id: { in: empty } } });

  await prisma.workout.update({
    where: { id: workout.id },
    data: { status: "done", endedAt: new Date(), durationSec, volumeKg: volume },
  });

  // Mise à jour des records personnels.
  for (const best of computeWorkoutBests(workout.entries)) {
    for (const kind of ["weight", "reps", "volume", "e1rm"] as const) {
      const value = best[kind];
      if (!value) continue;
      const current = await prisma.personalRecord.findUnique({
        where: { userId_exerciseId_kind: { userId: user.id, exerciseId: best.exerciseId, kind } },
      });
      if (!current || value > current.value) {
        await prisma.personalRecord.upsert({
          where: { userId_exerciseId_kind: { userId: user.id, exerciseId: best.exerciseId, kind } },
          create: { userId: user.id, exerciseId: best.exerciseId, kind, value },
          update: { value, achievedAt: new Date() },
        });
      }
    }
  }

  revalidatePath("/seance");
  revalidatePath("/progression");
  redirect(`/seance/${workout.id}/resume`);
}

/* ── Réglages ─────────────────────────────────────────────────────────────── */

export async function updateSettings(formData: FormData) {
  const user = await requireUser();
  const unit = String(formData.get("unit") ?? user.unit);
  const restSeconds = Number(formData.get("restSeconds") ?? user.restSeconds);
  const theme = String(formData.get("theme") ?? user.theme);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      unit: unit === "lb" ? "lb" : "kg",
      restSeconds: Number.isFinite(restSeconds) ? Math.min(600, Math.max(15, restSeconds)) : user.restSeconds,
      theme: theme === "light" ? "light" : "dark",
    },
  });
  revalidatePath("/profil");
}
