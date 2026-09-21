"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavBody, NavChart, NavList, NavSession, NavUser } from "./Icons";

const ITEMS = [
  { href: "/", label: "Corps", Icon: NavBody, match: (p: string) => p === "/" || p.startsWith("/muscle") },
  { href: "/biblio", label: "Exercices", Icon: NavList, match: (p: string) => p.startsWith("/biblio") || p.startsWith("/exercice") },
  { href: "/seance", label: "Séance", Icon: NavSession, match: (p: string) => p.startsWith("/seance") },
  { href: "/progression", label: "Progrès", Icon: NavChart, match: (p: string) => ["/progression", "/calendrier", "/corps"].some((r) => p.startsWith(r)) },
  { href: "/profil", label: "Profil", Icon: NavUser, match: (p: string) => p.startsWith("/profil") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottomnav">
      {ITEMS.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} className="navlink" aria-current={match(pathname) ? "page" : undefined}>
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
