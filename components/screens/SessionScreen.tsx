"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { addSet, finishWorkout, removeEntry, removeSet, renameWorkout, updateSet } from "@/app/actions";
import { IconCheck, IconPencil, IconTrash } from "@/components/Icons";
import { dec, mmss } from "@/lib/format";

export type SessionSet = { id: string; weight: number; reps: number; done: boolean; prev: string };
export type SessionEntry = {
  id: string;
  name: string;
  meta: string;
  note: string | null;
  sets: SessionSet[];
};

const actionBtn: React.CSSProperties = {
  width: 42, height: 42, flex: "none", borderRadius: 13, background: "var(--surf2)",
  border: "1px solid var(--hair)", color: "var(--faint)", font: "600 15px var(--sans)",
  cursor: "pointer", display: "grid", placeItems: "center", padding: 0,
};

export function SessionScreen({
  workoutId,
  workoutName,
  startedAt,
  entries,
  restSeconds,
  unit,
}: {
  workoutId: string | null;
  workoutName: string;
  startedAt: string | null;
  entries: SessionEntry[];
  restSeconds: number;
  unit: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [open, setOpen] = useState(0);
  const [local, setLocal] = useState(entries);
  const [, startAction] = useTransition();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => setLocal(entries), [entries]);

  useEffect(() => {
    if (!startedAt) return;
    const begin = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - begin) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (rest <= 0) return;
    const id = setInterval(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [rest]);

  /** Écrit la valeur après une courte pause, pour ne pas spammer le serveur. */
  const persist = (setId: string, patch: { weight?: number; reps?: number }) => {
    clearTimeout(timers.current[setId]);
    timers.current[setId] = setTimeout(() => {
      startAction(async () => {
        await updateSet({ setId, ...patch });
      });
    }, 500);
  };

  const patchSet = (entryId: string, setId: string, patch: Partial<SessionSet>) =>
    setLocal((prev) =>
      prev.map((e) =>
        e.id !== entryId ? e : { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) },
      ),
    );

  const toggleDone = (entryId: string, set: SessionSet) => {
    const next = !set.done;
    patchSet(entryId, set.id, { done: next });
    if (next) setRest(restSeconds);
    startAction(async () => {
      await updateSet({ setId: set.id, done: next, weight: set.weight, reps: set.reps });
    });
  };

  if (!workoutId) {
    return (
      <div className="scroll">
        <SessionHeader name={workoutName} elapsed={0} count={0} disabled />
        <div style={{ padding: "60px 34px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <div style={{ width: 104, height: 104, borderRadius: 32, border: "1px dashed rgba(255,255,255,.14)", display: "grid", placeItems: "center" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3.5" y="4.5" width="17" height="16" rx="4" stroke="#3D3933" strokeWidth="1.7" />
              <path d="M12 9v7M8.5 12.5h7" stroke="#3D3933" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ font: "700 19px var(--sans)" }}>Aucune séance en cours</span>
          <span style={{ font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            Choisis un muscle sur le corps, ajoute tes exercices, et c&apos;est parti.
          </span>
          <Link href="/" className="primary tap" style={{ marginTop: 6, minHeight: 52, padding: "0 24px", width: "auto", borderRadius: 17, textDecoration: "none" }}>
            Ouvrir le corps
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <SessionHeader
        name={workoutName}
        elapsed={elapsed}
        count={local.length}
        canFinish={local.some((e) => e.sets.some((s) => s.done))}
      />

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {rest > 0 && (
          <div
            role="timer"
            style={{
              padding: "14px 16px", borderRadius: 18, background: "rgba(255,91,30,.1)",
              border: "1px solid rgba(255,91,30,.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="eyebrow" style={{ letterSpacing: "1.4px" }}>REPOS EN COURS</span>
              <span style={{ font: "700 26px var(--mono)", color: "var(--acc)", letterSpacing: "-1px" }}>{mmss(rest)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setRest((r) => r + 30)}
                style={{ minHeight: 44, padding: "0 13px", borderRadius: 13, background: "rgba(255,255,255,.06)", border: "1px solid var(--hair2)", color: "var(--txt)", font: "600 12px var(--mono)", cursor: "pointer" }}
              >
                +30s
              </button>
              <button
                onClick={() => setRest(0)}
                style={{ minHeight: 44, padding: "0 13px", borderRadius: 13, background: "var(--acc)", border: 0, color: "var(--ink)", font: "700 12px var(--sans)", cursor: "pointer" }}
              >
                Passer
              </button>
            </div>
          </div>
        )}

        {local.length === 0 && (
          <p style={{ textAlign: "center", padding: "30px 10px", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            Séance vide pour l&apos;instant.<br />Ajoute un premier exercice ci-dessous.
          </p>
        )}

        {local.map((entry, i) => {
          const done = entry.sets.filter((s) => s.done).length;
          const full = done === entry.sets.length && entry.sets.length > 0;
          const isOpen = i === open;
          return (
            <div key={entry.id} style={{ borderRadius: 20, background: "var(--surf)", border: `1px solid ${isOpen ? "var(--hair2)" : "var(--hair)"}`, overflow: "hidden" }}>
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "none", border: 0, cursor: "pointer", textAlign: "left" }}
              >
                <span style={{ width: 20, display: "flex", flexDirection: "column", gap: 3, flex: "none", alignItems: "center" }} aria-hidden="true">
                  <span style={{ width: 14, height: 1.5, background: "#3D3933" }} />
                  <span style={{ width: 14, height: 1.5, background: "#3D3933" }} />
                  <span style={{ width: 14, height: 1.5, background: "#3D3933" }} />
                </span>
                <div className="gif" style={{ width: 44, height: 44, flex: "none", borderRadius: 13 }} />
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>{entry.name}</span>
                  <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>{entry.meta}</span>
                </div>
                <span
                  style={{
                    font: "600 12px var(--mono)", padding: "5px 9px", borderRadius: 8,
                    color: full ? "var(--ink)" : "var(--dim)", background: full ? "var(--acc)" : "var(--surf2)",
                  }}
                >
                  {done}/{entry.sets.length}
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "34px 1fr 74px 62px 44px", gap: 6, padding: "0 2px 8px" }}>
                    {["SÉR", "PRÉCÉDENT", unit.toUpperCase(), "REPS"].map((h) => (
                      <span key={h} style={{ font: "500 9px var(--mono)", letterSpacing: 1, color: "var(--ghost)" }}>{h}</span>
                    ))}
                    <span />
                  </div>

                  {entry.sets.map((set, j) => (
                    <div
                      key={set.id}
                      style={{
                        display: "grid", gridTemplateColumns: "34px 1fr 74px 62px 44px", gap: 6, alignItems: "center",
                        marginBottom: 7, background: set.done ? "rgba(255,91,30,.07)" : "transparent", borderRadius: 13, padding: "4px 2px",
                      }}
                    >
                      <span style={{ font: "700 15px var(--sans)", color: set.done ? "var(--acc)" : "var(--faint)", textAlign: "center" }}>{j + 1}</span>
                      <span style={{ font: "500 12px var(--mono)", color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {set.prev}
                      </span>

                      <input
                        className="numfield"
                        type="text"
                        inputMode="decimal"
                        aria-label={`Poids série ${j + 1}`}
                        value={set.weight === 0 ? "" : dec(set.weight)}
                        placeholder="0"
                        onChange={(e) => {
                          // La virgule est la séparateur décimal attendu en français.
                          const weight = Number(e.target.value.replace(",", ".")) || 0;
                          patchSet(entry.id, set.id, { weight });
                          persist(set.id, { weight });
                        }}
                        style={{
                          background: set.done ? "rgba(255,91,30,.08)" : "var(--surf2)",
                          borderColor: set.done ? "rgba(255,91,30,.22)" : "rgba(255,255,255,.07)",
                          color: set.done ? "var(--acc)" : "var(--txt)",
                        }}
                      />
                      <input
                        className="numfield"
                        type="text"
                        inputMode="numeric"
                        aria-label={`Répétitions série ${j + 1}`}
                        value={set.reps === 0 ? "" : set.reps}
                        placeholder="0"
                        onChange={(e) => {
                          const reps = Math.max(0, Math.round(Number(e.target.value) || 0));
                          patchSet(entry.id, set.id, { reps });
                          persist(set.id, { reps });
                        }}
                        style={{
                          background: set.done ? "rgba(255,91,30,.08)" : "var(--surf2)",
                          borderColor: set.done ? "rgba(255,91,30,.22)" : "rgba(255,255,255,.07)",
                          color: set.done ? "var(--acc)" : "var(--txt)",
                        }}
                      />

                      <button
                        onClick={() => toggleDone(entry.id, set)}
                        aria-label={set.done ? `Annuler la série ${j + 1}` : `Valider la série ${j + 1}`}
                        aria-pressed={set.done}
                        style={{
                          width: 44, height: 44, borderRadius: 13, cursor: "pointer", display: "grid", placeItems: "center", padding: 0,
                          border: `1px solid ${set.done ? "var(--acc)" : "rgba(255,255,255,.14)"}`,
                          background: set.done ? "var(--acc)" : "transparent",
                          color: set.done ? "var(--ink)" : "var(--dark)",
                        }}
                      >
                        <IconCheck />
                      </button>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <form action={addSet} style={{ flex: 1 }}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button
                        type="submit"
                        style={{ width: "100%", minHeight: 42, borderRadius: 13, background: "var(--surf2)", border: "1px dashed rgba(255,255,255,.14)", color: "var(--dim)", font: "600 13px var(--sans)", cursor: "pointer" }}
                      >
                        + Ajouter une série
                      </button>
                    </form>
                    {entry.sets.length > 1 && (
                      <form action={removeSet}>
                        <input type="hidden" name="setId" value={entry.sets[entry.sets.length - 1].id} />
                        <button type="submit" aria-label="Retirer la dernière série" style={actionBtn}>
                          −
                        </button>
                      </form>
                    )}
                    <form action={removeEntry}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button type="submit" aria-label="Retirer cet exercice de la séance" style={actionBtn}>
                        <IconTrash />
                      </button>
                    </form>
                  </div>

                  {entry.note && (
                    <div style={{ marginTop: 9, padding: "11px 13px", borderRadius: 13, background: "#121110", border: "1px solid rgba(255,255,255,.06)", display: "flex", gap: 9, alignItems: "center", color: "var(--dark)" }}>
                      <IconPencil size={14} />
                      <span style={{ font: "400 12px var(--sans)", color: "var(--faint)" }}>{entry.note}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <Link
          href="/"
          className="tap"
          style={{ minHeight: 56, borderRadius: 18, border: "1px dashed rgba(255,255,255,.16)", color: "var(--acc)", font: "600 15px var(--sans)", display: "grid", placeItems: "center", marginTop: 2 }}
        >
          + Ajouter un exercice
        </Link>
      </div>
    </div>
  );
}

function SessionHeader({
  name,
  elapsed,
  count,
  disabled,
  canFinish,
}: {
  name: string;
  elapsed: number;
  count: number;
  disabled?: boolean;
  canFinish?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <header style={{ padding: "6px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0, flex: 1 }}>
        {editing ? (
          <form action={renameWorkout} onSubmit={() => setEditing(false)} style={{ display: "flex", gap: 8 }}>
            <input className="field" name="name" defaultValue={name} autoFocus style={{ height: 40, borderRadius: 12 }} />
            <button type="submit" className="iconbtn" aria-label="Valider" style={{ height: 40, width: 40, minWidth: 40 }}>
              <IconCheck size={15} />
            </button>
          </form>
        ) : (
          <h1 style={{ margin: 0 }}>
            <button
              onClick={() => !disabled && setEditing(true)}
              aria-label={disabled ? undefined : `Renommer la séance « ${name} »`}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: 0, padding: 0, cursor: disabled ? "default" : "pointer", color: "var(--txt)", textAlign: "left", font: "700 24px var(--sans)", letterSpacing: "-.5px" }}
            >
              <span>{name}</span>
              {!disabled && <span style={{ color: "var(--faint)", display: "grid" }}><IconPencil /></span>}
            </button>
          </h1>
        )}
        <span style={{ font: "500 12px var(--mono)", color: "var(--mut)" }}>
          {mmss(elapsed)} · {count} exercice{count > 1 ? "s" : ""}
        </span>
      </div>

      {!disabled && (
        <form action={finishWorkout}>
          <input type="hidden" name="elapsed" value={elapsed} />
          <button
            type="submit"
            disabled={!canFinish}
            style={{
              flex: "none", minHeight: 44, padding: "0 16px", borderRadius: 14,
              background: "var(--surf2)", border: "1px solid rgba(255,255,255,.1)",
              color: canFinish ? "var(--txt)" : "var(--dark)",
              font: "600 13px var(--sans)", cursor: canFinish ? "pointer" : "default",
            }}
          >
            Terminer
          </button>
        </form>
      )}
    </header>
  );
}

