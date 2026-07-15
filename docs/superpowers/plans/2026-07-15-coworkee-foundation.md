# Coworkee Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real lauffähiges Fundament der HR-Software Coworkee: Auth+RBAC, Mitarbeiter-Stammdaten, Org-Chart, DE/EN-i18n, Clean-SaaS-UI-Shell.

**Architecture:** Next.js 15 App Router mit route groups `(auth)`/`(app)`. Prisma-Schema als single source of truth über PostgreSQL. Mutationen via Server Actions mit Zod-Validierung + AuditLog. Auth.js Credentials mit JWT-Session, Rolle in Token. i18n via next-intl mit locale in Cookie + User-Persistenz.

**Tech Stack:** Next.js 15, TypeScript, PostgreSQL, Prisma, Auth.js (NextAuth v5), Tailwind CSS, shadcn/ui, next-intl, Zod, bcryptjs, Vitest.

## Global Constraints

- Single-Tenant (keine tenant-Spalten, kein Mandanten-Scoping).
- Alle sichtbaren Strings über next-intl (`messages/de.json`, `messages/en.json`) — kein hartkodierter UI-Text. Fallback-Locale: `de`.
- Rollen exakt: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`.
- Schreibende HR-Aktionen erzeugen `AuditLog`-Eintrag.
- RBAC server-seitig durchgesetzt (nicht nur UI).
- Zod-Validierung an jeder Server-Action-Grenze.
- Node 20+, package manager `npm`.
- Commit-Trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

### Task 1: Projekt-Scaffold + Postgres + Tooling

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/globals.css`, `docker-compose.yml`, `.env`, `.env.example`, `.gitignore`, `components.json` (shadcn), `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`

**Interfaces:**
- Produces: laufende Next.js-App auf `:3000`, Postgres auf `:5432`, `DATABASE_URL` in `.env`, Tailwind + shadcn init, Vitest runbar.

- [ ] **Step 1: Scaffold Next.js**

```bash
npx create-next-app@latest . --ts --tailwind --app --src-dir=false --import-alias "@/*" --no-eslint --use-npm --yes
```

- [ ] **Step 2: Dependencies**

```bash
npm i next-auth@beta @auth/prisma-adapter @prisma/client next-intl zod bcryptjs
npm i -D prisma vitest @types/bcryptjs
npx shadcn@latest init -d
```

- [ ] **Step 3: docker-compose.yml + .env**

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: coworkee
      POSTGRES_PASSWORD: coworkee
      POSTGRES_DB: coworkee
    ports: ["5432:5432"]
    volumes: [coworkee_pg:/var/lib/postgresql/data]
volumes: { coworkee_pg: {} }
```

```
# .env  (and mirror keys with dummy values in .env.example)
DATABASE_URL="postgresql://coworkee:coworkee@localhost:5432/coworkee?schema=public"
AUTH_SECRET="dev-secret-change-me"
```

- [ ] **Step 4: vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { environment: "node", include: ["**/*.test.ts"] } });
```

- [ ] **Step 5: Verify** — Run: `docker-compose up -d && npm run build` — Expected: DB up, build succeeds.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "chore: scaffold Next.js + Postgres + tooling"`

---

### Task 2: Prisma-Schema + Migration

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json` (scripts: `db:migrate`, `db:seed`, `prisma.seed`)

**Interfaces:**
- Produces: Models `User, Employee, Department, Position, Location, AuditLog`; Enums `Role, ContractType, EmployeeStatus`. `PrismaClient` über `@/lib/db`.

- [ ] **Step 1: schema.prisma**

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

enum Role { ADMIN HR MANAGER EMPLOYEE }
enum ContractType { PERMANENT TEMPORARY INTERN WORKING_STUDENT }
enum EmployeeStatus { ACTIVE INACTIVE }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role     @default(EMPLOYEE)
  locale       String   @default("de")
  employee     Employee? @relation(fields: [employeeId], references: [id])
  employeeId   String?  @unique
  createdAt    DateTime @default(now())
}

model Employee {
  id           String   @id @default(cuid())
  firstName    String
  lastName     String
  email        String   @unique
  phone        String?
  birthDate    DateTime?
  street       String?
  city         String?
  country      String?
  hireDate     DateTime
  exitDate     DateTime?
  contractType ContractType @default(PERMANENT)
  workload     Int      @default(100)
  status       EmployeeStatus @default(ACTIVE)
  department   Department? @relation(fields: [departmentId], references: [id])
  departmentId String?
  position     Position?   @relation(fields: [positionId], references: [id])
  positionId   String?
  location     Location?   @relation(fields: [locationId], references: [id])
  locationId   String?
  manager      Employee?   @relation("Reports", fields: [managerId], references: [id])
  managerId    String?
  reports      Employee[]  @relation("Reports")
  user         User?
  ledDepartments Department[] @relation("DeptLead")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Department {
  id       String @id @default(cuid())
  name     String @unique
  lead     Employee? @relation("DeptLead", fields: [leadId], references: [id])
  leadId   String?
  employees Employee[]
}

model Position {
  id    String @id @default(cuid())
  title String @unique
  employees Employee[]
}

model Location {
  id      String @id @default(cuid())
  name    String @unique
  city    String?
  country String?
  employees Employee[]
}

model AuditLog {
  id          String   @id @default(cuid())
  actorUserId String
  action      String
  entity      String
  entityId    String
  changes     Json?
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: db lib** — Create `lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
```

- [ ] **Step 3: package.json scripts**

```json
"scripts": { "db:migrate": "prisma migrate dev", "db:seed": "prisma db seed" },
"prisma": { "seed": "npx tsx prisma/seed.ts" }
```

Add dep: `npm i -D tsx`

- [ ] **Step 4: Migrate** — Run: `npx prisma migrate dev --name init` — Expected: migration applied, client generated.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: prisma schema + migration"`

---

### Task 3: Seed (Demo-Firma)

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/db`, models from Task 2.
- Produces: ~15 Employees, Abteilungen/Positionen/Standorte, Manager-Hierarchie; 4 User-Logins `admin@coworkee.test / hr@... / manager@... / employee@...`, Passwort `coworkee` (bcrypt).

- [ ] **Step 1: seed.ts** — Legt Locations (Berlin/München), Departments (Engineering, People, Sales, Finance), Positions, dann Employees mit `managerId`-Kette (1 CEO → dept leads → reports). Setzt `Department.leadId`. Erstellt 4 `User` verknüpft mit passenden Employees, `passwordHash = bcrypt.hashSync("coworkee", 10)`, Rollen ADMIN/HR/MANAGER/EMPLOYEE. Idempotent: `await db.auditLog.deleteMany()` … truncate in FK-Reihenfolge am Anfang.

- [ ] **Step 2: Run** — `npm run db:seed` — Expected: "Seed done", keine FK-Fehler.

- [ ] **Step 3: Verify count** — Run: `npx prisma studio` optional / oder query script asserting `employee.count === 15 && user.count === 4`.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: demo seed"`

---

### Task 4: Auth.js Credentials + Session/Rolle

**Files:**
- Create: `auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `lib/password.ts`, `middleware.ts`, `types/next-auth.d.ts`

**Interfaces:**
- Produces: `auth()`, `signIn`, `signOut` from `@/auth`; session enthält `user.id`, `user.role`, `user.locale`. `middleware.ts` schützt `(app)`-Routen (redirect zu `/login` wenn keine Session).

- [ ] **Step 1: password lib + test** — Create `lib/password.ts`:

```ts
import bcrypt from "bcryptjs";
export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);
```

Create `lib/password.test.ts`:

```ts
import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password";
test("hash roundtrip", async () => {
  const h = await hashPassword("coworkee");
  expect(await verifyPassword("coworkee", h)).toBe(true);
  expect(await verifyPassword("wrong", h)).toBe(false);
});
```

- [ ] **Step 2: Run test** — `npx vitest run lib/password.test.ts` — Expected: PASS.

- [ ] **Step 3: auth.ts** — NextAuth v5 config, Credentials provider: `authorize` sucht User per email, `verifyPassword`, gibt `{id, email, role, locale}`. JWT-callback: role+locale ins Token; session-callback: ins `session.user`. `pages.signIn = "/login"`.

- [ ] **Step 4: middleware.ts** — `export { auth as middleware } from "@/auth"` mit matcher, der `(app)`-Pfade abdeckt und `/login`, `/api/auth`, statische Assets ausnimmt.

- [ ] **Step 5: types** — `types/next-auth.d.ts` augmentiert `Session["user"]` um `id, role, locale`.

- [ ] **Step 6: Verify** — `npm run dev`, POST login mit Seed-Creds via UI (nach Task 8) — hier: `npm run build` grün.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: auth.js credentials + session role"`

---

### Task 5: RBAC-Helper + Guards

**Files:**
- Create: `lib/rbac.ts`, `lib/rbac.test.ts`

**Interfaces:**
- Consumes: `Role` enum.
- Produces: `can(role, action): boolean`; `requireRole(...roles): Promise<Session>` (wirft/redirect wenn nicht erlaubt); `requireAuth(): Promise<Session>`.

- [ ] **Step 1: Test zuerst** — `lib/rbac.test.ts`:

```ts
import { expect, test } from "vitest";
import { can } from "./rbac";
test("HR can manage employees, EMPLOYEE cannot", () => {
  expect(can("HR", "employee:write")).toBe(true);
  expect(can("EMPLOYEE", "employee:write")).toBe(false);
  expect(can("ADMIN", "settings:write")).toBe(true);
  expect(can("MANAGER", "employee:write")).toBe(false);
});
```

- [ ] **Step 2: Run — fails** — `npx vitest run lib/rbac.test.ts` — Expected: FAIL (can undefined).

- [ ] **Step 3: Implement rbac.ts** — Permission-Matrix `Record<Role, Set<Action>>`; `can`; `requireAuth` nutzt `auth()`, redirect `/login` wenn null; `requireRole` nutzt `requireAuth` + `can`/role-check, sonst `redirect("/")` oder throw 403.

- [ ] **Step 4: Run — passes** — `npx vitest run lib/rbac.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: rbac helpers + guards"`

---

### Task 6: i18n (next-intl DE/EN)

**Files:**
- Create: `i18n/request.ts`, `i18n/locale.ts`, `messages/de.json`, `messages/en.json`
- Modify: `next.config.ts` (next-intl plugin), `app/layout.tsx` (NextIntlClientProvider)

**Interfaces:**
- Produces: `getLocale()`/`setLocale(locale)` (Cookie `NEXT_LOCALE` + User.locale persist via server action), `useTranslations()` client, `getTranslations()` server. Messages nach Namespaces (`common`, `nav`, `auth`, `employees`, `settings`, `dashboard`, `account`).

- [ ] **Step 1: next-intl request config** — `i18n/request.ts` liest Locale aus Cookie (fallback `de`), lädt `messages/${locale}.json`.

- [ ] **Step 2: locale.ts** — `setLocaleAction(locale)`: setzt Cookie, wenn Session vorhanden `db.user.update locale`, `revalidatePath("/")`.

- [ ] **Step 3: messages** — `de.json` + `en.json` mit allen Namespaces; Keys identisch in beiden. Start-Set für nav/auth/common; wird pro Screen-Task erweitert.

- [ ] **Step 4: wire layout + config** — plugin in `next.config.ts`, Provider + `lang`-Attribut in root layout.

- [ ] **Step 5: Verify** — Cookie `NEXT_LOCALE=en` → UI englisch; entfernen → deutsch. `npm run build` grün.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: i18n de/en via next-intl"`

---

### Task 7: App-Shell (Sidebar, Topbar, Theme, Locale-Switch)

**Files:**
- Create: `app/(app)/layout.tsx`, `components/app-sidebar.tsx`, `components/topbar.tsx`, `components/theme-toggle.tsx`, `components/locale-switch.tsx`, `components/user-menu.tsx`, `components/theme-provider.tsx`
- shadcn add: `button dropdown-menu avatar` etc.

**Interfaces:**
- Consumes: `requireAuth()`, session role für nav-gating, `useTranslations("nav")`.
- Produces: geschütztes Layout mit Sidebar (Dashboard, Mitarbeiter, Org-Chart, Einstellungen[HR/ADMIN], Konto), Topbar (Theme-Toggle, Locale-Switch, User-Menu mit Logout). Dark mode via `class` strategy.

- [ ] **Step 1: theme provider + toggle** — next-themes-freier Ansatz: `class` toggle via `theme-provider` (localStorage). shadcn dark tokens in globals.css.

- [ ] **Step 2: sidebar** — nav-items array, role-gefiltert (`can(role, "settings:write")` blendet Einstellungen). Aktiver Pfad hervorgehoben via `usePathname`.

- [ ] **Step 3: topbar + menus** — Locale-Switch ruft `setLocaleAction`; user-menu Logout ruft `signOut`.

- [ ] **Step 4: (app)/layout.tsx** — `await requireAuth()`, rendert Sidebar+Topbar+`{children}`.

- [ ] **Step 5: Verify** — Nach Login: Shell sichtbar, Theme wechselt, EMPLOYEE sieht keinen Einstellungen-Link. `npm run build` grün.

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: app shell (sidebar/topbar/theme/locale)"`

---

### Task 8: Login / Logout

**Files:**
- Create: `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`, `components/login-form.tsx`, `app/actions/auth-actions.ts`

**Interfaces:**
- Consumes: `signIn` from `@/auth`, Zod.
- Produces: funktionierender Login (Seed-Creds), Fehleranzeige bei falschen Daten, Redirect zu `/` bei Erfolg; Logout im user-menu.

- [ ] **Step 1: login schema + action** — `app/actions/auth-actions.ts`: Zod `{email, password}`, ruft `signIn("credentials", ...)`, gibt Fehlermeldung (i18n-key) zurück bei `CredentialsSignin`.

- [ ] **Step 2: login-form + page** — Client-Form (shadcn input/button), `useFormState`/action, alle Texte i18n (`auth`-namespace: title, email, password, submit, error).

- [ ] **Step 3: (auth)/layout** — zentriertes, shell-loses Layout mit Coworkee-Logo/Wortmarke.

- [ ] **Step 4: Verify (Klick-Durch)** — `npm run dev`: login `admin@coworkee.test/coworkee` → Dashboard; falsches Passwort → Fehlermeldung; Logout → zurück zu `/login`.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: login/logout"`

---

### Task 9: Dashboard

**Files:**
- Create: `app/(app)/page.tsx`, `components/dashboard/stat-card.tsx`, `components/dashboard/team-tiles.tsx`

**Interfaces:**
- Consumes: `requireAuth()`, `db`. Session-User → eigener Employee.
- Produces: Begrüßung (Name), Eckdaten-Cards (Abteilung, Position, Eintritt, Pensum). Für MANAGER: Kacheln direkter Reports. Für HR/ADMIN: Firmenzahlen (Mitarbeiter total, aktiv, Abteilungen).

- [ ] **Step 1: page.tsx** — lädt Employee inkl. relations; role-abhängige Sektionen; alle Texte `dashboard`-namespace.

- [ ] **Step 2: Verify** — Login je Rolle → passende Dashboard-Variante. Datum lokalisiert (de/en) via `Intl`.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: dashboard"`

---

### Task 10: Mitarbeiterverzeichnis (Liste/Suche/Filter)

**Files:**
- Create: `app/(app)/employees/page.tsx`, `components/employees/employee-table.tsx`, `components/employees/employee-filters.tsx`
- shadcn add: `table input select badge`

**Interfaces:**
- Consumes: `requireAuth()`, `db`. searchParams: `q, department, location, status, page`.
- Produces: paginierte Tabelle (Name, Position, Abteilung, Standort, Status-Badge), Suche (Name/E-Mail `contains insensitive`), Filter-Dropdowns, Zeile → `/employees/[id]`.

- [ ] **Step 1: query builder** — server-seitige `where` aus searchParams; `take/skip` (page size 20). Filter-Optionen aus DB (departments/locations).

- [ ] **Step 2: table + filters** — Filter setzen searchParams (URL). Empty-state i18n.

- [ ] **Step 3: Verify** — Suche "an" filtert; Abteilungsfilter greift; Pagination blättert; alle Spaltenköpfe i18n.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: employee directory"`

---

### Task 11: Mitarbeiter-Profil (Detail, Tabs)

**Files:**
- Create: `app/(app)/employees/[id]/page.tsx`, `components/employees/profile-tabs.tsx`
- shadcn add: `tabs card`

**Interfaces:**
- Consumes: `db`, `requireAuth()`, `can(role,...)`. 
- Produces: Detailseite mit Tabs Person/Beschäftigung/Team (Manager-Link + Reports-Liste). "Bearbeiten"-Button nur wenn `can(role,"employee:write")` oder eigenes Profil.

- [ ] **Step 1: page** — `db.employee.findUnique` inkl. department/position/location/manager/reports; 404 wenn null. Alle Labels i18n (`employees`-namespace).

- [ ] **Step 2: Verify** — Profil zeigt korrekte Daten; Team-Tab zeigt Manager + Reports mit Links; EMPLOYEE fremdes Profil → kein Bearbeiten-Button.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: employee profile detail"`

---

### Task 12: Mitarbeiter anlegen/bearbeiten (Server Action + Zod + Audit)

**Files:**
- Create: `app/(app)/employees/new/page.tsx`, `app/(app)/employees/[id]/edit/page.tsx`, `components/employees/employee-form.tsx`, `app/actions/employee-actions.ts`, `lib/audit.ts`
- Create test: `app/actions/employee-schema.test.ts`, `lib/employee-schema.ts`

**Interfaces:**
- Consumes: `requireRole("HR","ADMIN")`, `db`, Zod.
- Produces: `employeeSchema` (Zod); `createEmployee(data)`, `updateEmployee(id,data)` (validieren → db → `logAudit`); `logAudit(actorUserId, action, entity, entityId, changes)`.

- [ ] **Step 1: schema + test** — `lib/employee-schema.ts` Zod: firstName/lastName/email required, email format, workload 1–100, hireDate valid, enums. Test `employee-schema.test.ts`:

```ts
import { expect, test } from "vitest";
import { employeeSchema } from "@/lib/employee-schema";
test("rejects bad email + workload", () => {
  const r = employeeSchema.safeParse({ firstName:"A", lastName:"B", email:"x", hireDate:"2020-01-01", workload:0, contractType:"PERMANENT", status:"ACTIVE" });
  expect(r.success).toBe(false);
});
test("accepts valid", () => {
  const r = employeeSchema.safeParse({ firstName:"A", lastName:"B", email:"a@b.de", hireDate:"2020-01-01", workload:100, contractType:"PERMANENT", status:"ACTIVE" });
  expect(r.success).toBe(true);
});
```

- [ ] **Step 2: Run test** — `npx vitest run app/actions` (fails, then implement) — Expected FAIL→PASS.

- [ ] **Step 3: audit.ts** — `logAudit(...)` schreibt `db.auditLog.create`.

- [ ] **Step 4: actions** — `createEmployee`/`updateEmployee`: `requireRole`, `employeeSchema.parse`, db-write, `logAudit`, `revalidatePath`, redirect zum Profil.

- [ ] **Step 5: form + pages** — geteiltes `employee-form` (create+edit), Selects für Abteilung/Position/Standort/Manager, i18n, Fehleranzeige aus Zod.

- [ ] **Step 6: Verify (Klick-Durch)** — HR legt Mitarbeiter an → erscheint im Verzeichnis; edit ändert Feld → Profil aktualisiert; AuditLog-Zeile existiert (`prisma studio`); EMPLOYEE ruft `/employees/new` → redirect (server guard).

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: employee create/edit + audit"`

---

### Task 13: Org-Chart

**Files:**
- Create: `app/(app)/org/page.tsx`, `components/org/org-tree.tsx`, `lib/org-tree.ts`, `lib/org-tree.test.ts`

**Interfaces:**
- Consumes: `db` (alle Employees flach mit managerId).
- Produces: `buildTree(employees): OrgNode[]` (roots = managerId null); rekursive UI-Baumdarstellung.

- [ ] **Step 1: buildTree test** — `lib/org-tree.test.ts`:

```ts
import { expect, test } from "vitest";
import { buildTree } from "./org-tree";
test("nests reports under manager", () => {
  const t = buildTree([
    { id:"1", managerId:null, firstName:"C", lastName:"EO" },
    { id:"2", managerId:"1", firstName:"D", lastName:"ev" },
  ]);
  expect(t.length).toBe(1);
  expect(t[0].children[0].id).toBe("2");
});
```

- [ ] **Step 2: Run — fail** — `npx vitest run lib/org-tree.test.ts` — Expected FAIL.

- [ ] **Step 3: buildTree** — Map id→node, verketten; roots zurück.

- [ ] **Step 4: Run — pass** + UI-Tree-Komponente (eingerückte Cards / verbundene Boxen), i18n.

- [ ] **Step 5: Verify** — `/org` zeigt Hierarchie aus Seed (CEO oben, Reports darunter).

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: org chart"`

---

### Task 14: Einstellungen (Abteilungen/Positionen/Standorte + Rollen)

**Files:**
- Create: `app/(app)/settings/page.tsx`, `components/settings/crud-section.tsx`, `app/actions/settings-actions.ts`, `app/(app)/settings/users/page.tsx`, `app/actions/user-actions.ts`

**Interfaces:**
- Consumes: `requireRole("HR","ADMIN")` (users-Seite: `requireRole("ADMIN")`), Zod.
- Produces: CRUD `createDepartment/updateDepartment/deleteDepartment` (+ position, location analog); `setUserRole(userId, role)`; alle mit Audit.

- [ ] **Step 1: settings-actions** — Zod `{name}` je Entität; create/update/delete für Department/Position/Location; delete guard: wenn referenziert → i18n-Fehler statt FK-crash.
- [ ] **Step 2: settings page** — Tabs/Sektionen mit `crud-section` (Liste + inline add/edit/delete).
- [ ] **Step 3: users page (ADMIN)** — Liste User + Rollen-Select → `setUserRole` (+Audit). Admin kann sich nicht selbst degradieren (guard).
- [ ] **Step 4: Verify** — Abteilung anlegen → im Employee-Form-Select wählbar; delete referenzierter Abteilung → freundlicher Fehler; ADMIN ändert Rolle → wirkt nach Re-Login; HR sieht users-Seite nicht.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: settings + role management"`

---

### Task 15: Konto/Profil (Self-Service)

**Files:**
- Create: `app/(app)/account/page.tsx`, `components/account/account-form.tsx`, `components/account/password-form.tsx`, `app/actions/account-actions.ts`

**Interfaces:**
- Consumes: `requireAuth()`, `db`, `hashPassword/verifyPassword`, Zod.
- Produces: `updateOwnProfile(data)` (erlaubte Self-Service-Felder: phone, address), `changePassword(current,next)` (verify current, min 8), `changeOwnLocale(locale)`.

- [ ] **Step 1: schemas + actions** — Zod; `changePassword`: verify current sonst i18n-Fehler, `next` min 8, hash+save, Audit.
- [ ] **Step 2: page + forms** — eigene Daten (read-only Kernfelder, editierbar Kontakt), Passwort-Form, Sprach-Select (persistiert User.locale).
- [ ] **Step 3: Verify (Klick-Durch)** — Telefon ändern → gespeichert; Passwort ändern → Re-Login mit neuem PW klappt, altes scheitert; Sprache umstellen → persistent über Reload/Re-Login.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: account self-service"`

---

## Final Verification

- [ ] `docker-compose up -d && npx prisma migrate reset --force && npm run db:seed` fehlerfrei.
- [ ] `npx vitest run` — alle Tests grün.
- [ ] `npm run build` grün.
- [ ] Voller Klick-Durch je Rolle (admin/hr/manager/employee), DE↔EN umschaltbar & persistent, RBAC server-seitig geblockt.

## Self-Review Notes

- Spec-Coverage: Rollen(T4/5), Datenmodell(T2), 8 Screens(T8–T15), i18n(T6), Audit(T12/14/15), Seed(T3), Verifikation(Final). Alle Spec-Abschnitte abgedeckt.
- Keine Placeholder: Code/Commands konkret; UI-Detail-Strings bewusst in i18n-Files (pro Task erweitert) statt im Plan dupliziert — das ist Datenpflege, kein Logik-Placeholder.
- Typkonsistenz: `can(role,action)`, `requireRole`, `requireAuth`, `logAudit`, `buildTree`, `employeeSchema` durchgängig gleich benannt.
