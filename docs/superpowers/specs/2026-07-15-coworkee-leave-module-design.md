# Coworkee — Modul: Abwesenheit/Urlaub (Leave) Design

**Datum:** 2026-07-15  **Status:** Approved (Roadmap Phase 2)  **Baut auf:** Fundament.

## Ziel
Urlaubs-/Abwesenheitsverwaltung mit Antrag → Genehmigungs-Workflow, Kontingent/Saldo pro Jahr & Typ, Team-Übersicht.

## Datenmodell (Prisma, neu)
- `enum LeaveStatus { PENDING APPROVED REJECTED CANCELLED }`
- `LeaveType { id, name @unique, colorHex, paid Boolean, defaultDays Int }`
- `LeaveRequest { id, employeeId, typeId, startDate, endDate, halfDayStart Bool, halfDayEnd Bool, workingDays Float, reason?, status LeaveStatus, approverId?, decisionNote?, decidedAt?, createdAt }`
- `LeaveEntitlement { id, employeeId, typeId, year Int, days Float, @@unique([employeeId,typeId,year]) }`
- `Employee` Back-Relationen: `leaveRequests` (relation "EmployeeLeaves"), `leaveApprovals` (relation "LeaveApprovals"), `leaveEntitlements`.

## Kernlogik
- `computeWorkingDays(start, end, halfStart, halfEnd)`: Werktage Mo–Fr, Wochenenden raus; Halbtage je −0.5. **ponytail:** kein Feiertagskalender (Ceiling; später Region-Feiertage). TDD.
- **Saldo** je (employee, type, year) = `entitlement.days − Σ workingDays(APPROVED-Requests)`. Helper `getLeaveBalance`.

## RBAC (rbac.ts erweitern)
- `leave:request` — alle Rollen (eigenen Antrag stellen).
- `leave:approve` — MANAGER (nur eigenes Team), HR, ADMIN (alle).
- `leave:manage` — HR, ADMIN (LeaveTypes + Entitlements pflegen).
- Matrix: ADMIN {alle}, HR {request,approve,manage}, MANAGER {request,approve}, EMPLOYEE {request}.
- Manager-Scope in der Action erzwingen: approve nur wenn `request.employee.managerId === approver.employeeId` ODER Rolle HR/ADMIN.

## Screens (unter `(app)`)
1. **`/absences`** (Meine Abwesenheit): Saldo-Karten je Typ (Anspruch/genutzt/Rest), Liste eigener Anträge (Status-Badge), Button „Antrag stellen“. PENDING-Antrag stornierbar (→ CANCELLED).
2. **`/absences/new`**: Antragsformular (Typ, von/bis via `<input type=date>`, Halbtag-Flags, Grund). Zeigt berechnete Werktage live/serverseitig. Zod. Erzeugt PENDING.
3. **`/absences/approvals`** (MANAGER/HR/ADMIN): Queue offener Anträge (Manager: nur Team; HR/ADMIN: alle) mit Approve/Reject (+ optionale Notiz). Approve deduziert Saldo implizit (Saldo wird berechnet, kein Feldschreiben). Audit.
4. **`/absences/team`** (MANAGER/HR/ADMIN): Team-Kalenderübersicht wer wann abwesend (einfache Monats-/Listenansicht der APPROVED-Requests). **ponytail:** simple Listen-/Monatsraster, keine Kalender-Lib.
5. **Settings-Erweiterung** `/settings` neuer Abschnitt: LeaveTypes CRUD (HR/ADMIN) + Entitlements setzen (pro Mitarbeiter/Typ/Jahr Tage). Reuse `crud-section`-Muster wo möglich.

## Actions (`app/actions/leave-actions.ts`, `"use server"`, Zod + Audit)
- `createLeaveRequest` (requireAuth, eigener employee, computeWorkingDays, Überlappungs-Check optional).
- `cancelLeaveRequest(id)` (nur eigener + PENDING/APPROVED → CANCELLED).
- `decideLeaveRequest(id, decision, note?)` (requireRole approve + Manager-Scope-Guard; setzt status/approver/decidedAt; Audit).
- `leave-settings-actions.ts`: LeaveType CRUD + `setEntitlement`.

## i18n
Neue Namespaces `absences`, `leave` in `messages/de.json` + `en.json` (key-identisch). LeaveType-Namen sind Nutzerdaten (nicht i18n).

## Nav
Sidebar: „Abwesenheit“ → `/absences` (alle). „Genehmigungen“ → `/absences/approvals` (nur wenn `can(role,"leave:approve")`).

## Seed-Erweiterung
LeaveTypes (Urlaub/Vacation, Krankheit/Sick, Unbezahlt/Unpaid). Entitlements für alle Mitarbeiter (z.B. 30 Tage Urlaub, aktuelles Jahr). Ein paar Beispiel-Requests (PENDING + APPROVED) für Demo.

## Verifikation
Migration+Seed grün; computeWorkingDays-Tests; Klick-Durch: Employee stellt Antrag → erscheint PENDING; Manager sieht ihn in Approvals (nur Team), approved → Saldo sinkt; EMPLOYEE kann `/absences/approvals` nicht (redirect); DE/EN.

## Bau-Reihenfolge (Subagents)
- **L1:** Schema+Migration, rbac-Erweiterung, `computeWorkingDays`+`getLeaveBalance` (TDD), i18n-Namespaces-Skeleton, Sidebar-Links, Seed-Erweiterung.
- **L2:** `/absences` + `/absences/new` + createLeaveRequest/cancel (Employee-Self-Service, Saldo-Karten).
- **L3:** `/absences/approvals` + decideLeaveRequest (Manager-Scope + Audit) + `/absences/team` Übersicht.
- **L4:** Settings: LeaveTypes CRUD + Entitlements.
