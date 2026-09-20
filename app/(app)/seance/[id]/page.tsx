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
  if (!workout) notFound();
  if (workout.status === "done") redirect(`/seance/${id}/resume`);

  const prev = await previousSets(user.id, workout.entries.map((e) => e.exerciseId));

  const entries: SessionEntry[] = workout.entries.map((entry) => ({
    id: entry.id,
    name: entry.exercise.name,
    meta: `${entry.exercise.equipment} · ${entry.exercise.primaryMuscle.toUpperCase()}`,
    note: entry.note,
    sets: entry.sets.map((set, i) => {
      const previous = prev[entry.exerciseId]?.[i];
      return {
        id: set.id,
        weight: set.weight,
        reps: set.reps,
        done: set.done,
        prev: previous ? `${dec(previous.weight)} × ${previous.reps}` : "—",
      };
    }),
  }));

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
