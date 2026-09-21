"use client";

import { MUSCLES, bodyFor, viewBoxFor, type MuscleKey } from "@/lib/body";

const COLD = [106, 99, 91];
const HOT = [255, 91, 30];

/** Gris neutre → orange vif selon l'intensité (0 à 1). */
const heatColor = (t: number) => `rgb(${COLD.map((c, i) => Math.round(c + (HOT[i] - c) * t)).join(",")})`;

/**
 * Carte du corps cliquable — cœur de l'écran d'accueil.
 * Avec `heat` (intensité de 0 à 1 par muscle), elle devient une carte de volume :
 * un muscle absent ou à 0 reste gris.
 */
export function InteractiveBody({
  face,
  selected,
  onSelect,
  heat,
}: {
  face: boolean;
  selected: MuscleKey | null;
  onSelect: (m: MuscleKey) => void;
  heat?: Partial<Record<MuscleKey, number>>;
}) {
  const body = bodyFor(face);
  const muscles = Object.entries(body.muscles) as [MuscleKey, string[]][];

  return (
    <svg viewBox={viewBoxFor(face)} style={{ width: "100%", height: "100%", display: "block" }} role="group" aria-label="Carte musculaire">
      <path d={body.outline} fill="#2F2B27" />
      <g fill="#46413B" stroke="#151412" strokeWidth="1.2">
        {body.base.map((d, i) => <path key={i} d={d} />)}
      </g>

      {muscles.map(([key, ds]) => {
        const on = key === selected;
        const level = heat?.[key] ?? 0;
        const fill = heat ? (level > 0 ? heatColor(0.2 + 0.8 * Math.min(1, level)) : "#6A635B") : on ? "#FF5B1E" : "#6A635B";
        return (
          <g
            key={key}
            role="button"
            tabIndex={0}
            aria-label={MUSCLES[key]}
            aria-pressed={on}
            onClick={() => onSelect(key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(key);
              }
            }}
            style={{
              cursor: "pointer",
              transition: "fill .2s ease, filter .2s ease",
              filter: on ? "drop-shadow(0 0 14px rgba(255,91,30,.6))" : "none",
            }}
            fill={fill}
            stroke={on ? (heat ? "#FFFFFF" : "#FF8A5C") : "#151412"}
            strokeWidth={on && heat ? 2.4 : 1.2}
          >
            {ds.map((d, i) => <path key={i} d={d} />)}
          </g>
        );
      })}
    </svg>
  );
}
