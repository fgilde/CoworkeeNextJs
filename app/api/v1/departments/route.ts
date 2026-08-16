import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const auth = await authorize(req, "employee:read");
  if (auth instanceof Response) return auth;
  const data = await db.department.findMany({
    include: { lead: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  });
  return Response.json({ data });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "employee:write");
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => null);
  if (!body?.name) return apiError(400, "name is required");
  const dept = await db.department.create({ data: { name: body.name, leadId: body.leadId ?? null } });
  return Response.json(dept, { status: 201 });
}
