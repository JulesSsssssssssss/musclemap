"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addExerciseToWorkout, listEditableWorkouts, type AddResult, type EditableWorkout } from "@/app/actions";
import { IconCheck } from "./Icons";

/** Bouton « + » : ouvre le choix de la séance (existante ou nouvelle), puis confirme par un toast. */
export function AddToWorkout({
  slug,
  variant = "icon",
  label = "Ajouter à une séance",
}: {
  slug: string;
  variant?: "icon" | "primary";
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [workouts, setWorkouts] = useState<EditableWorkout[] | null>(null);
  const [newName, setNewName] = useState("");
  const [toast, setToast] = useState<AddResult | null>(null);

  const openPicker = () => {
    setOpen(true);
    setWorkouts(null);
    start(async () => setWorkouts(await listEditableWorkouts()));
  };

  const add = (target: { workoutId: string } | { newName: string }) =>
    start(async () => {
      const result = await addExerciseToWorkout(slug, target);
      setOpen(false);
      setNewName("");
      if (result) {
        setToast(result);
        setTimeout(() => setToast(null), 4000);
      }
    });

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={openPicker}
          aria-label="Ajouter à une séance"
          style={{
            width: 44, height: 44, flex: "none", alignSelf: "center", borderRadius: 14,
            border: "1px solid rgba(255,255,255,.1)", background: "var(--surf2)", color: "var(--acc)",
            cursor: "pointer", font: "600 22px var(--sans)", lineHeight: 1, padding: 0,
            display: "grid", placeItems: "center",
          }}
        >
          +
        </button>
      ) : (
        <button className="primary" onClick={openPicker} style={{ minHeight: 58, borderRadius: 19, boxShadow: "0 14px 34px rgba(0,0,0,.6)" }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
          <span>{label}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Choisir la séance"
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 20, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 520, maxHeight: "80dvh", overflowY: "auto", padding: "20px 20px calc(20px + env(safe-area-inset-bottom))", borderRadius: "24px 24px 0 0", background: "var(--surf)", border: "1px solid var(--hair2)", display: "flex", flexDirection: "column", gap: 10 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, font: "700 18px var(--sans)" }}>Ajouter à…</h2>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="iconbtn" style={{ width: 40, height: 40, minWidth: 40 }}>×</button>
            </div>

            {workouts === null && <p style={{ margin: 0, color: "var(--mut)", font: "400 13px var(--sans)" }}>Chargement…</p>}
            {workouts?.map((w) => (
              <button
                key={w.id}
                disabled={pending}
                onClick={() => add({ workoutId: w.id })}
                style={{ textAlign: "left", padding: "13px 14px", borderRadius: 16, background: "var(--surf2)", border: "1px solid var(--hair)", color: "var(--txt)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 3 }}
              >
                <span style={{ font: "600 15px var(--sans)" }}>{w.name}</span>
                <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>
                  {w.status === "active" ? "EN COURS" : "À VENIR"} · {w.exercises} EXERCICE{w.exercises > 1 ? "S" : ""}
                </span>
              </button>
            ))}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                add({ newName });
              }}
              style={{ display: "flex", gap: 8, marginTop: 4 }}
            >
              <input className="field" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nouvelle séance (ex. Push, Jambes…)" maxLength={60} style={{ height: 48 }} />
              <button type="submit" disabled={pending} className="primary" style={{ width: "auto", minHeight: 48, padding: "0 16px", borderRadius: 16 }}>
                Créer
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && <AddedToast result={toast} />}
    </>
  );
}

function AddedToast({ result }: { result: AddResult }) {
  return (
    <div
      role="status"
      style={{
        position: "fixed", left: 16, right: 16, bottom: 90, maxWidth: 520, margin: "0 auto", padding: "15px 16px", borderRadius: 20,
        background: "#FFE4D6", color: "var(--ink)", display: "flex", alignItems: "center", gap: 13,
        boxShadow: "0 18px 40px rgba(0,0,0,.65)", animation: "mmToast .28s cubic-bezier(.2,.9,.3,1.2) both", zIndex: 30,
      }}
    >
      <span style={{ width: 34, height: 34, flex: "none", borderRadius: 17, background: "var(--ink)", display: "grid", placeItems: "center", color: "var(--acc)" }}>
        <IconCheck />
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
        <span style={{ font: "700 14px var(--sans)" }}>Ajouté à {result.workoutName}</span>
        <span style={{ font: "500 11px var(--mono)", opacity: 0.6 }}>
          {result.exercises} EXERCICE{result.exercises > 1 ? "S" : ""} · {result.sets} SÉRIES PRÉVUES
        </span>
      </div>
      <Link
        href={`/seance/${result.workoutId}`}
        style={{
          flex: "none", minHeight: 40, padding: "0 13px", borderRadius: 12, background: "var(--ink)",
          color: "var(--acc)", font: "700 12px var(--sans)", display: "grid", placeItems: "center",
        }}
      >
        Voir
      </Link>
    </div>
  );
}
