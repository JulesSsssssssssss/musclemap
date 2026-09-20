"use client";

import { useState } from "react";
import { GUIDE_KEYS, GUIDE_TABS, type Guide } from "@/lib/catalog";

export function GuideTabs({ guide }: { guide: Guide }) {
  const [tab, setTab] = useState(0);
  const items = guide[GUIDE_KEYS[tab]] ?? [];
  const isMistakes = tab === 2;

  return (
    <>
      <div className="chiprow" role="tablist" aria-label="Guide de l'exercice" style={{ gap: 6, padding: "0 20px 16px" }}>
        {GUIDE_TABS.map((label, i) => {
          const on = i === tab;
          const empty = (guide[GUIDE_KEYS[i]] ?? []).length === 0;
          return (
            <button
              key={label}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(i)}
              style={{
                flex: "none", minHeight: 40, padding: "0 14px", borderRadius: 12, cursor: "pointer",
                whiteSpace: "nowrap", font: "600 13px var(--sans)",
                background: on ? "#F3F1EC" : "var(--surf)",
                color: on ? "var(--ink)" : empty ? "var(--ghost)" : "var(--dim)",
                border: `1px solid ${on ? "#F3F1EC" : "rgba(255,255,255,.08)"}`,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.length === 0 ? (
          <p style={{ textAlign: "center", padding: "24px 10px", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            Pas encore de contenu sur cet onglet pour cet exercice.
          </p>
        ) : (
          items.map((item, i) => (
            <div key={item.title} style={{ display: "flex", gap: 13, padding: 14, borderRadius: 18, background: "var(--surf)", border: "1px solid var(--hair)" }}>
              <span
                style={{
                  width: 28, height: 28, flex: "none", borderRadius: 9,
                  background: isMistakes ? "rgba(255,255,255,.1)" : "rgba(255,91,30,.14)",
                  color: isMistakes ? "var(--txt)" : "var(--acc)",
                  font: "700 13px var(--sans)", display: "grid", placeItems: "center",
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ font: "600 14px var(--sans)" }}>{item.title}</span>
                <span style={{ font: "400 13px/1.45 var(--sans)", color: "var(--dim)" }}>{item.body}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
