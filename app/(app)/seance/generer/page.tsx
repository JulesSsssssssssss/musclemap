import { GeneratorScreen } from "@/components/screens/GeneratorScreen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Générer une séance · MuscleMap" };

export default async function GeneratePage() {
  await requireUser();
  return (
    <div className="scroll">
      <ScreenHeader back="/seance" eyebrow="GÉNÉRATEUR" title="Séance sur mesure" />
      <GeneratorScreen />
    </div>
  );
}
