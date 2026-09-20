import { DETAIL_BACK, DETAIL_FRONT, SILHOUETTE, VIEWBOX, shapesFor, type MuscleKey } from "@/lib/body";
import { Shapes } from "./Shapes";

export type Highlight = { muscle: MuscleKey; opacity: number };

/**
 * Silhouette statique avec des muscles surlignés — utilisée sur la fiche
 * exercice, le résumé de séance et la répartition de progression.
 */
export function BodySilhouette({
  face = true,
  highlights = [],
  style,
  className,
}: {
  face?: boolean;
  highlights?: Highlight[];
  style?: React.CSSProperties;
  className?: string;
}) {
  const detail = face ? DETAIL_FRONT : DETAIL_BACK;
  return (
    <svg viewBox={VIEWBOX} style={style} className={className} aria-hidden="true">
      <g fill="#45403A" stroke="#FFFFFF" strokeOpacity=".22" strokeWidth="1">
        <Shapes shapes={SILHOUETTE} />
      </g>
      {highlights.map((h) => (
        <g key={`${h.muscle}-${h.opacity}`} fill="#FF5B1E" fillOpacity={h.opacity}>
          <Shapes shapes={shapesFor(h.muscle, face)} />
        </g>
      ))}
      <g fill="none" stroke="#000000" strokeOpacity=".38" strokeWidth="1.1" strokeLinecap="round" style={{ pointerEvents: "none" }}>
        {detail.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}
