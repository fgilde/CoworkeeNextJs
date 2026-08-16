import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { hashApiToken } from "@/lib/api-token";
import { can, type Action } from "@/lib/rbac";

export type ApiAuth = {
  user: { id: string; email: string; role: Role; locale: string; employeeId: string | null };
  role: Role;
};

/** JSON error Response helper. */
export function apiError(status: number, msg: string): Response {
  return Response.json({ error: msg }, { status });
}

/**
 * Authenticate a request via `Authorization: Bearer <raw>`. Returns the token's
 * user + role, or null if the header/token is missing, unknown, or expired.
 * Updates lastUsedAt best-effort.
 */
export async function authenticateApiRequest(req: Request): Promise<ApiAuth | null> {
  const header = req.headers.get("authorization") ?? "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;

  const token = await db.apiToken.findUnique({
    where: { tokenHash: hashApiToken(m[1].trim()) },
    include: {
      user: { select: { id: true, email: true, role: true, locale: true, employeeId: true } },
    },
  });
  if (!token) return null;
  if (token.expiresAt && token.expiresAt.getTime() < Date.now()) return null;

  void db.apiToken.update({ where: { id: token.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { user: token.user, role: token.user.role };
}

/** True if the authenticated principal may perform `action` per RBAC. */
export function requireApiPermission(auth: ApiAuth, action: Action): boolean {
  return can(auth.role, action);
}
