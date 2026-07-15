# Task 10 Report — Employee Directory

## Files

- `app/(app)/employees/page.tsx` — server component. Awaits `searchParams` (Next 16 Promise), builds Prisma `where` from `q`/`department`/`location`/`status`, paginates (`PAGE_SIZE = 20`, `skip`/`take`), orders by `lastName asc`, loads `department`/`location` option lists for filters, renders header (+ "New employee" link gated by `can(role, "employee:write")`, dead link to `/employees/new` until Task 12), `EmployeeFilters`, `EmployeeTable`, and inline prev/next pagination links that preserve current filters and disable at bounds.
- `components/employees/employee-filters.tsx` — `"use client"`. Search `Input` (debounced 300ms via `useEffect`/`setTimeout`) + department/location/status `Select`s (base-ui Select, shadcn wrapper). Any change pushes new URL query via `useRouter`/`usePathname`/`useSearchParams`, always resetting `page`. "All ..." option per select maps to `all` → param removed.
- `components/employees/employee-table.tsx` — presentational async server component (`getTranslations("employees")` directly, no props needed for i18n). Columns: Name, Position, Department, Location, Status (shadcn `Badge`: emerald bg/text for ACTIVE, `secondary`/muted for INACTIVE). Each cell links to `/employees/{id}` (dead until Task 11). Empty-state row via `t("noResults")`.
- `messages/en.json` / `messages/de.json` — added `employees.*` keys: `newEmployee`, `searchPlaceholder`, `filterDepartment/Location/Status`, `allDepartments/Locations/Statuses`, `statusActive/Inactive`, `columnName/Position/Department/Location/Status`, `noResults`, `previous`, `next`, `pageOf`.
- Added shadcn components via `npx shadcn@latest add table input select badge`: `components/ui/table.tsx`, `components/ui/select.tsx`, `components/ui/badge.tsx` (input.tsx already existed, skipped as identical).

## Verify

- `npx tsc --noEmit` — clean, no errors.
- `npm run build` — compiled successfully, `/employees` listed as a dynamic (ƒ) route.
- Runtime (dev server on `localhost:3000`, logged in as `hr@coworkee.test` / `coworkee` via csrf + credentials callback, cookie jar reused):
  - `GET /employees` → 200. Table body: **17 rows** (all 17 seeded employees fit on page 1, page size 20). Rows sorted by last name ascending (e.g. "Lukas Becker" first). Department/position/location/status render correctly with localized German status badges ("Aktiv").
  - `GET /employees?q=Lukas` → 200, **1 row** (down from 17) — matches the single seeded employee named Lukas (Becker).
  - `GET /employees?department=<Engineering dept id>` → 200, **7 rows** (down from 17) — matches `db.employee.count({ where: { departmentId: engineering.id } })` = 7, confirmed via a throwaway `tsx` script against the seeded DB (script deleted after use).
  - Dev server killed after verification. (Found and killed one stale orphaned dev server from a prior session occupying port 3000 before starting a clean one for this task's testing.)

## Commit

`b58f680b59a4307b3186429a77a22fc9ba55864e` — "feat: employee directory" (branch `foundation`).

Only directory-page files, its two components, the 3 new shadcn UI primitives, and i18n keys were staged/committed. Unrelated pre-existing working-tree changes (`.superpowers/sdd/progress.md`, `dev.log`, `task-8-report.md`) were left untouched.
