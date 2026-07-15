"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { stageOrder } from "@/lib/recruiting";

export type RecruitingActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().trim())
  .optional();
const emptyToNull = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.string().nullable());
const optionalRating = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.number().int().min(1).max(5))
  .optional();

function revalidateRecruiting(jobPostingId?: string) {
  revalidatePath("/recruiting");
  if (jobPostingId) revalidatePath(`/recruiting/${jobPostingId}`);
}

// ---------- Job postings ----------

const jobPostingSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  employmentType: optionalString,
  departmentId: emptyToNull,
  locationId: emptyToNull,
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]),
});

export async function createJobPosting(
  _prevState: RecruitingActionState,
  formData: FormData
): Promise<RecruitingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = jobPostingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, employmentType, departmentId, locationId, status } = parsed.data;

  const job = await db.jobPosting.create({
    data: {
      title,
      description,
      employmentType: employmentType ?? null,
      departmentId,
      locationId,
      status,
      createdById: session.user.id,
    },
  });

  await logAudit(session.user.id, "job.create", "JobPosting", job.id, { title, status });

  revalidateRecruiting();
  return {};
}

export async function updateJobPosting(
  id: string,
  _prevState: RecruitingActionState,
  formData: FormData
): Promise<RecruitingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = jobPostingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, employmentType, departmentId, locationId, status } = parsed.data;

  await db.jobPosting.update({
    where: { id },
    data: {
      title,
      description,
      employmentType: employmentType ?? null,
      departmentId,
      locationId,
      status,
    },
  });

  await logAudit(session.user.id, "job.update", "JobPosting", id, { title, status });

  revalidateRecruiting(id);
  return {};
}

export async function deleteJobPosting(id: string): Promise<RecruitingActionState> {
  const session = await requireRole("HR", "ADMIN");

  // Applications cascade-delete with the posting (onDelete: Cascade in schema).
  await db.jobPosting.delete({ where: { id } });
  await logAudit(session.user.id, "job.delete", "JobPosting", id);

  revalidateRecruiting();
  return {};
}

// ---------- Applications ----------

const createApplicationSchema = z.object({
  jobPostingId: z.string().min(1),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: optionalString,
  notes: optionalString,
});

export async function createApplication(
  _prevState: RecruitingActionState,
  formData: FormData
): Promise<RecruitingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = createApplicationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { jobPostingId, firstName, lastName, email, phone, notes } = parsed.data;

  const application = await db.application.create({
    data: {
      jobPostingId,
      firstName,
      lastName,
      email,
      phone: phone ?? null,
      notes: notes ?? null,
      stage: "APPLIED",
    },
  });

  await logAudit(session.user.id, "application.create", "Application", application.id, { jobPostingId, email });

  revalidateRecruiting(jobPostingId);
  return {};
}

const stageSchema = z.enum(stageOrder);

export async function updateApplicationStage(id: string, stage: string): Promise<RecruitingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = stageSchema.safeParse(stage);
  if (!parsed.success) return { error: "validationError" };

  const application = await db.application.update({ where: { id }, data: { stage: parsed.data } });
  await logAudit(session.user.id, "application.stage", "Application", id, { stage: parsed.data });

  revalidateRecruiting(application.jobPostingId);
  return {};
}

const updateApplicationSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: optionalString,
  rating: optionalRating,
  notes: optionalString,
  stage: stageSchema,
});

export async function updateApplication(
  id: string,
  _prevState: RecruitingActionState,
  formData: FormData
): Promise<RecruitingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = updateApplicationSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { firstName, lastName, email, phone, rating, notes, stage } = parsed.data;

  const application = await db.application.update({
    where: { id },
    data: {
      firstName,
      lastName,
      email,
      phone: phone ?? null,
      rating: rating ?? null,
      notes: notes ?? null,
      stage,
    },
  });

  await logAudit(session.user.id, "application.update", "Application", id, { stage });

  revalidateRecruiting(application.jobPostingId);
  return {};
}

export async function deleteApplication(id: string): Promise<RecruitingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const application = await db.application.delete({ where: { id } });
  await logAudit(session.user.id, "application.delete", "Application", id);

  revalidateRecruiting(application.jobPostingId);
  return {};
}
