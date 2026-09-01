"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type AssetActionState = { error?: string };

const optionalString = z
  .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string())
  .optional();

function revalidateAssets() {
  revalidatePath("/assets");
}

const createAssetSchema = z.object({
  name: z.string().trim().min(1),
  category: optionalString,
  serialNumber: optionalString,
  notes: optionalString,
});

export async function createAsset(
  _prevState: AssetActionState,
  formData: FormData
): Promise<AssetActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = createAssetSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: "validationError" };
  const { name, category, serialNumber, notes } = parsed.data;

  const asset = await db.asset.create({
    data: {
      name,
      category: category ?? null,
      serialNumber: serialNumber ?? null,
      notes: notes ?? null,
      status: "AVAILABLE",
    },
  });

  await logAudit(session.user.id, "asset.create", "Asset", asset.id, { name });

  revalidateAssets();
  return {};
}

export async function assignAsset(id: string, employeeId: string): Promise<AssetActionState> {
  const session = await requireRole("HR", "ADMIN");

  const parsed = z.object({ id: z.string().min(1), employeeId: z.string().min(1) }).safeParse({ id, employeeId });
  if (!parsed.success) return { error: "validationError" };

  const asset = await db.asset.findUnique({ where: { id }, select: { status: true } });
  if (!asset) return { error: "notFound" };
  if (asset.status === "RETIRED") return { error: "retired" };

  await db.asset.update({
    where: { id },
    data: { assignedToId: employeeId, status: "ASSIGNED", assignedAt: new Date() },
  });

  await logAudit(session.user.id, "asset.assign", "Asset", id, { employeeId });

  revalidateAssets();
  return {};
}

export async function returnAsset(id: string): Promise<AssetActionState> {
  const session = await requireRole("HR", "ADMIN");

  const asset = await db.asset.findUnique({ where: { id }, select: { id: true } });
  if (!asset) return { error: "notFound" };

  await db.asset.update({
    where: { id },
    data: { assignedToId: null, status: "AVAILABLE", assignedAt: null },
  });

  await logAudit(session.user.id, "asset.return", "Asset", id);

  revalidateAssets();
  return {};
}

export async function retireAsset(id: string): Promise<AssetActionState> {
  const session = await requireRole("HR", "ADMIN");

  const asset = await db.asset.findUnique({ where: { id }, select: { id: true } });
  if (!asset) return { error: "notFound" };

  await db.asset.update({
    where: { id },
    data: { status: "RETIRED", assignedToId: null, assignedAt: null },
  });

  await logAudit(session.user.id, "asset.retire", "Asset", id);

  revalidateAssets();
  return {};
}

export async function deleteAsset(id: string): Promise<AssetActionState> {
  const session = await requireRole("HR", "ADMIN");

  const asset = await db.asset.findUnique({ where: { id }, select: { id: true } });
  if (!asset) return { error: "notFound" };

  await db.asset.delete({ where: { id } });

  await logAudit(session.user.id, "asset.delete", "Asset", id);

  revalidateAssets();
  return {};
}
