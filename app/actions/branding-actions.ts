"use server";

import { writeFile, unlink } from "fs/promises";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { ensureBrandingDir, generateStoredName, safeBrandingPath } from "@/lib/documents";
import { isValidHex, isValidPreset } from "@/lib/theming";

export type BrandingActionState = { error?: string; ok?: boolean };

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

// Persist theme preset + accent color (logo handled separately below).
export async function updateAppearance(
  _prevState: BrandingActionState,
  formData: FormData
): Promise<BrandingActionState> {
  const session = await requireRole("ADMIN");

  const themePreset = formData.get("themePreset");
  const accentColor = formData.get("accentColor");
  if (!isValidPreset(themePreset) || !isValidHex(accentColor)) {
    return { error: "validationError" };
  }

  await db.companySettings.upsert({
    where: { id: "singleton" },
    update: { themePreset, accentColor },
    create: { id: "singleton", companyName: "Coworkee", themePreset, accentColor },
  });
  await logAudit(session.user.id, "branding.appearance", "CompanySettings", "singleton", {
    themePreset,
    accentColor,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function uploadLogo(
  _prevState: BrandingActionState,
  formData: FormData
): Promise<BrandingActionState> {
  const session = await requireRole("ADMIN");

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "validationError" };
  if (file.size > MAX_SIZE_BYTES) return { error: "fileTooLarge" };
  if (!ALLOWED_MIME_TYPES.has(file.type)) return { error: "fileType" };

  await ensureBrandingDir();
  const storedName = generateStoredName(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(safeBrandingPath(storedName), bytes);

  // Remove the previous logo file (best effort) before swapping the pointer.
  const prev = await db.companySettings.findUnique({
    where: { id: "singleton" },
    select: { logoPath: true },
  });
  await db.companySettings.upsert({
    where: { id: "singleton" },
    update: { logoPath: storedName },
    create: { id: "singleton", companyName: "Coworkee", logoPath: storedName },
  });
  if (prev?.logoPath) {
    try {
      await unlink(safeBrandingPath(prev.logoPath));
    } catch (err: any) {
      if (err?.code !== "ENOENT") throw err;
    }
  }

  await logAudit(session.user.id, "branding.logo.upload", "CompanySettings", "singleton", { storedName });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeLogo(): Promise<BrandingActionState> {
  const session = await requireRole("ADMIN");

  const cs = await db.companySettings.findUnique({
    where: { id: "singleton" },
    select: { logoPath: true },
  });
  if (cs?.logoPath) {
    await db.companySettings.update({ where: { id: "singleton" }, data: { logoPath: null } });
    try {
      await unlink(safeBrandingPath(cs.logoPath));
    } catch (err: any) {
      if (err?.code !== "ENOENT") throw err;
    }
    await logAudit(session.user.id, "branding.logo.remove", "CompanySettings", "singleton");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
