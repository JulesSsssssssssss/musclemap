import { monthLabel } from "@/lib/format";

export type Point = { date: Date; value: number };

/**
 * Courbe d'évolution — même langage visuel que la maquette.
 * Les points qui battent tout ce qui précède sont marqués (record), et une ligne
 * pointillée matérialise le record personnel enregistré (`record`).
 */
export function ProgressChart({
  points,
  label,
  record,
  format = (v) => String(Math.round(v)),
}: {
  points: Point[];
  label: string;
  record?: number;
  format?: (v: number) => string;
}) {
  const W = 320;
  const H = 150;
  const PAD = 8;
  const FLOOR = 128;

  if (points.length < 2) {
    return (
      <div style={{ height: H, display: "grid", placeItems: "center", font: "400 13px/1.5 var(--sans)", color: "var(--mut)", textAlign: "center" }}>
        Pas encore assez de données<br />pour tracer une courbe.
      </div>
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values, record ?? -Infinity);
  const span = max - min || 1;

  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (points.length - 1);
  const y = (v: number) => 26 + (1 - (v - min) / span) * (FLOOR - 26 - 16);

  const coords = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`);
  const area = `M${coords[0]} L${coords.slice(1).join(" L")} L${x(points.length - 1).toFixed(1)},${FLOOR} L${x(0).toFixed(1)},${FLOOR} Z`;

  // Un point est un record s'il dépasse strictement toutes les valeurs précédentes.
  let best = points[0].value;
  const prs = points.flatMap((p, i) => {
    if (i > 0 && p.value > best) {
      best = p.value;
      return [i];
    }
    return [];
  });

  const lastIndex = points.length - 1;
  const ticks = [0, Math.floor(lastIndex / 2), lastIndex].map((i) => monthLabel(points[i].date));

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} role="img" aria-label={label}>
        <defs>
          <linearGradient id="mmg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF5B1E" stopOpacity=".34" />
            <stop offset="1" stopColor="#FF5B1E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="#FFFFFF" strokeOpacity=".06" strokeWidth="1">
          {[30, 66, 102, FLOOR].map((gy) => (
            <line key={gy} x1="0" y1={gy} x2={W} y2={gy} />
          ))}
        </g>
        <path d={area} fill="url(#mmg)" />
        {record !== undefined && (
          <g>
            <line x1="0" y1={y(record)} x2={W} y2={y(record)} stroke="#FFC9B0" strokeOpacity=".55" strokeWidth="1.2" strokeDasharray="4 4" />
            <text x={W - 4} y={y(record) - 5} textAnchor="end" fontSize="9" fill="#FFC9B0" fillOpacity=".8" fontFamily="var(--mono)">
              RECORD {format(record)}
            </text>
          </g>
        )}
        <polyline points={coords.join(" ")} fill="none" stroke="#FF5B1E" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="2.6" fill="#FF5B1E" />
        ))}
        {prs.map((i) => (
          <circle key={`pr${i}`} cx={x(i)} cy={y(points[i].value)} r="5" fill="#151413" stroke="#FFE2D3" strokeWidth="2" />
        ))}
        <circle cx={x(lastIndex)} cy={y(points[lastIndex].value)} r="5.5" fill="#FF5B1E" />
        <circle cx={x(lastIndex)} cy={y(points[lastIndex].value)} r="11" fill="none" stroke="#FF5B1E" strokeOpacity=".28" strokeWidth="2" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px 0" }}>
        {ticks.map((t, i) => (
          <span key={`${t}-${i}`} style={{ font: "500 9px var(--mono)", color: "var(--ghost)" }}>{t}</span>
        ))}
      </div>
      {prs.length > 0 && (
        <div style={{ padding: "8px 4px 0", font: "500 10px var(--mono)", color: "var(--mut)", display: "flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 5, border: "2px solid #FFE2D3", background: "#151413" }} />
          {prs.length} NOUVEAU{prs.length > 1 ? "X" : ""} RECORD{prs.length > 1 ? "S" : ""} SUR LA PÉRIODE
        </div>
      )}
    </>
  );
}
