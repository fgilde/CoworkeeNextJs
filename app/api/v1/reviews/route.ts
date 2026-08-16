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

  let where: Prisma.ReviewWhereInput = {};
  if (!can(auth.role, "review:manage")) {
    where = self ? { OR: [{ employeeId: self }, { reviewerId: self }] } : { id: "__none__" };
  } else if (auth.role === "MANAGER") {
    const ids = self ? [self, ...(await reportIds(self))] : [];
    where = { OR: [{ employeeId: { in: ids } }, { reviewerId: self ?? "__none__" }] };
  }

  const [data, total] = await Promise.all([
    db.review.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.review.count({ where }),
  ]);
  return Response.json({ data, page, limit, total });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "review:manage");
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => null);
  if (!body?.employeeId || !body?.reviewerId || !body?.period) {
    return apiError(400, "employeeId, reviewerId and period are required");
  }
  if (auth.role === "MANAGER") {
    const target = await db.employee.findUnique({ where: { id: body.employeeId }, select: { managerId: true } });
    if (!target || target.managerId !== auth.user.employeeId) return apiError(403, "Forbidden — not your report");
  }

  const review = await db.review.create({
    data: {
      employeeId: body.employeeId,
      reviewerId: body.reviewerId,
      period: body.period,
      rating: typeof body.rating === "number" ? body.rating : null,
      strengths: body.strengths ?? null,
      improvements: body.improvements ?? null,
      comments: body.comments ?? null,
    },
  });
  return Response.json(review, { status: 201 });
}
