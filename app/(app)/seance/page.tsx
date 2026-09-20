import { SessionScreen, type SessionEntry } from "@/components/screens/SessionScreen";
import { requireUser } from "@/lib/auth";
import { getActiveWorkout, previousSets } from "@/lib/queries";
import { dec } from "@/lib/format";

export const metadata = { title: "Séance · MuscleMap" };

export default async function SessionPage() {
  const user = await requireUser();
  const workout = await getActiveWorkout(user.id);

  if (!workout) {
    return (
      <SessionScreen
        workoutId={null}
        workoutName="Séance"
        startedAt={null}
        entries={[]}
        restSeconds={user.restSeconds}
        unit={user.unit}
      />
    );
  }

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
      workoutName={workout.name}
      startedAt={workout.startedAt.toISOString()}
      entries={entries}
      restSeconds={user.restSeconds}
      unit={user.unit}
    />
  );
}
