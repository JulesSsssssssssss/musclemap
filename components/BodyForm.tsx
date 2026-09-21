"use client";

import { useState, useTransition } from "react";
import { addBodyEntry } from "@/app/actions";

const MAX_SIDE = 1000;
const MAX_BYTES = 600 * 1024;

/** Réduit la photo (côté long 1000 px, JPEG) pour rester léger en base et sous la limite d'envoi. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.82, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_BYTES) return blob;
  }
  throw new Error("too-big");
}

const FIELDS = [
  { name: "chest", label: "Poitrine" },
  { name: "waist", label: "Taille" },
  { name: "hips", label: "Hanches" },
  { name: "arm", label: "Bras" },
  { name: "thigh", label: "Cuisse" },
] as const;

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 };
const eyebrowStyle: React.CSSProperties = { letterSpacing: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

export function BodyForm({ today, unit }: { today: string; unit: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [fileName, setFileName] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError(null);
    setSaved(false);

    start(async () => {
      const photo = data.get("photo");
      try {
        if (photo instanceof File && photo.size > 0) data.set("photo", await shrink(photo), "photo.jpg");
        else data.delete("photo");
      } catch {
        setError("Impossible de lire cette photo. Essaie un JPEG ou un PNG.");
        return;
      }
      const result = await addBodyEntry(data);
      if (result?.error) return setError(result.error);
      form.reset();
      setFileName("");
      setSaved(true);
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* minWidth: 0 → les colonnes de la grille peuvent rétrécir (sinon le champ date déborde sur iOS). */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
        <label style={labelStyle}>
          <span className="eyebrow" style={eyebrowStyle}>DATE</span>
          <input className="field" type="date" name="date" defaultValue={today} max={today} style={{ height: 48, minWidth: 0 }} />
        </label>
        <label style={labelStyle}>
          <span className="eyebrow" style={eyebrowStyle}>POIDS ({unit.toUpperCase()})</span>
          <input className="field" name="weight" inputMode="decimal" placeholder="ex. 78,5" autoComplete="off" style={{ height: 48, minWidth: 0 }} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
        {FIELDS.map((f) => (
          <label key={f.name} style={labelStyle}>
            <span className="eyebrow" style={eyebrowStyle}>{f.label.toUpperCase()} (CM)</span>
            <input className="field" name={f.name} inputMode="decimal" placeholder="—" autoComplete="off" style={{ height: 48, minWidth: 0 }} />
          </label>
        ))}
      </div>

      <label
        style={{
          minHeight: 52, padding: "0 14px", borderRadius: 16, border: "1px dashed rgba(255,255,255,.16)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, cursor: "pointer",
          font: "600 14px var(--sans)", color: fileName ? "var(--txt)" : "var(--dim)",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fileName || "+ Ajouter une photo"}</span>
        <input
          type="file"
          name="photo"
          accept="image/*"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
        />
      </label>

      {error && <p role="alert" style={{ margin: 0, font: "500 13px var(--sans)", color: "#FF8A6B" }}>{error}</p>}
      {saved && !error && <p role="status" style={{ margin: 0, font: "500 13px var(--sans)", color: "var(--acc)" }}>Relevé enregistré ✓</p>}

      <button type="submit" className="primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le relevé"}
      </button>
    </form>
  );
}
