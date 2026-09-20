import Link from "next/link";

export default function NotFound() {
  return (
    <div className="frame" style={{ justifyContent: "center", alignItems: "center", padding: "0 30px", textAlign: "center", gap: 14 }}>
      <span className="eyebrow" style={{ letterSpacing: 2 }}>ERREUR 404</span>
      <h1 style={{ margin: 0, font: "700 26px/1.15 var(--sans)", letterSpacing: "-.8px" }}>
        Cette page n&apos;existe pas.
      </h1>
      <p style={{ margin: 0, font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
        Le muscle ou l&apos;exercice demandé est introuvable.
      </p>
      <Link href="/" className="primary tap" style={{ marginTop: 6, width: "auto", padding: "0 24px", textDecoration: "none" }}>
        Retour au corps
      </Link>
    </div>
  );
}
