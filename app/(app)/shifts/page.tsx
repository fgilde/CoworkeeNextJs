import { getTranslations, getLocale } from "next-intl/server";
import { requireAuth, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { NewShiftForm, DeleteShiftButton } from "@/components/shifts/shift-forms";

// minutes from midnight -> "HH:MM"
function hhmm(min: number): string {
  return String(Math.floor(min / 60)).padStart(2, "0") + ":" + String(min % 60).padStart(2, "0");
}

export default async function ShiftsPage() {
  const session = await requireAuth();
  const t = await getTranslations("shifts");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  const employeeId = user?.employeeId ?? null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const header = <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>;
  const canManage = can(session.user.role, "shift:manage");

  const myShifts = employeeId
    ? await db.shift.findMany({
        where: { employeeId, date: { gte: today } },
        orderBy: { date: "asc" },
      })
    : [];

  const mySection = (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("myShifts")}</h2>
      {!employeeId ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
        </Card>
      ) : myShifts.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noShifts")}</CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {myShifts.map((shift) => (
            <Card key={shift.id}>
              <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-medium">{dateFormatter.format(shift.date)}</span>
                <span className="text-sm text-muted-foreground">
                  {hhmm(shift.startMin)}–{hhmm(shift.endMin)}
                </span>
                {shift.role && <span className="text-sm">{shift.role}</span>}
                {shift.location && <span className="text-sm text-muted-foreground">{shift.location}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );

  if (!canManage) {
    return (
      <div className="flex flex-col gap-8">
        {header}
        {mySection}
      </div>
    );
  }

  // MANAGER/HR/ADMIN — team scoped (MANAGER: own reports, HR/ADMIN: all active).
  const managerEmployeeId = session.user.role === "MANAGER" ? (employeeId ?? "__none__") : undefined;

  const inScopeEmployees = await db.employee.findMany({
    where: managerEmployeeId ? { managerId: managerEmployeeId } : { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const scopeIds = inScopeEmployees.map((e) => e.id);
  const employeeOptions = inScopeEmployees.map((e) => ({ id: e.id, name: `${e.firstName} ${e.lastName}` }));

  const teamShifts = await db.shift.findMany({
    where: { employeeId: { in: scopeIds }, date: { gte: today } },
    include: { employee: { select: { firstName: true, lastName: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      {header}
      {mySection}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("scheduleShift")}</h2>
        <NewShiftForm employees={employeeOptions} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">{t("teamShifts")}</h2>
        {teamShifts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noShifts")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {teamShifts.map((shift) => (
              <Card key={shift.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {shift.employee.firstName} {shift.employee.lastName}
                    </span>
                    <span className="text-sm text-muted-foreground">· {dateFormatter.format(shift.date)}</span>
                    <span className="text-sm text-muted-foreground">
                      {hhmm(shift.startMin)}–{hhmm(shift.endMin)}
                    </span>
                    {shift.role && <span className="text-sm">{shift.role}</span>}
                  </div>
                  <DeleteShiftButton id={shift.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
