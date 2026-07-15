"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/password";

export type AccountActionState = { error?: string; ok?: boolean };

// Empty string (unfilled optional form field) is treated as "not provided" -> null.
const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

const profileSchema = z.object({
  phone: optionalString,
  street: optionalString,
  city: optionalString,
  country: optionalString,
});

export async function updateOwnProfile(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  if (!user?.employeeId) return { error: "noEmployee" };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  const data = {
    phone: parsed.data.phone ?? null,
    street: parsed.data.street ?? null,
    city: parsed.data.city ?? null,
    country: parsed.data.country ?? null,
  };

  await db.employee.update({ where: { id: user.employeeId }, data });
  await logAudit(session.user.id, "employee.selfUpdate", "Employee", user.employeeId, data);

  revalidatePath("/account");
  return { ok: true };
}

const passwordSchema = z
  .object({
    current: z.string().min(1),
    next: z.string().min(8),
    confirm: z.string(),
  });

export async function changePassword(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireAuth();

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  if (parsed.data.next !== parsed.data.confirm) return { error: "passwordMismatch" };

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { error: "wrongPassword" };
  }

  const passwordHash = await hashPassword(parsed.data.next);
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash } });
  await logAudit(session.user.id, "user.changePassword", "User", session.user.id);

  return { ok: true };
}
