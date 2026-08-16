"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { generateApiToken } from "@/lib/api-token";

export type ApiTokenActionState = { error?: string; ok?: boolean; raw?: string; name?: string };

const createSchema = z.object({ name: z.string().min(1).max(100) });

export async function createApiToken(
  _prev: ApiTokenActionState,
  formData: FormData
): Promise<ApiTokenActionState> {
  const session = await requireAuth();
  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: "nameRequired" };

  const { raw, hash, prefix } = generateApiToken();
  await db.apiToken.create({
    data: { userId: session.user.id, name: parsed.data.name, tokenHash: hash, prefix },
  });
  await logAudit(session.user.id, "apiToken.create", "ApiToken", prefix);

  revalidatePath("/account");
  // raw is returned to the caller ONCE and never persisted in plaintext.
  return { ok: true, raw, name: parsed.data.name };
}

export async function revokeApiToken(
  _prev: ApiTokenActionState,
  formData: FormData
): Promise<ApiTokenActionState> {
  const session = await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "revokeFailed" };

  // Own-tokens-only: the userId filter guarantees a user can never delete another's token.
  const res = await db.apiToken.deleteMany({ where: { id, userId: session.user.id } });
  if (res.count === 0) return { error: "revokeFailed" };
  await logAudit(session.user.id, "apiToken.revoke", "ApiToken", id);

  revalidatePath("/account");
  return { ok: true };
}
