"use client";

import {
  BACK_SHAPES, DETAIL_BACK, DETAIL_FRONT, FRONT_SHAPES, SILHOUETTE, VIEWBOX,
  type MuscleKey,
} from "@/lib/body";
import { Shapes } from "./Shapes";
import { MUSCLES } from "@/lib/body";

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
  const shapes = face ? FRONT_SHAPES : BACK_SHAPES;
  const detail = face ? DETAIL_FRONT : DETAIL_BACK;

  return (
    <svg viewBox={VIEWBOX} style={{ width: "100%", height: "100%", display: "block" }} role="group" aria-label="Carte musculaire">
      <g fill="#45403A" stroke="#FFFFFF" strokeOpacity=".22" strokeWidth="1">
        <Shapes shapes={SILHOUETTE} />
      </g>

      {(Object.keys(shapes) as MuscleKey[]).map((key) => {
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
              filter: on ? "drop-shadow(0 0 9px rgba(255,91,30,.55))" : "none",
            }}
            fill={on ? "#FF5B1E" : "#FFFFFF"}
            fillOpacity={on ? 1 : 0.14}
            stroke="#FFFFFF"
            strokeOpacity={on ? 0.75 : 0.3}
            strokeWidth="0.9"
          >
            <Shapes shapes={shapes[key]!} />
          </g>
        );
      })}

      <g fill="none" stroke="#000000" strokeOpacity=".38" strokeWidth="1.1" strokeLinecap="round" style={{ pointerEvents: "none" }}>
        {detail.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
