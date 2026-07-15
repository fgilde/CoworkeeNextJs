"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type LeaveSettingsActionState = { error?: string };

function isDuplicateError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Checkbox inputs are only present in FormData when checked ("on"); absent otherwise.
const checkbox = z.preprocess((v) => v === "on" || v === true, z.boolean());

const leaveTypeSchema = z.object({
  name: z.string().trim().min(1),
  colorHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#6366f1"),
  paid: checkbox,
  defaultDays: z.coerce.number().int().min(0),
});

export async function createLeaveType(
  _prevState: LeaveSettingsActionState,
  formData: FormData
): Promise<LeaveSettingsActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = leaveTypeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  try {
    const created = await db.leaveType.create({ data: parsed.data });
    await logAudit(session.user.id, "leaveType.create", "LeaveType", created.id, parsed.data);
  } catch (error) {
    if (isDuplicateError(error)) return { error: "nameTaken" };
    throw error;
  }

  revalidatePath("/settings");
  return {};
}

export async function updateLeaveType(
  id: string,
  _prevState: LeaveSettingsActionState,
  formData: FormData
): Promise<LeaveSettingsActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = leaveTypeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  try {
    await db.leaveType.update({ where: { id }, data: parsed.data });
    await logAudit(session.user.id, "leaveType.update", "LeaveType", id, parsed.data);
  } catch (error) {
    if (isDuplicateError(error)) return { error: "nameTaken" };
    throw error;
  }

  revalidatePath("/settings");
  return {};
}

export async function deleteLeaveType(id: string): Promise<LeaveSettingsActionState> {
  const session = await requireRole("HR", "ADMIN");

  // Guard referential integrity: a type still referenced by requests or
  // entitlements must not be deleted (never let Prisma throw a raw FK error).
  const [requestCount, entitlementCount] = await Promise.all([
    db.leaveRequest.count({ where: { typeId: id } }),
    db.leaveEntitlement.count({ where: { typeId: id } }),
  ]);
  if (requestCount > 0 || entitlementCount > 0) return { error: "inUse" };

  await db.leaveType.delete({ where: { id } });
  await logAudit(session.user.id, "leaveType.delete", "LeaveType", id);

  revalidatePath("/settings");
  return {};
}

const entitlementSchema = z.object({
  employeeId: z.string().trim().min(1),
  typeId: z.string().trim().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  days: z.coerce.number().min(0),
});

export async function setEntitlement(
  _prevState: LeaveSettingsActionState,
  formData: FormData
): Promise<LeaveSettingsActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = entitlementSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  const { employeeId, typeId, year, days } = parsed.data;

  const entitlement = await db.leaveEntitlement.upsert({
    where: { employeeId_typeId_year: { employeeId, typeId, year } },
    create: { employeeId, typeId, year, days },
    update: { days },
  });

  await logAudit(session.user.id, "leaveEntitlement.set", "LeaveEntitlement", entitlement.id, {
    employeeId,
    typeId,
    year,
    days,
  });

  revalidatePath("/settings");
  return {};
}
