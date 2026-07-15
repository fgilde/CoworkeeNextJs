import { readFile } from "fs/promises";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { safeStoredPath } from "@/lib/documents";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return new Response("Not found", { status: 404 });

  // Access check: HR/ADMIN (document:manage) may read any document; everyone
  // else may only read documents that belong to their own employee record.
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
  const isOwner = !!user?.employeeId && user.employeeId === doc.employeeId;
  const isManager = can(session.user.role, "document:manage");
  if (!isOwner && !isManager) return new Response("Forbidden", { status: 403 });

  let bytes: Buffer;
  try {
    bytes = await readFile(safeStoredPath(doc.storedName));
  } catch (err: any) {
    if (err?.code === "ENOENT") return new Response("Not found", { status: 404 });
    throw err;
  }

  const safeFileName = doc.originalName.replace(/["\\]/g, "_");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${safeFileName}"`,
      "Content-Length": String(doc.sizeBytes),
    },
  });
}
