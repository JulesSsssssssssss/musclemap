import { HomeScreen } from "@/components/screens/HomeScreen";
import { requireUser } from "@/lib/auth";
import { exerciseCounts, getActiveWorkout } from "@/lib/queries";

export default async function HomePage() {
  const user = await requireUser();
  const [{ byMuscle }, workout] = await Promise.all([exerciseCounts(), getActiveWorkout(user.id)]);
  return <HomeScreen counts={byMuscle} badge={workout?.entries.length ?? 0} />;
}
