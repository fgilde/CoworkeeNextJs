"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";

function revalidateNotifications() {
  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function markNotificationRead(id: string): Promise<{ error?: string }> {
  const session = await requireAuth();

  const result = await db.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  if (result.count === 0) return { error: "notFound" };

  revalidateNotifications();
  return {};
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  const session = await requireAuth();

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidateNotifications();
  return {};
}
