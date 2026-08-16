import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const auth = await authorize(req, "employee:read");
  if (auth instanceof Response) return auth;
  const data = await db.location.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  });
  return Response.json({ data });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "employee:write");
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => null);
  if (!body?.name) return apiError(400, "name is required");
  const location = await db.location.create({
    data: { name: body.name, city: body.city ?? null, country: body.country ?? null },
  });
  return Response.json(location, { status: 201 });
}
