"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type SetUserRoleState = { error?: string };

const roleSchema = z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]);

export async function setUserRole(userId: string, role: string): Promise<SetUserRoleState> {
  const session = await requireRole("ADMIN");

  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { error: "invalidRole" };

  // Prevent an admin from locking themselves out by changing their own role.
  if (userId === session.user.id) return { error: "cannotChangeSelf" };

  await db.user.update({ where: { id: userId }, data: { role: parsed.data } });
  await logAudit(session.user.id, "user.setRole", "User", userId, { role: parsed.data });

  revalidatePath("/settings/users");
  return {};
}
