import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize } from "@/lib/api-helpers";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, "employee:read");
  if (auth instanceof Response) return auth;
  const { id } = await params;

  const employee = await db.employee.findUnique({
    where: { id },
    include: { department: true, position: true, location: true, manager: true, reports: true },
  });
  if (!employee) return apiError(404, "Employee not found");
  return Response.json(employee);
}

const WRITABLE = [
  "firstName", "lastName", "email", "phone", "street", "city", "country",
  "contractType", "workload", "status", "departmentId", "positionId", "locationId", "managerId",
] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, "employee:write");
  if (auth instanceof Response) return auth;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return apiError(400, "JSON body required");

  const data: Record<string, unknown> = {};
  for (const k of WRITABLE) if (k in body) data[k] = body[k];
  if (body.hireDate) data.hireDate = new Date(body.hireDate);
  if (body.exitDate !== undefined) data.exitDate = body.exitDate ? new Date(body.exitDate) : null;

  const employee = await db.employee.update({ where: { id }, data }).catch(() => null);
  if (!employee) return apiError(404, "Employee not found");
  return Response.json(employee);
}
