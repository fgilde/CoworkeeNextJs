"use server";

import { writeFile, unlink } from "fs/promises";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { ensureStorageDir, generateStoredName, safeStoredPath } from "@/lib/documents";

export type DocumentActionState = { error?: string };

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const uploadSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["CONTRACT", "PAYSLIP", "CERTIFICATE", "ID", "OTHER"]),
});

export async function uploadDocument(
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = uploadSchema.safeParse({
    employeeId: formData.get("employeeId"),
    title: formData.get("title"),
    category: formData.get("category"),
  });
  if (!parsed.success) return { error: "validationError" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "validationError" };
  if (file.size > MAX_SIZE_BYTES) return { error: "fileTooLarge" };
  if (!ALLOWED_MIME_TYPES.has(file.type)) return { error: "fileType" };

  const { employeeId, title, category } = parsed.data;

  await ensureStorageDir();
  const storedName = generateStoredName(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(safeStoredPath(storedName), bytes);

  const doc = await db.document.create({
    data: {
      employeeId,
      title,
      category,
      originalName: file.name,
      storedName,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedById: session.user.id,
    },
  });

  await logAudit(session.user.id, "document.upload", "Document", doc.id, { employeeId, title, category });

  revalidatePath("/documents");
  return {};
}

export async function deleteDocument(id: string): Promise<DocumentActionState> {
  const session = await requireRole("HR", "ADMIN");

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "notFound" };

  await db.document.delete({ where: { id } });

  try {
    await unlink(safeStoredPath(doc.storedName));
  } catch (err: any) {
    if (err?.code !== "ENOENT") throw err;
  }

  await logAudit(session.user.id, "document.delete", "Document", id, {
    employeeId: doc.employeeId,
    title: doc.title,
  });

  revalidatePath("/documents");
  return {};
}
