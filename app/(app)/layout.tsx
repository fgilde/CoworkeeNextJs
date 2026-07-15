import { requireAuth, can } from "@/lib/rbac";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const canSettings = can(session.user.role, "settings:write");

  return (
    <div className="flex min-h-screen">
      <AppSidebar canSettings={canSettings} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={{ email: session.user.email ?? "", role: session.user.role }} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
