"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyEmployee } from "@/lib/notify";

export type SignatureActionState = { error?: string };

async function resolveActingEmployeeId(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { employeeId: true } });
  return user?.employeeId ?? null;
}

function revalidateSignatures() {
  revalidatePath("/signatures");
}

const createSchema = z.object({
  signerId: z.string().min(1),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export async function createSignatureRequest(
  _prevState: SignatureActionState,
  formData: FormData
): Promise<SignatureActionState> {
  const session = await requireRole("MANAGER", "HR", "ADMIN");
  const requesterId = await resolveActingEmployeeId(session.user.id);
  if (!requesterId) return { error: "noEmployee" };

  const parsed = createSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { signerId, title, body } = parsed.data;

  const request = await db.signatureRequest.create({
    data: { requesterId, signerId, title, body, status: "PENDING" },
  });

  await logAudit(session.user.id, "signature.create", "SignatureRequest", request.id, { signerId, title });

  await notifyEmployee(signerId, {
    type: "signature.requested",
    titleKey: "notifications.signatureRequested",
    body: title,
    link: "/signatures",
  });

  revalidateSignatures();
  return {};
}

export async function signRequest(id: string, signedName: string): Promise<SignatureActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const parsed = z.string().trim().min(1).safeParse(signedName);
  if (!parsed.success) return { error: "validationError" };

  const request = await db.signatureRequest.findUnique({
    where: { id },
    select: { signerId: true, status: true, requesterId: true, title: true },
  });
  if (!request) return { error: "notFound" };
  if (request.signerId !== actorEmployeeId) return { error: "forbidden" };
  if (request.status !== "PENDING") return { error: "alreadyHandled" };

  await db.signatureRequest.update({
    where: { id },
    data: { status: "SIGNED", signedName: parsed.data, signedAt: new Date() },
  });

  await logAudit(session.user.id, "signature.sign", "SignatureRequest", id);

  await notifyEmployee(request.requesterId, {
    type: "signature.signed",
    titleKey: "notifications.signatureSigned",
    body: request.title,
    link: "/signatures",
  });

  revalidateSignatures();
  return {};
}

export async function declineRequest(id: string): Promise<SignatureActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const request = await db.signatureRequest.findUnique({
    where: { id },
    select: { signerId: true, status: true, requesterId: true, title: true },
  });
  if (!request) return { error: "notFound" };
  if (request.signerId !== actorEmployeeId) return { error: "forbidden" };
  if (request.status !== "PENDING") return { error: "alreadyHandled" };

  await db.signatureRequest.update({ where: { id }, data: { status: "DECLINED" } });

  await logAudit(session.user.id, "signature.decline", "SignatureRequest", id);

  await notifyEmployee(request.requesterId, {
    type: "signature.declined",
    titleKey: "notifications.signatureDeclined",
    body: request.title,
    link: "/signatures",
  });

  revalidateSignatures();
  return {};
}

export async function deleteRequest(id: string): Promise<SignatureActionState> {
  const session = await requireAuth();
  const actorEmployeeId = await resolveActingEmployeeId(session.user.id);
  if (!actorEmployeeId) return { error: "noEmployee" };

  const request = await db.signatureRequest.findUnique({ where: { id }, select: { requesterId: true } });
  if (!request) return { error: "notFound" };

  const isHrOrAdmin = session.user.role === "HR" || session.user.role === "ADMIN";
  if (request.requesterId !== actorEmployeeId && !isHrOrAdmin) return { error: "forbidden" };

  await db.signatureRequest.delete({ where: { id } });
  await logAudit(session.user.id, "signature.delete", "SignatureRequest", id);

  revalidateSignatures();
  return {};
}
