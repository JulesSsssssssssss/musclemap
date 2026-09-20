import Link from "next/link";
import { IconBack } from "./Icons";

export function ScreenHeader({
  back,
  eyebrow,
  title,
}: {
  back?: string;
  eyebrow: string;
  title: React.ReactNode;
}) {
  return (
    <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 20px 12px" }}>
      {back && (
        <Link href={back} className="iconbtn" aria-label="Retour">
          <IconBack />
        </Link>
      )}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span className="eyebrow">{eyebrow}</span>
        <h1 style={{ margin: 0, font: "700 22px var(--sans)", letterSpacing: "-.4px" }}>{title}</h1>
      </div>
    </header>
  );
}
