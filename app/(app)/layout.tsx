import { requireAuth, can } from "@/lib/rbac";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { ContentTransition } from "@/components/content-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const canSettings = can(session.user.role, "settings:write");
  const canApprove = can(session.user.role, "leave:approve");
  const canViewTeamTime = can(session.user.role, "time:view-team");

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar canSettings={canSettings} canApprove={canApprove} canViewTeamTime={canViewTeamTime} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={{ email: session.user.email ?? "", role: session.user.role }} />
        <main className="flex-1 p-8">
          <ContentTransition>{children}</ContentTransition>
        </main>
      </div>
    </div>
  );
}
