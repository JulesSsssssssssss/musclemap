"use client";

import { useEffect } from "react";

/** Enregistre le service worker (production seulement : en dev il gênerait le rechargement à chaud). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // navigation privée ou navigateur restreint : l'app fonctionne très bien sans
    });
  }, []);
  return null;
}
