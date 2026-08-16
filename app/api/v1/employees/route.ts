import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize, pagination } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const auth = await authorize(req, "employee:read");
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const departmentId = url.searchParams.get("department") ?? undefined;
  const locationId = url.searchParams.get("location") ?? undefined;
  const status = url.searchParams.get("status");
  const { page, limit, skip, take } = pagination(url);

  const where: Prisma.EmployeeWhereInput = {
    ...(q && {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(departmentId && { departmentId }),
    ...(locationId && { locationId }),
    ...((status === "ACTIVE" || status === "INACTIVE") && { status }),
  };

  const [data, total] = await Promise.all([
    db.employee.findMany({
      where,
      include: { department: true, position: true, location: true },
      orderBy: { lastName: "asc" },
      skip,
      take,
    }),
    db.employee.count({ where }),
  ]);

  return Response.json({ data, page, limit, total });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "employee:write");
  if (auth instanceof Response) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.firstName || !body?.lastName || !body?.email || !body?.hireDate) {
    return apiError(400, "firstName, lastName, email and hireDate are required");
  }

  const employee = await db.employee.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      hireDate: new Date(body.hireDate),
      phone: body.phone ?? null,
      contractType: body.contractType ?? undefined,
      workload: typeof body.workload === "number" ? body.workload : undefined,
      departmentId: body.departmentId ?? null,
      positionId: body.positionId ?? null,
      locationId: body.locationId ?? null,
      managerId: body.managerId ?? null,
    },
  });
  return Response.json(employee, { status: 201 });
}
