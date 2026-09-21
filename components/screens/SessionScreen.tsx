"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  addSet, addWarmup, deleteWorkout, finishWorkout, removeEntry, removeSet, renameWorkout, saveAsRoutine,
  setEntryNote, startWorkout, toggleSuperset, updateSet,
} from "@/app/actions";
import { IconCheck, IconPencil, IconTrash } from "@/components/Icons";
import { dec, mmss } from "@/lib/format";
import { dequeue, enqueue, readQueue } from "@/lib/offline-queue";

type SetUpdate = Parameters<typeof updateSet>[0];
const RPE_VALUES = [6, 7, 8, 9, 10];

export type SessionSet = {
  id: string;
  weight: number;
  reps: number;
  done: boolean;
  kind: "work" | "warmup";
  rpe: number | null;
  note: string | null;
  prev: string;
};
export type SessionEntry = {
  id: string;
  name: string;
  meta: string;
  note: string | null;
  /** Enchaîné avec l'exercice précédent. */
  superset: boolean;
  /** L'exercice suivant est enchaîné avec celui-ci : pas de repos entre les deux. */
  linkedToNext: boolean;
  /** Charge relevée par rapport à la dernière séance (surcharge progressive). */
  overload: boolean;
  sets: SessionSet[];
};

const actionBtn: React.CSSProperties = {
  width: 42, height: 42, flex: "none", borderRadius: 13, background: "var(--surf2)",
  border: "1px solid var(--hair)", color: "var(--faint)", font: "600 15px var(--sans)",
  cursor: "pointer", display: "grid", placeItems: "center", padding: 0,
};

export function SessionScreen({
  workoutId,
  mode,
  workoutName,
  startedAt,
  entries,
  restSeconds,
  unit,
}: {
  workoutId: string;
  mode: "planned" | "active";
  workoutName: string;
  startedAt: string | null;
  entries: SessionEntry[];
  restSeconds: number;
  unit: string;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [rest, setRest] = useState(0);
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(restSeconds);
  const [sound, setSound] = useState(true);
  const soundOn = useRef(true);
  const audio = useRef<AudioContext | null>(null);
  const [open, setOpen] = useState(0);
  const [detail, setDetail] = useState<string | null>(null);
  const [pending, setPending] = useState(0);
  const queueKey = `mm-queue-${workoutId}`;
  const [local, setLocal] = useState(entries);
  const [, startAction] = useTransition();
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const patches = useRef<Record<string, Omit<SetUpdate, "setId">>>({});

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
    try {
      const saved = localStorage.getItem("mm-rest-sound") !== "off";
      soundOn.current = saved;
      setSound(saved);
    } catch {}
  }, []);

  /** Bip triple + vibration à la fin du repos. */
  const alarm = () => {
    navigator.vibrate?.([200, 100, 200, 100, 300]);
    const ctx = audio.current;
    if (!ctx || !soundOn.current) return;
    [0, 0.28, 0.56].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = ctx.currentTime + t;
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.22);
    });
  };

  // Le repos est calé sur une heure de fin : il reste juste si l'onglet passe en arrière-plan.
  useEffect(() => {
    if (restEnd === null) return;
    const update = () => {
      const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000));
      setRest(left);
      if (left === 0) {
        setRestEnd(null);
        alarm();
      }
    };
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [restEnd]);

  const startRest = (seconds: number) => {
    // Le contexte audio doit être créé pendant un geste de l'utilisateur.
    if (!audio.current && typeof AudioContext !== "undefined") audio.current = new AudioContext();
    void audio.current?.resume();
    setRestTotal(seconds);
    setRest(seconds);
    setRestEnd(Date.now() + seconds * 1000);
  };

  const skipRest = () => {
    setRestEnd(null);
    setRest(0);
  };

  const adjustRest = (delta: number) => {
    if (restEnd === null) return;
    const next = restEnd + delta * 1000;
    if (next <= Date.now()) return skipRest();
    setRestTotal((t) => Math.max(1, t + delta));
    setRestEnd(next);
  };

  const toggleSound = () => {
    const next = !sound;
    soundOn.current = next;
    setSound(next);
    try {
      localStorage.setItem("mm-rest-sound", next ? "on" : "off");
    } catch {}
  };

  /**
   * Envoie une modification de série. Sans réseau, elle est gardée sur l'appareil
   * et rejouée au retour de la connexion : la saisie en salle ne se perd pas.
   */
  const sendUpdate = async (input: SetUpdate) => {
    if (navigator.onLine) {
      try {
        await updateSet(input);
        return;
      } catch {
        // réseau coupé en cours de route : on met en attente
      }
    }
    setPending(enqueue(queueKey, input));
  };

  // Rejoue la file d'attente au chargement et à chaque retour du réseau.
  useEffect(() => {
    setPending(readQueue<SetUpdate>(queueKey).length);
    let flushing = false;
    const flush = async () => {
      if (flushing || !navigator.onLine) return;
      flushing = true;
      try {
        for (const item of readQueue<SetUpdate>(queueKey)) {
          await updateSet(item);
          setPending(dequeue<SetUpdate>(queueKey, item.setId));
        }
      } catch {
        // toujours hors ligne : on réessaiera
      }
      flushing = false;
    };
    void flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [queueKey]);

  /** Écrit la valeur après une courte pause, pour ne pas spammer le serveur. */
  const persist = (setId: string, patch: Omit<SetUpdate, "setId">) => {
    // Les modifications de plusieurs champs dans la même seconde sont regroupées en un seul envoi.
    patches.current[setId] = { ...patches.current[setId], ...patch };
    clearTimeout(timers.current[setId]);
    timers.current[setId] = setTimeout(() => {
      const merged = patches.current[setId];
      delete patches.current[setId];
      startAction(async () => {
        await sendUpdate({ setId, ...merged });
      });
    }, 500);
  };

  const patchSet = (entryId: string, setId: string, patch: Partial<SessionSet>) =>
    setLocal((prev) =>
      prev.map((e) =>
        e.id !== entryId ? e : { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) },
      ),
    );

  const planned = mode === "planned";

  const toggleDone = (entryIndex: number, set: SessionSet) => {
    if (planned) return;
    const entry = local[entryIndex];
    const next = !set.done;
    patchSet(entry.id, set.id, { done: next });
    if (next) {
      if (entry.linkedToNext) {
        // Superset : on enchaîne directement sur l'exercice suivant, sans repos.
        skipRest();
        setOpen(entryIndex + 1);
      } else {
        // Un échauffement ne demande qu'un repos court.
        startRest(set.kind === "warmup" ? Math.min(restSeconds, 45) : restSeconds);
      }
    }
    startAction(async () => {
      await sendUpdate({ setId: set.id, done: next, weight: set.weight, reps: set.reps });
    });
  };

  /** Type, RPE et note d'une série : appliqués tout de suite, enregistrés ensuite. */
  const editDetail = (entryId: string, setId: string, patch: Pick<SetUpdate, "kind" | "rpe" | "note">) => {
    patchSet(entryId, setId, patch as Partial<SessionSet>);
    persist(setId, patch);
  };

  return (
    <div className="scroll">
      <SessionHeader
        workoutId={workoutId}
        planned={planned}
        name={workoutName}
        elapsed={elapsed}
        count={local.length}
        canFinish={local.some((e) => e.sets.some((s) => s.done))}
      />

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        {pending > 0 && (
          <div role="status" style={{ padding: "11px 14px", borderRadius: 14, background: "rgba(255,196,0,.08)", border: "1px solid rgba(255,196,0,.28)", font: "500 12px/1.4 var(--sans)", color: "#F2C94C" }}>
            Hors ligne : {pending} série{pending > 1 ? "s" : ""} en attente. Elles seront enregistrées dès le retour du réseau.
          </div>
        )}

        {!planned && rest > 0 && (
          <div
            role="timer"
            aria-label={`Repos, ${mmss(rest)} restantes`}
            style={{
              position: "sticky", top: 8, zIndex: 5, overflow: "hidden", padding: "14px 16px", borderRadius: 18,
              background: "var(--surf)", border: "1px solid rgba(255,91,30,.3)", boxShadow: "0 10px 30px rgba(0,0,0,.5)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0, background: "rgba(255,91,30,.12)", transformOrigin: "left",
                transform: `scaleX(${Math.min(1, rest / restTotal)})`, transition: "transform .3s linear",
              }}
            />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 2 }}>
              <span className="eyebrow" style={{ letterSpacing: "1.4px" }}>REPOS EN COURS</span>
              <span style={{ font: "700 26px var(--mono)", color: "var(--acc)", letterSpacing: "-1px" }}>{mmss(rest)}</span>
            </div>
            <div style={{ position: "relative", display: "flex", gap: 6 }}>
              {[-15, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => adjustRest(d)}
                  aria-label={`${d > 0 ? "Ajouter" : "Retirer"} ${Math.abs(d)} secondes`}
                  style={{ minHeight: 44, minWidth: 44, padding: "0 10px", borderRadius: 13, background: "rgba(255,255,255,.06)", border: "1px solid var(--hair2)", color: "var(--txt)", font: "600 12px var(--mono)", cursor: "pointer" }}
                >
                  {d > 0 ? "+" : "−"}{Math.abs(d)}s
                </button>
              ))}
              <button
                onClick={toggleSound}
                aria-pressed={sound}
                aria-label="Son de fin de repos"
                style={{ minHeight: 44, minWidth: 44, padding: "0 8px", borderRadius: 13, background: "rgba(255,255,255,.06)", border: "1px solid var(--hair2)", color: sound ? "var(--txt)" : "var(--dark)", font: "600 11px var(--mono)", cursor: "pointer" }}
              >
                {sound ? "SON" : "MUET"}
              </button>
              <button
                onClick={skipRest}
                style={{ minHeight: 44, padding: "0 13px", borderRadius: 13, background: "var(--acc)", border: 0, color: "var(--ink)", font: "700 12px var(--sans)", cursor: "pointer" }}
              >
                Passer
              </button>
            </div>
          </div>
        )}

        {local.length === 0 && (
          <p style={{ textAlign: "center", padding: "30px 10px", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            Séance vide pour l&apos;instant.<br />Ajoute un premier exercice depuis la bibliothèque.
          </p>
        )}

        {local.map((entry, i) => {
          const done = entry.sets.filter((s) => s.done).length;
          const full = done === entry.sets.length && entry.sets.length > 0;
          const isOpen = i === open;
          const inSuperset = entry.superset || entry.linkedToNext;
          let workNumber = 0;
          return (
            <div
              key={entry.id}
              style={{
                borderRadius: 20, background: "var(--surf)", overflow: "hidden",
                border: `1px solid ${isOpen ? "var(--hair2)" : "var(--hair)"}`,
                borderLeft: inSuperset ? "3px solid var(--acc)" : undefined,
                // Les exercices d'un superset se collent : on annule l'écart avec le précédent.
                marginTop: entry.superset ? -6 : 0,
              }}
            >
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
                  <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>
                    {entry.meta}
                    {entry.overload && (
                      <span style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 6, background: "rgba(255,91,30,.14)", color: "var(--acc)" }}>
                        ↑ SURCHARGE
                      </span>
                    )}
                    {inSuperset && (
                      <span style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 6, background: "var(--surf3)", color: "var(--dim)" }}>
                        SUPERSET
                      </span>
                    )}
                  </span>
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

                  {entry.sets.map((set) => {
                    const warm = set.kind === "warmup";
                    const label = warm ? "É" : String(++workNumber);
                    const showDetail = detail === set.id;
                    const hasDetail = warm || set.rpe !== null || Boolean(set.note);
                    return (
                    <div key={set.id} style={{ marginBottom: 7 }}>
                    <div
                      style={{
                        display: "grid", gridTemplateColumns: "34px 1fr 74px 62px 44px", gap: 6, alignItems: "center",
                        background: set.done ? "rgba(255,91,30,.07)" : "transparent", borderRadius: 13, padding: "4px 2px",
                      }}
                    >
                      <button
                        onClick={() => setDetail(showDetail ? null : set.id)}
                        aria-expanded={showDetail}
                        aria-label={`Série ${warm ? "d'échauffement" : label} : détails (type, effort, note)`}
                        style={{
                          minHeight: 44, border: 0, background: "none", cursor: "pointer", padding: 0, position: "relative",
                          font: warm ? "600 13px var(--mono)" : "700 15px var(--sans)",
                          color: set.done ? "var(--acc)" : warm ? "#7C8275" : "var(--faint)",
                        }}
                      >
                        {label}
                        {hasDetail && !warm && <span aria-hidden="true" style={{ position: "absolute", top: 8, right: 3, width: 5, height: 5, borderRadius: 3, background: "var(--acc)" }} />}
                      </button>
                      <span style={{ font: "500 12px var(--mono)", color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {set.prev}
                      </span>

                      <input
                        className="numfield"
                        type="text"
                        inputMode="decimal"
                        aria-label={`Poids ${warm ? "échauffement" : `série ${label}`}`}
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
                        aria-label={`Répétitions ${warm ? "échauffement" : `série ${label}`}`}
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
                        onClick={() => toggleDone(i, set)}
                        disabled={planned}
                        title={planned ? "Démarre la séance pour valider tes séries" : undefined}
                        aria-label={set.done ? `Annuler ${warm ? "l'échauffement" : `la série ${label}`}` : `Valider ${warm ? "l'échauffement" : `la série ${label}`}`}
                        aria-pressed={set.done}
                        style={{
                          width: 44, height: 44, borderRadius: 13, cursor: planned ? "default" : "pointer", opacity: planned ? 0.35 : 1, display: "grid", placeItems: "center", padding: 0,
                          border: `1px solid ${set.done ? "var(--acc)" : "rgba(255,255,255,.14)"}`,
                          background: set.done ? "var(--acc)" : "transparent",
                          color: set.done ? "var(--ink)" : "var(--dark)",
                        }}
                      >
                        <IconCheck />
                      </button>
                    </div>

                    {showDetail && (
                      <div style={{ margin: "6px 2px 2px", padding: 12, borderRadius: 14, background: "#121110", border: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", gap: 10 }}>
                        <div role="group" aria-label="Type de série" style={{ display: "flex", gap: 6 }}>
                          {([["work", "Travail"], ["warmup", "Échauffement"]] as const).map(([kind, text]) => (
                            <button
                              key={kind}
                              onClick={() => editDetail(entry.id, set.id, { kind })}
                              aria-pressed={set.kind === kind}
                              style={{ flex: 1, minHeight: 40, borderRadius: 11, cursor: "pointer", font: "600 12px var(--sans)", background: set.kind === kind ? "var(--acc)" : "var(--surf2)", color: set.kind === kind ? "var(--ink)" : "var(--dim)", border: "1px solid rgba(255,255,255,.08)" }}
                            >
                              {text}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span className="eyebrow" style={{ width: 34, flex: "none" }}>RPE</span>
                          {RPE_VALUES.map((v) => (
                            <button
                              key={v}
                              onClick={() => editDetail(entry.id, set.id, { rpe: set.rpe === v ? null : v })}
                              aria-pressed={set.rpe === v}
                              aria-label={`Effort perçu ${v} sur 10`}
                              style={{ flex: 1, minHeight: 40, borderRadius: 11, cursor: "pointer", font: "700 13px var(--mono)", background: set.rpe === v ? "var(--acc)" : "var(--surf2)", color: set.rpe === v ? "var(--ink)" : "var(--dim)", border: "1px solid rgba(255,255,255,.08)" }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        <input
                          className="field"
                          aria-label="Note sur la série"
                          placeholder="Note (sensation, tempo, douleur…)"
                          maxLength={140}
                          defaultValue={set.note ?? ""}
                          onChange={(e) => editDetail(entry.id, set.id, { note: e.target.value })}
                          style={{ height: 44, borderRadius: 12, font: "500 13px var(--sans)" }}
                        />
                      </div>
                    )}
                    </div>
                    );
                  })}

                  <div style={{ display: "flex", gap: 8, marginTop: 4, marginBottom: 8 }}>
                    <form action={addWarmup} style={{ flex: 1 }}>
                      <input type="hidden" name="entryId" value={entry.id} />
                      <button
                        type="submit"
                        style={{ width: "100%", minHeight: 42, borderRadius: 13, background: "var(--surf2)", border: "1px solid var(--hair)", color: "var(--dim)", font: "600 12px var(--sans)", cursor: "pointer" }}
                      >
                        + Échauffement
                      </button>
                    </form>
                    {i > 0 && (
                      <form action={toggleSuperset} style={{ flex: 1 }}>
                        <input type="hidden" name="entryId" value={entry.id} />
                        <button
                          type="submit"
                          aria-pressed={entry.superset}
                          style={{
                            width: "100%", minHeight: 42, borderRadius: 13, cursor: "pointer", font: "600 12px var(--sans)",
                            background: entry.superset ? "rgba(255,91,30,.14)" : "var(--surf2)",
                            border: `1px solid ${entry.superset ? "rgba(255,91,30,.4)" : "var(--hair)"}`,
                            color: entry.superset ? "var(--acc)" : "var(--dim)",
                          }}
                        >
                          {entry.superset ? "Superset ✓" : "Superset"}
                        </button>
                      </form>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
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

                  <form
                    action={setEntryNote}
                    style={{ marginTop: 9, padding: "0 13px", borderRadius: 13, background: "#121110", border: "1px solid rgba(255,255,255,.06)", display: "flex", gap: 9, alignItems: "center", color: "var(--dark)" }}
                  >
                    <input type="hidden" name="entryId" value={entry.id} />
                    <IconPencil size={14} />
                    <input
                      name="note"
                      defaultValue={entry.note ?? ""}
                      maxLength={200}
                      placeholder="Note sur l'exercice (réglage, sensation…)"
                      aria-label={`Note sur ${entry.name}`}
                      // Enregistré en quittant le champ ou avec Entrée.
                      onBlur={(e) => {
                        if (e.currentTarget.value.trim() !== (entry.note ?? "")) e.currentTarget.form?.requestSubmit();
                      }}
                      style={{ flex: 1, minWidth: 0, height: 44, background: "none", border: 0, outline: "none", color: "var(--faint)", font: "400 12px var(--sans)" }}
                    />
                  </form>
                </div>
              )}
            </div>
          );
        })}

        <Link
          href="/biblio"
          className="tap"
          style={{ minHeight: 56, borderRadius: 18, border: "1px dashed rgba(255,255,255,.16)", color: "var(--acc)", font: "600 15px var(--sans)", display: "grid", placeItems: "center", marginTop: 2 }}
        >
          + Ajouter un exercice
        </Link>

        {local.length > 0 && (
          <form action={saveAsRoutine}>
            <input type="hidden" name="workoutId" value={workoutId} />
            <button type="submit" className="ghostbtn tap">
              ☆ Enregistrer comme routine
            </button>
          </form>
        )}
      </div>

      {planned && (
        <div style={{ position: "sticky", bottom: 0, padding: "24px 20px 12px", background: "linear-gradient(to bottom, transparent, var(--ink) 45%)" }}>
          <form action={startWorkout}>
            <input type="hidden" name="workoutId" value={workoutId} />
            <button type="submit" className="primary" disabled={local.length === 0} style={{ minHeight: 58, borderRadius: 19, boxShadow: "0 14px 34px rgba(0,0,0,.6)" }}>
              ▶ Démarrer la séance
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function SessionHeader({
  workoutId,
  planned,
  name,
  elapsed,
  count,
  canFinish,
}: {
  workoutId: string;
  planned: boolean;
  name: string;
  elapsed: number;
  count: number;
  canFinish?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <header style={{ padding: "6px 20px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0, flex: 1 }}>
        <Link href="/seance" style={{ font: "600 12px var(--sans)", color: "var(--dim)" }}>← Mes séances</Link>
        {editing ? (
          <form action={renameWorkout} onSubmit={() => setEditing(false)} style={{ display: "flex", gap: 8 }}>
            <input type="hidden" name="workoutId" value={workoutId} />
            <input className="field" name="name" defaultValue={name} autoFocus style={{ height: 40, borderRadius: 12 }} />
            <button type="submit" className="iconbtn" aria-label="Valider" style={{ height: 40, width: 40, minWidth: 40 }}>
              <IconCheck size={15} />
            </button>
          </form>
        ) : (
          <h1 style={{ margin: 0 }}>
            <button
              onClick={() => setEditing(true)}
              aria-label={`Renommer la séance « ${name} »`}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--txt)", textAlign: "left", font: "700 24px var(--sans)", letterSpacing: "-.5px" }}
            >
              <span>{name}</span>
              <span style={{ color: "var(--faint)", display: "grid" }}><IconPencil /></span>
            </button>
          </h1>
        )}
        <span style={{ font: "500 12px var(--mono)", color: "var(--mut)" }}>
          {planned ? "À VENIR · " : `${mmss(elapsed)} · `}{count} exercice{count > 1 ? "s" : ""}
        </span>
      </div>

      {planned ? (
        <form action={deleteWorkout}>
          <input type="hidden" name="workoutId" value={workoutId} />
          <button type="submit" aria-label="Supprimer la séance" style={actionBtn}>
            <IconTrash />
          </button>
        </form>
      ) : (
        <form action={finishWorkout}>
          <input type="hidden" name="workoutId" value={workoutId} />
          <input type="hidden" name="elapsed" value={elapsed} />
          <button
            type="submit"
            disabled={!canFinish}
            style={{
              flex: "none", minHeight: 44, padding: "0 16px", borderRadius: 14,
              background: canFinish ? "var(--acc)" : "var(--surf2)", border: "1px solid rgba(255,255,255,.1)",
              color: canFinish ? "var(--ink)" : "var(--dark)",
              font: "700 13px var(--sans)", cursor: canFinish ? "pointer" : "default",
            }}
          >
            Terminer
          </button>
        </form>
      )}
    </header>
  );
}
