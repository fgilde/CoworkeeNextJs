import { getTranslations, getLocale } from "next-intl/server";
import { Building2, Briefcase, MapPin, CalendarDays, Clock, FileText, CircleCheck, Users2, Building } from "lucide-react";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeamTiles } from "@/components/dashboard/team-tiles";

export default async function DashboardPage() {
  const session = await requireAuth();
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });

  const employee = currentUser?.employeeId
    ? await db.employee.findUnique({
        where: { id: currentUser.employeeId },
        include: {
          department: true,
          position: true,
          location: true,
          reports: { include: { position: true } },
        },
      })
    : null;

  const greetingName = employee?.firstName ?? session.user.email ?? "";

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  let companyStats: { total: number; active: number; departments: number } | null = null;
  if (session.user.role === "HR" || session.user.role === "ADMIN") {
    const [total, active, departments] = await Promise.all([
      db.employee.count(),
      db.employee.count({ where: { status: "ACTIVE" } }),
      db.department.count(),
    ]);
    companyStats = { total, active, departments };
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("greeting", { name: greetingName })}</h1>

      {employee ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myDetails")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StatCard label={t("department")} value={employee.department?.name ?? t("notSet")} icon={Building2} />
            <StatCard label={t("position")} value={employee.position?.title ?? t("notSet")} icon={Briefcase} />
            <StatCard label={t("location")} value={employee.location?.name ?? t("notSet")} icon={MapPin} />
            <StatCard label={t("hireDate")} value={dateFormatter.format(employee.hireDate)} icon={CalendarDays} />
            <StatCard label={t("workload")} value={`${employee.workload}%`} icon={Clock} />
            <StatCard label={t("contractType")} value={t(`contractTypes.${employee.contractType}`)} icon={FileText} />
            <StatCard label={t("status")} value={t(`statuses.${employee.status}`)} icon={CircleCheck} />
          </div>
        </section>
      ) : (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployeeLinked")}</CardContent>
        </Card>
      )}

      {session.user.role === "MANAGER" && employee && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myTeam")}</h2>
          {employee.reports.length > 0 ? (
            <TeamTiles reports={employee.reports} />
          ) : (
            <Card>
              <CardContent className="text-sm text-muted-foreground">{t("noReports")}</CardContent>
            </Card>
          )}
        </section>
      )}

      {companyStats && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("companyOverview")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label={t("totalEmployees")} value={companyStats.total} icon={Users2} />
            <StatCard label={t("activeEmployees")} value={companyStats.active} icon={CircleCheck} />
            <StatCard label={t("departmentsCount")} value={companyStats.departments} icon={Building} />
          </div>
        </section>
      )}
    </div>
  );
}
