import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { ContentTransition } from "@/components/content-transition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const canSettings = can(session.user.role, "settings:write");
  const canApprove = can(session.user.role, "leave:approve");
  const canViewTeamTime = can(session.user.role, "time:view-team");
  const canAnalytics = can(session.user.role, "analytics:view");
  const canRecruiting = can(session.user.role, "recruiting:manage");

  const [notifications, unreadCount, companySettings] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.notification.count({ where: { userId: session.user.id, read: false } }),
    db.companySettings.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        canSettings={canSettings}
        canApprove={canApprove}
        canViewTeamTime={canViewTeamTime}
        canAnalytics={canAnalytics}
        canRecruiting={canRecruiting}
        companyName={companySettings?.companyName}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={{ email: session.user.email ?? "", role: session.user.role }}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-8">
          <ContentTransition>{children}</ContentTransition>
        </main>
      </div>
    </div>
  );
}
