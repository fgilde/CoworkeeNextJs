import { getTranslations, getLocale } from "next-intl/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeamAbsencesPage() {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const t = await getTranslations("absences");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  let managerEmployeeId: string | undefined;
  if (session.user.role === "MANAGER") {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });
    managerEmployeeId = user?.employeeId ?? "__none__";
  }

  // Current month through the end of next month.
  const now = new Date();
  const rangeStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const rangeEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 2, 0));

  const requests = await db.leaveRequest.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { lte: rangeEnd },
      endDate: { gte: rangeStart },
      ...(managerEmployeeId ? { employee: { managerId: managerEmployeeId } } : {}),
    },
    include: { employee: true, type: true },
    orderBy: [{ employee: { lastName: "asc" } }, { startDate: "asc" }],
  });

  const byEmployee = new Map<string, { name: string; items: typeof requests }>();
  for (const request of requests) {
    const entry = byEmployee.get(request.employeeId);
    if (entry) {
      entry.items.push(request);
    } else {
      byEmployee.set(request.employeeId, {
        name: `${request.employee.firstName} ${request.employee.lastName}`,
        items: [request],
      });
    }
  }
  const groups = [...byEmployee.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("teamAbsences")}</h1>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noTeamAbsences")}</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.name}>
              <CardContent className="flex flex-col gap-2">
                <div className="font-medium">{group.name}</div>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {group.items.map((request) => (
                    <li key={request.id} className="flex flex-wrap items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: request.type.colorHex }}
                        aria-hidden
                      />
                      <span>
                        {dateFormatter.format(request.startDate)} – {dateFormatter.format(request.endDate)}
                      </span>
                      <span className="text-muted-foreground">{request.type.name}</span>
                      {request.status === "PENDING" && (
                        <Badge variant="secondary" className="ml-auto">
                          {t("status.PENDING")}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
