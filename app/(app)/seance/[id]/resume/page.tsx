import Link from "next/link";
import { notFound } from "next/navigation";
import { saveAsRoutine } from "@/app/actions";
import { BodySilhouette, type Highlight } from "@/components/body/BodySilhouette";
import { requireUser } from "@/lib/auth";
import { getWorkout, listRecords } from "@/lib/queries";
import { MUSCLES, type MuscleKey } from "@/lib/body";
import { dec, mmss, num } from "@/lib/format";

export const metadata = { title: "Séance terminée · MuscleMap" };

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const workout = await getWorkout(user.id, id);
  if (!workout || workout.status === "template") notFound();

  const doneSets = workout.entries.flatMap((e) => e.sets.filter((s) => s.done && s.kind === "work"));

  // Volume par muscle → intensité du surlignage sur la silhouette.
  const volumeByMuscle = new Map<MuscleKey, number>();
  for (const entry of workout.entries) {
    const key = entry.exercise.muscle as MuscleKey;
    const v = entry.sets.filter((s) => s.done && s.kind === "work").reduce((a, s) => a + Math.max(s.weight, 1) * s.reps, 0);
    volumeByMuscle.set(key, (volumeByMuscle.get(key) ?? 0) + v);
  }
  const ranked = [...volumeByMuscle.entries()].sort((a, b) => b[1] - a[1]);
  const peak = ranked[0]?.[1] ?? 1;
  const highlights: Highlight[] = ranked
    .map(([muscle, v]) => ({ muscle, opacity: Math.max(0.16, Math.min(1, v / peak)) }))
    .reverse();

  // Records battus pendant cette séance.
  const records: { name: string; label: string; value: string }[] = [];
  for (const entry of workout.entries) {
    const best = await listRecords(user.id, entry.exerciseId);
    const top = entry.sets.filter((s) => s.done && s.kind === "work").reduce((a, s) => Math.max(a, s.weight), 0);
    if (top > 0 && best.weight && Math.abs(best.weight - top) < 0.001) {
      records.push({ name: entry.exercise.name, label: "Charge max", value: `${dec(top)} ${user.unit}` });
    }
  }

  const stats = [
    { label: "DURÉE", value: mmss(workout.durationSec), accent: false },
    { label: "VOLUME", value: `${num(workout.volumeKg)}`, suffix: ` ${user.unit}`, accent: true },
    { label: "EXERCICES", value: String(workout.entries.length), accent: false },
    { label: "SÉRIES", value: String(doneSets.length), accent: false },
  ];

  return (
    <div className="scroll">
      <div style={{ padding: "10px 20px 18px" }}>
        <span className="eyebrow" style={{ letterSpacing: "1.8px", color: "var(--acc)" }}>SÉANCE TERMINÉE</span>
        <h1 style={{ margin: "6px 0 0", font: "700 30px/1.05 var(--sans)", letterSpacing: "-1.2px" }}>
          {workout.name},<br />c&apos;est bouclé.
        </h1>
      </div>

      <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: 15, borderRadius: 18,
              background: s.accent ? "rgba(255,91,30,.1)" : "var(--surf)",
              border: `1px solid ${s.accent ? "rgba(255,91,30,.28)" : "var(--hair)"}`,
            }}
          >
            <span style={{ font: "500 9px var(--mono)", letterSpacing: "1.4px", color: "var(--mut)" }}>{s.label}</span>
            <div style={{ font: "700 28px var(--sans)", letterSpacing: "-1px", marginTop: 4, color: s.accent ? "var(--acc)" : "var(--txt)" }}>
              {s.value}
              {s.suffix && <span style={{ fontSize: 14, letterSpacing: 0 }}>{s.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      <section style={{ margin: "0 20px 16px", padding: 16, borderRadius: 22, background: "var(--surf)", border: "1px solid var(--hair)", display: "flex", gap: 14, alignItems: "center" }}>
        <BodySilhouette highlights={highlights} style={{ height: 196, flex: "none" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          <span className="eyebrow" style={{ letterSpacing: "1.4px" }}>MUSCLES TRAVAILLÉS</span>
          {ranked.slice(0, 3).map(([muscle, v], i) => (
            <div key={muscle} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ width: 26, height: 8, flex: "none", borderRadius: 4, background: `rgba(255,91,30,${Math.max(0.16, v / peak).toFixed(2)})` }} />
              <span style={{ font: "500 12px var(--sans)", color: i === 0 ? "var(--txt)" : i === 1 ? "var(--dim)" : "var(--faint)" }}>
                {MUSCLES[muscle]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {records.length > 0 && (
        <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="eyebrow">RECORDS BATTUS</span>
          <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
            {records.slice(0, 4).map((r, i) => (
              <div
                key={r.name}
                style={{
                  flex: 1, minWidth: 150, padding: 14, borderRadius: 18,
                  background: "linear-gradient(140deg,rgba(255,91,30,.14),rgba(255,91,30,.03))",
                  border: "1px solid rgba(255,91,30,.3)",
                  animation: `mmPop .4s ${i * 0.08}s ease both`,
                }}
              >
                <div style={{ fontSize: 19, lineHeight: 1 }}>🏆</div>
                <div style={{ font: "600 13px var(--sans)", marginTop: 7 }}>{r.name}</div>
                <div style={{ font: "700 19px var(--sans)", color: "var(--acc)", letterSpacing: "-.5px" }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 9 }}>
        <Link href="/progression" className="primary tap" style={{ minHeight: 58, borderRadius: 19, textDecoration: "none" }}>
          Voir ma progression
        </Link>
        <form action={saveAsRoutine}>
          <input type="hidden" name="workoutId" value={workout.id} />
          <button type="submit" className="ghostbtn tap" style={{ width: "100%" }}>
            ☆ Enregistrer comme routine
          </button>
        </form>
        <Link href="/" className="ghostbtn tap" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>
          Retour au corps
        </Link>
      </div>
    </div>
  );
}
