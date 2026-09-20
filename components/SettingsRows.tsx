"use client";

import { useTransition } from "react";
import { updateSettings } from "@/app/actions";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ font: "600 14px var(--sans)" }}>{label}</span>
      {children}
    </div>
  );
}

export function SettingsRows({ unit, restSeconds, theme }: { unit: string; restSeconds: number; theme: string }) {
  const [pending, start] = useTransition();

  const save = (patch: Record<string, string | number>) =>
    start(async () => {
      const data = new FormData();
      data.set("unit", String(patch.unit ?? unit));
      data.set("restSeconds", String(patch.restSeconds ?? restSeconds));
      data.set("theme", String(patch.theme ?? theme));
      await updateSettings(data);
    });

  const dark = theme !== "light";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, opacity: pending ? 0.7 : 1 }}>
      <Row label="Unité de poids">
        <div style={{ display: "flex", background: "var(--surf2)", borderRadius: 11, padding: 3 }}>
          {["kg", "lb"].map((u) => {
            const on = unit === u;
            return (
              <button
                key={u}
                onClick={() => !on && save({ unit: u })}
                aria-pressed={on}
                style={{
                  minWidth: 48, minHeight: 38, border: 0, borderRadius: 9, cursor: "pointer",
                  font: "600 12px var(--mono)",
                  background: on ? "var(--acc)" : "transparent",
                  color: on ? "var(--ink)" : "var(--mut)",
                }}
              >
                {u.toUpperCase()}
              </button>
            );
          })}
        </div>
      </Row>

      <Row label="Thème sombre">
        <button
          onClick={() => save({ theme: dark ? "light" : "dark" })}
          role="switch"
          aria-checked={dark}
          aria-label="Thème sombre"
          style={{
            width: 56, height: 32, borderRadius: 16, border: 0, cursor: "pointer", padding: 3,
            background: dark ? "var(--acc)" : "#2C2924",
            display: "flex", justifyContent: dark ? "flex-end" : "flex-start",
            transition: "background .2s ease",
          }}
        >
          <span style={{ width: 26, height: 26, borderRadius: 13, background: dark ? "var(--ink)" : "var(--faint)", display: "block" }} />
        </button>
      </Row>

      <Row label="Minuteur de repos">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => save({ restSeconds: Math.max(15, restSeconds - 15) })}
            aria-label="Diminuer"
            style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surf2)", border: "1px solid var(--hair)", color: "var(--dim)", cursor: "pointer", font: "600 15px var(--sans)" }}
          >
            −
          </button>
          <span style={{ font: "600 13px var(--mono)", color: "var(--acc)", minWidth: 44, textAlign: "center" }}>{restSeconds} s</span>
          <button
            onClick={() => save({ restSeconds: Math.min(600, restSeconds + 15) })}
            aria-label="Augmenter"
            style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surf2)", border: "1px solid var(--hair)", color: "var(--dim)", cursor: "pointer", font: "600 15px var(--sans)" }}
          >
            +
          </button>
        </div>
      </Row>
    </div>
  );
}
