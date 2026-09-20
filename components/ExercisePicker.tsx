"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { IconChevron } from "./Icons";

export function ExercisePicker({
  exercises,
  current,
}: {
  exercises: { slug: string; name: string }[];
  current: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div style={{ margin: "0 20px 12px", position: "relative" }}>
      <div
        style={{
          width: "100%", minHeight: 52, borderRadius: 16, background: "var(--surf)",
          border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px",
        }}
      >
        <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>
          {exercises.find((e) => e.slug === current)?.name ?? "Choisir un exercice"}
        </span>
        <span style={{ color: "var(--mut)", transform: "rotate(90deg)" }}><IconChevron /></span>
      </div>
      <select
        aria-label="Exercice suivi"
        value={current}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("exo", e.target.value);
          router.push(`/progression?${next.toString()}`);
        }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
      >
        {exercises.map((e) => (
          <option key={e.slug} value={e.slug}>{e.name}</option>
        ))}
      </select>
    </div>
  );
}
