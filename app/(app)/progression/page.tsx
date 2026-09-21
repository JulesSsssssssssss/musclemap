import Link from "next/link";
import { Suspense } from "react";
import { BodySilhouette, type Highlight } from "@/components/body/BodySilhouette";
import { ProgressChart } from "@/components/ProgressChart";
import { ExercisePicker } from "@/components/ExercisePicker";
import { FilterChips } from "@/components/FilterChips";
import { requireUser } from "@/lib/auth";
import { WeeklyGoal } from "@/components/WeeklyGoal";
import { listHistory, listRecords, muscleDistribution, progressionSeries, trainedExercises, weeklyGoalFor } from "@/lib/queries";
import { MUSCLES, type MuscleKey } from "@/lib/body";
import { PERIODS } from "@/lib/catalog";
import { dayMonth, dec, mmss, num } from "@/lib/format";

export const metadata = { title: "Progression · MuscleMap" };

/** Ce qu'on trace : la clé dans la série, et le record personnel correspondant. */
const METRICS = [
  { label: "Charge max", key: "max", record: "weight" },
  { label: "1RM estimé", key: "e1rm", record: "e1rm" },
  { label: "Volume", key: "volume", record: "volume" },
] as const;

export default async function ProgressionPage({
  searchParams,
}: {
  searchParams: Promise<{ exo?: string; periode?: string; metrique?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const metric = METRICS.find((m) => m.label === query.metrique) ?? METRICS[0];

  const exercises = await trainedExercises(user.id);
  const current = exercises.find((e) => e.slug === query.exo) ?? exercises[0] ?? null;

  const periodLabel = PERIODS.some((p) => p.label === query.periode) ? query.periode! : PERIODS[1].label;
  const months = PERIODS.find((p) => p.label === periodLabel)!.months;

  const [series, records, distribution, history, goal] = await Promise.all([
    current ? progressionSeries(user.id, current.id, months) : Promise.resolve([]),
    current ? listRecords(user.id, current.id) : Promise.resolve({} as Awaited<ReturnType<typeof listRecords>>),
    muscleDistribution(user.id, months),
    listHistory(user.id, 8),
    weeklyGoalFor(user.id, user.sessionsPerWeek),
  ]);

  const values = series.map((p) => ({ date: p.date, value: p[metric.key] }));
  const first = values[0]?.value ?? 0;
  const last = values.at(-1)?.value ?? 0;
  const delta = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
  const isVolume = metric.key === "volume";
  const fmt = (v: number) => (isVolume ? num(v) : dec(Math.round(v * 10) / 10));

  const ranked = (Object.entries(distribution.volume) as [MuscleKey, number][]).sort((a, b) => b[1] - a[1]);
  const highlights: Highlight[] = ranked
    .map(([muscle, v]) => ({ muscle, opacity: Math.max(0.13, Math.min(1, v / distribution.max)) }))
    .reverse();
  const lagging = ranked.at(-1);

  return (
    <div className="scroll">
      <div style={{ padding: "8px 20px 14px" }}>
        <span className="eyebrow" style={{ letterSpacing: "1.8px" }}>PROGRESSION</span>
        <h1 style={{ margin: "5px 0 0", font: "700 26px var(--sans)", letterSpacing: "-.8px" }}>{metric.label}</h1>
      </div>

      <WeeklyGoal {...goal} />

      <div style={{ padding: "0 20px 16px", display: "flex", gap: 9 }}>
        {[
          { href: "/calendrier", label: "Calendrier" },
          { href: "/corps", label: "Suivi corporel" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="tap"
            style={{ flex: 1, minHeight: 48, borderRadius: 14, background: "var(--surf)", border: "1px solid var(--hair)", color: "var(--txt)", font: "600 13px var(--sans)", display: "grid", placeItems: "center" }}
          >
            {l.label}
          </Link>
        ))}
      </div>

      {current ? (
        <>
          <Suspense fallback={<div style={{ height: 52, margin: "0 20px 12px" }} />}>
            <ExercisePicker exercises={exercises.map((e) => ({ slug: e.slug, name: e.name }))} current={current.slug} />
          </Suspense>

          <FilterChips
            values={METRICS.map((m) => m.label)}
            active={metric.label}
            param="metrique"
            base="/progression"
            params={{ exo: current.slug, periode: query.periode, metrique: metric.label }}
            style="dashed"
          />
          <FilterChips
            values={PERIODS.map((p) => p.label)}
            active={periodLabel}
            param="periode"
            base="/progression"
            params={{ exo: current.slug, periode: periodLabel, metrique: query.metrique }}
            style="solid"
          />

          <section style={{ margin: "0 20px 16px", padding: "16px 14px 12px", borderRadius: 22, background: "var(--surf)", border: "1px solid var(--hair)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, padding: "0 4px 10px", flexWrap: "wrap" }}>
              <span style={{ font: "700 32px var(--sans)", letterSpacing: "-1.2px" }}>
                {fmt(last)}<span style={{ fontSize: 15, color: "var(--mut)" }}> {user.unit}</span>
              </span>
              {series.length > 1 && (
                <span style={{ font: "600 12px var(--mono)", color: delta >= 0 ? "var(--acc)" : "var(--mut)" }}>
                  {delta >= 0 ? "+" : ""}{delta} % / {periodLabel}
                </span>
              )}
            </div>
            <ProgressChart
              points={values}
              label={`Évolution : ${metric.label.toLowerCase()}`}
              record={records[metric.record]}
              format={fmt}
            />
          </section>

          <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <span className="eyebrow">RECORDS PERSONNELS</span>
            <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
              {[
                { label: "CHARGE MAX", value: records.weight ? `${dec(records.weight)} ${user.unit}` : "—" },
                { label: "1RM ESTIMÉ", value: records.e1rm ? `${dec(Math.round(records.e1rm))} ${user.unit}` : "—" },
                { label: "VOLUME MAX", value: records.volume ? `${num(records.volume)} ${user.unit}` : "—" },
                { label: "REPS MAX", value: records.reps ? String(Math.round(records.reps)) : "—" },
              ].map((r) => (
                <div key={r.label} style={{ flex: "none", width: 136, padding: 14, borderRadius: 18, background: "var(--surf)", border: "1px solid var(--hair)" }}>
                  <span style={{ font: "500 10px var(--mono)", color: "var(--mut)" }}>{r.label}</span>
                  <div style={{ font: "700 24px var(--sans)", letterSpacing: "-.8px", marginTop: 5 }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p style={{ padding: "40px 30px", textAlign: "center", font: "400 13px/1.6 var(--sans)", color: "var(--mut)" }}>
          Aucune séance terminée pour l&apos;instant.<br />
          <Link href="/">Choisis un muscle</Link> et lance ta première séance.
        </p>
      )}

      {ranked.length > 0 && (
        <section style={{ margin: "0 20px 16px", padding: 16, borderRadius: 22, background: "var(--surf)", border: "1px solid var(--hair)", display: "flex", gap: 16, alignItems: "center" }}>
          <BodySilhouette highlights={highlights} style={{ height: 166, flex: "none" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <span className="eyebrow" style={{ letterSpacing: "1.4px" }}>RÉPARTITION · {periodLabel}</span>
            <span style={{ font: "400 12px/1.5 var(--sans)", color: "var(--dim)" }}>
              {MUSCLES[ranked[0][0]]} domine ton volume.{" "}
              {lagging && lagging[0] !== ranked[0][0] && (
                <span style={{ color: "var(--txt)" }}>{MUSCLES[lagging[0]]} en retard</span>
              )}{" "}
              — pense à équilibrer.
            </span>
            {lagging && (
              <Link
                href={`/muscle/${lagging[0]}`}
                style={{
                  alignSelf: "flex-start", minHeight: 40, padding: "0 13px", borderRadius: 12,
                  background: "rgba(255,91,30,.12)", border: "1px solid rgba(255,91,30,.3)",
                  color: "var(--acc)", font: "600 12px var(--sans)", display: "grid", placeItems: "center",
                }}
              >
                Cibler {MUSCLES[lagging[0]].toLowerCase()}
              </Link>
            )}
          </div>
        </section>
      )}

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 9 }}>
        <span className="eyebrow">HISTORIQUE</span>
        {history.length === 0 && (
          <p style={{ font: "400 13px var(--sans)", color: "var(--mut)" }}>Aucune séance enregistrée.</p>
        )}
        {history.map((w) => {
          const { d, m } = dayMonth(w.startedAt);
          const sets = w.entries.reduce((a, e) => a + e.sets.filter((s) => s.done && s.kind === "work").length, 0);
          return (
            <Link
              key={w.id}
              href={`/seance/${w.id}/resume`}
              style={{ display: "flex", alignItems: "center", gap: 13, padding: "13px 14px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)", color: "inherit" }}
            >
              <div style={{ width: 42, height: 42, flex: "none", borderRadius: 13, background: "var(--surf2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ font: "700 15px var(--sans)", lineHeight: 1 }}>{d}</span>
                <span style={{ font: "500 8px var(--mono)", color: "var(--mut)" }}>{m}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>{w.name}</span>
                <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>
                  {mmss(w.durationSec)} · {w.entries.length} EXOS · {sets} SÉRIES
                </span>
              </div>
              <span style={{ font: "600 13px var(--mono)", color: "var(--acc)" }}>{num(w.volumeKg)} {user.unit}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
