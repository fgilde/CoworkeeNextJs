"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type TimeActionState = { error?: string };

async function currentEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function clockIn(): Promise<TimeActionState> {
  const session = await requireAuth();
  const employeeId = await currentEmployeeId(session.user.id);
  if (!employeeId) return { error: "noEmployee" };

  const open = await db.timeEntry.findFirst({ where: { employeeId, end: null } });
  if (open) return { error: "alreadyClockedIn" };

  const now = new Date();
  const entry = await db.timeEntry.create({
    data: { employeeId, date: startOfDay(now), start: now, end: null },
  });

  await logAudit(session.user.id, "time.clockIn", "TimeEntry", entry.id);
  revalidatePath("/time");
  return {};
}

export async function clockOut(): Promise<TimeActionState> {
  const session = await requireAuth();
  const employeeId = await currentEmployeeId(session.user.id);
  if (!employeeId) return { error: "noEmployee" };

  const open = await db.timeEntry.findFirst({ where: { employeeId, end: null } });
  if (!open) return { error: "notClockedIn" };

  const now = new Date();
  await db.timeEntry.update({ where: { id: open.id }, data: { end: now } });

  await logAudit(session.user.id, "time.clockOut", "TimeEntry", open.id);
  revalidatePath("/time");
  return {};
}

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const manualEntrySchema = z.object({
  date: z.iso.date(),
  start: timeSchema,
  end: timeSchema,
  breakMinutes: z.coerce.number().int().min(0),
  note: z
    .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
    .optional(),
});

function combineDateAndTime(date: string, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
}

export async function createManualEntry(
  _prevState: TimeActionState,
  formData: FormData
): Promise<TimeActionState> {
  const session = await requireAuth();
  const employeeId = await currentEmployeeId(session.user.id);
  if (!employeeId) return { error: "noEmployee" };

  const parsed = manualEntrySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  const { date, breakMinutes, note } = parsed.data;
  const start = combineDateAndTime(date, parsed.data.start);
  const end = combineDateAndTime(date, parsed.data.end);
  if (end <= start) return { error: "invalidRange" };

  const entry = await db.timeEntry.create({
    data: {
      employeeId,
      date: new Date(date),
      start,
      end,
      breakMinutes,
      note: note ?? null,
    },
  });

  await logAudit(session.user.id, "time.manualCreate", "TimeEntry", entry.id, {
    date,
    start: parsed.data.start,
    end: parsed.data.end,
    breakMinutes,
  });

  revalidatePath("/time");
  return {};
}

async function canModify(userId: string, role: string, entryId: string): Promise<{ error?: string }> {
  const employeeId = await currentEmployeeId(userId);
  if (!employeeId) return { error: "noEmployee" };

  const entry = await db.timeEntry.findUnique({ where: { id: entryId }, select: { employeeId: true } });
  if (!entry) return { error: "forbidden" };

  const isOwner = entry.employeeId === employeeId;
  const isHrOrAdmin = role === "HR" || role === "ADMIN";
  return isOwner || isHrOrAdmin ? {} : { error: "forbidden" };
}

export async function updateEntry(
  id: string,
  _prevState: TimeActionState,
  formData: FormData
): Promise<TimeActionState> {
  const session = await requireAuth();

  const { error: modifyError } = await canModify(session.user.id, session.user.role, id);
  if (modifyError) return { error: modifyError };

  const parsed = manualEntrySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  const { date, breakMinutes, note } = parsed.data;
  const start = combineDateAndTime(date, parsed.data.start);
  const end = combineDateAndTime(date, parsed.data.end);
  if (end <= start) return { error: "invalidRange" };

  await db.timeEntry.update({
    where: { id },
    data: { date: new Date(date), start, end, breakMinutes, note: note ?? null },
  });

  await logAudit(session.user.id, "time.update", "TimeEntry", id, {
    date,
    start: parsed.data.start,
    end: parsed.data.end,
    breakMinutes,
  });

  revalidatePath("/time");
  return {};
}

export async function deleteEntry(id: string): Promise<TimeActionState> {
  const session = await requireAuth();

  const { error: modifyError } = await canModify(session.user.id, session.user.role, id);
  if (modifyError) return { error: modifyError };

  await db.timeEntry.delete({ where: { id } });
  await logAudit(session.user.id, "time.delete", "TimeEntry", id);

  revalidatePath("/time");
  return {};
}
