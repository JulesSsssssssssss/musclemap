"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InteractiveBody } from "@/components/body/InteractiveBody";
import { IconClipboard } from "@/components/Icons";
import { BACK_MUSCLES, FRONT_MUSCLES, MUSCLES, type MuscleKey } from "@/lib/body";

type Volume = Record<7 | 30, Partial<Record<MuscleKey, number>>>;

/** Séries par semaine au-delà desquelles un muscle est « pleinement » travaillé. */
const WEEKLY_TARGET = 10;

function Segmented<T extends string | number>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" aria-label={label} style={{ flex: 1, display: "flex", background: "var(--surf)", border: "1px solid var(--hair)", borderRadius: 14, padding: 4 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, minHeight: 40, border: 0, borderRadius: 11, cursor: "pointer", font: "600 13px var(--sans)",
              background: on ? "var(--acc)" : "transparent", color: on ? "var(--ink)" : "var(--mut)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function HomeScreen({
  counts,
  badge,
  volume,
}: {
  counts: Record<string, number>;
  badge: number;
  volume: Volume;
}) {
  const router = useRouter();
  const [face, setFace] = useState(true);
  const [muscle, setMuscle] = useState<MuscleKey | null>(null);
  const [volumeMode, setVolumeMode] = useState(false);
  const [days, setDays] = useState<7 | 30>(7);

  const sets = volume[days];
  const target = days === 7 ? WEEKLY_TARGET : WEEKLY_TARGET * 4;
  const heat = volumeMode
    ? Object.fromEntries(Object.entries(sets).map(([k, n]) => [k, (n ?? 0) / target]))
    : undefined;
  const totalSets = Object.values(sets).reduce((a, n) => a + (n ?? 0), 0);
  const neglected = (Object.keys(MUSCLES) as MuscleKey[]).filter((m) => !sets[m]);

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

      <div style={{ margin: "0 20px 10px", display: "flex", gap: 10 }}>
        <Segmented
          label="Mode de la carte"
          value={volumeMode ? "volume" : "explore"}
          options={[{ value: "explore", label: "Explorer" }, { value: "volume", label: "Volume" }]}
          onChange={(v) => setVolumeMode(v === "volume")}
        />
        {volumeMode && (
          <Segmented
            label="Période"
            value={days}
            options={[{ value: 7, label: "7 j" }, { value: 30, label: "30 j" }]}
            onChange={setDays}
          />
        )}
      </div>

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

        <InteractiveBody face={face} selected={muscle} onSelect={(m) => setMuscle(m)} heat={heat} />
      </div>

      <div style={{ padding: "14px 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {volumeMode && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, font: "500 10px var(--mono)", color: "var(--mut)" }}>
              <span>0</span>
              <span aria-hidden="true" style={{ flex: 1, height: 8, borderRadius: 4, background: "linear-gradient(to right, rgb(106,99,91), rgb(255,91,30))" }} />
              <span>{target}+ SÉRIES / {days} J</span>
            </div>
            {totalSets === 0 ? (
              <span style={{ font: "400 13px var(--sans)", color: "var(--faint)" }}>
                Aucune série validée sur cette période. Termine une séance pour voir la carte se colorer.
              </span>
            ) : (
              neglected.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                  <span className="eyebrow" style={{ letterSpacing: "1.2px" }}>À TRAVAILLER</span>
                  {neglected.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMuscle(m);
                        if (FRONT_MUSCLES.includes(m) !== face) setFace(FRONT_MUSCLES.includes(m));
                      }}
                      style={{ minHeight: 32, padding: "0 10px", borderRadius: 999, background: "var(--surf)", border: "1px solid var(--hair2)", color: "var(--dim)", font: "500 12px var(--sans)", cursor: "pointer" }}
                    >
                      {MUSCLES[m]}
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {muscle ? (
          <button className="primary tap" onClick={() => router.push(`/muscle/${muscle}`)}>
            <span>Voir {MUSCLES[muscle].toLowerCase()}</span>
            <span style={{ font: "600 13px var(--mono)", opacity: 0.6 }}>
              {volumeMode ? `${sets[muscle] ?? 0} séries · ${days} j` : `${count} exos`}
            </span>
          </button>
        ) : (
          !volumeMode && (
            <div style={{ textAlign: "center", font: "400 13px var(--sans)", color: "var(--faint)", padding: "14px 0" }}>
              Touche un muscle pour voir les exercices
            </div>
          )
        )}
      </div>
    </div>
  );
}
