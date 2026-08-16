import { db } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { authorize, pagination } from "@/lib/api-helpers";

// Company news — readable by any authenticated token holder.
export async function GET(req: Request) {
  const auth = await authorize(req);
  if (auth instanceof Response) return auth;
  const url = new URL(req.url);
  const { page, limit, skip, take } = pagination(url);

  const [data, total] = await Promise.all([
    db.announcement.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip,
      take,
    }),
    db.announcement.count(),
  ]);
  return Response.json({ data, page, limit, total });
}

export async function POST(req: Request) {
  const auth = await authorize(req, "announcement:manage");
  if (auth instanceof Response) return auth;
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.body) return apiError(400, "title and body are required");

  const announcement = await db.announcement.create({
    data: {
      title: body.title,
      body: body.body,
      pinned: Boolean(body.pinned),
      authorId: auth.user.id,
    },
  });
  return Response.json(announcement, { status: 201 });
}
