import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize, pagination, reportIds } from "@/lib/api-helpers";
import { can } from "@/lib/rbac";
import { computeWorkingDays } from "@/lib/leave";

export async function GET(req: Request) {
  const auth = await authorize(req, "leave:request");
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const { page, limit, skip, take } = pagination(url);
  const status = url.searchParams.get("status");

  // Scope: leave:manage → all; leave:approve (manager) → own + direct reports; else own only.
  let where: Prisma.LeaveRequestWhereInput = {};
  if (!can(auth.role, "leave:manage")) {
    const self = auth.user.employeeId;
    if (!self) return Response.json({ data: [], page, limit, total: 0 });
    const ids = can(auth.role, "leave:approve") ? [self, ...(await reportIds(self))] : [self];
    where = { employeeId: { in: ids } };
  }
  if (status) where = { ...where, status: status as Prisma.LeaveRequestWhereInput["status"] };

  const [data, total] = await Promise.all([
    db.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        type: { select: { id: true, name: true, colorHex: true } },
      },
      orderBy: { startDate: "desc" },
      skip,
      take,
    }),
    db.leaveRequest.count({ where }),
  ]);
  return Response.json({ data, page, limit, total });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "leave:request");
  if (auth instanceof Response) return auth;
  if (!auth.user.employeeId) return apiError(400, "Your account is not linked to an employee");

  const body = await req.json().catch(() => null);
  if (!body?.typeId || !body?.startDate || !body?.endDate) {
    return apiError(400, "typeId, startDate and endDate are required");
  }
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const halfDayStart = Boolean(body.halfDayStart);
  const halfDayEnd = Boolean(body.halfDayEnd);
  const workingDays = computeWorkingDays(start, end, halfDayStart, halfDayEnd);

  const request = await db.leaveRequest.create({
    data: {
      employeeId: auth.user.employeeId,
      typeId: body.typeId,
      startDate: start,
      endDate: end,
      halfDayStart,
      halfDayEnd,
      workingDays,
      reason: body.reason ?? null,
    },
  });
  return Response.json(request, { status: 201 });
}
