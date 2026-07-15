# Task 4 Report — Auth.js Credentials + session role/locale + route protection

## Files touched
- `lib/password.test.ts` (new) — TDD test, written first, run RED (module didn't exist), then GREEN after implementation.
- `lib/password.ts` (new) — `hashPassword`/`verifyPassword` via `bcryptjs`, exactly per spec.
- `auth.config.ts` (new, **not in original spec, added to fix a real bug** — see "Deviation" below) — edge-safe `NextAuthConfig`: `session.strategy: "jwt"`, `pages.signIn: "/login"`, empty `providers`, `callbacks.authorized`.
- `auth.ts` (new) — `NextAuth({ ...authConfig, providers: [Credentials(...)], callbacks: { ...authConfig.callbacks, jwt, session } })`. `authorize()` validates with Zod (`email().email()`, `password().min(1)`), looks up `db.user.findUnique({ where: { email } })`, verifies via `verifyPassword`, returns `null` on any failure (bad email format, no user, wrong password) — never throws, never logs the password. `jwt` callback copies `id`/`role`/`locale` onto the token on sign-in; `session` callback copies them onto `session.user`. Exports `{ handlers, auth, signIn, signOut }`.
- `app/api/auth/[...nextauth]/route.ts` (new) — `export const { GET, POST } = handlers` from `@/auth`.
- `types/next-auth.d.ts` (new) — module augmentation for `Session.user.{id,role,locale}` and `next-auth`'s `User`, plus `JWT.{id,role,locale}`. Augments **both** `next-auth/jwt` and `@auth/core/jwt` (see "Deviation").
- `middleware.ts` (new) — builds its **own** `NextAuth(authConfig)` instance (edge-safe config only, no Prisma/bcrypt) and re-exports its `auth` as `middleware`; matcher excludes `api/auth`, `login`, static assets, favicon.

## Deviation from spec (root-caused, not worked around)
The spec's literal `middleware.ts` (`export { auth as middleware } from "@/auth"`) imports the full `auth.ts`, which imports `lib/db.ts` (Prisma + `pg` driver adapter) and `bcryptjs`. Next.js middleware bundles for the **Edge runtime**, which can't load these Node-only modules. Confirmed by running `npm run dev` and hitting `/`: every request 500'd with `Error: Failed to load external module node:util/types: TypeError: Native module not found: node:util/types`, sourced from the middleware edge chunk.

Root-cause fix (the standard Auth.js pattern for Prisma + Credentials + middleware): split the config into an edge-safe `auth.config.ts` (session/pages/callbacks, empty providers) and the full `auth.ts` (adds the `Credentials` provider using `db`/`verifyPassword`). `middleware.ts` builds its own lightweight `NextAuth(authConfig)` instance instead of importing `@/auth`, so no Prisma/bcrypt code ever reaches the Edge bundle. `authConfig.callbacks.authorized` is spread into `auth.ts`'s callbacks so both instances share the same authorization rule. This added one file (`auth.config.ts`) beyond the spec's file list but no other scope creep — no RBAC helpers, no login page were added.

A second, unrelated type error also required a small deviation: `token.id`/`token.role`/`token.locale` inside the `session` callback typechecked as `unknown` even with `declare module "next-auth/jwt"` augmentation, because `next-auth/jwt.d.ts` only does `export * from "@auth/core/jwt"` — the actual `JWT` interface lives in `@auth/core/jwt`, and TS module augmentation doesn't merge through a re-export. Fixed by augmenting `@auth/core/jwt` as well in `types/next-auth.d.ts`.

## Test output
```
npx vitest run lib/password.test.ts
 Test Files  1 passed (1)
      Tests  1 passed (1)
```
Ran RED first (module missing → `Cannot find module './password'`), then GREEN after writing `lib/password.ts`. Full suite (`npx vitest run`) also 1 passed / 1 total (no other test files in repo yet).

## Build result
`npm run build` — succeeds, no type errors, after the `auth.config.ts` split and the `@auth/core/jwt` augmentation.
```
✓ Compiled successfully in 1242ms
Running TypeScript ...
Finished TypeScript in 1844ms ...
Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /api/auth/[...nextauth]
ƒ Proxy (Middleware)
```
Note: Next 16 prints `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` — this is a non-fatal warning; kept `middleware.ts` per the spec's explicit filename instead of migrating to the newer `proxy.ts` convention, which is out of scope for this task.

## Runtime / curl verification
`npm run dev`, then:
```
curl http://localhost:3000/           -> 307, redirect_url=http://localhost:3000/login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F
curl http://localhost:3000/login      -> 404  (expected: no login page yet, Task 8 scope)
curl http://localhost:3000/api/auth/session -> 200 (public, untouched by middleware)
```
Dev server log showed no errors on any of these requests (the earlier `node:util/types` crash is gone after the `auth.config.ts` split). Dev server killed after verification.

## Commit
- Files: `lib/password.ts`, `lib/password.test.ts`, `auth.config.ts`, `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`, `middleware.ts`.
- Message: `feat: auth.js credentials + session role/locale + route protection`
- Commit hash: filled in after `git add -A && git commit`, see below.
