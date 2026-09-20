import type { Guide } from "@/lib/catalog";

const H2 = { margin: "0 0 12px", font: "700 17px var(--sans)", letterSpacing: "-.3px" } as const;

/** Fiche exercice : même structure pour tous — étapes numérotées, puis conseils. Une section absente n'est pas affichée. */
export function ExerciseGuide({ guide }: { guide: Guide }) {
  const steps = guide.steps ?? [];
  const tips = guide.tips ?? [];

  return (
    <>
      {steps.length > 0 && (
        <section style={{ padding: "0 20px 22px" }}>
          <h2 style={H2}>Comment faire</h2>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ display: "flex", gap: 13, padding: 14, borderRadius: 18, background: "var(--surf)", border: "1px solid var(--hair)" }}>
                <span style={{ width: 28, height: 28, flex: "none", borderRadius: 9, background: "rgba(255,91,30,.14)", color: "var(--acc)", font: "700 13px var(--sans)", display: "grid", placeItems: "center" }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, minWidth: 0, font: "400 14px/1.5 var(--sans)", color: "var(--dim)" }}>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {tips.length > 0 && (
        <section style={{ padding: "0 20px 22px" }}>
          <h2 style={H2}>Conseils</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, borderRadius: 18, background: "var(--surf)", border: "1px solid var(--hair)" }}>
            {tips.map((b, i) =>
              b.kind === "h" ? (
                <h3 key={i} style={{ margin: i === 0 ? 0 : "8px 0 0", font: "600 14px var(--sans)", color: "var(--txt)" }}>{b.text}</h3>
              ) : (
                <p key={i} style={{ margin: 0, font: "400 14px/1.55 var(--sans)", color: "var(--dim)" }}>{b.text}</p>
              ),
            )}
          </div>
        </section>
      )}
    </>
  );
}
