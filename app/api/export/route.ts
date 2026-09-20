import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Export CSV de toutes les séries enregistrées. */
export async function GET() {
  const user = await requireUser();

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id, status: "done" },
    orderBy: { startedAt: "asc" },
    include: {
      entries: {
        orderBy: { position: "asc" },
        include: { exercise: true, sets: { orderBy: { position: "asc" } } },
      },
    },
  });

  const escape = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [["date", "seance", "exercice", "equipement", "muscle", "serie", "poids_kg", "reps", "validee"]];

  for (const w of workouts) {
    for (const entry of w.entries) {
      for (const set of entry.sets) {
        rows.push([
          w.startedAt.toISOString().slice(0, 10),
          w.name,
          entry.exercise.name,
          entry.exercise.equipment,
          entry.exercise.muscle,
          String(set.position + 1),
          String(set.weight),
          String(set.reps),
          set.done ? "oui" : "non",
        ]);
      }
    }
  }

  const csv = rows.map((r) => r.map(escape).join(";")).join("\n");

  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="musclemap-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
