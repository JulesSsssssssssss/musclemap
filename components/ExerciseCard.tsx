import Link from "next/link";
import { AddToWorkout } from "./AddToWorkout";


export type CardExercise = {
  slug: string;
  name: string;
  equipment: string;
  primaryMuscle: string;
  image?: string | null;
  secondary: string[];
};

export function ExerciseCard({ exercise }: { exercise: CardExercise }) {
  return (
    <article style={{ display: "flex", gap: 13, padding: 13, borderRadius: 20, background: "var(--surf)", border: "1px solid var(--hair)" }}>
      <Link
        href={`/exercice/${exercise.slug}`}
        className="gif"
        aria-label={`Fiche ${exercise.name}`}
        style={{ width: 76, height: 76, flex: "none", borderRadius: 16, border: "1px solid rgba(255,255,255,.06)", display: "grid", placeItems: "center", overflow: "hidden" }}
      >
        {exercise.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exercise.image.replace(".webp", "-thumb.webp")} alt="" width={76} height={76} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ font: "500 8px var(--mono)", color: "var(--ghost)", letterSpacing: ".6px" }}>GIF</span>
        )}
      </Link>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        <Link href={`/exercice/${exercise.slug}`} style={{ font: "600 15px/1.25 var(--sans)", color: "var(--txt)" }}>
          {exercise.name}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ font: "500 10px var(--mono)", letterSpacing: ".6px", color: "var(--dim)", padding: "3px 7px", borderRadius: 6, background: "var(--surf3)" }}>
            {exercise.equipment}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          <span style={{ font: "500 10px var(--sans)", color: "var(--acc)", padding: "3px 7px", borderRadius: 999, border: "1px solid rgba(255,91,30,.3)" }}>
            {exercise.primaryMuscle}
          </span>
          {exercise.secondary.map((s) => (
            <span key={s} style={{ font: "500 10px var(--sans)", color: "#7C8275", padding: "3px 7px", borderRadius: 999, border: "1px solid rgba(255,255,255,.1)" }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <AddToWorkout slug={exercise.slug} />
    </article>
  );
}
