import { requireUser } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { OfflineBadge } from "@/components/OfflineBadge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="frame app-shell">
      <OfflineBadge />
      <div className="app-main">{children}</div>
      <BottomNav />
    </div>
  );
}
