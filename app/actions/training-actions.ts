"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole, type Role } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type TrainingActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

// HR/ADMIN may assign to any employee; a MANAGER only to their own reports.
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

function revalidateTrainings() {
  revalidatePath("/trainings");
}

// ---------- Courses ----------

const createCourseSchema = z.object({
  title: z.string().trim().min(1),
  description: optionalString,
  provider: optionalString,
  url: optionalString,
});

export async function createCourse(
  _prevState: TrainingActionState,
  formData: FormData
): Promise<TrainingActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");

  const parsed = createCourseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, provider, url } = parsed.data;

  const course = await db.course.create({
    data: {
      title,
      description: description ?? null,
      provider: provider ?? null,
      url: url ?? null,
    },
  });

  await logAudit(session.user.id, "training.createCourse", "Course", course.id, { title });

  revalidateTrainings();
  return {};
}

export async function deleteCourse(id: string): Promise<TrainingActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");

  const course = await db.course.findUnique({ where: { id }, select: { id: true } });
  if (!course) return { error: "notFound" };

  await db.course.delete({ where: { id } });
  await logAudit(session.user.id, "training.deleteCourse", "Course", id);

  revalidateTrainings();
  return {};
}

// ---------- Enrollments ----------

const assignCourseSchema = z.object({
  courseId: z.string().min(1),
  employeeId: z.string().min(1),
});

export async function assignCourse(
  _prevState: TrainingActionState,
  formData: FormData
): Promise<TrainingActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = assignCourseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { courseId, employeeId } = parsed.data;

  if (!(await canManageEmployee(session.user.role, actorEmployeeId, employeeId))) {
    return { error: "notYourTeam" };
  }

  try {
    const enrollment = await db.trainingEnrollment.create({
      data: { courseId, employeeId, status: "ASSIGNED" },
    });
    await logAudit(session.user.id, "training.assign", "TrainingEnrollment", enrollment.id, {
      courseId,
      employeeId,
    });
  } catch {
    // Unique (courseId, employeeId) — already assigned.
    return { error: "alreadyAssigned" };
  }

  revalidateTrainings();
  return {};
}

export async function updateOwnTrainingStatus(
  enrollmentId: string,
  status: "IN_PROGRESS" | "COMPLETED"
): Promise<TrainingActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = z.enum(["IN_PROGRESS", "COMPLETED"]).safeParse(status);
  if (!parsed.success) return { error: "validationError" };

  const enrollment = await db.trainingEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { employeeId: true },
  });
  if (!enrollment || enrollment.employeeId !== actorEmployeeId) return { error: "forbidden" };

  const value = parsed.data;
  await db.trainingEnrollment.update({
    where: { id: enrollmentId },
    data: { status: value, completedAt: value === "COMPLETED" ? new Date() : null },
  });

  await logAudit(session.user.id, "training.statusSelf", "TrainingEnrollment", enrollmentId, { status: value });

  revalidateTrainings();
  return {};
}

export async function unassign(enrollmentId: string): Promise<TrainingActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const enrollment = await db.trainingEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { employee: { select: { managerId: true } } },
  });
  if (!enrollment) return { error: "notFound" };
  if (session.user.role === "MANAGER" && enrollment.employee.managerId !== actorEmployeeId) {
    return { error: "notYourTeam" };
  }

  await db.trainingEnrollment.delete({ where: { id: enrollmentId } });
  await logAudit(session.user.id, "training.unassign", "TrainingEnrollment", enrollmentId);

  revalidateTrainings();
  return {};
}
