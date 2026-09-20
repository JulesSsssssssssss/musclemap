import { requireUser } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="frame app-shell">
      <div className="app-main">{children}</div>
      <BottomNav />
    </div>
  );
}
