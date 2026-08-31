"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole, type Role } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type SkillActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

const READINESS = ["READY_NOW", "ONE_TO_TWO_YEARS", "THREE_PLUS_YEARS"] as const;

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

// Self, the employee's direct manager, or HR/ADMIN may set a rating.
async function canRate(
  actorRole: Role,
  actorEmployeeId: string,
  targetEmployeeId: string
): Promise<boolean> {
  if (actorEmployeeId === targetEmployeeId) return true;
  if (actorRole === "HR" || actorRole === "ADMIN") return true;
  if (actorRole !== "MANAGER") return false;
  const target = await db.employee.findUnique({ where: { id: targetEmployeeId }, select: { managerId: true } });
  return target?.managerId === actorEmployeeId;
}

// ---------- Skill master list (HR/ADMIN) ----------

const skillSchema = z.object({ name: z.string().trim().min(1), category: optionalString });

export async function createSkill(_prev: SkillActionState, formData: FormData): Promise<SkillActionState> {
  const session = await requireRole("HR", "ADMIN");
  const parsed = skillSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  try {
    await db.skill.create({ data: { name: parsed.data.name, category: parsed.data.category ?? null } });
  } catch {
    return { error: "nameTaken" };
  }
  await logAudit(session.user.id, "skill.create", "Skill", parsed.data.name);
  revalidatePath("/skills");
  return {};
}

export async function deleteSkill(id: string): Promise<SkillActionState> {
  const session = await requireRole("HR", "ADMIN");
  await db.skill.delete({ where: { id } });
  await logAudit(session.user.id, "skill.delete", "Skill", id);
  revalidatePath("/skills");
  return {};
}

// ---------- Ratings ----------

const rateSchema = z.object({
  employeeId: z.string().min(1),
  skillId: z.string().min(1),
  level: z.coerce.number().int().min(0).max(5),
});

export async function setEmployeeSkill(_prev: SkillActionState, formData: FormData): Promise<SkillActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = rateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { employeeId, skillId, level } = parsed.data;

  if (!(await canRate(session.user.role, actorEmployeeId, employeeId))) return { error: "forbidden" };

  // Level 0 clears the rating.
  if (level === 0) {
    await db.employeeSkill.deleteMany({ where: { employeeId, skillId } });
  } else {
    await db.employeeSkill.upsert({
      where: { employeeId_skillId: { employeeId, skillId } },
      create: { employeeId, skillId, level },
      update: { level },
    });
  }
  revalidatePath("/skills");
  return {};
}

// ---------- Succession planning (HR/ADMIN) ----------

const planSchema = z.object({ roleHolderId: z.string().min(1), notes: optionalString });

export async function upsertSuccessionPlan(_prev: SkillActionState, formData: FormData): Promise<SkillActionState> {
  const session = await requireRole("HR", "ADMIN");
  const parsed = planSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { roleHolderId, notes } = parsed.data;

  await db.successionPlan.upsert({
    where: { roleHolderId },
    create: { roleHolderId, notes: notes ?? null, createdById: session.user.id },
    update: { notes: notes ?? null },
  });
  await logAudit(session.user.id, "succession.upsert", "SuccessionPlan", roleHolderId);
  revalidatePath("/skills/succession");
  return {};
}

export async function deleteSuccessionPlan(id: string): Promise<SkillActionState> {
  const session = await requireRole("HR", "ADMIN");
  await db.successionPlan.delete({ where: { id } });
  await logAudit(session.user.id, "succession.delete", "SuccessionPlan", id);
  revalidatePath("/skills/succession");
  return {};
}

const candidateSchema = z.object({
  planId: z.string().min(1),
  candidateId: z.string().min(1),
  readiness: z.enum(READINESS),
  notes: optionalString,
});

export async function addSuccessionCandidate(
  _prev: SkillActionState,
  formData: FormData
): Promise<SkillActionState> {
  await requireRole("HR", "ADMIN");
  const parsed = candidateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { planId, candidateId, readiness, notes } = parsed.data;

  const plan = await db.successionPlan.findUnique({ where: { id: planId }, select: { roleHolderId: true } });
  if (!plan) return { error: "notFound" };
  if (plan.roleHolderId === candidateId) return { error: "candidateIsHolder" };

  try {
    await db.successionCandidate.create({ data: { planId, candidateId, readiness, notes: notes ?? null } });
  } catch {
    return { error: "candidateExists" };
  }
  revalidatePath("/skills/succession");
  return {};
}

export async function removeSuccessionCandidate(id: string): Promise<SkillActionState> {
  await requireRole("HR", "ADMIN");
  await db.successionCandidate.delete({ where: { id } });
  revalidatePath("/skills/succession");
  return {};
}
