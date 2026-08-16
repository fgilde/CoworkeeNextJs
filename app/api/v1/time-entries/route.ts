import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize, pagination, reportIds } from "@/lib/api-helpers";
import { can } from "@/lib/rbac";

export async function GET(req: Request) {
  const auth = await authorize(req, "time:track");
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const { page, limit, skip, take } = pagination(url);

  // Scope mirrors the UI: without view-team, own entries only; MANAGER sees own+reports;
  // HR/ADMIN (view-team, no team scoping in UI) see all.
  let where: Prisma.TimeEntryWhereInput = {};
  const self = auth.user.employeeId;
  if (!can(auth.role, "time:view-team")) {
    if (!self) return Response.json({ data: [], page, limit, total: 0 });
    where = { employeeId: self };
  } else if (auth.role === "MANAGER") {
    if (!self) return Response.json({ data: [], page, limit, total: 0 });
    where = { employeeId: { in: [self, ...(await reportIds(self))] } };
  }

  const [data, total] = await Promise.all([
    db.timeEntry.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { date: "desc" },
      skip,
      take,
    }),
    db.timeEntry.count({ where }),
  ]);
  return Response.json({ data, page, limit, total });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "time:track");
  if (auth instanceof Response) return auth;
  if (!auth.user.employeeId) return apiError(400, "Your account is not linked to an employee");

  const body = await req.json().catch(() => null);
  if (!body?.date || !body?.start) return apiError(400, "date and start are required");

  const entry = await db.timeEntry.create({
    data: {
      employeeId: auth.user.employeeId,
      date: new Date(body.date),
      start: new Date(body.start),
      end: body.end ? new Date(body.end) : null,
      breakMinutes: typeof body.breakMinutes === "number" ? body.breakMinutes : 0,
      note: body.note ?? null,
    },
  });
  return Response.json(entry, { status: 201 });
}
