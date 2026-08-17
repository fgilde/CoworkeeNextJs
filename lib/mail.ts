import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

type MailSettings = NonNullable<Awaited<ReturnType<typeof getSettings>>>;

const FALLBACK_FROM = "Coworkee <no-reply@coworkee.local>";

async function getSettings() {
  return db.mailSettings.findUnique({ where: { id: "singleton" } });
}

function fromLine(s: { fromName?: string | null; fromEmail?: string | null } | null): string {
  if (!s?.fromEmail) return FALLBACK_FROM;
  return s.fromName ? `${s.fromName} <${s.fromEmail}>` : s.fromEmail;
}

// True unless we'd only log (provider LOG or no from address configured).
export async function isMailConfigured(): Promise<boolean> {
  const s = await getSettings();
  return !!s && s.provider !== "LOG" && !!s.fromEmail;
}

function buildTransport(s: MailSettings) {
  switch (s.provider) {
    case "SMTP":
      return nodemailer.createTransport({
        host: s.smtpHost ?? undefined,
        port: s.smtpPort ?? 587,
        secure: s.smtpSecure,
        auth: s.smtpUser ? { user: s.smtpUser, pass: s.smtpPassEnc ? decryptSecret(s.smtpPassEnc) : "" } : undefined,
      });
    case "SENDGRID":
      return nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: { user: "apikey", pass: s.sendgridKeyEnc ? decryptSecret(s.sendgridKeyEnc) : "" },
      });
    case "SENDMAIL":
      return nodemailer.createTransport({ sendmail: true, newline: "unix", path: "/usr/sbin/sendmail" });
    default:
      return null; // LOG
  }
}

// Sends a mail via the configured provider. On LOG (default/unconfigured) it
// logs the full message (incl. links) and returns true, so reset stays usable
// on an unconfigured instance. Never throws in a way that leaks recipient
// existence — returns false on failure.
export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const s = await getSettings();
  const transport = s ? buildTransport(s) : null;
  const from = fromLine(s);

  if (!transport) {
    console.log(
      `[mail:LOG] from=${from} to=${to}\nsubject: ${subject}\n${text}`
    );
    return true;
  }

  try {
    await transport.sendMail({ from, to, subject, html, text });
    return true;
  } catch (err) {
    console.error("[mail] send failed:", err);
    return false;
  }
}
