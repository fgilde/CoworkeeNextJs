"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/password";

export type AccountActionState = { error?: string; ok?: boolean };

// Empty string (unfilled optional form field) is treated as "not provided" -> null.
// `max` caps free-text length so arbitrarily long input can't be stored.
const optionalString = (max: number) =>
  z
    .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().max(max))
    .optional();

const profileSchema = z.object({
  phone: optionalString(40),
  street: optionalString(120),
  city: optionalString(120),
  country: optionalString(120),
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
    next: z.string().min(8).max(200),
    confirm: z.string(),
  });

// Rate-limit wrong current-password guesses: max 5 failures / 15 min per user.
// ponytail: in-memory per-process limit; use a shared store if multi-instance.
const MAX_WRONG_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const wrongPasswordAttempts = new Map<string, { count: number; resetAt: number }>();

export async function changePassword(
  _prevState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  const session = await requireAuth();

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  if (parsed.data.next !== parsed.data.confirm) return { error: "passwordMismatch" };

  const now = Date.now();
  const record = wrongPasswordAttempts.get(session.user.id);
  if (record && record.resetAt > now && record.count >= MAX_WRONG_ATTEMPTS) {
    return { error: "tooManyAttempts" };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    const fresh = record && record.resetAt > now ? record : { count: 0, resetAt: now + ATTEMPT_WINDOW_MS };
    fresh.count += 1;
    wrongPasswordAttempts.set(session.user.id, fresh);
    return { error: "wrongPassword" };
  }

  wrongPasswordAttempts.delete(session.user.id);
  const passwordHash = await hashPassword(parsed.data.next);
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash } });
  await logAudit(session.user.id, "user.changePassword", "User", session.user.id);

  return { ok: true };
}
