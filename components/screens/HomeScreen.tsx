"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InteractiveBody } from "@/components/body/InteractiveBody";
import { IconClipboard } from "@/components/Icons";
import { BACK_MUSCLES, FRONT_MUSCLES, MUSCLES, type MuscleKey } from "@/lib/body";

export function HomeScreen({
  counts,
  badge,
}: {
  counts: Record<string, number>;
  badge: number;
}) {
  const router = useRouter();
  const [face, setFace] = useState(true);
  const [muscle, setMuscle] = useState<MuscleKey | null>(null);

  const switchView = (next: boolean) => {
    const available = next ? FRONT_MUSCLES : BACK_MUSCLES;
    setFace(next);
    setMuscle((m) => (m && available.includes(m) ? m : null));
  };

  const count = muscle ? counts[muscle] ?? 0 : 0;

  return (
    <div className="scroll" style={{ display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px 14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="eyebrow" style={{ letterSpacing: 2 }}>MUSCLEMAP</span>
          <h1 style={{ margin: 0, font: "700 25px var(--sans)", letterSpacing: "-.6px" }}>
            Où on tape<br />aujourd&apos;hui&nbsp;?
          </h1>
        </div>
        <Link
          href="/seance"
          aria-label={`Séance en cours — ${badge} exercice${badge > 1 ? "s" : ""}`}
          style={{
            position: "relative", background: "var(--surf2)", border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 16, width: 48, height: 48, display: "grid", placeItems: "center", color: "var(--txt)",
          }}
        >
          <IconClipboard />
          <span
            style={{
              position: "absolute", top: -7, right: -7, minWidth: 22, height: 22, borderRadius: 11,
              background: "var(--acc)", color: "var(--ink)", font: "700 12px var(--sans)",
              display: "grid", placeItems: "center", padding: "0 6px",
            }}
          >
            {badge}
          </span>
        </Link>
      </header>

      <div
        role="tablist"
        aria-label="Vue du corps"
        style={{ margin: "0 20px 14px", display: "flex", background: "var(--surf)", border: "1px solid var(--hair)", borderRadius: 14, padding: 4 }}
      >
        {[
          { label: "Face", on: face, action: () => switchView(true) },
          { label: "Dos", on: !face, action: () => switchView(false) },
        ].map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={t.on}
            onClick={t.action}
            style={{
              flex: 1, minHeight: 44, border: 0, borderRadius: 11, cursor: "pointer",
              font: "600 14px var(--sans)",
              background: t.on ? "var(--acc)" : "transparent",
              color: t.on ? "var(--ink)" : "var(--mut)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          margin: "0 20px", flex: 1, minHeight: 320, position: "relative", borderRadius: 26,
          border: "1px solid var(--hair)",
          background: "radial-gradient(120% 75% at 50% 15%,#1C1308 0%,#100F0D 62%)",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 14, left: 16, font: "500 9px var(--mono)", letterSpacing: "1.6px", color: "var(--ghost)" }}>
          {face ? "VUE ANTÉRIEURE" : "VUE POSTÉRIEURE"}
        </div>
        <div
          style={{
            position: "absolute", top: 12, right: 14, display: "flex", alignItems: "center", gap: 7,
            padding: "7px 12px", borderRadius: 999, background: "rgba(255,91,30,.12)",
            border: "1px solid rgba(255,91,30,.3)", opacity: muscle ? 1 : 0,
            transition: "opacity .2s ease", pointerEvents: "none",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--acc)" }} />
          <span style={{ font: "600 12px var(--sans)", color: "var(--acc)" }}>{muscle ? MUSCLES[muscle] : ""}</span>
        </div>

        <InteractiveBody face={face} selected={muscle} onSelect={(m) => setMuscle(m)} />
      </div>

      <div style={{ padding: "14px 20px 16px" }}>
        {muscle ? (
          <button className="primary tap" onClick={() => router.push(`/muscle/${muscle}`)}>
            <span>Voir {MUSCLES[muscle].toLowerCase()}</span>
            <span style={{ font: "600 13px var(--mono)", opacity: 0.6 }}>{count} exos</span>
          </button>
        ) : (
          <div style={{ textAlign: "center", font: "400 13px var(--sans)", color: "var(--faint)", padding: "14px 0" }}>
            Touche un muscle pour voir les exercices
          </div>
        )}
      </div>
    </div>
  );
}
