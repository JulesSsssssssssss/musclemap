import Link from "next/link";

/** Anneau de progression de la semaine + série de semaines consécutives. */
export function WeeklyGoal({
  done,
  target,
  streak,
  best,
}: {
  done: number;
  target: number;
  streak: number;
  best: number;
}) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const ratio = Math.min(1, done / Math.max(1, target));
  const met = done >= target;

  return (
    <section
      aria-label="Objectif de la semaine"
      style={{
        margin: "0 20px 16px", padding: 16, borderRadius: 22, display: "flex", alignItems: "center", gap: 16,
        background: met ? "linear-gradient(140deg,rgba(255,91,30,.14),rgba(255,91,30,.03))" : "var(--surf)",
        border: `1px solid ${met ? "rgba(255,91,30,.3)" : "var(--hair)"}`,
      }}
    >
      <div style={{ position: "relative", width: 76, height: 76, flex: "none" }}>
        <svg viewBox="0 0 76 76" width="76" height="76" role="img" aria-label={`${done} séance${done > 1 ? "s" : ""} sur ${target}`}>
          <circle cx="38" cy="38" r={R} fill="none" stroke="var(--surf3)" strokeWidth="7" />
          <circle
            cx="38" cy="38" r={R} fill="none" stroke="#FF5B1E" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${(C * ratio).toFixed(1)} ${C.toFixed(1)}`} transform="rotate(-90 38 38)"
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", font: "700 19px var(--sans)", letterSpacing: "-.5px" }}>
          {done}<span style={{ fontSize: 12, color: "var(--mut)" }}>/{target}</span>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <span className="eyebrow" style={{ letterSpacing: "1.4px" }}>CETTE SEMAINE</span>
        <span style={{ font: "700 17px var(--sans)", letterSpacing: "-.3px" }}>
          {met ? "Objectif atteint 💪" : `Encore ${target - done} séance${target - done > 1 ? "s" : ""}`}
        </span>
        <span style={{ font: "500 12px var(--mono)", color: streak > 0 ? "var(--acc)" : "var(--mut)" }}>
          {streak > 0 ? `🔥 ${streak} SEMAINE${streak > 1 ? "S" : ""} D'AFFILÉE` : "PAS ENCORE DE SÉRIE"}
          {best > streak && <span style={{ color: "var(--faint)" }}> · RECORD {best}</span>}
        </span>
        <Link href="/calendrier" style={{ font: "600 12px var(--sans)", alignSelf: "flex-start", minHeight: 24 }}>Voir le calendrier →</Link>
      </div>
    </section>
  );
}
