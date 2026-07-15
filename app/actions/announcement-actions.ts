"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type AnnouncementActionState = { error?: string };

const announcementSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  pinned: z.boolean(),
});

function parseForm(formData: FormData) {
  return announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    pinned: formData.get("pinned") === "on",
  });
}

function revalidateNews() {
  revalidatePath("/news");
  revalidatePath("/");
}

export async function createAnnouncement(
  _prevState: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "validationError" };
  const { title, body, pinned } = parsed.data;

  const announcement = await db.announcement.create({
    data: { title, body, pinned, authorId: session.user.id },
  });

  await logAudit(session.user.id, "announcement.create", "Announcement", announcement.id, { title, pinned });

  revalidateNews();
  return {};
}

export async function updateAnnouncement(
  id: string,
  _prevState: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = parseForm(formData);
  if (!parsed.success) return { error: "validationError" };
  const { title, body, pinned } = parsed.data;

  await db.announcement.update({ where: { id }, data: { title, body, pinned } });

  await logAudit(session.user.id, "announcement.update", "Announcement", id, { title, pinned });

  revalidateNews();
  return {};
}

export async function deleteAnnouncement(id: string): Promise<AnnouncementActionState> {
  const session = await requireRole("HR", "ADMIN");

  await db.announcement.delete({ where: { id } });

  await logAudit(session.user.id, "announcement.delete", "Announcement", id, {});

  revalidateNews();
  return {};
}
