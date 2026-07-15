"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { computeWorkingDays } from "@/lib/leave";

export type LeaveRequestFormState = { error?: string };

// Checkbox inputs are only present in FormData when checked ("on"); absent otherwise.
const checkbox = z.preprocess((v) => v === "on" || v === true, z.boolean());
const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

const leaveRequestSchema = z.object({
  typeId: z.string().min(1),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  halfDayStart: checkbox,
  halfDayEnd: checkbox,
  reason: optionalString,
});

export async function createLeaveRequest(
  _prevState: LeaveRequestFormState,
  formData: FormData
): Promise<LeaveRequestFormState> {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  if (!user?.employeeId) return { error: "noEmployee" };

  const parsed = leaveRequestSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  const { typeId, halfDayStart, halfDayEnd, reason } = parsed.data;
  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (endDate < startDate) return { error: "invalidRange" };

  const workingDays = computeWorkingDays(startDate, endDate, halfDayStart, halfDayEnd);
  if (workingDays <= 0) return { error: "zeroDays" };

  const request = await db.leaveRequest.create({
    data: {
      employeeId: user.employeeId,
      typeId,
      startDate,
      endDate,
      halfDayStart,
      halfDayEnd,
      workingDays,
      reason: reason ?? null,
      status: "PENDING",
    },
  });

  await logAudit(session.user.id, "leave.request", "LeaveRequest", request.id, {
    typeId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    workingDays,
  });

  revalidatePath("/absences");
  redirect("/absences");
}

export async function cancelLeaveRequest(id: string): Promise<{ error?: string }> {
  const session = await requireAuth();

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true },
  });
  if (!user?.employeeId) return { error: "cancelError" };

  const request = await db.leaveRequest.findUnique({
    where: { id },
    select: { employeeId: true, status: true },
  });
  // Only the owner may cancel, and only while still PENDING or APPROVED.
  if (!request || request.employeeId !== user.employeeId) return { error: "cancelError" };
  if (request.status !== "PENDING" && request.status !== "APPROVED") return { error: "cancelError" };

  await db.leaveRequest.update({ where: { id }, data: { status: "CANCELLED" } });
  await logAudit(session.user.id, "leave.cancel", "LeaveRequest", id);

  revalidatePath("/absences");
  return {};
}
