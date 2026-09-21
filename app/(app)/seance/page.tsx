import Link from "next/link";
import { createWorkout, deleteRoutine, startFromRoutine } from "@/app/actions";
import { IconTrash } from "@/components/Icons";
import { requireUser } from "@/lib/auth";
import { listRoutines, listWorkouts } from "@/lib/queries";
import { dayMonth, mmss } from "@/lib/format";
import { SwipeToDelete } from "@/components/SwipeToDelete";

export const metadata = { title: "Séances · MuscleMap" };

const STATUS = {
  active: { label: "EN COURS", fg: "var(--ink)", bg: "var(--acc)" },
  planned: { label: "À VENIR", fg: "var(--acc)", bg: "rgba(255,91,30,.12)" },
  done: { label: "TERMINÉE", fg: "var(--dim)", bg: "var(--surf2)" },
} as const;

export default async function SessionsPage() {
  const user = await requireUser();
  const [workouts, routines] = await Promise.all([listWorkouts(user.id), listRoutines(user.id)]);
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

      <div style={{ padding: "0 20px 18px" }}>
        <Link
          href="/seance/generer"
          className="tap"
          style={{ minHeight: 52, borderRadius: 16, background: "rgba(255,91,30,.1)", border: "1px solid rgba(255,91,30,.28)", color: "var(--acc)", font: "600 14px var(--sans)", display: "grid", placeItems: "center" }}
        >
          ✨ Générer une séance
        </Link>
      </div>

      {routines.length > 0 && (
        <section style={{ padding: "0 20px 18px" }}>
          <h2 className="eyebrow" style={{ margin: "0 0 10px", letterSpacing: "1.6px" }}>MES ROUTINES</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {routines.map((r) => {
              const muscles = [...new Set(r.entries.map((e) => e.exercise.primaryMuscle))].slice(0, 3).join(" · ");
              return (
                <div
                  key={r.id}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, borderRadius: 18, background: "var(--surf)", border: "1px solid var(--hair)" }}
                >
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ font: "600 15px var(--sans)" }}>{r.name}</span>
                    <span style={{ font: "500 11px var(--mono)", color: "var(--mut)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.entries.length} EXO{r.entries.length > 1 ? "S" : ""}{muscles && ` · ${muscles.toUpperCase()}`}
                    </span>
                  </div>
                  <form action={startFromRoutine}>
                    <input type="hidden" name="routineId" value={r.id} />
                    <button type="submit" className="primary" style={{ width: "auto", minHeight: 44, padding: "0 16px", borderRadius: 14, font: "700 13px var(--sans)" }}>
                      Lancer
                    </button>
                  </form>
                  <form action={deleteRoutine}>
                    <input type="hidden" name="routineId" value={r.id} />
                    <button
                      type="submit"
                      aria-label={`Supprimer la routine « ${r.name} »`}
                      style={{ width: 44, height: 44, borderRadius: 13, background: "var(--surf2)", border: "1px solid var(--hair)", color: "var(--faint)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}
                    >
                      <IconTrash />
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {workouts.length === 0 && routines.length === 0 && (
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
                  const card = (
                    <Link
                      key={w.id}
                      draggable={false}
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
                  return w.status === "planned" ? (
                    <SwipeToDelete key={w.id} workoutId={w.id} label={`Supprimer la séance « ${w.name} »`}>
                      {card}
                    </SwipeToDelete>
                  ) : (
                    card
                  );
                })}
              </div>
            </section>
          ),
      )}
    </div>
  );
}
