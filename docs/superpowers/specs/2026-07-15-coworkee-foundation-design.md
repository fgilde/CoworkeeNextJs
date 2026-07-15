# Coworkee — Fundament (Phase 1) Design

**Datum:** 2026-07-15
**Status:** Approved
**Scope:** Fundament einer Personalverwaltungssoftware (HR) im Stil von Personio/HR-Works. Single-Tenant (ein Unternehmen). Erste von mehreren Phasen; Feature-Module folgen als eigene Specs.

## Ziel

Tragfähiges, real lauffähiges Fundament: Auth + RBAC, Mitarbeiter-Stammdaten, Org-Struktur, DE/EN-i18n, modernes Clean-SaaS-UI-Shell. Auf diesem Fundament werden spätere Module (Abwesenheit, Zeiterfassung, Dokumente, …) je als eigene Spec gebaut.

## Nicht-Ziele (Phase 1)

- Kein Abwesenheits-/Urlaubsmanagement, keine Zeiterfassung, keine Dokumente, kein Recruiting, keine Performance-Reviews, kein Reporting — alles spätere Phasen.
- Keine Multi-Tenancy (bewusst, YAGNI; single-tenant).
- Kein E-Mail-Versand (spätere Phase mit Notifications).

## Stack

- **Framework:** Next.js 15, App Router, TypeScript
- **DB:** PostgreSQL (lokal via `docker-compose`), Prisma ORM
- **Auth:** Auth.js (NextAuth) — Credentials-Provider, Session via JWT
- **UI:** Tailwind CSS + shadcn/ui; Clean-SaaS-Optik, Light + Dark Mode, Sidebar-Navigation
- **i18n:** next-intl, DE + EN, erweiterbar (neue Sprache = neue Message-Datei)
- **Validierung:** Zod an allen Trust-Boundaries (Server Actions / Route Handlers)

## Rollen (RBAC)

`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`.

- **Guards server-seitig** (Session-Rolle prüfen in Server Actions / Layout), UI zusätzlich gated.
- Rechte-Matrix (Phase 1):
  - `ADMIN`: alles inkl. Einstellungen, User-Rollen.
  - `HR`: Mitarbeiter CRUD, Stammdaten, Einstellungen (Abteilungen/Positionen/Standorte).
  - `MANAGER`: eigenes Team lesen, eigenes Profil bearbeiten (Teilfelder).
  - `EMPLOYEE`: eigenes Profil lesen, Self-Service-Teilfelder + Sprache/Passwort.

## Datenmodell (Prisma, Kern)

- `User` — Login (email, passwordHash), `role`, `locale`, FK → `Employee?` (1:1)
- `Employee` — Personendaten (Vor-/Nachname, E-Mail, Telefon, Geburtsdatum, Adresse) + Beschäftigung (Eintrittsdatum, Austrittsdatum?, Vertragstyp [PERMANENT/TEMPORARY/INTERN/WORKING_STUDENT], Pensum %, Status [ACTIVE/INACTIVE]); FKs → `Department?`, `Position?`, `Location?`, `manager Employee?` (self-relation → Org-Chart)
- `Department` — name, FK → `lead Employee?`
- `Position` — Jobtitel
- `Location` — Standort (name, Stadt, Land)
- `AuditLog` — actorUserId, action, entity, entityId, `changes Json`, createdAt

Enums: `Role`, `ContractType`, `EmployeeStatus`.

## Screens

Route groups: `(auth)` (kein Shell) / `(app)` (mit Sidebar-Shell).

1. **Login / Logout** — Credentials.
2. **Dashboard** — Begrüßung, eigene Eckdaten, Team-Kacheln (für Manager: direkte Reports).
3. **Mitarbeiterverzeichnis** — Tabelle, Suche (Name/E-Mail), Filter (Abteilung, Standort, Status), Pagination.
4. **Mitarbeiter-Profil (Detail)** — Tabs: Person / Beschäftigung / Team (Manager + Reports).
5. **Org-Chart** — Baumdarstellung aus `manager`-Self-Relation.
6. **Mitarbeiter anlegen / bearbeiten** — Formular (HR/Admin), Zod-validiert; legt optional zugehörigen `User`-Login an.
7. **Einstellungen** — CRUD für Abteilungen/Positionen/Standorte; App-Sprache; (Admin) User-Rollen.
8. **Konto/Profil** — eigene Self-Service-Daten, Sprache, Passwort ändern.

## Architektur / Konventionen

- Prisma-Schema = single source of truth fürs Datenmodell.
- Mutationen via **Server Actions**, Eingaben **Zod**-validiert, danach `AuditLog`-Eintrag für schreibende HR-Aktionen.
- i18n: alle sichtbaren Strings von Tag 1 in `messages/de.json` + `messages/en.json`; Sprachumschalter in Topbar; pro User in `User.locale` persistiert; Fallback DE.
- Verzeichnis: Feature-orientiert unter `app/(app)/<feature>`; geteilte UI in `components/ui` (shadcn) + `components/`.
- Dateien fokussiert halten; wächst eine Datei zu groß → aufteilen.

## Seed / Demo

`prisma/seed.ts`: Demo-Firma mit ~15 Mitarbeitern, mehreren Abteilungen, Positionen, Standorten, echter Manager-Hierarchie (Org-Chart nicht trivial). Je ein Login pro Rolle (admin/hr/manager/employee) mit bekanntem Passwort für Klick-Durch.

## Verifikation

- `docker-compose up -d` (Postgres), `prisma migrate` + `prisma db seed` laufen fehlerfrei.
- Klick-Durch: Login → Dashboard → Verzeichnis (Suche/Filter) → Profil → Mitarbeiter anlegen → erscheint in Liste → Org-Chart zeigt Hierarchie.
- Sprache DE↔EN in Topbar umschaltbar, persistiert über Reload.
- RBAC: EMPLOYEE sieht keine HR-only-Aktionen (server-seitig geblockt, nicht nur UI).

## Roadmap (spätere, eigene Specs)

Abwesenheit/Urlaub + Genehmigungs-Workflow → Zeiterfassung → Dokumente/Verträge → Onboarding/Offboarding → Performance/Ziele → Recruiting/ATS → Reporting/Analytics → Notifications/E-Mail.
