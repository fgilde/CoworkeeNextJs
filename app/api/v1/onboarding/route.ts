import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authorize, pagination } from "@/lib/api-helpers";

// Onboarding/offboarding checklists (read). Creation from templates stays in the UI.
export async function GET(req: Request) {
  const auth = await authorize(req, "onboarding:manage");
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const { page, limit, skip, take } = pagination(url);
  const type = url.searchParams.get("type");
  const employeeId = url.searchParams.get("employee");

  const where: Prisma.EmployeeChecklistWhereInput = {
    ...((type === "ONBOARDING" || type === "OFFBOARDING") && { type }),
    ...(employeeId && { employeeId }),
  };

  const [data, total] = await Promise.all([
    db.employeeChecklist.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        tasks: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.employeeChecklist.count({ where }),
  ]);
  return Response.json({ data, page, limit, total });
}
