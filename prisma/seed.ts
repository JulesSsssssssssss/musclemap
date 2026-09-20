import { PrismaClient } from "@prisma/client";
import imported from "./data/exercises-import.json";

const prisma = new PrismaClient();

/** Catalogue unique : les exercices importés. Les autres (sans séance associée) sont retirés. */
async function main() {
  for (const e of imported) {
    const data = {
      name: e.name, equipment: e.equipment, level: e.level, muscle: e.muscle, subCode: e.subCode,
      primaryMuscle: e.primaryMuscle, guide: JSON.stringify(e.guide), popularity: 30,
      description: e.description, image: e.image, sourceUrl: e.sourceUrl,
    };
    await prisma.exercise.upsert({ where: { slug: e.slug }, create: { slug: e.slug, ...data }, update: data });
  }
  const { count } = await prisma.exercise.deleteMany({
    where: { slug: { notIn: imported.map((e) => e.slug) }, entries: { none: {} } },
  });
  console.log(`✓ ${imported.length} exercices, ${count} anciens supprimés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
