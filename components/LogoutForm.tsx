"use client";

import { logout } from "@/app/actions";

/**
 * Déconnexion : vide aussi les copies hors ligne des pages, qui contiennent les données du compte
 * (sinon la personne suivante sur cet appareil pourrait les relire sans réseau).
 */
export function LogoutForm() {
  return (
    <form
      action={logout}
      onSubmit={() => {
        void caches?.keys().then((names) => Promise.all(names.filter((n) => n.startsWith("mm-pages-")).map((n) => caches.delete(n))));
      }}
    >
      <button
        type="submit"
        style={{ minHeight: 38, padding: "0 13px", borderRadius: 11, background: "var(--surf2)", border: "1px solid var(--hair2)", color: "var(--acc)", font: "600 12px var(--sans)", cursor: "pointer" }}
      >
        Déconnexion
      </button>
    </form>
  );
}
