import Link from "next/link";
import { Suspense } from "react";
import { SearchField } from "@/components/SearchField";
import { FilterChips } from "@/components/FilterChips";
import { AddToWorkout } from "@/components/AddToWorkout";
import { MUSCLES } from "@/lib/body";
import { EQUIPMENTS } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { listExercises } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Bibliothèque · MuscleMap" };

const MUSCLE_FILTER = ["Tous muscles", ...Object.values(MUSCLES)];
const KEY_BY_LABEL = Object.fromEntries(Object.entries(MUSCLES).map(([k, v]) => [v, k]));

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string; equip?: string }>;
}) {
  await requireUser();
  const query = await searchParams;

  const muscleLabel = MUSCLE_FILTER.includes(query.muscle ?? "") ? query.muscle! : MUSCLE_FILTER[0];
  const equip = EQUIPMENTS.includes(query.equip ?? "") ? query.equip! : EQUIPMENTS[0];

  const [exercises, total] = await Promise.all([
    listExercises({
      search: query.q || undefined,
      muscle: muscleLabel === MUSCLE_FILTER[0] ? undefined : KEY_BY_LABEL[muscleLabel],
      equipment: equip === EQUIPMENTS[0] ? undefined : equip,
    }),
    prisma.exercise.count(),
  ]);

  // Regroupement alphabétique : la lettre n'apparaît que sur la première entrée.
  const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  let lastLetter = "";

  return (
    <div className="scroll">
      <div style={{ padding: "8px 20px 14px" }}>
        <span className="eyebrow" style={{ letterSpacing: "1.8px" }}>BIBLIOTHÈQUE</span>
        <h1 style={{ margin: "5px 0 0", font: "700 26px var(--sans)", letterSpacing: "-.8px" }}>
          {query.q || muscleLabel !== MUSCLE_FILTER[0] || equip !== EQUIPMENTS[0]
            ? `${sorted.length} résultat${sorted.length > 1 ? "s" : ""}`
            : `${total} exercices`}
        </h1>
      </div>

      <Suspense fallback={<div style={{ height: 52, margin: "0 20px 12px" }} />}>
        <SearchField initial={query.q ?? ""} />
      </Suspense>

      <FilterChips values={MUSCLE_FILTER} active={muscleLabel} param="muscle" base="/biblio" params={query} />
      <FilterChips values={EQUIPMENTS} active={equip} param="equip" base="/biblio" params={query} style="dashed" />

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px 10px", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            Aucun exercice ne correspond.
          </p>
        )}
        {sorted.map((e) => {
          const letter = e.name[0].toUpperCase();
          const show = letter !== lastLetter;
          lastLetter = letter;
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px" }}>
              <span style={{ width: 26, flex: "none", font: "700 15px var(--sans)", color: show ? "var(--acc)" : "transparent", textAlign: "center" }}>
                {letter}
              </span>
              <Link href={`/exercice/${e.slug}`} className="gif" aria-hidden="true" tabIndex={-1} style={{ width: 48, height: 48, flex: "none", borderRadius: 14, overflow: "hidden" }}>
                {e.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image.replace(".webp", "-thumb.webp")} alt="" width={48} height={48} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                )}
              </Link>
              <Link href={`/exercice/${e.slug}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, color: "inherit" }}>
                <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>{e.name}</span>
                <span style={{ font: "500 10px var(--mono)", color: "var(--mut)" }}>
                  {e.equipment} · {e.primaryMuscle.toUpperCase()}
                </span>
              </Link>
              <AddToWorkout slug={e.slug} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
