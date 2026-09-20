import Link from "next/link";

export function FilterChips({
  values,
  active,
  param,
  base,
  params,
  style = "solid",
}: {
  values: string[];
  active: string;
  param: string;
  base: string;
  params: Record<string, string | undefined>;
  style?: "solid" | "dashed";
}) {
  const href = (value: string, index: number) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== param) next.set(k, v);
    if (index > 0) next.set(param, value);
    const qs = next.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="chiprow" style={{ padding: style === "solid" ? "0 20px 10px" : "0 20px 14px" }}>
      {values.map((value, i) => {
        const on = value === active;
        if (style === "solid") {
          return (
            <Link
              key={value}
              href={href(value, i)}
              scroll={false}
              style={{
                flex: "none", minHeight: 44, padding: "0 16px", borderRadius: 999, whiteSpace: "nowrap",
                font: "600 13px var(--sans)", display: "grid", placeItems: "center",
                background: on ? "var(--acc)" : "var(--surf2)",
                color: on ? "var(--ink)" : "var(--dim)",
                border: `1px solid ${on ? "var(--acc)" : "rgba(255,255,255,.08)"}`,
              }}
            >
              {value}
            </Link>
          );
        }
        return (
          <Link
            key={value}
            href={href(value, i)}
            scroll={false}
            style={{
              flex: "none", minHeight: 38, padding: "0 14px", borderRadius: 999, whiteSpace: "nowrap",
              font: "500 12px var(--mono)", letterSpacing: ".4px", display: "grid", placeItems: "center",
              background: on ? "rgba(255,91,30,.12)" : "transparent",
              color: on ? "var(--acc)" : "var(--faint)",
              border: `1px dashed ${on ? "rgba(255,91,30,.45)" : "rgba(255,255,255,.12)"}`,
            }}
          >
            {value}
          </Link>
        );
      })}
    </div>
  );
}
