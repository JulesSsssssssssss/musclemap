import { notFound, redirect } from "next/navigation";
import { SessionScreen, type SessionEntry } from "@/components/screens/SessionScreen";
import { requireUser } from "@/lib/auth";
import { getWorkout, previousSets } from "@/lib/queries";
import { dec } from "@/lib/format";

export const metadata = { title: "Séance · MuscleMap" };

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const workout = await getWorkout(user.id, id);
  if (!workout || workout.status === "template") notFound();
  if (workout.status === "done") redirect(`/seance/${id}/resume`);

  const prev = await previousSets(user.id, workout.entries.map((e) => e.exerciseId));

  const entries: SessionEntry[] = workout.entries.map((entry, index) => {
    const before = prev[entry.exerciseId];
    const firstWork = entry.sets.find((s) => s.kind === "work");
    let workIndex = 0; // « précédent » se compare série de travail à série de travail

    return {
      id: entry.id,
      name: entry.exercise.name,
      slug: entry.exercise.slug,
      image: entry.exercise.image,
      meta: `${entry.exercise.equipment} · ${entry.exercise.primaryMuscle.toUpperCase()}`,
      note: entry.note,
      superset: entry.superset,
      linkedToNext: workout.entries[index + 1]?.superset ?? false,
      overload: Boolean(before?.length && firstWork && firstWork.weight > before[0].weight),
      sets: entry.sets.map((set) => {
        const previous = set.kind === "work" ? before?.[workIndex++] : undefined;
        return {
          id: set.id,
          weight: set.weight,
          reps: set.reps,
          done: set.done,
          kind: set.kind === "warmup" ? "warmup" : "work",
          rpe: set.rpe,
          note: set.note,
          prev: previous ? `${dec(previous.weight)} × ${previous.reps}` : "—",
        };
      }),
    };
  });

  return (
    <SessionScreen
      workoutId={workout.id}
      mode={workout.status === "active" ? "active" : "planned"}
      workoutName={workout.name}
      startedAt={workout.status === "active" ? workout.startedAt.toISOString() : null}
      entries={entries}
      restSeconds={user.restSeconds}
      unit={user.unit}
    />
  );
}
