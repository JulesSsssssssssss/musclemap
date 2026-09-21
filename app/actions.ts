"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { computeWorkoutBests, previousSets, visibleTo } from "@/lib/queries";
import { nextWarmup, scaleWarmups, suggestSets } from "@/lib/progression";
import { fromUnit } from "@/lib/format";
import { proposeWorkout } from "@/lib/generator";
import { MUSCLES, type MuscleKey } from "@/lib/body";
import { EQUIPMENTS, subsFor } from "@/lib/catalog";

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

/** Séance de l'utilisateur (hors routines), si elle existe. */
async function ownWorkout(userId: string, id: string) {
  return prisma.workout.findFirst({ where: { id, userId, status: { not: "template" } } });
}

type SetSeed = { weight: number; reps: number; kind?: string };

/** Lignes de séries à créer : positions consécutives, séries non validées. */
const setRows = (sets: SetSeed[]) =>
  sets.map((s, i) => ({ position: i, weight: s.weight, reps: s.reps, kind: s.kind ?? "work", done: false }));

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

/* ── Routines ─────────────────────────────────────────────────────────────── */

/** Enregistre une séance (à venir, en cours ou terminée) comme routine réutilisable. */
export async function saveAsRoutine(formData: FormData) {
  const user = await requireUser();
  const source = await prisma.workout.findFirst({
    where: { id: String(formData.get("workoutId") ?? ""), userId: user.id, status: { not: "template" } },
    include: { entries: { orderBy: { position: "asc" }, include: { sets: { orderBy: { position: "asc" } } } } },
  });
  if (!source) redirect("/seance");

  const entries = source.entries
    .map((e) => {
      const done = e.sets.filter((s) => s.done);
      return { exerciseId: e.exerciseId, superset: e.superset, sets: done.length ? done : e.sets };
    })
    .filter((e) => e.sets.length > 0);
  if (entries.length === 0) redirect(`/seance/${source.id}`);

  await prisma.workout.create({
    data: {
      userId: user.id,
      name: source.name,
      status: "template",
      entries: {
        create: entries.map((e, position) => ({
          exerciseId: e.exerciseId,
          position,
          superset: position > 0 && e.superset,
          sets: { create: setRows(e.sets) },
        })),
      },
    },
  });
  revalidatePath("/seance");
  redirect("/seance");
}

/** Lance une routine : crée une séance à venir, pré-remplie d'après la dernière performance. */
export async function startFromRoutine(formData: FormData) {
  const user = await requireUser();
  const routine = await prisma.workout.findFirst({
    where: { id: String(formData.get("routineId") ?? ""), userId: user.id, status: "template" },
    include: {
      entries: { orderBy: { position: "asc" }, include: { exercise: true, sets: { orderBy: { position: "asc" } } } },
    },
  });
  if (!routine) redirect("/seance");

  const previous = await previousSets(user.id, routine.entries.map((e) => e.exerciseId));

  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      name: routine.name,
      status: "planned",
      entries: {
        create: routine.entries.map((e, position) => {
          const warmups = e.sets.filter((s) => s.kind === "warmup");
          const work = e.sets.filter((s) => s.kind !== "warmup");
          const last = previous[e.exerciseId];

          // Séries de travail d'après la dernière performance ; échauffements recalés dessus.
          const nextWork = last?.length
            ? suggestSets(last, e.exercise.scheme, work.length || undefined).sets
            : work.map((s) => ({ weight: s.weight, reps: s.reps }));
          const nextWarm = scaleWarmups(warmups, work[0]?.weight ?? 0, nextWork[0]?.weight ?? 0);

          return {
            exerciseId: e.exerciseId,
            position,
            note: e.note,
            superset: e.superset,
            sets: {
              create: setRows([
                ...nextWarm.map((s) => ({ ...s, kind: "warmup" })),
                ...nextWork.map((s) => ({ ...s, kind: "work" })),
              ]),
            },
          };
        }),
      },
    },
  });
  revalidatePath("/seance");
  redirect(`/seance/${workout.id}`);
}

export async function deleteRoutine(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("routineId") ?? "");
  await prisma.workout.deleteMany({ where: { id, userId: user.id, status: "template" } });
  revalidatePath("/seance");
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
  const exercise = await prisma.exercise.findFirst({ where: { slug, ...visibleTo(user.id) } });
  if (!exercise) return null;

  const workout =
    "workoutId" in target
      ? await ownWorkout(user.id, target.workoutId)
      : await prisma.workout.create({
          data: { userId: user.id, name: target.newName.trim().slice(0, 60) || defaultName(), status: "planned" },
        });
  if (!workout || workout.status === "done") return null;

  const count = await prisma.workoutExercise.count({ where: { workoutId: workout.id } });

  // Pré-remplit avec la dernière performance, en proposant une surcharge si elle est méritée.
  const previous = await previousSets(user.id, [exercise.id]);
  const template = suggestSets(previous[exercise.id] ?? [], exercise.scheme).sets;

  await prisma.workoutExercise.create({
    data: {
      workoutId: workout.id,
      exerciseId: exercise.id,
      position: count,
      sets: { create: setRows(template) },
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

export async function addSet(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  const entry = await prisma.workoutExercise.findFirst({
    where: { id: entryId, workout: { userId: user.id } },
    include: { sets: { orderBy: { position: "asc" } } },
  });
  if (!entry) return;
  const last = entry.sets.filter((s) => s.kind === "work").at(-1);
  await prisma.workoutSet.create({
    data: { entryId, position: entry.sets.length, weight: last?.weight ?? 0, reps: last?.reps ?? 10 },
  });
  revalidatePath("/seance");
}

/** Insère une série d'échauffement avant les séries de travail (50 %, puis 70 %, puis 85 %). */
export async function addWarmup(formData: FormData) {
  const user = await requireUser();
  const entryId = String(formData.get("entryId") ?? "");
  const entry = await prisma.workoutExercise.findFirst({
    where: { id: entryId, workout: { userId: user.id } },
    include: { sets: { orderBy: { position: "asc" } } },
  });
  if (!entry) return;

  const warmups = entry.sets.filter((s) => s.kind === "warmup").length;
  const top = entry.sets.find((s) => s.kind === "work")?.weight ?? 0;
  const next = nextWarmup(warmups, top);

  await prisma.$transaction([
    prisma.workoutSet.updateMany({ where: { entryId, position: { gte: warmups } }, data: { position: { increment: 1 } } }),
    prisma.workoutSet.create({ data: { entryId, position: warmups, weight: next.weight, reps: next.reps, kind: "warmup" } }),
  ]);
  revalidatePath("/seance");
}

/** Enchaîne (ou détache) un exercice avec le précédent : superset. */
export async function toggleSuperset(formData: FormData) {
  const user = await requireUser();
  const entry = await prisma.workoutExercise.findFirst({
    where: { id: String(formData.get("entryId") ?? ""), workout: { userId: user.id } },
  });
  if (!entry || entry.position === 0) return;
  await prisma.workoutExercise.update({ where: { id: entry.id }, data: { superset: !entry.superset } });
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

/** Met à jour poids / reps / validation, et type / RPE / note d'une série. */
export async function updateSet(input: {
  setId: string;
  weight?: number;
  reps?: number;
  done?: boolean;
  kind?: "work" | "warmup";
  /** Effort perçu de 6 à 10 ; `null` l'efface. */
  rpe?: number | null;
  note?: string | null;
}) {
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
      kind: input.kind === "warmup" || input.kind === "work" ? input.kind : undefined,
      rpe: input.rpe === null ? null : input.rpe !== undefined && input.rpe >= 6 && input.rpe <= 10 ? input.rpe : undefined,
      note: input.note === null ? null : typeof input.note === "string" ? input.note.trim().slice(0, 140) || null : undefined,
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

  // Les échauffements ne comptent ni dans le volume ni dans les records.
  const doneSets = workout.entries.flatMap((e) => e.sets.filter((s) => s.done && s.kind === "work"));
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
  const workEntries = workout.entries.map((e) => ({ ...e, sets: e.sets.filter((s) => s.kind === "work") }));
  for (const best of computeWorkoutBests(workEntries)) {
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

/* ── Favoris et exercices personnalisés ───────────────────────────────────── */

/** Ajoute ou retire un exercice des favoris ; renvoie le nouvel état. */
export async function toggleFavorite(exerciseId: string): Promise<boolean> {
  const user = await requireUser();
  const key = { userId_exerciseId: { userId: user.id, exerciseId } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) {
    await prisma.favorite.delete({ where: key });
  } else if (await prisma.exercise.findFirst({ where: { id: exerciseId, ...visibleTo(user.id) }, select: { id: true } })) {
    await prisma.favorite.create({ data: { userId: user.id, exerciseId } });
  } else {
    return false;
  }
  revalidatePath("/biblio");
  return !existing;
}

const MAX_CUSTOM_EXERCISES = 100;

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

/** Crée un exercice personnalisé, visible de son auteur seulement. */
export async function createExercise(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  const muscle = String(formData.get("muscle") ?? "") as MuscleKey;
  const subCode = String(formData.get("subCode") ?? "");
  const equipment = String(formData.get("equipment") ?? "").toUpperCase();
  const description = String(formData.get("description") ?? "").trim().slice(0, 600);

  if (name.length < 2 || name.length > 80) return { error: "Donne un nom de 2 à 80 caractères." };
  if (!(muscle in MUSCLES)) return { error: "Choisis un groupe musculaire." };
  const subs = subsFor(muscle);
  const sub = subs.find((s) => s.code === subCode) ?? subs[0];
  if (!EQUIPMENTS.slice(1).some((e) => e.toUpperCase() === equipment)) return { error: "Choisis un équipement." };

  if ((await prisma.exercise.count({ where: { userId: user.id } })) >= MAX_CUSTOM_EXERCISES) {
    return { error: `Tu as atteint la limite de ${MAX_CUSTOM_EXERCISES} exercices personnalisés.` };
  }

  const slug = `perso-${slugify(name) || "exercice"}-${Math.random().toString(36).slice(2, 8)}`;
  await prisma.exercise.create({
    data: {
      slug, name, equipment, muscle, subCode: sub.code, primaryMuscle: MUSCLES[muscle],
      level: "—", description: description || null, userId: user.id,
    },
  });
  revalidatePath("/biblio");
  redirect(`/exercice/${slug}`);
}

/** Supprime un exercice personnalisé — refusé s'il apparaît déjà dans une séance. */
export async function deleteExercise(formData: FormData) {
  const user = await requireUser();
  const exercise = await prisma.exercise.findFirst({
    where: { id: String(formData.get("exerciseId") ?? ""), userId: user.id },
    include: { _count: { select: { entries: true } } },
  });
  if (!exercise) redirect("/biblio");
  if (exercise._count.entries > 0) redirect(`/exercice/${exercise.slug}?utilise=1`);
  await prisma.exercise.delete({ where: { id: exercise.id } });
  revalidatePath("/biblio");
  redirect("/biblio");
}

/* ── Générateur de séance ─────────────────────────────────────────────────── */

/** Propose une séance (rien n'est créé) — le même `seed` redonne la même proposition. */
export async function previewWorkout(input: { muscles: string[]; minutes: number; seed: number }) {
  const user = await requireUser();
  const minutes = [30, 45, 60, 90].includes(input.minutes) ? input.minutes : 60;
  return proposeWorkout(user.id, { muscles: input.muscles, minutes, seed: Math.floor(input.seed) || 1 });
}

/** Crée une séance à venir avec les exercices retenus, pré-remplie d'après tes dernières performances. */
export async function createGeneratedWorkout(input: { slugs: string[]; name: string }) {
  const user = await requireUser();
  const slugs = [...new Set(input.slugs)].slice(0, 12);
  const found = await prisma.exercise.findMany({ where: { slug: { in: slugs }, ...visibleTo(user.id) } });
  const exercises = slugs.flatMap((s) => found.find((e) => e.slug === s) ?? []);
  if (exercises.length === 0) return { error: "Aucun exercice à ajouter." };

  const previous = await previousSets(user.id, exercises.map((e) => e.id));
  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      name: input.name.trim().slice(0, 60) || defaultName(),
      status: "planned",
      entries: {
        create: exercises.map((e, position) => ({
          exerciseId: e.id,
          position,
          sets: { create: setRows(suggestSets(previous[e.id] ?? [], e.scheme).sets) },
        })),
      },
    },
  });
  revalidatePath("/seance");
  redirect(`/seance/${workout.id}`);
}

/* ── Suivi corporel ───────────────────────────────────────────────────────── */

const MAX_PHOTO_BYTES = 700 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** « 82,5 » ou « 82.5 » → 82.5 ; vide ou invalide → null. */
function parseMeasure(raw: FormDataEntryValue | null, max: number): number | null {
  const value = Number(String(raw ?? "").trim().replace(",", "."));
  return String(raw ?? "").trim() !== "" && Number.isFinite(value) && value > 0 && value <= max ? value : null;
}

/** Ajoute un relevé : poids (dans l'unité de l'utilisateur), mensurations en cm, photo facultative. */
export async function addBodyEntry(formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const weightInput = parseMeasure(formData.get("weight"), 700);
  const data = {
    weight: weightInput === null ? null : fromUnit(weightInput, user.unit),
    chest: parseMeasure(formData.get("chest"), 300),
    waist: parseMeasure(formData.get("waist"), 300),
    hips: parseMeasure(formData.get("hips"), 300),
    arm: parseMeasure(formData.get("arm"), 150),
    thigh: parseMeasure(formData.get("thigh"), 200),
  };

  const file = formData.get("photo");
  let photo: Uint8Array<ArrayBuffer> | null = null;
  let photoType: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!PHOTO_TYPES.includes(file.type)) return { error: "Format de photo non pris en charge (JPEG, PNG ou WebP)." };
    if (file.size > MAX_PHOTO_BYTES) return { error: "Photo trop lourde, même après réduction. Essaie une autre image." };
    photo = new Uint8Array(await file.arrayBuffer());
    photoType = file.type;
  }

  if (!photo && Object.values(data).every((v) => v === null)) {
    return { error: "Renseigne au moins un poids, une mensuration ou une photo." };
  }

  // Jour choisi (calé à midi UTC pour rester le même jour à Paris) ; aujourd'hui par défaut.
  const day = String(formData.get("date") ?? "");
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T12:00:00Z`) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) && parsed.getTime() <= Date.now() + 86_400_000 ? parsed : new Date();

  await prisma.bodyEntry.create({ data: { userId: user.id, date, ...data, photo, photoType } });
  revalidatePath("/corps");
}

export async function deleteBodyEntry(formData: FormData) {
  const user = await requireUser();
  await prisma.bodyEntry.deleteMany({ where: { id: String(formData.get("entryId") ?? ""), userId: user.id } });
  revalidatePath("/corps");
}

/* ── Réglages ─────────────────────────────────────────────────────────────── */

export async function updateSettings(formData: FormData) {
  const user = await requireUser();
  const unit = String(formData.get("unit") ?? user.unit);
  const restSeconds = Number(formData.get("restSeconds") ?? user.restSeconds);
  const theme = String(formData.get("theme") ?? user.theme);
  const sessionsPerWeek = Number(formData.get("sessionsPerWeek") ?? user.sessionsPerWeek);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      sessionsPerWeek: Number.isFinite(sessionsPerWeek) ? Math.min(7, Math.max(1, Math.round(sessionsPerWeek))) : user.sessionsPerWeek,
      unit: unit === "lb" ? "lb" : "kg",
      restSeconds: Number.isFinite(restSeconds) ? Math.min(600, Math.max(15, restSeconds)) : user.restSeconds,
      theme: theme === "light" ? "light" : "dark",
    },
  });
  revalidatePath("/profil");
  revalidatePath("/progression");
}
