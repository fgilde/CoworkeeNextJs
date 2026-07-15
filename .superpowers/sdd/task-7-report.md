# Task 7 — Protected app shell (sidebar/topbar/theme/locale/user-menu)

## Files added
- `components/theme-provider.tsx` — client context provider. Reads whatever class the anti-flash script already set on `<html>`, exposes `{ theme, toggleTheme }` via `useTheme()`. Persists to `localStorage["coworkee-theme"]`.
- `components/theme-toggle.tsx` — icon button (`Sun`/`Moon` from lucide-react) calling `toggleTheme()`.
- `components/locale-switch.tsx` — dropdown-menu (shadcn/Base UI) listing `locale.de` / `locale.en`, calling `setLocaleAction(code)` on click. Current locale via `useLocale()` (next-intl).
- `components/user-menu.tsx` — avatar (initials fallback) + dropdown showing `user.email` / `user.role`, and a `nav.logout` item calling the `logoutAction` server action.
- `components/app-sidebar.tsx` — client nav list (`Dashboard /`, `Employees /employees`, `Org Chart /org`, `Settings /settings` gated by `canSettings` prop, `Account /account`). Active route highlighted via `usePathname()` (exact match for `/`, prefix match otherwise). Brand wordmark uses `common.appName`.
- `components/topbar.tsx` — server component composing `ThemeToggle` + `LocaleSwitch` + `UserMenu`, right-aligned.
- `lib/actions/logout.ts` — `"use server"` action `logoutAction()` calling `signOut({ redirectTo: "/login" })` from `@/auth`.
- `app/(app)/layout.tsx` — protected shell: `requireAuth()`, `canSettings = can(session.user.role, "settings:write")`, renders `AppSidebar` + `Topbar` + `<main>`.
- `app/(app)/page.tsx` — moved from `app/page.tsx`; minimal placeholder `<h1>{t("dashboard.title")}</h1>` (server component, `getTranslations("dashboard")`).
- `i18n/locales.ts` — **new file, not in the original task list** — extracted the locale constants (`locales`, `Locale`, `defaultLocale`, `isLocale`) out of `i18n/request.ts` into a module with no `next/headers` import. Required because `locale-switch.tsx` (client component) needs the `locales` array at runtime, and importing it from `i18n/request.ts` pulled `next/headers` into the client bundle → Turbopack build error ("importing a module that depends on next/headers ... in the Pages Router"). `i18n/request.ts` now re-exports from `./locales` so `i18n/locale.ts` (server action) is unaffected.

## Files modified
- `app/layout.tsx` — added `suppressHydrationWarning` on `<html>`, an inline `<script>` in `<head>` that reads `localStorage["coworkee-theme"]` (or falls back to `prefers-color-scheme`) and toggles the `.dark` class before paint, and wraps `children` in `<ThemeProvider>`.
- `app/page.tsx` — deleted (moved to `app/(app)/page.tsx`).

## shadcn components added
`npx shadcn@latest add button dropdown-menu avatar separator` → `button` was already present (skipped), `dropdown-menu.tsx` and `avatar.tsx` added and used, `separator.tsx` was added but ended up unused (dropdown-menu ships its own inline separator) so it was deleted to keep the component set minimal. Stack is Base UI (`@base-ui/react`), not Radix — composition uses the `render` prop (Base UI's `asChild` equivalent), e.g. `<DropdownMenuTrigger render={<Button .../>} />`.

## How things are wired
- **Theme**: class-based (`.dark` on `<html>`), no external lib. `globals.css` already had `@custom-variant dark (&:is(.dark *));` plus a full `:root` / `.dark` OKLCH token set from the shadcn init — untouched. Toggling the class flips every `--color-*` CSS var the app already uses (background, border, sidebar, popover, etc.), so no dark-mode-specific classes were needed in the new components — they use existing tokens (`bg-sidebar`, `border-border`, `text-muted-foreground`, …).
- **Locale**: `LocaleSwitch` calls the existing `setLocaleAction` server action from `@/i18n/locale` (unchanged), which sets the `NEXT_LOCALE` cookie and revalidates. Labels from the `locale` namespace.
- **Logout**: `UserMenu`'s dropdown item calls `logoutAction()` (new thin server action wrapping `signOut` from `@/auth`) directly `onClick` — no form needed, Next.js App Router allows client components to invoke server actions as plain async functions.
- **RBAC gating**: `canSettings` is computed server-side in `app/(app)/layout.tsx` via `can(session.user.role, "settings:write")` and passed as a boolean prop into the client `AppSidebar` — the client component never imports `@/lib/rbac` or sees the role, only the pre-computed flag. Real enforcement still lives in the `/settings` page's own guard (out of scope for this task).

## Verified
- `npm run build` — clean (Turbopack compile + full TypeScript pass + static page generation). Route table confirms `/` maps to the `(app)` route group's page (no route-group segment leaks into the URL): `Route (app): ƒ /, ƒ /_not-found, ƒ /api/auth/[...nextauth]`.
- `npx tsc --noEmit` — no errors.
- `npm test` (vitest) — 2 files / 4 tests passed, unaffected by this change.
- Logic inspection: `AppSidebar` filters out the `settings` nav item unless `canSettings` is `true`; `canSettings` only becomes `true` for `ADMIN`/`HR` per the existing `PERMISSIONS` map in `lib/rbac.ts` (`MANAGER`/`EMPLOYEE` lack `settings:write`) — confirmed by reading `rbac.ts`, not runtime-tested (login flow is Task 8).
- All visible copy traced to `next-intl` namespaces (`nav.*`, `common.appName`, `locale.*`); no hardcoded UI strings. `user.email`/`role` in the menu are user data, not UI copy, so left untranslated by design. Icon-only theme-toggle has a hardcoded English `aria-label` (screen-reader only, not visible text) — flagged here rather than silently done, can move into `common` namespace later if desired.
- Could not do a logged-in visual smoke test (no login page yet — Task 8) and deliberately did not weaken auth to fake one, per the task's explicit instruction.

## Commit
`660154b` — "feat: app shell (sidebar/topbar/theme/locale/user-menu)"
