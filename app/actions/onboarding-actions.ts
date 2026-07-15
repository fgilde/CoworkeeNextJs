"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAuth, requireRole, can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type OnboardingActionState = { error?: string };

function isDuplicateError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function revalidateOnboarding(checklistId?: string) {
  revalidatePath("/onboarding");
  if (checklistId) revalidatePath(`/onboarding/${checklistId}`);
}

const templateSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["ONBOARDING", "OFFBOARDING"]),
});

export async function createTemplate(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = templateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  try {
    const template = await db.checklistTemplate.create({ data: parsed.data });
    await logAudit(session.user.id, "checklistTemplate.create", "ChecklistTemplate", template.id, parsed.data);
  } catch (error) {
    if (isDuplicateError(error)) return { error: "nameTaken" };
    throw error;
  }

  revalidateOnboarding();
  return {};
}

export async function updateTemplate(
  id: string,
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = templateSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  try {
    await db.checklistTemplate.update({ where: { id }, data: parsed.data });
    await logAudit(session.user.id, "checklistTemplate.update", "ChecklistTemplate", id, parsed.data);
  } catch (error) {
    if (isDuplicateError(error)) return { error: "nameTaken" };
    throw error;
  }

  revalidateOnboarding();
  return {};
}

export async function deleteTemplate(id: string): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  // Templates are snapshotted into EmployeeChecklist/ChecklistTask on start, so
  // there's no FK from active processes back to the template — safe to cascade.
  await db.checklistTemplate.delete({ where: { id } });
  await logAudit(session.user.id, "checklistTemplate.delete", "ChecklistTemplate", id);

  revalidateOnboarding();
  return {};
}

const itemSchema = z.object({ title: z.string().trim().min(1) });

export async function addTemplateItem(
  templateId: string,
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = itemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  const count = await db.checklistTemplateItem.count({ where: { templateId } });
  const item = await db.checklistTemplateItem.create({
    data: { templateId, title: parsed.data.title, sortOrder: count },
  });
  await logAudit(session.user.id, "checklistTemplate.addItem", "ChecklistTemplateItem", item.id, parsed.data);

  revalidateOnboarding();
  return {};
}

export async function updateTemplateItem(
  id: string,
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = itemSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };

  await db.checklistTemplateItem.update({ where: { id }, data: { title: parsed.data.title } });
  await logAudit(session.user.id, "checklistTemplate.updateItem", "ChecklistTemplateItem", id, parsed.data);

  revalidateOnboarding();
  return {};
}

export async function deleteTemplateItem(id: string): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  await db.checklistTemplateItem.delete({ where: { id } });
  await logAudit(session.user.id, "checklistTemplate.deleteItem", "ChecklistTemplateItem", id);

  revalidateOnboarding();
  return {};
}

const startChecklistSchema = z.object({
  employeeId: z.string().min(1),
  templateId: z.string().min(1),
});

export async function startChecklist(
  _prevState: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = startChecklistSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { employeeId, templateId } = parsed.data;

  const template = await db.checklistTemplate.findUnique({
    where: { id: templateId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) return { error: "templateNotFound" };

  const checklist = await db.employeeChecklist.create({
    data: {
      employeeId,
      type: template.type,
      title: template.name,
      tasks: {
        create: template.items.map((item) => ({
          title: item.title,
          sortOrder: item.sortOrder,
        })),
      },
    },
  });

  await logAudit(session.user.id, "checklist.start", "EmployeeChecklist", checklist.id, {
    employeeId,
    templateId,
  });

  revalidateOnboarding();
  return {};
}

export async function toggleTask(taskId: string): Promise<OnboardingActionState> {
  const session = await requireAuth();

  const task = await db.checklistTask.findUnique({
    where: { id: taskId },
    include: { checklist: { include: { tasks: true } } },
  });
  if (!task) return { error: "notFound" };

  const isManager = can(session.user.role, "onboarding:manage");
  if (!isManager) {
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { employeeId: true } });
    if (!user?.employeeId || user.employeeId !== task.checklist.employeeId) return { error: "forbidden" };
  }

  const nextDone = !task.done;
  await db.checklistTask.update({
    where: { id: taskId },
    data: { done: nextDone, doneAt: nextDone ? new Date() : null },
  });

  const allDone = task.checklist.tasks.every((t) => (t.id === taskId ? nextDone : t.done));
  await db.employeeChecklist.update({
    where: { id: task.checklistId },
    data: { completedAt: allDone ? new Date() : null },
  });

  await logAudit(session.user.id, "checklist.toggleTask", "ChecklistTask", taskId, { done: nextDone });

  revalidateOnboarding(task.checklistId);
  return {};
}

export async function deleteChecklist(id: string): Promise<OnboardingActionState> {
  const session = await requireRole("HR", "ADMIN");

  await db.employeeChecklist.delete({ where: { id } });
  await logAudit(session.user.id, "checklist.delete", "EmployeeChecklist", id);

  revalidateOnboarding();
  return {};
}
