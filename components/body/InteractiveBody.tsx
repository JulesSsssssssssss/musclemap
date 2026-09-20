"use client";

import { MUSCLES, bodyFor, viewBoxFor, type MuscleKey } from "@/lib/body";

/** Carte du corps cliquable — cœur de l'écran d'accueil. */
export function InteractiveBody({
  face,
  selected,
  onSelect,
}: {
  face: boolean;
  selected: MuscleKey | null;
  onSelect: (m: MuscleKey) => void;
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
            fill={on ? "#FF5B1E" : "#6A635B"}
            stroke={on ? "#FF8A5C" : "#151412"}
            strokeWidth="1.2"
          >
            {ds.map((d, i) => <path key={i} d={d} />)}
          </g>
        );
      })}
    </svg>
  );
}
