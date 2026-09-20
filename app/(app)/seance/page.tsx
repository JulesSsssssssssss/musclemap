import Link from "next/link";
import { createWorkout } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { listWorkouts } from "@/lib/queries";
import { dayMonth, mmss } from "@/lib/format";

export const metadata = { title: "Séances · MuscleMap" };

const STATUS = {
  active: { label: "EN COURS", fg: "var(--ink)", bg: "var(--acc)" },
  planned: { label: "À VENIR", fg: "var(--acc)", bg: "rgba(255,91,30,.12)" },
  done: { label: "TERMINÉE", fg: "var(--dim)", bg: "var(--surf2)" },
} as const;

export default async function SessionsPage() {
  const user = await requireUser();
  const workouts = await listWorkouts(user.id);
  const groups = [
    { title: "En cours", items: workouts.filter((w) => w.status === "active") },
    { title: "À venir", items: workouts.filter((w) => w.status === "planned") },
    { title: "Terminées", items: workouts.filter((w) => w.status === "done") },
  ];

  return (
    <div className="scroll">
      <header style={{ padding: "6px 20px 14px" }}>
        <span className="eyebrow" style={{ letterSpacing: "1.8px" }}>MES SÉANCES</span>
        <h1 style={{ margin: "5px 0 0", font: "700 26px var(--sans)", letterSpacing: "-.8px" }}>
          {workouts.length} séance{workouts.length > 1 ? "s" : ""}
        </h1>
      </header>

      <form action={createWorkout} style={{ display: "flex", gap: 8, padding: "0 20px 18px" }}>
        <input className="field" name="name" placeholder="Nouvelle séance (ex. Push, Jambes…)" maxLength={60} style={{ height: 52 }} />
        <button type="submit" className="primary" style={{ width: "auto", minHeight: 52, padding: "0 18px", borderRadius: 16 }}>
          + Créer
        </button>
      </form>

      {workouts.length === 0 && (
        <p style={{ textAlign: "center", padding: "30px 30px", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
          Aucune séance pour l&apos;instant. Crée-en une ci-dessus, puis ajoute des exercices depuis la bibliothèque.
        </p>
      )}

      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.title} style={{ padding: "0 20px 18px" }}>
              <h2 className="eyebrow" style={{ margin: "0 0 10px", letterSpacing: "1.6px" }}>{g.title.toUpperCase()}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {g.items.map((w) => {
                  const st = STATUS[w.status as keyof typeof STATUS] ?? STATUS.planned;
                  const date = dayMonth(w.startedAt);
                  return (
                    <Link
                      key={w.id}
                      href={w.status === "done" ? `/seance/${w.id}/resume` : `/seance/${w.id}`}
                      className="tap"
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, background: "var(--surf)", border: "1px solid var(--hair)", color: "var(--txt)" }}
                    >
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ font: "600 15px var(--sans)" }}>{w.name}</span>
                        <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>
                          {w._count.entries} EXERCICE{w._count.entries > 1 ? "S" : ""}
                          {w.status === "done" && ` · ${date.d} ${date.m.toUpperCase()}. · ${mmss(w.durationSec)}`}
                        </span>
                      </div>
                      <span style={{ flex: "none", font: "600 10px var(--mono)", letterSpacing: ".6px", padding: "4px 8px", borderRadius: 7, color: st.fg, background: st.bg }}>
                        {st.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ),
      )}
    </div>
  );
}
