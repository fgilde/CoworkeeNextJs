# Task 5 Report — RBAC helpers + guards

## Status
Done.

## Commit
`72924a4` — "feat: rbac helpers + guards"

## Files
- `C:\dev\privat\github\Coworkee_NEXTJS\lib\rbac.ts`
- `C:\dev\privat\github\Coworkee_NEXTJS\lib\rbac.test.ts`

## Test result
`npx vitest run lib/rbac.test.ts` → 1 file, 3 tests, all PASS. Full suite (`npm run test`) → 2 files, 4 tests, all PASS. `npm run build` → compiles and type-checks with no errors.

## Implementation notes
- `can(role, action)` is a pure `Record<Role, Set<Action>>` lookup, exactly matching the spec matrix (ADMIN: all 4; HR: read/write/settings, no users:manage; MANAGER/EMPLOYEE: read only).
- `requireAuth()` / `requireRole(...roles)` implemented per spec using `auth()` and `redirect()`.
- TDD followed literally: wrote `lib/rbac.test.ts` first, confirmed it failed with "Cannot find module './rbac'", then implemented `lib/rbac.ts`, then confirmed pass.

## Concerns / deviations from the literal task text (with reasons)
1. **`auth` import is a dynamic `import("../auth")` inside `requireAuth`, not a static top-level import.** A static top-level `import { auth } from "@/auth"` (or even `"../auth"`) transitively loads next-auth's internals (`next-auth/lib/env.js` → `next/server`), which fails to resolve under vitest's node environment ("Cannot find package 'next/server'... did you mean next/server.js"). Since ES module imports are static/hoisted, merely importing `can` from the same file would have pulled that whole chain in and broken the test file — exactly the risk flagged in the task's own TDD step 5. Deferring the `auth` import to inside `requireAuth()` (dynamic `import()`) keeps `can` import-clean while keeping `requireAuth`'s behavior identical at runtime (Next.js does support dynamic import of server modules).
2. **Used `../auth` (relative) instead of `@/auth` (path alias) for that dynamic import.** `vitest.config.ts` has no `resolve.alias`/`vite-tsconfig-paths` configured, so `@/auth` doesn't resolve under vitest even dynamically. Relative import sidesteps needing to touch `vitest.config.ts`, which is out of this task's scope ("Only `lib/rbac.ts` + test").
3. **`redirect` from `next/navigation` is imported statically at the top of the file** (not dynamically), unlike `auth`. Reason: TypeScript's unreachable-code narrowing (the thing that lets `if (!session?.user) redirect(...); return session;` type-check as returning non-null `Session`) only fires when the `never`-returning call is a direct reference to a statically-known function — routing it through a destructured dynamic-import alias (even with matching types) silently defeats that narrowing and `npm run build` fails with "Type 'Session | null' is not assignable to type 'Session'". Verified this in isolation with minimal repros before settling on this split (static `redirect`, dynamic `auth`). `next/navigation` itself does not pull in next-auth/db, so importing it statically doesn't reintroduce the vitest resolution problem.
4. No `server-only` package import was added — it isn't installed in this project (attempted, got "Cannot find package 'server-only'"), and the task didn't require it, so it was dropped rather than adding a new dependency.

No other deviations. No screens or layout wiring were touched, per the task's rules.
