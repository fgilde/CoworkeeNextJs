import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/analytics/stat-tile";
import { BarChart, type BarDatum } from "@/components/analytics/bar-chart";
import { DonutChart, type DonutSlice } from "@/components/analytics/donut-chart";
import { ChartDataTable } from "@/components/analytics/chart-data-table";

const CONTRACT_SLOTS = [
  { type: "PERMANENT", colorVar: "--slot1" },
  { type: "TEMPORARY", colorVar: "--slot2" },
  { type: "INTERN", colorVar: "--slot3" },
  { type: "WORKING_STUDENT", colorVar: "--slot4" },
] as const;

export default async function AnalyticsPage() {
  await requireRole("HR", "ADMIN");
  const t = await getTranslations("analytics");
  const tEmployees = await getTranslations("employees");

  const now = new Date();
  const currentYear = now.getFullYear();
  const yearStart = new Date(Date.UTC(currentYear, 0, 1));
  const nextYearStart = new Date(Date.UTC(currentYear + 1, 0, 1));

  const [employees, departmentCount, pendingRequests, openGoals, approvedLeaves] = await Promise.all([
    db.employee.findMany({
      select: {
        status: true,
        contractType: true,
        hireDate: true,
        department: { select: { name: true } },
      },
    }),
    db.department.count(),
    db.leaveRequest.count({ where: { status: "PENDING" } }),
    db.goal.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.leaveRequest.findMany({
      where: { status: "APPROVED", startDate: { gte: yearStart, lt: nextYearStart } },
      select: { workingDays: true, type: { select: { id: true, name: true, colorHex: true } } },
    }),
  ]);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "ACTIVE").length;

  const avgTenureYears =
    totalEmployees === 0
      ? 0
      : employees.reduce((sum, e) => sum + (now.getTime() - e.hireDate.getTime()) / (365.25 * 86400000), 0) /
        totalEmployees;

  // Headcount by department — sorted descending, single-hue magnitude chart.
  const deptCounts = new Map<string, number>();
  for (const e of employees) {
    const name = e.department?.name ?? "—";
    deptCounts.set(name, (deptCounts.get(name) ?? 0) + 1);
  }
  const headcountData: BarDatum[] = [...deptCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ key: name, label: name, value: count }));

  // Contract type distribution — fixed slot order, never re-ranked by count.
  const contractCounts = new Map<string, number>();
  for (const e of employees) {
    contractCounts.set(e.contractType, (contractCounts.get(e.contractType) ?? 0) + 1);
  }
  const contractData: DonutSlice[] = CONTRACT_SLOTS.map(({ type, colorVar }) => ({
    key: type,
    label: tEmployees(`contractTypes.${type}`),
    value: contractCounts.get(type) ?? 0,
    colorVar,
  }));

  // New hires by year — one bar per year from the earliest hire to the current year.
  const hireYears = employees.map((e) => e.hireDate.getFullYear());
  const minYear = hireYears.length > 0 ? Math.min(...hireYears) : currentYear;
  const hiresByYear = new Map<number, number>();
  for (const y of hireYears) hiresByYear.set(y, (hiresByYear.get(y) ?? 0) + 1);
  const newHiresData: BarDatum[] = [];
  for (let year = minYear; year <= currentYear; year++) {
    newHiresData.push({ key: String(year), label: String(year), value: hiresByYear.get(year) ?? 0 });
  }

  // Approved leave days by type (this year) — data-owned color from the LeaveType itself.
  const leaveDaysByType = new Map<string, { name: string; colorHex: string; days: number }>();
  for (const r of approvedLeaves) {
    const entry = leaveDaysByType.get(r.type.id) ?? { name: r.type.name, colorHex: r.type.colorHex, days: 0 };
    entry.days += r.workingDays;
    leaveDaysByType.set(r.type.id, entry);
  }
  const leaveDaysData: BarDatum[] = [...leaveDaysByType.values()]
    .sort((a, b) => b.days - a.days)
    .map((entry) => ({ key: entry.name, label: entry.name, value: entry.days, color: entry.colorHex }));

  const numberFormat = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatTile label={t("totalEmployees")} value={totalEmployees} />
        <StatTile label={t("activeEmployees")} value={activeEmployees} />
        <StatTile label={t("departments")} value={departmentCount} />
        <StatTile label={t("avgTenure")} value={`${avgTenureYears.toFixed(1)}`} subNote={t("years")} />
        <StatTile label={t("pendingRequests")} value={pendingRequests} />
        <StatTile label={t("openGoals")} value={openGoals} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("headcountByDept")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={headcountData} orientation="horizontal" emptyLabel={t("noData")} />
            <ChartDataTable
              caption={t("showTable")}
              categoryHeader={t("category")}
              valueHeader={t("value")}
              rows={headcountData.map((d) => ({ label: d.label, value: String(d.value) }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("contractTypes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={contractData} totalLabel={t("employees")} emptyLabel={t("noData")} />
            <ChartDataTable
              caption={t("showTable")}
              categoryHeader={t("category")}
              valueHeader={t("value")}
              rows={contractData.map((d) => ({ label: d.label, value: String(d.value) }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("newHiresByYear")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={newHiresData} orientation="vertical" emptyLabel={t("noData")} />
            <ChartDataTable
              caption={t("showTable")}
              categoryHeader={t("category")}
              valueHeader={t("value")}
              rows={newHiresData.map((d) => ({ label: d.label, value: String(d.value) }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("leaveDaysByType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={leaveDaysData}
              orientation="horizontal"
              valueFormatter={numberFormat}
              emptyLabel={t("noData")}
            />
            <ChartDataTable
              caption={t("showTable")}
              categoryHeader={t("category")}
              valueHeader={t("value")}
              rows={leaveDaysData.map((d) => ({ label: d.label, value: numberFormat(d.value) }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
