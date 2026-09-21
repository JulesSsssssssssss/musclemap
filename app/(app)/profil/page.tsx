import Link from "next/link";
import { SettingsRows } from "@/components/SettingsRows";
import { IconChevron } from "@/components/Icons";
import { LogoutForm } from "@/components/LogoutForm";
import { requireUser } from "@/lib/auth";
import { WeeklyGoal } from "@/components/WeeklyGoal";
import { profileStats, weeklyGoalFor } from "@/lib/queries";
import { num } from "@/lib/format";

export const metadata = { title: "Profil · MuscleMap" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [stats, goal] = await Promise.all([profileStats(user.id), weeklyGoalFor(user.id, user.sessionsPerWeek)]);
  const perWeek = stats.months > 0 ? (stats.workouts / (stats.months * 4.33)).toFixed(1).replace(".0", "") : "0";

  return (
    <div className="scroll">
      <div style={{ padding: "8px 20px 18px", display: "flex", alignItems: "center", gap: 15 }}>
        <div className="gif" style={{ width: 64, height: 64, borderRadius: 22, border: "1px solid var(--hair)", display: "grid", placeItems: "center" }}>
          <span style={{ font: "700 22px var(--sans)", color: "var(--faint)" }}>{user.name.slice(0, 1).toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          <h1 style={{ margin: 0, font: "700 22px var(--sans)", letterSpacing: "-.5px" }}>{user.name}</h1>
          <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>
            {perWeek} SÉANCES / SEMAINE · {stats.months} MOIS
          </span>
        </div>
      </div>

      <div style={{ padding: "0 20px 18px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
        {[
          { value: num(stats.workouts), label: "SÉANCES", accent: false },
          { value: `${num(stats.totalKg / 1000)} t`, label: "SOULEVÉS", accent: false },
          { value: num(stats.records), label: "RECORDS", accent: true },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: 13, borderRadius: 16,
              background: s.accent ? "rgba(255,91,30,.1)" : "var(--surf)",
              border: `1px solid ${s.accent ? "rgba(255,91,30,.28)" : "var(--hair)"}`,
            }}
          >
            <div style={{ font: "700 21px var(--sans)", letterSpacing: "-.6px", color: s.accent ? "var(--acc)" : "var(--txt)" }}>{s.value}</div>
            <span style={{ font: "500 9px var(--mono)", color: "var(--mut)" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <WeeklyGoal {...goal} />

      <div style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 9 }}>
        <span className="eyebrow">RÉGLAGES</span>

        <SettingsRows unit={user.unit} restSeconds={user.restSeconds} theme={user.theme} sessionsPerWeek={user.sessionsPerWeek} />

        {[
          { href: "/progression", label: "Historique des séances" },
          { href: "/calendrier", label: "Calendrier des séances" },
          { href: "/corps", label: "Suivi corporel" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{ padding: "14px 16px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", color: "inherit" }}
          >
            <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>{l.label}</span>
            <span style={{ color: "var(--ghost)" }}><IconChevron /></span>
          </Link>
        ))}

        <a
          href="/api/export"
          style={{ padding: "14px 16px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", color: "inherit" }}
        >
          <span style={{ font: "600 14px var(--sans)", color: "var(--txt)" }}>Exporter mes données</span>
          <span style={{ font: "500 11px var(--mono)", color: "var(--mut)" }}>CSV</span>
        </a>

        <div style={{ padding: "14px 16px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ font: "600 14px var(--sans)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</span>
          <LogoutForm />
        </div>
      </div>
    </div>
  );
}
