import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { sumHours, startOfWeek } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TeamTimePage() {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const t = await getTranslations("time");

  let managerEmployeeId: string | undefined;
  if (session.user.role === "MANAGER") {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });
    managerEmployeeId = user?.employeeId ?? "__none__";
  }

  const employees = await db.employee.findMany({
    where: managerEmployeeId ? { managerId: managerEmployeeId } : undefined,
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const entries = await db.timeEntry.findMany({
    where: {
      employeeId: { in: employees.map((e) => e.id) },
      date: { gte: weekStart, lt: weekEnd },
    },
    select: { employeeId: true, start: true, end: true, breakMinutes: true },
  });

  const byEmployee = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = byEmployee.get(entry.employeeId);
    if (list) list.push(entry);
    else byEmployee.set(entry.employeeId, [entry]);
  }

  const rows = employees.map((emp) => {
    const list = byEmployee.get(emp.id) ?? [];
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      total: sumHours(list),
      clockedIn: list.some((e) => e.end === null),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("teamTime")}</h1>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noTeamEntries")}</CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("employee")}</TableHead>
              <TableHead>{t("totalHours")}</TableHead>
              <TableHead>{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="tabular-nums">{row.total}</TableCell>
                <TableCell>
                  {row.clockedIn ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      {t("clockedInStatus")}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t("clockedOutStatus")}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
