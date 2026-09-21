"use client";

import { useState, useTransition } from "react";
import { createGeneratedWorkout, previewWorkout } from "@/app/actions";
import { MUSCLES, type MuscleKey } from "@/lib/body";

type Item = Awaited<ReturnType<typeof previewWorkout>>["items"][number];

const DURATIONS = [30, 45, 60, 90];

const chip = (on: boolean): React.CSSProperties => ({
  flex: "none", minHeight: 44, padding: "0 15px", borderRadius: 999, whiteSpace: "nowrap", cursor: "pointer",
  font: "600 13px var(--sans)",
  background: on ? "var(--acc)" : "var(--surf2)",
  color: on ? "var(--ink)" : "var(--dim)",
  border: `1px solid ${on ? "var(--acc)" : "rgba(255,255,255,.08)"}`,
});

/** Choix des muscles et de la durée, aperçu de la séance proposée, puis création. */
export function GeneratorScreen() {
  const [muscles, setMuscles] = useState<MuscleKey[]>([]);
  const [minutes, setMinutes] = useState(45);
  const [items, setItems] = useState<Item[] | null>(null);
  const [auto, setAuto] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (m: MuscleKey) =>
    setMuscles((cur) => (cur.includes(m) ? cur.filter((x) => x !== m) : cur.length < 5 ? [...cur, m] : cur));

  const propose = () =>
    start(async () => {
      setError(null);
      const result = await previewWorkout({ muscles, minutes, seed: Math.floor(Math.random() * 1e9) + 1 });
      setItems(result.items);
      setAuto(result.auto);
      if (result.items.length === 0) setError("Aucun exercice trouvé pour ces muscles.");
    });

  const create = () =>
    start(async () => {
      if (!items?.length) return;
      const name = auto ? "Séance générée" : `Séance ${[...new Set(items.map((i) => i.muscleLabel))].slice(0, 2).join(" + ")}`;
      // En cas de succès le serveur redirige vers la séance ; on n'atteint la suite qu'en cas d'erreur.
      const result = await createGeneratedWorkout({ slugs: items.map((i) => i.slug), name });
      if (result?.error) setError(result.error);
    });

  return (
    <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="eyebrow">MUSCLES</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => setMuscles([])} aria-pressed={muscles.length === 0} style={chip(muscles.length === 0)}>
            Auto · les plus en retard
          </button>
          {(Object.entries(MUSCLES) as [MuscleKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => toggle(key)} aria-pressed={muscles.includes(key)} style={chip(muscles.includes(key))}>
              {label}
            </button>
          ))}
        </div>
        <span style={{ font: "400 12px/1.4 var(--sans)", color: "var(--faint)" }}>
          {muscles.length === 0
            ? "L'app choisit les grands groupes que tu as le moins travaillés ces 7 et 30 derniers jours."
            : "Jusqu'à 5 muscles."}
        </span>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="eyebrow">DURÉE</span>
        <div style={{ display: "flex", gap: 8 }}>
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => setMinutes(d)} aria-pressed={minutes === d} style={{ ...chip(minutes === d), flex: 1 }}>
              {d} min
            </button>
          ))}
        </div>
      </section>

      <button className="primary" onClick={propose} disabled={pending}>
        {pending && !items ? "Recherche…" : items ? "Autre proposition" : "Proposer une séance"}
      </button>

      {error && <p role="alert" style={{ margin: 0, font: "500 13px var(--sans)", color: "#FF8A6B" }}>{error}</p>}

      {items && items.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 9, opacity: pending ? 0.6 : 1 }}>
          <span className="eyebrow">{items.length} EXERCICES PROPOSÉS</span>
          {items.map((item) => (
            <div key={item.slug} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 14px var(--sans)" }}>{item.name}</span>
                <span style={{ font: "500 10px var(--mono)", color: "var(--mut)" }}>
                  {item.equipment} · {item.muscleLabel.toUpperCase()} · {item.scheme}
                </span>
                <span style={{ font: "500 10px var(--mono)", color: "var(--acc)" }}>{item.reason.toUpperCase()}</span>
              </div>
              <button
                onClick={() => setItems((cur) => cur?.filter((i) => i.slug !== item.slug) ?? null)}
                aria-label={`Retirer ${item.name}`}
                style={{ width: 44, height: 44, flex: "none", borderRadius: 13, background: "var(--surf2)", border: "1px solid var(--hair)", color: "var(--faint)", cursor: "pointer", font: "600 18px var(--sans)", padding: 0 }}
              >
                ×
              </button>
            </div>
          ))}
          <button className="primary" onClick={create} disabled={pending} style={{ marginTop: 6 }}>
            Créer la séance
          </button>
        </section>
      )}
    </div>
  );
}
