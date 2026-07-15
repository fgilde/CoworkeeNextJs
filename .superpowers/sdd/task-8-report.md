# Task 8: Login page + form + action

## Status: complete

## Commit
`33773e0` — "feat: login/logout"

## Files

- `app/(auth)/layout.tsx` — shell-less centered layout (no sidebar/topbar). Renders the
  `common.appName` wordmark above `children`. Reuses the flex-column-centered pattern from
  `app/(app)/layout.tsx`; relies on the root `app/layout.tsx` for `<html>/<body>`,
  `NextIntlClientProvider`, and `ThemeProvider` (already light/dark aware there — no
  duplication needed).
- `app/(auth)/login/page.tsx` — server component. Uses `getTranslations("auth")` for
  `loginTitle`, renders a shadcn `Card` with `CardHeader`/`CardTitle` and `<LoginForm />` in
  `CardContent`. Route group `(auth)` keeps the URL at `/login`.
- `app/actions/auth-actions.ts` — `"use server"`. `loginAction(prevState, formData)`:
  - Validates `{ email: z.string().email(), password: z.string().min(1) }` via Zod
    `safeParse`; on failure returns `{ error: "invalidCredentials" }` (generic, no email/password
    distinction — never logs credentials).
  - Calls `await signIn("credentials", { email, password, redirectTo: "/" })`.
  - Catches errors: if `error instanceof AuthError` (covers `CredentialsSignin`) → returns
    `{ error: "invalidCredentials" }`. Any other error (i.e. the `NEXT_REDIRECT` thrown by
    Auth.js on success) is re-thrown so Next.js performs the redirect.
- `components/login-form.tsx` — `"use client"`. `useActionState(loginAction, {})` (React 19).
  Email/password fields built from shadcn `Input`/`Label`, submit via shadcn `Button`
  (`disabled={pending}`). Inline error shown via `t(state.error)` from the `auth` namespace when
  `state.error` is set. All copy (`email`, `password`, `submit`) from `auth` namespace — no new
  i18n keys were needed; `auth.loginTitle/email/password/submit/invalidCredentials/welcome`
  already existed in both `messages/de.json` and `messages/en.json` in identical form.
- Added shadcn primitives via `npx shadcn@latest add input label card`: `components/ui/input.tsx`,
  `components/ui/label.tsx`, `components/ui/card.tsx`.

No `app/login/` (non-grouped) leftover existed prior to this task — verified via directory
listing before starting; nothing to remove.

Logout was not touched — `lib/actions/logout.ts` (`logoutAction`) and its wiring in
`components/user-menu.tsx` from Task 7 are untouched and reused as-is.

## Verification (real click-through via `npm run dev` + curl, no auth/middleware weakened)

Dev server started in background (`next dev`, Turbopack, "Ready in 353ms"), then killed
afterward via `Stop-Process` on the process bound to port 3000. Confirmed down: a follow-up
`GET /login` timed out (connection refused).

1. **GET `/login` → 200, localized title present.**
   ```
   curl -s -o login.html -w "%{http_code}\n" http://localhost:3000/login
   200
   ```
   Response body contains `Anmelden` (the `auth.loginTitle` string for the default locale
   `de`, per `i18n/locales.ts` `defaultLocale = "de"`) — confirmed with `grep -o "Anmelden|Log in"`
   matching 5 occurrences of `Anmelden`.

2. **Bad credentials → no session cookie, redirected back to `/login` with error.**
   - `GET /api/auth/csrf` → obtained `csrfToken`, stored `authjs.csrf-token` +
     `authjs.callback-url` cookies in a fresh jar.
   - `POST /api/auth/callback/credentials` with `email=admin@coworkee.test`,
     `password=wrongpassword`, matching `csrfToken`, `redirect=false`:
     ```
     HTTP/1.1 302 Found
     location: http://localhost:3000/login?error=CredentialsSignin&code=credentials
     ```
   - Cookie jar after this request contains only `authjs.csrf-token` and
     `authjs.callback-url` — **no `authjs.session-token`**.

3. **Good credentials (`admin@coworkee.test` / `coworkee`) → session cookie set, redirect to `/`.**
   - Fresh CSRF token/jar, then `POST /api/auth/callback/credentials` with the correct
     password:
     ```
     HTTP/1.1 302 Found
     location: http://localhost:3000/
     set-cookie: authjs.callback-url=...; Path=/; HttpOnly; SameSite=Lax
     set-cookie: authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEy...; Path=/; Expires=Fri, 14 Aug 2026 11:16:50 GMT; HttpOnly; SameSite=Lax
     ```
   - Cookie jar after this request contains `authjs.session-token` (JWE, HttpOnly).

4. **End-to-end sanity beyond the minimum spec:**
   - `GET /` with the good-cred cookie jar → `200` (middleware lets the authenticated
     request through to the protected app shell).
   - `GET /` with no cookies at all → `307` redirect to
     `location: /login?callbackUrl=http%3A%2F%2Flocalhost%3A3000%2F` (middleware still
     protects everything else; `/login` itself is public, matching `middleware.ts`'s
     matcher which excludes `login`).

`npx tsc --noEmit` — clean, no errors, after all four files were added.

## Concerns / notes

- None blocking. One design note: `loginAction`'s catch block relies on the standard
  Auth.js v5 pattern (`if (error instanceof AuthError) return {...}; throw error;`) so that
  the `NEXT_REDIRECT` internal signal on success is transparently re-thrown and handled by
  Next.js — this was verified indirectly (the raw `/api/auth/callback/credentials` endpoint
  underlying `signIn` behaves correctly per the curl tests above) rather than by clicking the
  actual rendered form in a browser, since this environment has no headless browser available.
  The server action wraps the exact same `signIn()` call Auth.js exposes, so this is
  equivalent in effect to a browser-driven form submit.
- `.superpowers/sdd/progress.md` had a pre-existing uncommitted modification (from Task 7)
  when this task started; left untouched/unstaged since it's out of this task's scope.
