"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export function AuthForm({
  action,
  mode,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  mode: "login" | "register";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";

  return (
    <div className="frame" style={{ justifyContent: "center", padding: "0 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 26 }}>
        <span className="eyebrow" style={{ letterSpacing: 2 }}>MUSCLEMAP</span>
        <h1 style={{ margin: 0, font: "700 30px/1.05 var(--sans)", letterSpacing: "-1.2px" }}>
          {isRegister ? (<>Crée ton<br />compte.</>) : (<>Content de<br />te revoir.</>)}
        </h1>
      </div>

      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {isRegister && (
          <input className="field" name="name" placeholder="Prénom" autoComplete="given-name" required />
        )}
        <input className="field" name="email" type="email" placeholder="E-mail" autoComplete="email" required />
        <input
          className="field"
          name="password"
          type="password"
          placeholder={isRegister ? "Mot de passe (8 caractères min.)" : "Mot de passe"}
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
        />

        {state?.error && (
          <p role="alert" style={{ margin: "2px 0 0", font: "500 12px var(--sans)", color: "var(--acc)" }}>
            {state.error}
          </p>
        )}

        <button className="primary" type="submit" disabled={pending} style={{ marginTop: 6 }}>
          {pending ? "…" : isRegister ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>

      <p style={{ marginTop: 20, textAlign: "center", font: "400 13px var(--sans)", color: "var(--mut)" }}>
        {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
        <Link href={isRegister ? "/connexion" : "/inscription"}>
          {isRegister ? "Se connecter" : "S'inscrire"}
        </Link>
      </p>

      {!isRegister && (
        <div style={{ marginTop: 26, padding: 14, borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)" }}>
          <span className="eyebrow">COMPTE DE DÉMONSTRATION</span>
          <p style={{ margin: "6px 0 0", font: "500 12px var(--mono)", color: "var(--dim)", lineHeight: 1.6 }}>
            demo@musclemap.app<br />demo1234
          </p>
        </div>
      )}
    </div>
  );
}
