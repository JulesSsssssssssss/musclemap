import { ExerciseForm } from "@/components/ExerciseForm";
import { ScreenHeader } from "@/components/ScreenHeader";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Nouvel exercice · MuscleMap" };

export default async function NewExercisePage() {
  await requireUser();
  return (
    <div className="scroll">
      <ScreenHeader back="/biblio" eyebrow="EXERCICE PERSONNALISÉ" title="Nouvel exercice" />
      <ExerciseForm />
    </div>
  );
}
