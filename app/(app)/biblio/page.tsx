import Link from "next/link";
import { Suspense } from "react";
import { SearchField } from "@/components/SearchField";
import { FilterChips } from "@/components/FilterChips";
import { AddToWorkout } from "@/components/AddToWorkout";
import { FavoriteButton } from "@/components/FavoriteButton";
import { MUSCLES } from "@/lib/body";
import { EQUIPMENTS } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { favoriteIds, listExercises, recentExercises, visibleTo } from "@/lib/queries";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Bibliothèque · MuscleMap" };

const MUSCLE_FILTER = ["Tous muscles", ...Object.values(MUSCLES)];
const KEY_BY_LABEL = Object.fromEntries(Object.entries(MUSCLES).map(([k, v]) => [v, k]));
const VIEWS = ["Tous", "★ Favoris"];

type Row = {
  id: string;
  slug: string;
  name: string;
  equipment: string;
  primaryMuscle: string;
  image: string | null;
  userId: string | null;
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; muscle?: string; equip?: string; vue?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;

  const muscleLabel = MUSCLE_FILTER.includes(query.muscle ?? "") ? query.muscle! : MUSCLE_FILTER[0];
  const equip = EQUIPMENTS.includes(query.equip ?? "") ? query.equip! : EQUIPMENTS[0];
  const view = VIEWS.includes(query.vue ?? "") ? query.vue! : VIEWS[0];
  const favoritesOnly = view === VIEWS[1];
  const filtered = Boolean(query.q) || muscleLabel !== MUSCLE_FILTER[0] || equip !== EQUIPMENTS[0] || favoritesOnly;

  const [exercises, total, favorites, recents] = await Promise.all([
    listExercises({
      userId: user.id,
      search: query.q || undefined,
      muscle: muscleLabel === MUSCLE_FILTER[0] ? undefined : KEY_BY_LABEL[muscleLabel],
      equipment: equip === EQUIPMENTS[0] ? undefined : equip,
      favoritesOnly,
    }),
    prisma.exercise.count({ where: visibleTo(user.id) }),
    favoriteIds(user.id),
    filtered ? Promise.resolve([]) : recentExercises(user.id),
  ]);

  // Regroupement alphabétique : la lettre n'apparaît que sur la première entrée.
  const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  let lastLetter = "";

  const thumb = (e: Row, size: number) =>
    e.image && (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={e.image.replace(".webp", "-thumb.webp")} alt="" width={size} height={size} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    );

  return (
    <div className="scroll">
      <div style={{ padding: "8px 20px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <span className="eyebrow" style={{ letterSpacing: "1.8px" }}>BIBLIOTHÈQUE</span>
          <h1 style={{ margin: "5px 0 0", font: "700 26px var(--sans)", letterSpacing: "-.8px" }}>
            {filtered ? `${sorted.length} résultat${sorted.length > 1 ? "s" : ""}` : `${total} exercices`}
          </h1>
        </div>
        <Link
          href="/exercice/nouveau"
          className="tap"
          style={{ flex: "none", minHeight: 44, padding: "0 14px", borderRadius: 14, background: "rgba(255,91,30,.12)", border: "1px solid rgba(255,91,30,.3)", color: "var(--acc)", font: "600 13px var(--sans)", display: "grid", placeItems: "center" }}
        >
          + Créer
        </Link>
      </div>

      <Suspense fallback={<div style={{ height: 52, margin: "0 20px 12px" }} />}>
        <SearchField initial={query.q ?? ""} />
      </Suspense>

      <FilterChips values={VIEWS} active={view} param="vue" base="/biblio" params={query} />
      <FilterChips values={MUSCLE_FILTER} active={muscleLabel} param="muscle" base="/biblio" params={query} />
      <FilterChips values={EQUIPMENTS} active={equip} param="equip" base="/biblio" params={query} style="dashed" />

      {recents.length > 0 && (
        <section style={{ padding: "0 0 16px" }}>
          <h2 className="eyebrow" style={{ margin: "0 20px 10px", letterSpacing: "1.6px" }}>RÉCENTS</h2>
          <div className="chiprow" style={{ padding: "0 20px", gap: 10 }}>
            {recents.map((e) => (
              <Link
                key={e.id}
                href={`/exercice/${e.slug}`}
                style={{ flex: "none", width: 132, display: "flex", flexDirection: "column", gap: 7, color: "inherit" }}
              >
                <span className="gif" style={{ display: "block", width: 132, height: 96, borderRadius: 16, overflow: "hidden" }}>
                  {thumb(e, 132)}
                </span>
                <span style={{ font: "600 12px/1.3 var(--sans)", color: "var(--txt)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {e.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px 10px", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            {favoritesOnly ? "Aucun favori pour l'instant. Touche l'étoile d'un exercice pour le retrouver ici." : "Aucun exercice ne correspond."}
          </p>
        )}
        {sorted.map((e) => {
          const letter = e.name[0].toUpperCase();
          const show = letter !== lastLetter;
          lastLetter = letter;
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0" }}>
              <span style={{ width: 22, flex: "none", font: "700 15px var(--sans)", color: show ? "var(--acc)" : "transparent", textAlign: "center" }}>
                {letter}
              </span>
              <Link href={`/exercice/${e.slug}`} className="gif" aria-hidden="true" tabIndex={-1} style={{ width: 48, height: 48, flex: "none", borderRadius: 14, overflow: "hidden" }}>
                {thumb(e, 48)}
              </Link>
              <Link href={`/exercice/${e.slug}`} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3, color: "inherit" }}>
                <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>{e.name}</span>
                <span style={{ font: "500 10px var(--mono)", color: "var(--mut)" }}>
                  {e.equipment} · {e.primaryMuscle.toUpperCase()}
                  {e.userId && <span style={{ marginLeft: 6, color: "var(--acc)" }}>PERSO</span>}
                </span>
              </Link>
              <FavoriteButton exerciseId={e.id} initial={favorites.has(e.id)} name={e.name} size={40} />
              <AddToWorkout slug={e.slug} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
