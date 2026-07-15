import { getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { sumHours, startOfWeek } from "@/lib/time";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockWidget } from "@/components/time/clock-widget";
import { TimeEntriesSection } from "@/components/time/time-entries-section";

export default async function TimePage() {
  const session = await requireAuth();
  const t = await getTranslations("time");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });

  if (!user?.employeeId) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <Card>
          <CardContent className="text-sm text-muted-foreground">{t("noEmployee")}</CardContent>
        </Card>
      </div>
    );
  }

  const employeeId = user.employeeId;
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [openEntry, weekEntries] = await Promise.all([
    db.timeEntry.findFirst({ where: { employeeId, end: null } }),
    db.timeEntry.findMany({
      where: { employeeId, date: { gte: weekStart, lt: weekEnd } },
      orderBy: { date: "asc" },
    }),
  ]);

  const weekTotal = sumHours(weekEntries);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>

      <ClockWidget openEntryStart={openEntry ? openEntry.start.toISOString() : null} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("thisWeek")}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {t("totalHours")}:{" "}
            <span className="text-base font-semibold tabular-nums text-foreground">{weekTotal}</span>
          </div>
        </CardHeader>
        <CardContent>
          <TimeEntriesSection
            entries={weekEntries.map((e) => ({
              id: e.id,
              date: e.date.toISOString(),
              start: e.start.toISOString(),
              end: e.end ? e.end.toISOString() : null,
              breakMinutes: e.breakMinutes,
              note: e.note,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
