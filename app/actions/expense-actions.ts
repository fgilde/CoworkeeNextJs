"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole, type Role } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyEmployee } from "@/lib/notify";

export type ExpenseActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

// HR/ADMIN may act on any employee's expenses; a MANAGER only their own reports.
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

function revalidateExpenses() {
  revalidatePath("/expenses");
}

const submitExpenseSchema = z.object({
  title: z.string().trim().min(1),
  category: optionalString,
  amount: z.coerce.number().positive(),
  currency: z.preprocess((v) => (v === "" || v == null ? "EUR" : v), z.string().trim().min(1)),
  spentAt: z.iso.date(),
  note: optionalString,
});

export async function submitExpense(
  _prevState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = submitExpenseSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { title, category, amount, currency, spentAt, note } = parsed.data;

  const amountCents = Math.round(amount * 100);
  if (amountCents <= 0) return { error: "validationError" };

  const expense = await db.expense.create({
    data: {
      employeeId: actorEmployeeId,
      title,
      category: category ?? null,
      amountCents,
      currency,
      spentAt: new Date(spentAt),
      note: note ?? null,
      status: "PENDING",
    },
  });

  await logAudit(session.user.id, "expense.submit", "Expense", expense.id, { title, amountCents, currency });

  revalidateExpenses();
  return {};
}

export async function decideExpense(
  id: string,
  decision: "APPROVED" | "REJECTED"
): Promise<ExpenseActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = z.enum(["APPROVED", "REJECTED"]).safeParse(decision);
  if (!parsed.success) return { error: "validationError" };

  const expense = await db.expense.findUnique({
    where: { id },
    select: { employeeId: true, status: true, title: true },
  });
  if (!expense) return { error: "notFound" };
  if (expense.status !== "PENDING") return { error: "notPending" };
  if (!(await canManageEmployee(session.user.role, actorEmployeeId, expense.employeeId))) {
    return { error: "notYourTeam" };
  }

  await db.expense.update({
    where: { id },
    data: { status: parsed.data, decidedById: session.user.id, decidedAt: new Date() },
  });

  await logAudit(session.user.id, "expense.decide", "Expense", id, { decision: parsed.data });

  await notifyEmployee(expense.employeeId, {
    type: "expense.decided",
    titleKey: "notifications.expenseDecided",
    body: expense.title,
    link: "/expenses",
  });

  revalidateExpenses();
  return {};
}

export async function markReimbursed(id: string): Promise<ExpenseActionState> {
  const session = await requireRole("HR", "ADMIN");

  const expense = await db.expense.findUnique({ where: { id }, select: { status: true } });
  if (!expense) return { error: "notFound" };
  if (expense.status !== "APPROVED") return { error: "notApproved" };

  await db.expense.update({ where: { id }, data: { status: "REIMBURSED" } });
  await logAudit(session.user.id, "expense.reimburse", "Expense", id);

  revalidateExpenses();
  return {};
}

export async function deleteExpense(id: string): Promise<ExpenseActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const expense = await db.expense.findUnique({ where: { id }, select: { employeeId: true, status: true } });
  if (!expense) return { error: "notFound" };

  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  const isOwnerPending = expense.employeeId === actorEmployeeId && expense.status === "PENDING";
  if (!isHrOrAdmin && !isOwnerPending) return { error: "forbidden" };

  await db.expense.delete({ where: { id } });
  await logAudit(session.user.id, "expense.delete", "Expense", id);

  revalidateExpenses();
  return {};
}
