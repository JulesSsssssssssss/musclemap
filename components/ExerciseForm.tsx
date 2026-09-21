"use client";

import { useActionState, useState } from "react";
import { createExercise } from "@/app/actions";
import { MUSCLES, type MuscleKey } from "@/lib/body";
import { EQUIPMENTS, subsFor } from "@/lib/catalog";

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 };

/** Formulaire de création d'un exercice personnalisé. */
export function ExerciseForm() {
  const [state, action, pending] = useActionState(createExercise, undefined);
  const [muscle, setMuscle] = useState<MuscleKey>("pectoraux");
  const subs = subsFor(muscle);

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 20px 24px" }}>
      <label style={labelStyle}>
        <span className="eyebrow">NOM</span>
        <input className="field" name="name" required minLength={2} maxLength={80} placeholder="ex. Développé couché prise serrée" autoComplete="off" />
      </label>

      <label style={labelStyle}>
        <span className="eyebrow">GROUPE MUSCULAIRE</span>
        <select className="field" name="muscle" value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleKey)}>
          {(Object.entries(MUSCLES) as [MuscleKey, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </label>

      {/* `key` : la liste change avec le muscle, le champ repart sur son premier choix. */}
      <label style={labelStyle}>
        <span className="eyebrow">FAISCEAU</span>
        <select className="field" name="subCode" key={muscle}>
          {subs.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        <span className="eyebrow">ÉQUIPEMENT</span>
        <select className="field" name="equipment" defaultValue="Haltères">
          {EQUIPMENTS.slice(1).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </label>

      <label style={labelStyle}>
        <span className="eyebrow">NOTES (FACULTATIF)</span>
        <textarea
          className="field"
          name="description"
          maxLength={600}
          rows={3}
          placeholder="Réglages, prise, tempo…"
          style={{ height: "auto", padding: "12px 15px", resize: "vertical" }}
        />
      </label>

      {state?.error && <p role="alert" style={{ margin: 0, font: "500 13px var(--sans)", color: "#FF8A6B" }}>{state.error}</p>}

      <button type="submit" className="primary" disabled={pending}>
        {pending ? "Création…" : "Créer l'exercice"}
      </button>
    </form>
  );
}
