"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type SetUserRoleState = { error?: string };

const roleSchema = z.enum(["ADMIN", "HR", "MANAGER", "EMPLOYEE"]);
// cuid-ish: non-empty, no whitespace, sane length — rejects garbage ids before
// they hit Prisma.
const userIdSchema = z.string().trim().min(1).max(50).regex(/^[a-z0-9]+$/i);

export async function setUserRole(userId: string, role: string): Promise<SetUserRoleState> {
  const session = await requireRole("ADMIN");

  const parsedId = userIdSchema.safeParse(userId);
  if (!parsedId.success) return { error: "invalidUser" };

  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { error: "invalidRole" };

  // Prevent an admin from locking themselves out by changing their own role.
  if (parsedId.data === session.user.id) return { error: "cannotChangeSelf" };

  try {
    await db.user.update({ where: { id: parsedId.data }, data: { role: parsed.data } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { error: "notFound" };
    }
    throw error;
  }
  await logAudit(session.user.id, "user.setRole", "User", parsedId.data, { role: parsed.data });

  revalidatePath("/settings/users");
  return {};
}
