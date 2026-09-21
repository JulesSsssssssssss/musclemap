"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions";

/** Étoile de favori — bascule tout de suite, puis se cale sur la réponse du serveur. */
export function FavoriteButton({
  exerciseId,
  initial,
  name,
  size = 44,
}: {
  exerciseId: string;
  initial: boolean;
  name: string;
  size?: number;
}) {
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();

  return (
    <button
      onClick={() => {
        setOn(!on);
        start(async () => setOn(await toggleFavorite(exerciseId)));
      }}
      aria-pressed={on}
      aria-label={on ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
      style={{
        width: size, height: size, flex: "none", alignSelf: "center", borderRadius: 14, padding: 0, cursor: "pointer",
        display: "grid", placeItems: "center", font: "500 20px var(--sans)", lineHeight: 1,
        background: on ? "rgba(255,91,30,.12)" : "transparent",
        border: `1px solid ${on ? "rgba(255,91,30,.35)" : "rgba(255,255,255,.1)"}`,
        color: on ? "var(--acc)" : "var(--faint)",
      }}
    >
      {on ? "★" : "☆"}
    </button>
  );
}
