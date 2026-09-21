import { HomeScreen } from "@/components/screens/HomeScreen";
import { requireUser } from "@/lib/auth";
import { countOpenWorkouts, exerciseCounts, muscleVolume } from "@/lib/queries";

export default async function HomePage() {
  const user = await requireUser();
  const [{ byMuscle }, open, volume] = await Promise.all([
    exerciseCounts(),
    countOpenWorkouts(user.id),
    muscleVolume(user.id),
  ]);
  return <HomeScreen counts={byMuscle} badge={open} volume={volume} />;
}
