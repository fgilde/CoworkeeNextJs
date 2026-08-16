import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize, pagination, reportIds } from "@/lib/api-helpers";
import { can } from "@/lib/rbac";

export async function GET(req: Request) {
  const auth = await authorize(req, "employee:read");
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const { page, limit, skip, take } = pagination(url);
  const self = auth.user.employeeId;

  let where: Prisma.GoalWhereInput = {};
  if (!can(auth.role, "goal:manage")) {
    if (!self) return Response.json({ data: [], page, limit, total: 0 });
    where = { employeeId: self };
  } else if (auth.role === "MANAGER") {
    const ids = self ? [self, ...(await reportIds(self))] : [];
    where = { employeeId: { in: ids } };
  }

  const [data, total] = await Promise.all([
    db.goal.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    db.goal.count({ where }),
  ]);
  return Response.json({ data, page, limit, total });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "goal:manage");
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => null);
  if (!body?.employeeId || !body?.title) return apiError(400, "employeeId and title are required");

  // MANAGER may only create goals for their own reports.
  if (auth.role === "MANAGER") {
    const target = await db.employee.findUnique({ where: { id: body.employeeId }, select: { managerId: true } });
    if (!target || target.managerId !== auth.user.employeeId) return apiError(403, "Forbidden — not your report");
  }

  const goal = await db.goal.create({
    data: {
      employeeId: body.employeeId,
      title: body.title,
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      createdById: auth.user.id,
    },
  });
  return Response.json(goal, { status: 201 });
}
