import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FilterChips } from "@/components/FilterChips";
import { ExerciseCard } from "@/components/ExerciseCard";
import { MUSCLES, type MuscleKey } from "@/lib/body";
import { EQUIPMENTS, subsFor } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { listExercises, parseSecondary } from "@/lib/queries";

export default async function SubMusclePage({
  params,
  searchParams,
}: {
  params: Promise<{ muscle: string; sub: string }>;
  searchParams: Promise<{ equip?: string }>;
}) {
  await requireUser();
  const { muscle, sub } = await params;
  const query = await searchParams;
  if (!(muscle in MUSCLES)) notFound();

  const key = muscle as MuscleKey;
  const subs = subsFor(key);
  const current = subs.find((s) => s.code === sub.toUpperCase());
  if (!current) notFound();

  const equip = EQUIPMENTS.includes(query.equip ?? "") ? query.equip! : EQUIPMENTS[0];

  const exercises = await listExercises({
    muscle: key,
    subCode: current.code,
    equipment: equip === EQUIPMENTS[0] ? undefined : equip,
  });

  const base = `/muscle/${key}/${current.code}`;

  return (
    <div className="scroll">
      <ScreenHeader back={`/muscle/${key}`} eyebrow="EXERCICES CIBLÉS" title={current.name} />

      <FilterChips values={EQUIPMENTS} active={equip} param="equip" base={base} params={query} />

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span className="eyebrow">{exercises.length} RÉSULTAT{exercises.length > 1 ? "S" : ""}</span>
          <span style={{ font: "500 11px var(--sans)", color: "var(--ghost)" }}>Trier · Popularité</span>
        </div>

        {exercises.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px 10px", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            Aucun exercice pour ce filtre.<br />Essaie « Tous » ou un autre équipement.
          </p>
        ) : (
          exercises.map((e) => (
            <ExerciseCard
              key={e.id}
              exercise={{
                slug: e.slug, name: e.name, equipment: e.equipment,
                primaryMuscle: e.primaryMuscle, image: e.image, secondary: parseSecondary(e.secondaryMuscles),
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
