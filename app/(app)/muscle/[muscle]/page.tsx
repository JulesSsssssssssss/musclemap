import Link from "next/link";
import { notFound } from "next/navigation";
import { BodySilhouette } from "@/components/body/BodySilhouette";
import { ScreenHeader } from "@/components/ScreenHeader";
import { IconChevron } from "@/components/Icons";
import { FRONT_MUSCLES, MUSCLES, type MuscleKey } from "@/lib/body";
import { subsFor } from "@/lib/catalog";
import { requireUser } from "@/lib/auth";
import { exerciseCounts } from "@/lib/queries";

export default async function MusclePage({ params }: { params: Promise<{ muscle: string }> }) {
  await requireUser();
  const { muscle } = await params;
  if (!(muscle in MUSCLES)) notFound();

  const key = muscle as MuscleKey;
  const subs = subsFor(key);
  const { byMuscle, bySub } = await exerciseCounts();
  const total = byMuscle[key] ?? 0;
  const face = FRONT_MUSCLES.includes(key);

  return (
    <div className="scroll">
      <ScreenHeader back="/" eyebrow="GROUPE MUSCULAIRE" title={MUSCLES[key]} />

      <section
        style={{
          margin: "0 20px 18px", height: 172, borderRadius: 22, border: "1px solid var(--hair)",
          background: "radial-gradient(110% 80% at 70% 20%,#1C1308 0%,#100F0D 65%)",
          position: "relative", overflow: "hidden", display: "flex", alignItems: "center", padding: "0 22px",
        }}
      >
        <BodySilhouette
          face={face}
          highlights={[{ muscle: key, opacity: 1 }]}
          style={{ position: "absolute", right: -44, top: -74, height: 340, opacity: 0.95 }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6, maxWidth: 190 }}>
          <span style={{ font: "700 34px var(--sans)", letterSpacing: "-1px", color: "var(--acc)" }}>{total}</span>
          <span style={{ font: "400 13px/1.4 var(--sans)", color: "var(--dim)" }}>
            exercices répartis sur {subs.length} faisceaux. Choisis ta zone.
          </span>
        </div>
      </section>

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="eyebrow" style={{ marginBottom: 2 }}>SOUS-MUSCLES</span>
        {subs.map((s) => {
          const n = bySub[`${key}:${s.code}`] ?? 0;
          return (
            <Link
              key={s.code}
              href={`/muscle/${key}/${s.code}`}
              className="tap"
              style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                padding: 14, minHeight: 76, borderRadius: 20, background: "var(--surf)",
                border: "1px solid var(--hair)", color: "inherit",
              }}
            >
              <div style={{ width: 52, height: 52, flex: "none", borderRadius: 16, background: "var(--surf2)", display: "grid", placeItems: "center" }}>
                <span style={{ font: "600 11px var(--mono)", color: "var(--mut)" }}>{s.code}</span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ font: "600 16px var(--sans)", color: "var(--txt)" }}>{s.name}</span>
                <span style={{ font: "400 12px var(--sans)", color: "var(--mut)" }}>{s.hint}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ghost)" }}>
                <span style={{ font: "600 13px var(--mono)", color: "var(--acc)" }}>{n}</span>
                <IconChevron />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
