import Link from "next/link";
import { notFound } from "next/navigation";
import { BodySilhouette, type Highlight } from "@/components/body/BodySilhouette";
import { ExerciseGuide } from "@/components/ExerciseGuide";
import { AddToWorkout } from "@/components/AddToWorkout";
import { IconBack } from "@/components/Icons";
import { FRONT_MUSCLES, MUSCLES, type MuscleKey } from "@/lib/body";
import { muscleFromLabel } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { getExercise, lastPerformance, parseGuide, parseSecondary } from "@/lib/queries";
import { dec, dayMonth } from "@/lib/format";


export default async function ExercisePage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const exercise = await getExercise(slug);
  if (!exercise) notFound();

  const secondary = parseSecondary(exercise.secondaryMuscles);
  const guide = parseGuide(exercise.guide);
  const last = await lastPerformance(user.id, exercise.id);

  const primaryKey = exercise.muscle as MuscleKey;
  const face = FRONT_MUSCLES.includes(primaryKey);
  const highlights: Highlight[] = [{ muscle: primaryKey, opacity: 1 }];
  for (const label of secondary) {
    const key = muscleFromLabel(label) as MuscleKey | null;
    if (key && key !== primaryKey && !highlights.some((h) => h.muscle === key)) {
      highlights.unshift({ muscle: key, opacity: 0.32 });
    }
  }

  return (
    <div className="scroll" style={{ position: "relative" }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "center", background: "#fff", minHeight: 96 }}>
        <Link
          href={`/muscle/${primaryKey}/${exercise.subCode}`}
          aria-label="Retour"
          style={{
            position: "absolute", top: 8, left: 20, width: 44, height: 44, borderRadius: 14,
            background: "rgba(10,11,10,.72)", border: "1px solid rgba(255,255,255,.1)", zIndex: 1,
            display: "grid", placeItems: "center", color: "var(--txt)",
          }}
        >
          <IconBack />
        </Link>
        {exercise.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={exercise.image} alt={`Démonstration : ${exercise.name}`} width={360} height={360} style={{ display: "block", width: "min(100%, 360px)", height: "auto", aspectRatio: "1 / 1", objectFit: "contain" }} />
        )}
      </div>

      <div style={{ padding: "18px 20px 0" }}>
        <h1 style={{ margin: "0 0 10px", font: "700 26px/1.15 var(--sans)", letterSpacing: "-.8px" }}>{exercise.name}</h1>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
          <span style={{ font: "500 11px var(--mono)", color: "var(--dim)", padding: "6px 10px", borderRadius: 8, background: "var(--surf2)" }}>
            {exercise.equipment}
          </span>
          <span style={{ font: "500 11px var(--mono)", color: "var(--acc)", padding: "6px 10px", borderRadius: 8, background: "rgba(255,91,30,.12)" }}>
            {exercise.scheme}
          </span>
        </div>
        {exercise.description && (
          <p style={{ margin: "0 0 18px", font: "400 14px/1.55 var(--sans)", color: "var(--dim)" }}>{exercise.description}</p>
        )}
      </div>

      <ExerciseGuide guide={guide} />

      <section style={{ margin: "0 20px 14px", padding: 16, borderRadius: 20, background: "var(--surf)", border: "1px solid var(--hair)", display: "flex", gap: 16, alignItems: "center" }}>
        <BodySilhouette face={face} highlights={highlights} style={{ width: 84, flex: "none" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: "var(--acc)" }} />
            <span style={{ font: "600 13px var(--sans)" }}>{exercise.primaryMuscle}</span>
          </div>
          {secondary.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(255,91,30,.32)" }} />
              <span style={{ font: "400 13px var(--sans)", color: "var(--dim)" }}>{secondary.join(" · ")}</span>
            </div>
          )}
          <span style={{ font: "400 11px/1.4 var(--sans)", color: "var(--ghost)" }}>
            Groupe {MUSCLES[primaryKey].toLowerCase()} · faisceau {exercise.subCode}
          </span>
        </div>
      </section>

      {exercise.sourceUrl && (
        <p style={{ margin: "0 20px 14px", font: "400 11px/1.5 var(--sans)", color: "var(--ghost)" }}>
          Source : <a href={exercise.sourceUrl} target="_blank" rel="noopener noreferrer">docteur-fitness.com</a>
        </p>
      )}

      {last ? (
        <section
          style={{
            margin: "0 20px 16px", padding: "15px 16px", borderRadius: 20,
            background: "linear-gradient(100deg,rgba(255,91,30,.1),rgba(255,91,30,.02))",
            border: "1px solid rgba(255,91,30,.22)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
            <span className="eyebrow" style={{ letterSpacing: "1.4px" }}>
              DERNIÈRE FOIS · {dayMonth(last.date).d} {dayMonth(last.date).m}.
            </span>
            <span style={{ font: "700 22px var(--sans)", letterSpacing: "-.5px" }}>
              {last.sets} × {last.reps} <span style={{ color: "var(--acc)" }}>{dec(last.weight)} kg</span>
            </span>
          </div>
          {last.weight > 0 && (
            <span style={{ flex: "none", font: "600 12px var(--sans)", color: "var(--acc)", padding: "8px 12px", borderRadius: 10, background: "rgba(255,91,30,.12)" }}>
              +{last.weight >= 40 ? "5" : "2,5"} kg ?
            </span>
          )}
        </section>
      ) : (
        <section style={{ margin: "0 20px 16px", padding: "15px 16px", borderRadius: 20, background: "var(--surf)", border: "1px solid var(--hair)" }}>
          <span className="eyebrow" style={{ letterSpacing: "1.4px" }}>PREMIÈRE FOIS</span>
          <p style={{ margin: "6px 0 0", font: "400 13px/1.45 var(--sans)", color: "var(--dim)" }}>
            Aucune donnée sur cet exercice. Ajoute-le à ta séance pour commencer à suivre ta charge.
          </p>
        </section>
      )}

      <div style={{ position: "sticky", bottom: 0, padding: "24px 20px 12px", background: "linear-gradient(to bottom, transparent, var(--ink) 45%)" }}>
        <AddToWorkout slug={exercise.slug} variant="primary" />
      </div>
    </div>
  );
}
