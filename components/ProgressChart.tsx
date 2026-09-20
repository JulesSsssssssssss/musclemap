import { monthLabel } from "@/lib/format";

export type Point = { date: Date; max: number };

/** Courbe de charge max — même langage visuel que la maquette. */
export function ProgressChart({ points }: { points: Point[] }) {
  const W = 320;
  const H = 150;
  const PAD = 8;
  const FLOOR = 128;

  if (points.length < 2) {
    return (
      <div style={{ height: H, display: "grid", placeItems: "center", font: "400 13px/1.5 var(--sans)", color: "var(--mut)", textAlign: "center" }}>
        Pas encore assez de séances<br />sur cet exercice pour tracer une courbe.
      </div>
    );
  }

  const values = points.map((p) => p.max);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (i: number) => PAD + (i * (W - PAD * 2)) / (points.length - 1);
  const y = (v: number) => 26 + (1 - (v - min) / span) * (FLOOR - 26 - 16);

  const coords = points.map((p, i) => `${x(i).toFixed(1)},${y(p.max).toFixed(1)}`);
  const area = `M${coords[0]} L${coords.slice(1).join(" L")} L${x(points.length - 1).toFixed(1)},${FLOOR} L${x(0).toFixed(1)},${FLOOR} Z`;

  const last = points[points.length - 1];
  const lastX = x(points.length - 1);
  const lastY = y(last.max);

  // Trois repères temporels répartis sur la période.
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1].map((i) => monthLabel(points[i].date));

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }} role="img" aria-label="Évolution de la charge maximale">
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
        <polyline points={coords.join(" ")} fill="none" stroke="#FF5B1E" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r="5.5" fill="#FF5B1E" />
        <circle cx={lastX} cy={lastY} r="11" fill="none" stroke="#FF5B1E" strokeOpacity=".28" strokeWidth="2" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px 0" }}>
        {ticks.map((t, i) => (
          <span key={`${t}-${i}`} style={{ font: "500 9px var(--mono)", color: "var(--ghost)" }}>{t}</span>
        ))}
      </div>
    </>
  );
}
