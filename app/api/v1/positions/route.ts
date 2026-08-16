import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const auth = await authorize(req, "employee:read");
  if (auth instanceof Response) return auth;
  const data = await db.position.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { title: "asc" },
  });
  return Response.json({ data });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "employee:write");
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => null);
  if (!body?.title) return apiError(400, "title is required");
  const position = await db.position.create({ data: { title: body.title } });
  return Response.json(position, { status: 201 });
}
