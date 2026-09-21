"use client";

import { deleteWorkout } from "@/app/actions";
import { IconTrash } from "@/components/Icons";

export function DeleteWorkoutButton({ workoutId, name }: { workoutId: string; name: string }) {
  return (
    <form
      action={deleteWorkout}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer la séance « ${name} » ? Cette action est définitive.`)) e.preventDefault();
      }}
      style={{ flex: "none" }}
    >
      <input type="hidden" name="workoutId" value={workoutId} />
      <button
        type="submit"
        aria-label={`Supprimer la séance « ${name} »`}
        className="iconbtn tap"
        style={{ height: 44, width: 44, minWidth: 44 }}
      >
        <IconTrash />
      </button>
    </form>
  );
}
