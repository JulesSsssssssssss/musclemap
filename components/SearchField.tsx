"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconSearch } from "./Icons";

export function SearchField({ initial }: { initial: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => setValue(initial), [initial]);

  const submit = (next: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const qs = new URLSearchParams(params.toString());
      if (next) qs.set("q", next);
      else qs.delete("q");
      const s = qs.toString();
      router.replace(s ? `/biblio?${s}` : "/biblio", { scroll: false });
    }, 300);
  };

  return (
    <div
      style={{
        margin: "0 20px 12px", height: 52, borderRadius: 16, background: "var(--surf)",
        border: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 11, padding: "0 15px",
      }}
    >
      <span style={{ color: "var(--faint)", flex: "none", display: "grid" }}><IconSearch /></span>
      <input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          submit(e.target.value);
        }}
        placeholder="Rechercher un exercice…"
        aria-label="Rechercher un exercice"
        style={{ flex: 1, background: "none", border: 0, outline: "none", color: "var(--txt)", font: "400 14px var(--sans)" }}
      />
    </div>
  );
}
