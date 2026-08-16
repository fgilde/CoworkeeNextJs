import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { authorize, pagination } from "@/lib/api-helpers";
import { can } from "@/lib/rbac";

// Metadata only — file bytes stay behind the guarded /api/documents/[id] download.
export async function GET(req: Request) {
  const auth = await authorize(req, "document:read-own");
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const { page, limit, skip, take } = pagination(url);

  let where: Prisma.DocumentWhereInput = {};
  if (!can(auth.role, "document:manage")) {
    if (!auth.user.employeeId) return Response.json({ data: [], page, limit, total: 0 });
    where = { employeeId: auth.user.employeeId };
  }

  const [data, total] = await Promise.all([
    db.document.findMany({
      where,
      select: {
        id: true, employeeId: true, title: true, category: true, originalName: true,
        mimeType: true, sizeBytes: true, uploadedAt: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { uploadedAt: "desc" },
      skip,
      take,
    }),
    db.document.count({ where }),
  ]);
  return Response.json({ data, page, limit, total });
}
