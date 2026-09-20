"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addExerciseToWorkout, type AddResult } from "@/app/actions";
import { IconCheck } from "./Icons";

/** Bouton « + » présent sur chaque carte exercice, avec toast de confirmation. */
export function AddToWorkout({
  slug,
  variant = "icon",
  label = "Ajouter à ma séance",
}: {
  slug: string;
  variant?: "icon" | "primary";
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<AddResult | null>(null);

  const add = () =>
    start(async () => {
      const result = await addExerciseToWorkout(slug);
      if (result) {
        setToast(result);
        setTimeout(() => setToast(null), 4000);
      }
    });

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={add}
          disabled={pending}
          aria-label="Ajouter à ma séance"
          style={{
            width: 44, height: 44, flex: "none", alignSelf: "center", borderRadius: 14,
            border: "1px solid rgba(255,255,255,.1)", background: "var(--surf2)", color: "var(--acc)",
            cursor: "pointer", font: "600 22px var(--sans)", lineHeight: 1, padding: 0,
            display: "grid", placeItems: "center", opacity: pending ? 0.5 : 1,
          }}
        >
          +
        </button>
      ) : (
        <button className="primary" onClick={add} disabled={pending} style={{ minHeight: 58, borderRadius: 19, boxShadow: "0 14px 34px rgba(0,0,0,.6)" }}>
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span>
          <span>{label}</span>
        </button>
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
        position: "absolute", left: 16, right: 16, bottom: 90, padding: "15px 16px", borderRadius: 20,
        background: "#FFE4D6", color: "var(--ink)", display: "flex", alignItems: "center", gap: 13,
        boxShadow: "0 18px 40px rgba(0,0,0,.65)", animation: "mmToast .28s cubic-bezier(.2,.9,.3,1.2) both", zIndex: 5,
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
        href="/seance"
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
