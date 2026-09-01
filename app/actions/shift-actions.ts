"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, type Role } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type ShiftActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

// "HH:MM" -> minutes from midnight (0..1439).
const time = z.string().transform((v, ctx) => {
  const [h, m] = v.split(":").map(Number);
  const mins = h * 60 + m;
  if (!Number.isInteger(mins) || mins < 0 || mins > 1439) {
    ctx.addIssue({ code: "custom", message: "invalidTime" });
    return z.NEVER;
  }
  return mins;
});

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

// HR/ADMIN may schedule for anyone; a MANAGER only for their own reports.
async function canManageEmployee(
  actorRole: Role,
  actorEmployeeId: string,
  targetEmployeeId: string
): Promise<boolean> {
  if (actorRole === "HR" || actorRole === "ADMIN") return true;
  if (actorRole !== "MANAGER") return false;
  const target = await db.employee.findUnique({ where: { id: targetEmployeeId }, select: { managerId: true } });
  return target?.managerId === actorEmployeeId;
}

const createShiftSchema = z
  .object({
    employeeId: z.string().min(1),
    date: z.iso.date(),
    start: time,
    end: time,
    role: optionalString,
    location: optionalString,
    note: optionalString,
  })
  .refine((d) => d.end > d.start, { message: "invalidTime", path: ["end"] });

export async function createShift(
  _prevState: ShiftActionState,
  formData: FormData
): Promise<ShiftActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = createShiftSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { employeeId, date, start, end, role, location, note } = parsed.data;

  if (!(await canManageEmployee(session.user.role, actorEmployeeId, employeeId))) {
    return { error: "notYourTeam" };
  }

  const shift = await db.shift.create({
    data: {
      employeeId,
      date: new Date(date),
      startMin: start,
      endMin: end,
      role: role ?? null,
      location: location ?? null,
      note: note ?? null,
      createdById: session.user.id,
    },
  });

  await logAudit(session.user.id, "shift.create", "Shift", shift.id, { employeeId, date });

  revalidatePath("/shifts");
  return {};
}

export async function deleteShift(id: string): Promise<ShiftActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const shift = await db.shift.findUnique({ where: { id }, select: { employeeId: true } });
  if (!shift) return { error: "notFound" };

  if (!(await canManageEmployee(session.user.role, actorEmployeeId, shift.employeeId))) {
    return { error: "notYourTeam" };
  }

  await db.shift.delete({ where: { id } });
  await logAudit(session.user.id, "shift.delete", "Shift", id);

  revalidatePath("/shifts");
  return {};
}
