import { BodyForm } from "@/components/BodyForm";
import { IconTrash } from "@/components/Icons";
import { ProgressChart } from "@/components/ProgressChart";
import { ScreenHeader } from "@/components/ScreenHeader";
import { deleteBodyEntry } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { dayKey } from "@/lib/dates";
import { dec, toUnit } from "@/lib/format";
import { listBodyEntries } from "@/lib/queries";

export const metadata = { title: "Suivi corporel · MuscleMap" };

const MEASURES = [
  { key: "chest", label: "Poitrine" },
  { key: "waist", label: "Taille" },
  { key: "hips", label: "Hanches" },
  { key: "arm", label: "Bras" },
  { key: "thigh", label: "Cuisse" },
] as const;

const frDate = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

const sign = (n: number) => (n > 0 ? "+" : n < 0 ? "−" : "±");
const round1 = (n: number) => Math.round(n * 10) / 10;

export default async function BodyPage() {
  const user = await requireUser();
  const entries = await listBodyEntries(user.id); // du plus récent au plus ancien
  const chronological = [...entries].reverse();

  const weights = chronological.filter((e) => e.weight !== null);
  const points = weights.map((e) => ({ date: e.date, value: toUnit(e.weight!, user.unit) }));
  const latestWeight = points.at(-1)?.value;
  const weightDelta = points.length > 1 ? points.at(-1)!.value - points[0].value : null;

  // Mensurations : dernière valeur connue et évolution depuis la première.
  const measures = MEASURES.map((m) => {
    const known = chronological.map((e) => e[m.key]).filter((v): v is number => v !== null);
    return { ...m, latest: known.at(-1), delta: known.length > 1 ? known.at(-1)! - known[0] : null };
  }).filter((m) => m.latest !== undefined);

  const photos = chronological.filter((e) => e.photoType);
  const before = photos.length > 1 ? photos[0] : null;
  const after = photos.length > 1 ? photos.at(-1)! : null;

  return (
    <div className="scroll">
      <ScreenHeader back="/progression" eyebrow="SUIVI CORPOREL" title="Mon corps" />

      <section style={{ margin: "0 20px 16px", padding: "16px 14px 12px", borderRadius: 22, background: "var(--surf)", border: "1px solid var(--hair)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, padding: "0 4px 10px", flexWrap: "wrap" }}>
          <span style={{ font: "700 32px var(--sans)", letterSpacing: "-1.2px" }}>
            {latestWeight !== undefined ? dec(round1(latestWeight)) : "—"}
            <span style={{ fontSize: 15, color: "var(--mut)" }}> {user.unit}</span>
          </span>
          {weightDelta !== null && (
            <span style={{ font: "600 12px var(--mono)", color: "var(--acc)" }}>
              {sign(weightDelta)}{dec(Math.abs(round1(weightDelta)))} {user.unit} DEPUIS LE {frDate(weights[0].date).toUpperCase()}
            </span>
          )}
        </div>
        <ProgressChart points={points} label="Évolution du poids" format={(v) => dec(round1(v))} />
      </section>

      {measures.length > 0 && (
        <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
          {measures.map((m) => (
            <div key={m.key} style={{ padding: 13, borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)" }}>
              <div style={{ font: "700 20px var(--sans)", letterSpacing: "-.5px" }}>
                {dec(round1(m.latest!))}<span style={{ fontSize: 11, color: "var(--mut)" }}> cm</span>
              </div>
              <span style={{ font: "500 9px var(--mono)", color: "var(--mut)" }}>{m.label.toUpperCase()}</span>
              {m.delta !== null && (
                <div style={{ font: "600 10px var(--mono)", color: "var(--acc)", marginTop: 3 }}>
                  {sign(m.delta)}{dec(Math.abs(round1(m.delta)))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {before && after && (
        <section style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="eyebrow">AVANT / MAINTENANT</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[before, after].map((e, i) => (
              <figure key={e.id} style={{ margin: 0, position: "relative", borderRadius: 18, overflow: "hidden", border: "1px solid var(--hair)", background: "var(--surf)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/corps/${e.id}/photo`} alt={`Photo du ${frDate(e.date)}`} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "3 / 4", objectFit: "cover" }} />
                <figcaption style={{ position: "absolute", left: 8, bottom: 8, padding: "4px 8px", borderRadius: 8, background: "rgba(0,0,0,.65)", font: "600 10px var(--mono)", color: "#fff" }}>
                  {i === 0 ? "AVANT" : "MAINTENANT"} · {frDate(e.date).toUpperCase()}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="eyebrow">NOUVEAU RELEVÉ</span>
        <BodyForm today={dayKey(new Date())} unit={user.unit} />
      </section>

      <section style={{ padding: "0 20px 24px", display: "flex", flexDirection: "column", gap: 9 }}>
        <span className="eyebrow">HISTORIQUE</span>
        {entries.length === 0 && (
          <p style={{ margin: 0, font: "400 13px/1.5 var(--sans)", color: "var(--mut)" }}>
            Aucun relevé pour l&apos;instant. Ajoute ton poids, tes mensurations ou une photo pour suivre ta transformation.
          </p>
        )}
        {entries.map((e) => {
          const details = [
            e.weight !== null && `${dec(round1(toUnit(e.weight, user.unit)))} ${user.unit}`,
            ...MEASURES.filter((m) => e[m.key] !== null).map((m) => `${m.label} ${dec(round1(e[m.key]!))}`),
          ].filter(Boolean);
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: "var(--surf)", border: "1px solid var(--hair)" }}>
              {e.photoType && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/corps/${e.id}/photo`} alt="" loading="lazy" width={44} height={58} style={{ flex: "none", borderRadius: 10, objectFit: "cover", width: 44, height: 58 }} />
              )}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ font: "600 14px var(--sans)" }}>{frDate(e.date)}</span>
                <span style={{ font: "500 11px/1.4 var(--mono)", color: "var(--mut)" }}>
                  {details.length ? details.join(" · ") : "PHOTO"}
                </span>
              </div>
              <form action={deleteBodyEntry}>
                <input type="hidden" name="entryId" value={e.id} />
                <button
                  type="submit"
                  aria-label={`Supprimer le relevé du ${frDate(e.date)}`}
                  style={{ width: 44, height: 44, borderRadius: 13, background: "var(--surf2)", border: "1px solid var(--hair)", color: "var(--faint)", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}
                >
                  <IconTrash />
                </button>
              </form>
            </div>
          );
        })}
      </section>
    </div>
  );
}
