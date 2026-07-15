import { db } from "./db";

// ponytail: no holiday calendar, add regional holidays later
export function computeWorkingDays(
  start: Date,
  end: Date,
  halfDayStart = false,
  halfDayEnd = false
): number {
  let days = 0;
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cur <= last) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      let day = 1;
      if (halfDayStart && cur.getTime() === new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())).getTime()) {
        day -= 0.5;
      }
      if (halfDayEnd && cur.getTime() === last.getTime()) {
        day -= 0.5;
      }
      days += day;
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  return days;
}

export async function getLeaveBalance(employeeId: string, typeId: string, year: number) {
  const [entitlement, requests] = await Promise.all([
    db.leaveEntitlement.findUnique({
      where: { employeeId_typeId_year: { employeeId, typeId, year } },
    }),
    db.leaveRequest.findMany({
      where: {
        employeeId,
        typeId,
        status: "APPROVED",
        startDate: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) },
      },
      select: { workingDays: true },
    }),
  ]);

  const allocated = entitlement?.days ?? 0;
  const used = requests.reduce((sum, r) => sum + r.workingDays, 0);

  return { allocated, used, remaining: allocated - used };
}
