import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize, pagination } from "@/lib/api-helpers";

// Job postings (with their applications). recruiting:manage only.
export async function GET(req: Request) {
  const auth = await authorize(req, "recruiting:manage");
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const { page, limit, skip, take } = pagination(url);
  const status = url.searchParams.get("status");

  const where: Prisma.JobPostingWhereInput = {
    ...((status === "DRAFT" || status === "OPEN" || status === "CLOSED") && { status }),
  };

  const [data, total] = await Promise.all([
    db.jobPosting.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        applications: { orderBy: { appliedAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
    db.jobPosting.count({ where }),
  ]);
  return Response.json({ data, page, limit, total });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "recruiting:manage");
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.description) return apiError(400, "title and description are required");

  const posting = await db.jobPosting.create({
    data: {
      title: body.title,
      description: body.description,
      employmentType: body.employmentType ?? null,
      status: body.status ?? undefined,
      departmentId: body.departmentId ?? null,
      locationId: body.locationId ?? null,
      createdById: auth.user.id,
    },
  });
  return Response.json(posting, { status: 201 });
}
