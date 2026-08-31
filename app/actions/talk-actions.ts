"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole, type Role } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyEmployee } from "@/lib/notify";

export type TalkActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();
const optionalDate = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.iso.date())
  .optional();

const ITEM_TYPES = ["SECTION", "TEXT", "RATING", "YESNO"] as const;

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

// HR/ADMIN may run a talk for anyone; a MANAGER only for their own direct reports.
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

function revalidateTalks() {
  revalidatePath("/talks");
  revalidatePath("/talks/templates");
}

// ---------- Templates (the reusable agenda a manager designs) ----------

const templateSchema = z.object({
  title: z.string().trim().min(1),
  description: optionalString,
  shared: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export async function createTemplate(
  _prevState: TalkActionState,
  formData: FormData
): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = templateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, shared } = parsed.data;

  // Only HR/ADMIN may publish an org-wide (shared) template.
  const canShare = session.user.role === "HR" || session.user.role === "ADMIN";
  const tpl = await db.talkTemplate.create({
    data: { title, description: description ?? null, shared: canShare ? shared : false, ownerId: actorEmployeeId },
  });
  await logAudit(session.user.id, "talkTemplate.create", "TalkTemplate", tpl.id, { title });

  revalidateTalks();
  return {};
}

async function loadOwnedTemplate(id: string, actorRole: Role, actorEmployeeId: string) {
  const tpl = await db.talkTemplate.findUnique({ where: { id }, select: { ownerId: true } });
  if (!tpl) return { error: "notFound" as const };
  const isHrOrAdmin = actorRole === "HR" || actorRole === "ADMIN";
  if (tpl.ownerId !== actorEmployeeId && !isHrOrAdmin) return { error: "forbidden" as const };
  return { ok: true as const };
}

export async function updateTemplate(
  id: string,
  _prevState: TalkActionState,
  formData: FormData
): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const owned = await loadOwnedTemplate(id, session.user.role, actorEmployeeId);
  if ("error" in owned) return { error: owned.error };

  const parsed = templateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, description, shared } = parsed.data;

  const canShare = session.user.role === "HR" || session.user.role === "ADMIN";
  await db.talkTemplate.update({
    where: { id },
    data: { title, description: description ?? null, ...(canShare ? { shared } : {}) },
  });
  await logAudit(session.user.id, "talkTemplate.update", "TalkTemplate", id, { title });

  revalidateTalks();
  return {};
}

export async function deleteTemplate(id: string): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const owned = await loadOwnedTemplate(id, session.user.role, actorEmployeeId);
  if ("error" in owned) return { error: owned.error };

  // Talks snapshot their agenda, so removing a template never touches talks in flight;
  // the Talk.templateId FK is nullable and set null on delete.
  await db.talk.updateMany({ where: { templateId: id }, data: { templateId: null } });
  await db.talkTemplate.delete({ where: { id } });
  await logAudit(session.user.id, "talkTemplate.delete", "TalkTemplate", id);

  revalidateTalks();
  return {};
}

// ---------- Template items (the agenda questions) ----------

const itemSchema = z.object({
  type: z.enum(ITEM_TYPES),
  prompt: z.string().trim().min(1),
  helpText: optionalString,
  required: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export async function addTemplateItem(
  templateId: string,
  _prevState: TalkActionState,
  formData: FormData
): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const owned = await loadOwnedTemplate(templateId, session.user.role, actorEmployeeId);
  if ("error" in owned) return { error: owned.error };

  const parsed = itemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { type, prompt, helpText, required } = parsed.data;

  // ponytail: order = current count, no drag-reorder. Delete + re-add to reshuffle.
  const order = await db.talkTemplateItem.count({ where: { templateId } });
  await db.talkTemplateItem.create({
    data: { templateId, order, type, prompt, helpText: helpText ?? null, required: type === "SECTION" ? false : required },
  });
  await logAudit(session.user.id, "talkTemplateItem.create", "TalkTemplate", templateId, { type, prompt });

  revalidatePath(`/talks/templates/${templateId}`);
  return {};
}

export async function deleteTemplateItem(id: string): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const item = await db.talkTemplateItem.findUnique({ where: { id }, select: { templateId: true } });
  if (!item) return { error: "notFound" };
  const owned = await loadOwnedTemplate(item.templateId, session.user.role, actorEmployeeId);
  if ("error" in owned) return { error: owned.error };

  await db.talkTemplateItem.delete({ where: { id } });
  revalidatePath(`/talks/templates/${item.templateId}`);
  return {};
}

// ---------- Talks (a scheduled/held conversation) ----------

const createTalkSchema = z.object({
  employeeId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().trim().min(1),
  scheduledAt: optionalDate,
});

export async function createTalk(
  _prevState: TalkActionState,
  formData: FormData
): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = createTalkSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { employeeId, templateId, title, scheduledAt } = parsed.data;

  if (!(await canManageEmployee(session.user.role, actorEmployeeId, employeeId))) {
    return { error: "notYourTeam" };
  }

  const tpl = await db.talkTemplate.findUnique({
    where: { id: templateId },
    select: { ownerId: true, shared: true, items: { orderBy: { order: "asc" } } },
  });
  if (!tpl) return { error: "templateNotFound" };
  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  if (!tpl.shared && tpl.ownerId !== actorEmployeeId && !isHrOrAdmin) return { error: "forbidden" };

  // Snapshot the agenda so later template edits never mutate this talk.
  const talk = await db.talk.create({
    data: {
      templateId,
      employeeId,
      managerId: actorEmployeeId,
      title,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: "DRAFT",
      items: {
        create: tpl.items.map((it) => ({
          order: it.order,
          type: it.type,
          prompt: it.prompt,
          helpText: it.helpText,
          required: it.required,
        })),
      },
    },
  });
  await logAudit(session.user.id, "talk.create", "Talk", talk.id, { employeeId, title });

  revalidateTalks();
  return {};
}

// A talk is visible to its subject employee, its manager, or HR/ADMIN. The
// subject only sees it once SHARED — a DRAFT is the manager's private prep.
async function loadTalkForActor(id: string, actorRole: Role, actorEmployeeId: string | null) {
  const talk = await db.talk.findUnique({
    where: { id },
    select: { id: true, employeeId: true, managerId: true, status: true, title: true },
  });
  if (!talk) return { error: "notFound" as const };
  const isHrOrAdmin = actorRole === "HR" || actorRole === "ADMIN";
  const isManager = actorEmployeeId !== null && actorEmployeeId === talk.managerId;
  const isSubject = actorEmployeeId !== null && actorEmployeeId === talk.employeeId;
  if (!isHrOrAdmin && !isManager && !isSubject) return { error: "forbidden" as const };
  if (isSubject && !isManager && !isHrOrAdmin && talk.status === "DRAFT") return { error: "forbidden" as const };
  return { talk, isManagerSide: isManager || isHrOrAdmin, isSubject };
}

export async function releaseTalk(id: string): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  const loaded = await loadTalkForActor(id, session.user.role, actorEmployeeId);
  if ("error" in loaded) return { error: loaded.error };
  if (!loaded.isManagerSide) return { error: "forbidden" };
  if (loaded.talk.status !== "DRAFT") return { error: "alreadyShared" };

  await db.talk.update({ where: { id }, data: { status: "SHARED" } });
  await logAudit(session.user.id, "talk.release", "Talk", id);
  await notifyEmployee(loaded.talk.employeeId, {
    type: "talk.shared",
    titleKey: "notifications.talkShared",
    body: loaded.talk.title,
    link: `/talks/${id}`,
  });

  revalidateTalks();
  revalidatePath(`/talks/${id}`);
  return {};
}

const completeSchema = z.object({ summary: optionalString });

export async function completeTalk(
  id: string,
  _prevState: TalkActionState,
  formData: FormData
): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  const loaded = await loadTalkForActor(id, session.user.role, actorEmployeeId);
  if ("error" in loaded) return { error: loaded.error };
  if (!loaded.isManagerSide) return { error: "forbidden" };
  if (loaded.talk.status === "COMPLETED") return { error: "alreadyCompleted" };

  const parsed = completeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  await db.talk.update({
    where: { id },
    data: { status: "COMPLETED", summary: parsed.data.summary ?? null, completedAt: new Date() },
  });
  await logAudit(session.user.id, "talk.complete", "Talk", id);
  await notifyEmployee(loaded.talk.employeeId, {
    type: "talk.completed",
    titleKey: "notifications.talkCompleted",
    body: loaded.talk.title,
    link: `/talks/${id}`,
  });

  revalidateTalks();
  revalidatePath(`/talks/${id}`);
  return {};
}

export async function deleteTalk(id: string): Promise<TalkActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  const loaded = await loadTalkForActor(id, session.user.role, actorEmployeeId);
  if ("error" in loaded) return { error: loaded.error };
  if (!loaded.isManagerSide) return { error: "forbidden" };

  await db.talk.delete({ where: { id } });
  await logAudit(session.user.id, "talk.delete", "Talk", id);

  revalidateTalks();
  return {};
}

// Save the acting side's whole answer set in one go. FormData carries
// `text__<itemId>` and `rating__<itemId>` keys per agenda item.
export async function saveTalkAnswers(
  id: string,
  _prevState: TalkActionState,
  formData: FormData
): Promise<TalkActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  const loaded = await loadTalkForActor(id, session.user.role, actorEmployeeId);
  if ("error" in loaded) return { error: loaded.error };
  if (loaded.talk.status === "COMPLETED") return { error: "alreadyCompleted" };
  // The subject can only fill once the talk is shared.
  if (loaded.isSubject && !loaded.isManagerSide && loaded.talk.status !== "SHARED") return { error: "forbidden" };

  const party = loaded.isManagerSide ? "MANAGER" : "EMPLOYEE";
  const items = await db.talkItem.findMany({
    where: { talkId: id, type: { not: "SECTION" } },
    select: { id: true, type: true },
  });

  for (const item of items) {
    const rawText = formData.get(`text__${item.id}`);
    const rawRating = formData.get(`rating__${item.id}`);
    const text = typeof rawText === "string" && rawText.trim() !== "" ? rawText.trim() : null;
    const ratingNum =
      item.type === "RATING" && typeof rawRating === "string" && rawRating !== "" ? Number(rawRating) : null;
    const rating = ratingNum !== null && Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : null;

    if (text === null && rating === null) {
      await db.talkAnswer.deleteMany({ where: { itemId: item.id, party } });
      continue;
    }
    await db.talkAnswer.upsert({
      where: { itemId_party: { itemId: item.id, party } },
      create: { talkId: id, itemId: item.id, party, text, rating },
      update: { text, rating },
    });
  }
  await logAudit(session.user.id, "talk.saveAnswers", "Talk", id, { party });

  revalidatePath(`/talks/${id}`);
  return {};
}
