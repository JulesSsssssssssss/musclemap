import Link from "next/link";
import { IconChevron } from "@/components/Icons";
import { ScreenHeader } from "@/components/ScreenHeader";
import { requireUser } from "@/lib/auth";
import { MONTH_NAMES, dayKey, daysInMonth, monthKey, parseMonth, shiftMonth, weekday } from "@/lib/dates";
import { mmss, num } from "@/lib/format";
import { workoutsBetween } from "@/lib/queries";

export const metadata = { title: "Calendrier · MuscleMap" };

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ m?: string; j?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;

  const today = dayKey(new Date());
  const { y, m } = parseMonth(query.m, today);
  const key = monthKey(y, m);
  const prev = shiftMonth(y, m, -1);
  const next = shiftMonth(y, m, 1);
  const hasNext = monthKey(next.y, next.m) <= today.slice(0, 7);

  // Marge d'un jour de chaque côté : le regroupement par jour se fait ensuite à Paris.
  const workouts = await workoutsBetween(user.id, new Date(Date.UTC(y, m - 1, 1) - 86_400_000), new Date(Date.UTC(y, m, 1) + 86_400_000));
  const byDay = new Map<string, typeof workouts>();
  for (const w of workouts) {
    const k = dayKey(w.startedAt);
    if (k.startsWith(key)) byDay.set(k, [...(byDay.get(k) ?? []), w]);
  }

  const selected = query.j && byDay.has(query.j) ? query.j : null;
  const inMonth = [...byDay.values()].flat();
  const volume = inMonth.reduce((a, w) => a + w.volumeKg, 0);
  const cells: (number | null)[] = [
    ...Array<null>(weekday(`${key}-01`)).fill(null),
    ...Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1),
  ];
  const href = (k: string, j?: string) => `/calendrier?m=${k}${j ? `&j=${j}` : ""}`;
  const navBtn: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 13, background: "var(--surf2)", border: "1px solid var(--hair)",
    color: "var(--txt)", display: "grid", placeItems: "center",
  };

  const shown = selected ? byDay.get(selected)! : [];

  return (
    <div className="scroll">
      <ScreenHeader back="/progression" eyebrow="CALENDRIER" title="Mes séances" />

      <div style={{ padding: "0 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href={href(monthKey(prev.y, prev.m))} aria-label="Mois précédent" style={{ ...navBtn, transform: "scaleX(-1)" }}>
          <IconChevron />
        </Link>
        <h2 style={{ margin: 0, font: "700 19px var(--sans)", letterSpacing: "-.4px" }}>{MONTH_NAMES[m - 1]} {y}</h2>
        {hasNext ? (
          <Link href={href(monthKey(next.y, next.m))} aria-label="Mois suivant" style={navBtn}>
            <IconChevron />
          </Link>
        ) : (
          <span aria-hidden="true" style={{ ...navBtn, opacity: 0.3 }}><IconChevron /></span>
        )}
      </div>

      <div style={{ margin: "0 20px 14px", padding: 12, borderRadius: 22, background: "var(--surf)", border: "1px solid var(--hair)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, paddingBottom: 6 }}>
          {WEEKDAYS.map((d, i) => (
            <span key={i} style={{ textAlign: "center", font: "500 10px var(--mono)", color: "var(--ghost)" }}>{d}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            if (day === null) return <span key={`e${i}`} />;
            const k = `${key}-${String(day).padStart(2, "0")}`;
            const sessions = byDay.get(k)?.length ?? 0;
            const isToday = k === today;
            const isSelected = k === selected;
            const style: React.CSSProperties = {
              minHeight: 44, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
              font: "600 14px var(--sans)",
              background: sessions ? "var(--acc)" : "transparent",
              color: sessions ? "var(--ink)" : k > today ? "var(--ghost)" : "var(--dim)",
              border: `1.5px solid ${isSelected ? "#fff" : isToday ? "var(--acc)" : "transparent"}`,
            };
            return sessions ? (
              <Link
                key={k}
                href={href(key, k)}
                scroll={false}
                aria-label={`${day} ${MONTH_NAMES[m - 1]} : ${sessions} séance${sessions > 1 ? "s" : ""}`}
                aria-current={isSelected ? "date" : undefined}
                style={{ ...style, color: "var(--ink)" }}
              >
                {day}
                {sessions > 1 && <span style={{ font: "700 9px var(--mono)" }}>×{sessions}</span>}
              </Link>
            ) : (
              <span key={k} style={style} aria-current={isToday ? "date" : undefined}>{day}</span>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
        {[
          { label: "SÉANCES", value: String(inMonth.length) },
          { label: "JOURS ACTIFS", value: String(byDay.size) },
          { label: "VOLUME", value: `${num(volume / 1000)} t` },
        ].map((s) => (
          <div key={s.label} style={{ padding: 13, borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)" }}>
            <div style={{ font: "700 21px var(--sans)", letterSpacing: "-.6px" }}>{s.value}</div>
            <span style={{ font: "500 9px var(--mono)", color: "var(--mut)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 9 }}>
        {selected ? (
          <>
            <span className="eyebrow">{Number(selected.slice(8))} {MONTH_NAMES[m - 1].toUpperCase()}</span>
            {shown.map((w) => (
              <Link
                key={w.id}
                href={`/seance/${w.id}/resume`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)", color: "inherit" }}
              >
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>{w.name}</span>
                  <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>
                    {mmss(w.durationSec)} · {w._count.entries} EXOS
                  </span>
                </div>
                <span style={{ font: "600 13px var(--mono)", color: "var(--acc)" }}>{num(w.volumeKg)} {user.unit}</span>
              </Link>
            ))}
          </>
        ) : (
          <p style={{ margin: 0, textAlign: "center", font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            {inMonth.length ? "Touche un jour en orange pour revoir ses séances." : "Aucune séance terminée ce mois-ci."}
          </p>
        )}
      </div>
    </div>
  );
}
