"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type BenefitActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();
const asBool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

function revalidateBenefits() {
  revalidatePath("/benefits");
}

// ---------- Management (HR/ADMIN) ----------

const createBenefitSchema = z.object({
  name: z.string().trim().min(1),
  description: optionalString,
  category: optionalString,
});

export async function createBenefit(
  _prevState: BenefitActionState,
  formData: FormData
): Promise<BenefitActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = createBenefitSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { name, description, category } = parsed.data;

  const benefit = await db.benefit.create({
    data: { name, description: description ?? null, category: category ?? null, active: true },
  });

  await logAudit(session.user.id, "benefit.create", "Benefit", benefit.id, { name });

  revalidateBenefits();
  return {};
}

const updateBenefitSchema = z.object({
  name: z.string().trim().min(1),
  description: optionalString,
  category: optionalString,
  active: asBool,
});

export async function updateBenefit(
  id: string,
  _prevState: BenefitActionState,
  formData: FormData
): Promise<BenefitActionState> {
  const session = await requireRole("HR", "ADMIN");

  const benefit = await db.benefit.findUnique({ where: { id }, select: { id: true } });
  if (!benefit) return { error: "notFound" };

  const parsed = updateBenefitSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { name, description, category, active } = parsed.data;

  await db.benefit.update({
    where: { id },
    data: { name, description: description ?? null, category: category ?? null, active },
  });

  await logAudit(session.user.id, "benefit.update", "Benefit", id, { name, active });

  revalidateBenefits();
  return {};
}

export async function deleteBenefit(id: string): Promise<BenefitActionState> {
  const session = await requireRole("HR", "ADMIN");

  const benefit = await db.benefit.findUnique({ where: { id }, select: { id: true } });
  if (!benefit) return { error: "notFound" };

  await db.benefit.delete({ where: { id } });
  await logAudit(session.user.id, "benefit.delete", "Benefit", id);

  revalidateBenefits();
  return {};
}

// ---------- Enrollment (any authenticated employee) ----------

export async function enroll(benefitId: string): Promise<BenefitActionState> {
  const session = await requireAuth();
  const employeeId = await resolveActingEmployeeId(session.user.id);
  if (!employeeId) return { error: "noEmployee" };

  const benefit = await db.benefit.findUnique({ where: { id: benefitId }, select: { active: true } });
  if (!benefit) return { error: "notFound" };
  if (!benefit.active) return { error: "forbidden" };

  try {
    await db.benefitEnrollment.create({ data: { benefitId, employeeId } });
  } catch (error) {
    // Unique (benefitId, employeeId) violation — already enrolled, treat as success.
    if (!isUniqueViolation(error)) throw error;
    return {};
  }

  await logAudit(session.user.id, "benefit.enroll", "Benefit", benefitId);

  revalidateBenefits();
  return {};
}

export async function unenroll(benefitId: string): Promise<BenefitActionState> {
  const session = await requireAuth();
  const employeeId = await resolveActingEmployeeId(session.user.id);
  if (!employeeId) return { error: "noEmployee" };

  await db.benefitEnrollment.deleteMany({ where: { benefitId, employeeId } });
  await logAudit(session.user.id, "benefit.unenroll", "Benefit", benefitId);

  revalidateBenefits();
  return {};
}
