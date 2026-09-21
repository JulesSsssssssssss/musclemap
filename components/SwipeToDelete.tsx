"use client";

import { useRef, useState, type ReactNode } from "react";
import { deleteWorkout } from "@/app/actions";

const ACTION_W = 84;

/** Glisser de droite à gauche révèle un bouton corbeille rouge (suppression d'une séance). */
export function SwipeToDelete({ workoutId, label, children }: { workoutId: string; label: string; children: ReactNode }) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ px: number; py: number; base: number; locked: boolean | null } | null>(null);
  const moved = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { px: e.clientX, py: e.clientY, base: x, locked: null };
    moved.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const dx = e.clientX - s.px;
    const dy = e.clientY - s.py;
    if (s.locked === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      s.locked = Math.abs(dx) > Math.abs(dy); // geste horizontal ou scroll vertical
      if (s.locked) {
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
    if (!s.locked) return;
    moved.current = true;
    setX(Math.max(-ACTION_W, Math.min(0, s.base + dx)));
  };

  const onPointerEnd = () => {
    const s = start.current;
    start.current = null;
    if (!s?.locked) return;
    setDragging(false);
    setX((cur) => (cur < -ACTION_W / 2 ? -ACTION_W : 0));
  };

  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden" }}>
      <form action={deleteWorkout} style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "flex-end" }}>
        <input type="hidden" name="workoutId" value={workoutId} />
        <button
          type="submit"
          aria-label={label}
          tabIndex={x === 0 ? -1 : 0}
          style={{ width: ACTION_W, border: 0, background: "#E5372B", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
          </svg>
        </button>
      </form>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (moved.current) {
            e.preventDefault();
            e.stopPropagation();
            moved.current = false;
          } else if (x !== 0) {
            e.preventDefault(); // un tap sur la card ouverte la referme
            e.stopPropagation();
            setX(0);
          }
        }}
        style={{
          position: "relative",
          transform: `translateX(${x}px)`,
          transition: dragging ? "none" : "transform .2s ease",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          background: "var(--surf)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
