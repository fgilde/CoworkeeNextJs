import { redirect } from "next/navigation";
import type { Session } from "next-auth";

export type Action =
  | "employee:read"
  | "employee:write"
  | "settings:write"
  | "users:manage"
  | "leave:request"
  | "leave:approve"
  | "leave:manage"
  | "time:track"
  | "time:view-team"
  | "document:read-own"
  | "document:manage"
  | "announcement:manage";
export type Role = "ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";

const PERMISSIONS: Record<Role, Set<Action>> = {
  ADMIN: new Set([
    "employee:read",
    "employee:write",
    "settings:write",
    "users:manage",
    "leave:request",
    "leave:approve",
    "leave:manage",
    "time:track",
    "time:view-team",
    "document:read-own",
    "document:manage",
    "announcement:manage",
  ]),
  HR: new Set([
    "employee:read",
    "employee:write",
    "settings:write",
    "leave:request",
    "leave:approve",
    "leave:manage",
    "time:track",
    "time:view-team",
    "document:read-own",
    "document:manage",
    "announcement:manage",
  ]),
  MANAGER: new Set([
    "employee:read",
    "leave:request",
    "leave:approve",
    "time:track",
    "time:view-team",
    "document:read-own",
  ]),
  EMPLOYEE: new Set(["employee:read", "leave:request", "time:track", "document:read-own"]),
};

export function can(role: Role, action: Action): boolean {
  return PERMISSIONS[role].has(action);
}

// `auth` is imported lazily (dynamic import) so that importing `can` — the part
// this file's tests cover — never pulls next-auth's runtime into vitest.

export async function requireAuth(): Promise<Session> {
  const { auth } = await import("../auth");
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await requireAuth();
  if (!roles.includes(session.user.role)) redirect("/");
  return session;
}
