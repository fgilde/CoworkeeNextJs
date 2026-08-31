"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyManyUsers } from "@/lib/notify";

export type SurveyActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();
const asBool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

const QUESTION_TYPES = ["SCALE", "NPS", "TEXT"] as const;

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

function revalidateSurveys() {
  revalidatePath("/surveys");
}

// ---------- Survey CRUD (HR/ADMIN) ----------

const surveySchema = z.object({
  title: z.string().trim().min(1),
  description: optionalString,
  anonymous: asBool,
});

export async function createSurvey(
  _prev: SurveyActionState,
  formData: FormData
): Promise<SurveyActionState> {
  const session = await requireRole("HR", "ADMIN");
  const parsed = surveySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, anonymous } = parsed.data;

  const survey = await db.survey.create({
    data: { title, description: description ?? null, anonymous, createdById: session.user.id, status: "DRAFT" },
  });
  await logAudit(session.user.id, "survey.create", "Survey", survey.id, { title });
  revalidateSurveys();
  return {};
}

export async function updateSurvey(
  id: string,
  _prev: SurveyActionState,
  formData: FormData
): Promise<SurveyActionState> {
  const session = await requireRole("HR", "ADMIN");
  const survey = await db.survey.findUnique({ where: { id }, select: { status: true } });
  if (!survey) return { error: "notFound" };
  if (survey.status !== "DRAFT") return { error: "notDraft" };

  const parsed = surveySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, anonymous } = parsed.data;

  await db.survey.update({ where: { id }, data: { title, description: description ?? null, anonymous } });
  revalidatePath(`/surveys/${id}`);
  revalidateSurveys();
  return {};
}

const questionSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  prompt: z.string().trim().min(1),
  required: asBool,
});

export async function addSurveyQuestion(
  surveyId: string,
  _prev: SurveyActionState,
  formData: FormData
): Promise<SurveyActionState> {
  await requireRole("HR", "ADMIN");
  const survey = await db.survey.findUnique({ where: { id: surveyId }, select: { status: true } });
  if (!survey) return { error: "notFound" };
  if (survey.status !== "DRAFT") return { error: "notDraft" };

  const parsed = questionSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { type, prompt, required } = parsed.data;

  const order = await db.surveyQuestion.count({ where: { surveyId } });
  await db.surveyQuestion.create({ data: { surveyId, order, type, prompt, required } });
  revalidatePath(`/surveys/${surveyId}`);
  return {};
}

export async function deleteSurveyQuestion(id: string): Promise<SurveyActionState> {
  await requireRole("HR", "ADMIN");
  const q = await db.surveyQuestion.findUnique({
    where: { id },
    select: { surveyId: true, survey: { select: { status: true } } },
  });
  if (!q) return { error: "notFound" };
  if (q.survey.status !== "DRAFT") return { error: "notDraft" };
  await db.surveyQuestion.delete({ where: { id } });
  revalidatePath(`/surveys/${q.surveyId}`);
  return {};
}

export async function openSurvey(id: string): Promise<SurveyActionState> {
  const session = await requireRole("HR", "ADMIN");
  const survey = await db.survey.findUnique({ where: { id }, select: { status: true, title: true, _count: { select: { questions: true } } } });
  if (!survey) return { error: "notFound" };
  if (survey.status !== "DRAFT") return { error: "notDraft" };
  if (survey._count.questions === 0) return { error: "noQuestions" };

  await db.survey.update({ where: { id }, data: { status: "OPEN" } });
  await logAudit(session.user.id, "survey.open", "Survey", id);

  // Best-effort: invite everyone with a login.
  const users = await db.user.findMany({ where: { employeeId: { not: null } }, select: { id: true } });
  await notifyManyUsers(users.map((u) => u.id), {
    type: "survey.opened",
    titleKey: "notifications.surveyOpened",
    body: survey.title,
    link: `/surveys/${id}`,
  });

  revalidatePath(`/surveys/${id}`);
  revalidateSurveys();
  return {};
}

export async function closeSurvey(id: string): Promise<SurveyActionState> {
  const session = await requireRole("HR", "ADMIN");
  const survey = await db.survey.findUnique({ where: { id }, select: { status: true } });
  if (!survey) return { error: "notFound" };
  if (survey.status !== "OPEN") return { error: "notOpen" };
  await db.survey.update({ where: { id }, data: { status: "CLOSED" } });
  await logAudit(session.user.id, "survey.close", "Survey", id);
  revalidatePath(`/surveys/${id}`);
  revalidateSurveys();
  return {};
}

export async function deleteSurvey(id: string): Promise<SurveyActionState> {
  const session = await requireRole("HR", "ADMIN");
  await db.survey.delete({ where: { id } });
  await logAudit(session.user.id, "survey.delete", "Survey", id);
  revalidateSurveys();
  return {};
}

// ---------- Responding (any employee, once) ----------

export async function submitSurveyResponse(
  surveyId: string,
  _prev: SurveyActionState,
  formData: FormData
): Promise<SurveyActionState> {
  const session = await requireAuth();
  const employeeId = await resolveActingEmployeeId(session.user.id);
  if (!employeeId) return { error: "noEmployee" };

  const survey = await db.survey.findUnique({
    where: { id: surveyId },
    select: { status: true, anonymous: true, questions: { orderBy: { order: "asc" } } },
  });
  if (!survey) return { error: "notFound" };
  if (survey.status !== "OPEN") return { error: "notOpen" };

  const already = await db.surveyParticipation.findUnique({
    where: { surveyId_employeeId: { surveyId, employeeId } },
  });
  if (already) return { error: "alreadyResponded" };

  const answers: { questionId: string; value: number | null; text: string | null }[] = [];
  for (const q of survey.questions) {
    const raw = formData.get(`q__${q.id}`);
    const str = typeof raw === "string" ? raw.trim() : "";
    if (q.type === "TEXT") {
      if (q.required && str === "") return { error: "missingRequired" };
      answers.push({ questionId: q.id, value: null, text: str === "" ? null : str });
    } else {
      const max = q.type === "NPS" ? 10 : 5;
      const min = q.type === "NPS" ? 0 : 1;
      if (str === "") {
        if (q.required) return { error: "missingRequired" };
        answers.push({ questionId: q.id, value: null, text: null });
      } else {
        const n = Number(str);
        if (!Number.isInteger(n) || n < min || n > max) return { error: "validationError" };
        answers.push({ questionId: q.id, value: n, text: null });
      }
    }
  }

  // Participation marker (dedupe) + the answers, atomically. For anonymous
  // surveys the response carries no respondentId, so answers can't be traced.
  try {
    await db.$transaction([
      db.surveyParticipation.create({ data: { surveyId, employeeId } }),
      db.surveyResponse.create({
        data: {
          surveyId,
          respondentId: survey.anonymous ? null : employeeId,
          answers: { create: answers },
        },
      }),
    ]);
  } catch {
    // Unique violation on participation = a concurrent double submit.
    return { error: "alreadyResponded" };
  }

  revalidatePath(`/surveys/${surveyId}`);
  revalidateSurveys();
  return {};
}
