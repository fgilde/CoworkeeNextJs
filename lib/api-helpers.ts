import { authenticateApiRequest, requireApiPermission, apiError, type ApiAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import type { Action } from "@/lib/rbac";

/**
 * Authenticate the request and optionally enforce one RBAC action.
 * Returns the ApiAuth on success, or a ready-to-return error Response
 * (401 no/invalid token, 403 not permitted). Callers: `if (a instanceof Response) return a;`
 */
export async function authorize(req: Request, action?: Action): Promise<ApiAuth | Response> {
  const auth = await authenticateApiRequest(req);
  if (!auth) return apiError(401, "Unauthorized — Bearer token missing or invalid");
  if (action && !requireApiPermission(auth, action)) return apiError(403, "Forbidden — insufficient role");
  return auth;
}

/** Parse ?page & ?limit into skip/take (limit 1..100, default 50). */
export function pagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  return { page, limit, skip: (page - 1) * limit, take: limit };
}

/** Employee ids of a manager's direct reports (UI's team scope). */
export async function reportIds(managerEmployeeId: string): Promise<string[]> {
  const reports = await db.employee.findMany({ where: { managerId: managerEmployeeId }, select: { id: true } });
  return reports.map((r) => r.id);
}

export function parsed<T>(body: unknown, ok: (b: Record<string, unknown>) => T | null): T | null {
  if (!body || typeof body !== "object") return null;
  return ok(body as Record<string, unknown>);
}
