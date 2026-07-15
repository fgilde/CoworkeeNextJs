"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole, type Role } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type PerformanceActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();
const optionalDate = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.iso.date())
  .optional();

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

// HR/ADMIN may manage any employee's goals/reviews; a MANAGER only their own reports.
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

function revalidatePerformance() {
  revalidatePath("/performance");
}

// ---------- Goals ----------

const createGoalSchema = z.object({
  employeeId: z.string().min(1),
  title: z.string().trim().min(1),
  description: optionalString,
  dueDate: optionalDate,
});

export async function createGoal(
  _prevState: PerformanceActionState,
  formData: FormData
): Promise<PerformanceActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = createGoalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { employeeId, title, description, dueDate } = parsed.data;

  if (!(await canManageEmployee(session.user.role, actorEmployeeId, employeeId))) {
    return { error: "notYourTeam" };
  }

  const goal = await db.goal.create({
    data: {
      employeeId,
      title,
      description: description ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: session.user.id,
      status: "OPEN",
      progress: 0,
    },
  });

  await logAudit(session.user.id, "goal.create", "Goal", goal.id, { employeeId, title });

  revalidatePerformance();
  return {};
}

const updateGoalSchema = z.object({
  title: z.string().trim().min(1),
  description: optionalString,
  status: z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]),
  progress: z.coerce.number().int().min(0).max(100),
  dueDate: optionalDate,
});

export async function updateGoal(
  id: string,
  _prevState: PerformanceActionState,
  formData: FormData
): Promise<PerformanceActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const goal = await db.goal.findUnique({ where: { id }, select: { employee: { select: { managerId: true } } } });
  if (!goal) return { error: "notFound" };
  if (session.user.role === "MANAGER" && goal.employee.managerId !== actorEmployeeId) {
    return { error: "notYourTeam" };
  }

  const parsed = updateGoalSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, status, progress, dueDate } = parsed.data;

  await db.goal.update({
    where: { id },
    data: { title, description: description ?? null, status, progress, dueDate: dueDate ? new Date(dueDate) : null },
  });

  await logAudit(session.user.id, "goal.update", "Goal", id, { title, status, progress });

  revalidatePerformance();
  return {};
}

export async function updateOwnGoalProgress(id: string, progress: number): Promise<PerformanceActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = z.coerce.number().int().min(0).max(100).safeParse(progress);
  if (!parsed.success) return { error: "validationError" };

  const goal = await db.goal.findUnique({ where: { id }, select: { employeeId: true } });
  if (!goal || goal.employeeId !== actorEmployeeId) return { error: "forbidden" };

  const value = parsed.data;
  const status = value === 100 ? "DONE" : value > 0 ? "IN_PROGRESS" : "OPEN";

  await db.goal.update({ where: { id }, data: { progress: value, status } });

  await logAudit(session.user.id, "goal.progressSelf", "Goal", id, { progress: value, status });

  revalidatePerformance();
  return {};
}

export async function deleteGoal(id: string): Promise<PerformanceActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const goal = await db.goal.findUnique({ where: { id }, select: { employee: { select: { managerId: true } } } });
  if (!goal) return { error: "notFound" };
  if (session.user.role === "MANAGER" && goal.employee.managerId !== actorEmployeeId) {
    return { error: "notYourTeam" };
  }

  await db.goal.delete({ where: { id } });
  await logAudit(session.user.id, "goal.delete", "Goal", id);

  revalidatePerformance();
  return {};
}

// ---------- Reviews ----------

const createReviewSchema = z.object({
  employeeId: z.string().min(1),
  period: z.string().trim().min(1),
});

export async function createReview(
  _prevState: PerformanceActionState,
  formData: FormData
): Promise<PerformanceActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = createReviewSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { employeeId, period } = parsed.data;

  if (!(await canManageEmployee(session.user.role, actorEmployeeId, employeeId))) {
    return { error: "notYourTeam" };
  }

  const review = await db.review.create({
    data: { employeeId, reviewerId: actorEmployeeId, period, status: "DRAFT" },
  });

  await logAudit(session.user.id, "review.create", "Review", review.id, { employeeId, period });

  revalidatePerformance();
  return {};
}

const updateReviewSchema = z.object({
  rating: z
    .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().int().min(1).max(5))
    .optional(),
  strengths: optionalString,
  improvements: optionalString,
  comments: optionalString,
  status: z.enum(["DRAFT", "SUBMITTED"]),
});

export async function updateReview(
  id: string,
  _prevState: PerformanceActionState,
  formData: FormData
): Promise<PerformanceActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const review = await db.review.findUnique({ where: { id }, select: { reviewerId: true, status: true } });
  if (!review) return { error: "notFound" };

  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  if (review.reviewerId !== actorEmployeeId && !isHrOrAdmin) return { error: "forbidden" };
  if (review.status === "ACKNOWLEDGED") return { error: "alreadyAcknowledged" };

  const parsed = updateReviewSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { rating, strengths, improvements, comments, status } = parsed.data;

  await db.review.update({
    where: { id },
    data: {
      rating: rating ?? null,
      strengths: strengths ?? null,
      improvements: improvements ?? null,
      comments: comments ?? null,
      status,
      submittedAt: status === "SUBMITTED" ? new Date() : undefined,
    },
  });

  await logAudit(session.user.id, "review.update", "Review", id, { status, rating });

  revalidatePerformance();
  return {};
}

export async function acknowledgeReview(id: string): Promise<PerformanceActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const review = await db.review.findUnique({ where: { id }, select: { employeeId: true, status: true } });
  if (!review || review.employeeId !== actorEmployeeId) return { error: "forbidden" };
  if (review.status !== "SUBMITTED") return { error: "notSubmitted" };

  await db.review.update({ where: { id }, data: { status: "ACKNOWLEDGED" } });
  await logAudit(session.user.id, "review.acknowledge", "Review", id);

  revalidatePerformance();
  return {};
}

export async function deleteReview(id: string): Promise<PerformanceActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const review = await db.review.findUnique({ where: { id }, select: { reviewerId: true } });
  if (!review) return { error: "notFound" };

  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  if (review.reviewerId !== actorEmployeeId && !isHrOrAdmin) return { error: "forbidden" };

  await db.review.delete({ where: { id } });
  await logAudit(session.user.id, "review.delete", "Review", id);

  revalidatePerformance();
  return {};
}
