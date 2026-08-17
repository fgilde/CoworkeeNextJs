"use server";

import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto";
import { sendMail } from "@/lib/mail";

export type MailActionState = { error?: string; ok?: boolean };

const opt = (max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().max(max)).optional();

const schema = z.object({
  provider: z.enum(["SMTP", "SENDGRID", "SENDMAIL", "LOG"]),
  fromEmail: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().email().max(200)
  ).optional(),
  fromName: opt(120),
  smtpHost: opt(200),
  smtpPort: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().min(1).max(65535)
  ).optional(),
  smtpSecure: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  smtpUser: opt(200),
  // Secrets: blank means "keep existing".
  smtpPass: opt(500),
  sendgridKey: opt(500),
});

export async function updateMailSettings(
  _prevState: MailActionState,
  formData: FormData
): Promise<MailActionState> {
  const session = await requireRole("ADMIN");

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const d = parsed.data;

  const data = {
    provider: d.provider,
    fromEmail: d.fromEmail ?? null,
    fromName: d.fromName ?? null,
    smtpHost: d.smtpHost ?? null,
    smtpPort: d.smtpPort ?? null,
    smtpSecure: d.smtpSecure,
    smtpUser: d.smtpUser ?? null,
    // Only overwrite secrets when a new value was provided.
    ...(d.smtpPass ? { smtpPassEnc: encryptSecret(d.smtpPass) } : {}),
    ...(d.sendgridKey ? { sendgridKeyEnc: encryptSecret(d.sendgridKey) } : {}),
  };

  await db.mailSettings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });
  // Never log secret values.
  await logAudit(session.user.id, "mail.settings", "MailSettings", "singleton", {
    provider: d.provider,
    fromEmail: d.fromEmail ?? null,
  });

  return { ok: true };
}

export async function sendTestMail(): Promise<MailActionState> {
  const session = await requireRole("ADMIN");
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  const to = user?.email;
  if (!to) return { error: "noEmail" };

  const ok = await sendMail({
    to,
    subject: "Coworkee — test email",
    text: "This is a test email from your Coworkee mail configuration. If you received it, sending works.",
    html: "<p>This is a test email from your Coworkee mail configuration. If you received it, sending works.</p>",
  });
  return ok ? { ok: true } : { error: "sendFailed" };
}
