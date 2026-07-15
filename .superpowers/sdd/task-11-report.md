# Task 11 — Employee Profile Detail

## Files
- `app/(app)/employees/[id]/page.tsx` — server page: loads employee with department/position/location/manager/reports, `notFound()` on miss, header (name, position, status badge, RBAC-gated Edit link), converts Dates to locale-formatted strings before passing to the client tabs.
- `app/(app)/employees/[id]/not-found.tsx` — localized 404 fallback (title, description, back-to-list link).
- `components/employees/profile-tabs.tsx` — `"use client"` shadcn Tabs with three panels: Person, Employment, Team. Reuses `components/dashboard/team-tiles.tsx` (`TeamTiles`) for the direct-reports grid instead of duplicating that markup.
- `components/ui/tabs.tsx` — added via `npx shadcn@latest add tabs card` (card already present, skipped as identical).
- `messages/en.json` / `messages/de.json` — added `employees.edit`, `notFoundTitle/Description`, `backToList`, `tabPerson/Employment/Team`, `firstName/lastName/email/phone/birthDate/address`, `hireDate/exitDate/contractType/workload`, `manager/noManager/directReports/noReports`, `contractTypes.{PERMANENT,TEMPORARY,INTERN,WORKING_STUDENT}`. Reused existing `employees.columnDepartment/columnPosition/columnLocation/columnStatus/statusActive/statusInactive` keys for the Employment tab's department/position/location/status fields rather than adding duplicates.

## RBAC
Edit button shown when `can(role, "employee:write")` OR the viewed profile's id matches the current user's own `employeeId` (looked up via `db.user.findUnique`). Links to `/employees/{id}/edit`, a dead link until Task 12 (as instructed).

## Verify
- `npx tsc --noEmit`: clean.
- `npm run build`: clean, route `/employees/[id]` present as dynamic (ƒ).
- Runtime: logged in as `hr@coworkee.test` / `coworkee` (HR role) via curl against `npm run dev`.
  - Test id: `cmrlya8yz000k14xzuv9mbqai` (Lukas Becker — Engineering Manager, has both a manager and 4 direct reports, seeded in `prisma/seed.ts`).
  - `GET /employees/cmrlya8yz000k14xzuv9mbqai` → 200. Header: "Lukas Becker", "Engineering Manager", badge "Aktiv", "Bearbeiten" button (HR has employee:write).
  - Person tab (default): Vorname "Lukas", Nachname "Becker", E-Mail "lukas.becker@coworkee.test", Telefon/Geburtsdatum/Adresse show "—" (not seeded for this employee).
  - Employment tab (verified by temporarily flipping the Tabs `defaultValue`, since Base UI's `Tabs.Panel` uses `keepMounted=false` and only mounts the active panel in the initial SSR HTML — reverted afterward): Eintrittsdatum "1. April 2019" (localized `hireDate(2019,4,1)` from seed), Austrittsdatum "—", Vertragsart "Unbefristet" (PERMANENT), Arbeitsumfang "100%", Status "Aktiv", Abteilung "Engineering", Position "Engineering Manager", Standort "Berlin".
  - Team tab (same temporary-default technique): Führungskraft "Jonas Weber — CTO"; Direkt unterstellte Mitarbeitende: "Emily Krüger", "David Wagner", "Nina Schulz", "Paul Zimmermann" (all "Software Engineer").
  - `GET /employees/nonexistent-id-xyz` → 404, rendered not-found page: "Mitarbeiter nicht gefunden" / "Dieses Mitarbeiterprofil existiert nicht.".
  - Dev server killed after verification.

## Environment note (unrelated to this task's code)
Mid-verification, every route (including pre-existing `/`, `/employees`, `/login`) started 500'ing with a Turbopack `TurbopackInternalError` (`node process exited before we could connect to it with exit code: 0xc0000142`) while processing `app/globals.css`. This reproduced even on routes untouched by this task, confirming it was a stale/corrupted `.next` dev cache or a transient Windows subprocess-spawn failure, not a regression from this change. Clearing `.next` and restarting `npm run dev` resolved it.

## Commit
`3fba6f0` — "feat: employee profile detail"
(Progress ledger entry recorded in a small follow-up commit.)
