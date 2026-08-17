"use server";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import { sendMail } from "@/lib/mail";

export type ResetActionState = { error?: string; ok?: boolean };

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

async function baseUrl(): Promise<string> {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

// In-memory rate-limit: max 5 requests / 15 min per email+IP.
// ponytail: per-process limit; use a shared store if multi-instance.
const MAX_REQUESTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimited(keyStr: string): boolean {
  const now = Date.now();
  const rec = attempts.get(keyStr);
  if (rec && rec.resetAt > now) {
    if (rec.count >= MAX_REQUESTS) return true;
    rec.count += 1;
    return false;
  }
  attempts.set(keyStr, { count: 1, resetAt: now + WINDOW_MS });
  return false;
}

export async function requestPasswordReset(
  _prevState: ResetActionState,
  formData: FormData
): Promise<ResetActionState> {
  const parsed = z.object({ email: z.string().email() }).safeParse({ email: formData.get("email") });
  // Generic response either way — never reveal whether the email exists.
  if (!parsed.success) return { ok: true };

  const email = parsed.data.email.toLowerCase();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(`${email}|${ip}`)) return { ok: true };

  const user = await db.user.findUnique({ where: { email }, select: { id: true, locale: true } });
  if (user) {
    const raw = randomBytes(32).toString("base64url");
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${await baseUrl()}/reset-password?token=${raw}`;
    const t = await getTranslations({ locale: user.locale, namespace: "auth.resetEmail" });
    await sendMail({
      to: email,
      subject: t("subject"),
      text: `${t("body")}\n\n${link}\n\n${t("expiry")}`,
      html: `<p>${t("body")}</p><p><a href="${link}">${link}</a></p><p>${t("expiry")}</p>`,
    });
  }

  return { ok: true };
}

const passwordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"] });

export async function resetPassword(
  _prevState: ResetActionState,
  formData: FormData
): Promise<ResetActionState> {
  const parsed = passwordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    const err = parsed.error.issues[0];
    return { error: err?.path[0] === "confirm" ? "passwordMismatch" : "weakPassword" };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "invalidOrExpired" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate the user's other outstanding tokens.
    db.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
  await logAudit(record.userId, "password.reset", "User", record.userId);

  redirect("/login?reset=1");
}
