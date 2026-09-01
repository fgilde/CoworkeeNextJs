"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type CompensationActionState = { error?: string };

const addSchema = z.object({
  employeeId: z.string().min(1),
  amount: z.coerce.number().positive(),
  currency: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? "EUR" : v),
    z.string().trim().min(1)
  ),
  frequency: z.enum(["MONTHLY", "YEARLY", "HOURLY"]),
  effectiveDate: z.iso.date(),
  note: z
    .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
    .optional(),
});

export async function addCompensation(
  _prevState: CompensationActionState,
  formData: FormData
): Promise<CompensationActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = addSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { employeeId, amount, currency, frequency, effectiveDate, note } = parsed.data;

  const record = await db.compensationRecord.create({
    data: {
      employeeId,
      amountCents: Math.round(amount * 100),
      currency,
      frequency,
      effectiveDate: new Date(effectiveDate),
      note: note ?? null,
      createdById: session.user.id,
    },
  });

  await logAudit(session.user.id, "compensation.add", "CompensationRecord", record.id, {
    employeeId,
    amountCents: record.amountCents,
    currency,
    frequency,
  });

  revalidatePath("/compensation");
  return {};
}

export async function deleteCompensation(id: string): Promise<CompensationActionState> {
  const session = await requireRole("HR", "ADMIN");

  const record = await db.compensationRecord.findUnique({ where: { id }, select: { id: true } });
  if (!record) return { error: "notFound" };

  await db.compensationRecord.delete({ where: { id } });
  await logAudit(session.user.id, "compensation.delete", "CompensationRecord", id);

  revalidatePath("/compensation");
  return {};
}
