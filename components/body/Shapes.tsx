import type { Shape } from "@/lib/body";

/** Rend une liste de formes SVG (path / rect / ellipse). */
export function Shapes({ shapes }: { shapes: Shape[] }) {
  return (
    <>
      {shapes.map((s, i) => {
        if (s.t === "p") return <path key={i} d={s.d} />;
        if (s.t === "r") return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} />;
        return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} />;
      })}
    </>
  );
}
