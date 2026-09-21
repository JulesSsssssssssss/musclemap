import "server-only";
import { prisma } from "./prisma";
import { MUSCLES, type MuscleKey } from "./body";
import { MAJOR_MUSCLES, equipmentWeight, exerciseCountFor, mulberry32, pickForMuscle } from "./generator-core";
import { favoriteIds, muscleVolume, recentExercises, visibleTo } from "./queries";

export type Proposal = {
  slug: string;
  name: string;
  muscle: MuscleKey;
  muscleLabel: string;
  equipment: string;
  scheme: string;
  reason: string;
};

/** Propose une séance : les muscles demandés, ou à défaut ceux le moins travaillés récemment. */
export async function proposeWorkout(
  userId: string,
  opts: { muscles: string[]; minutes: number; seed: number },
): Promise<{ items: Proposal[]; auto: boolean }> {
  const rng = mulberry32(opts.seed);
  const count = exerciseCountFor(opts.minutes);

  let targets = [...new Set(opts.muscles)].filter((m): m is MuscleKey => m in MUSCLES).slice(0, 5);
  const auto = targets.length === 0;
  if (auto) {
    const volume = await muscleVolume(userId);
    const score = (m: MuscleKey) => (volume[7][m] ?? 0) * 3 + (volume[30][m] ?? 0) + rng() * 0.5;
    targets = [...MAJOR_MUSCLES].sort((a, b) => score(a) - score(b)).slice(0, count <= 5 ? 2 : 3);
  }

  const [rows, favorites, recents] = await Promise.all([
    prisma.exercise.findMany({
      where: { muscle: { in: targets }, ...visibleTo(userId) },
      select: { id: true, slug: true, name: true, muscle: true, subCode: true, equipment: true, scheme: true, popularity: true },
    }),
    favoriteIds(userId),
    recentExercises(userId, 40),
  ]);
  const recent = new Set(recents.map((r) => r.id));

  const items: Proposal[] = [];
  targets.forEach((muscle, i) => {
    const quota = Math.floor(count / targets.length) + (i < count % targets.length ? 1 : 0);
    const pool = rows.filter((r) => r.muscle === muscle);
    for (const c of pickForMuscle(pool, quota, { favorites, recent, rng })) {
      items.push({
        slug: c.slug,
        name: c.name,
        muscle,
        muscleLabel: MUSCLES[muscle],
        equipment: c.equipment,
        scheme: c.scheme,
        reason: favorites.has(c.id) ? "Favori" : recent.has(c.id) ? "Déjà pratiqué" : auto ? "Muscle en retard" : "Suggestion",
      });
    }
  });

  // Charges lourdes d'abord ; le tri est stable, l'ordre par muscle est conservé à égalité.
  items.sort((a, b) => equipmentWeight(b.equipment) - equipmentWeight(a.equipment));
  return { items, auto };
}
