import { HomeScreen } from "@/components/screens/HomeScreen";
import { requireUser } from "@/lib/auth";
import { countOpenWorkouts, exerciseCounts } from "@/lib/queries";

export default async function HomePage() {
  const user = await requireUser();
  const [{ byMuscle }, open] = await Promise.all([exerciseCounts(), countOpenWorkouts(user.id)]);
  return <HomeScreen counts={byMuscle} badge={open} />;
}
