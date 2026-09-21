"use client";

import { useEffect, useState } from "react";

/** Pastille « Hors ligne » en haut de l'écran tant que le réseau est coupé. */
export function OfflineBadge() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      style={{
        position: "fixed", top: "calc(env(safe-area-inset-top) + 8px)", left: "50%", transform: "translateX(-50%)", zIndex: 50,
        padding: "6px 12px", borderRadius: 999, background: "rgba(255,196,0,.14)", border: "1px solid rgba(255,196,0,.35)",
        color: "#F2C94C", font: "600 11px var(--mono)", letterSpacing: ".6px", pointerEvents: "none",
      }}
    >
      HORS LIGNE
    </div>
  );
}
