import { bodyFor, pathsFor, viewBoxFor, type MuscleKey } from "@/lib/body";

export type Highlight = { muscle: MuscleKey; opacity: number };

/** Silhouette anatomique avec muscles surlignés (fiche exercice, résumé de séance, progression). */
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
  const body = bodyFor(face);
  const muscles = Object.entries(body.muscles);
  return (
    <svg viewBox={viewBoxFor(face)} style={style} className={className} aria-hidden="true">
      <path d={body.outline} fill="#3A3631" />
      <g fill="#4A453F" stroke="#1A1815" strokeWidth="1.2">
        {body.base.map((d, i) => <path key={i} d={d} />)}
        {muscles.flatMap(([key, ds]) => ds.map((d, i) => <path key={`${key}${i}`} d={d} fill="#57514A" />))}
      </g>
      {highlights.map((h) => (
        <g key={`${h.muscle}-${h.opacity}`} fill="#FF5B1E" fillOpacity={h.opacity} stroke="#FF5B1E" strokeOpacity={h.opacity} strokeWidth="1.5">
          {pathsFor(h.muscle, face).map((d, i) => <path key={i} d={d} />)}
        </g>
      ))}
    </svg>
  );
}
