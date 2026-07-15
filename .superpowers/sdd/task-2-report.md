# Task 2 Report — Prisma schema + migration

## Summary
Wrote `prisma/schema.prisma` with the exact agreed data model (all models,
enums, fields, and relations unchanged from the spec), added `lib/db.ts`,
wired `db:migrate`/`db:seed` scripts + the `prisma.seed` block into
`package.json`, ran `prisma migrate dev --name init` against Postgres on
port 5433, and verified with a throwaway `db.user.count()` script.

## Prisma 7 compatibility gotchas (unexpected, had to adapt)
The installed `prisma`/`@prisma/client` is **v7.8.0**, which has breaking
schema-parser and runtime changes vs. the Prisma 5/6 syntax the task snippet
was written in. Data model (fields/relations/enums) is byte-for-byte what was
asked for; only the *tooling wiring* below had to change to make it run:

1. **Single-line block syntax rejected.** The task's
   `generator client { provider = "prisma-client-js" }` and
   `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }`
   one-liners fail Prisma 7's schema parser ("not a valid definition within a
   generator"). Reformatted to standard multi-line blocks (identical
   content/fields) — same fix `prisma format` would apply.
2. **Single-line enum syntax rejected** the same way
   (`enum Role { ADMIN HR MANAGER EMPLOYEE }` → one value per line). Same
   fix, no change to the enum values themselves.
3. **`datasource.url` no longer supported in schema.prisma at all** (hard
   error: "Move connection URLs for Migrate to `prisma.config.ts`"). Prisma 7
   moves the connection string out of the schema file entirely. Added
   `prisma.config.ts` at the repo root (Prisma's own generated template) that
   reads `DATABASE_URL` via `dotenv/config` and passes it to
   `defineConfig({ datasource: { url } })` — this is what `prisma migrate dev`
   actually connects with now.
4. **`PrismaClient` in v7 requires an explicit driver adapter** (or an
   Accelerate URL) — it no longer reads `DATABASE_URL` implicitly at
   runtime. Plain `new PrismaClient()` throws
   `PrismaClientInitializationError`. Installed `@prisma/adapter-pg` + `pg`
   (+ `@types/pg` devDep) and changed `lib/db.ts` to:
   ```ts
   import { PrismaClient } from "@prisma/client";
   import { PrismaPg } from "@prisma/adapter-pg";

   const g = globalThis as unknown as { prisma?: PrismaClient };
   const adapter = new PrismaPg(process.env.DATABASE_URL!);
   export const db = g.prisma ?? new PrismaClient({ adapter });
   if (process.env.NODE_ENV !== "production") g.prisma = db;
   ```
   This is a hard requirement of the installed Prisma version, not a style
   choice — `new PrismaClient()` with no adapter throws immediately on
   construction with any query.
5. Added `dotenv` as an explicit devDependency (was previously only a
   transitive dep pulled in by something else; `prisma.config.ts` imports it
   directly, so pinned it as a direct dependency instead of relying on
   hoisting).

No model/field/enum was added, removed, or renamed from the spec.

## Files created/changed
- `prisma/schema.prisma` — full schema per spec (reformatted generator/
  datasource/enum blocks only, per #1–#3 above).
- `prisma.config.ts` — new, required by Prisma 7 for `migrate`/`generate` to
  know the connection URL.
- `lib/db.ts` — per spec, plus the `@prisma/adapter-pg` wiring required by
  Prisma 7 (#4 above).
- `package.json` — added `db:migrate`, `db:seed` scripts, `prisma.seed`
  block, and new deps: `@prisma/adapter-pg`, `pg` (dependencies), `dotenv`,
  `@types/pg` (devDependencies).
- `package-lock.json` — updated by `npm install`.
- `prisma/migrations/20260715103642_init/migration.sql` — generated
  migration (see below).
- `prisma/migrations/migration_lock.toml` — generated (`provider = "postgresql"`).

## Migration output
```
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "coworkee", schema "public" at "localhost:5433"

Applying migration `20260715103642_init`

The following migration(s) have been created and applied from new schema changes:

prisma\migrations/
  └─ 20260715103642_init/
    └─ migration.sql

Your database is now in sync with your schema.
```
Migration SQL creates: enums `Role`, `ContractType`, `EmployeeStatus`; tables
`User`, `Employee`, `Department`, `Position`, `Location`, `AuditLog`; all FKs
(`Employee.departmentId/positionId/locationId/managerId`,
`Department.leadId`, `User.employeeId`) and unique constraints
(`User.email`, `User.employeeId`, `Employee.email`, `Department.name`,
`Position.title`, `Location.name`) exactly matching the spec.

## `prisma generate` confirmation
```
✔ Generated Prisma Client (v7.8.0) to .\node_modules\@prisma\client in 69ms
```
Ran twice (once implicitly during `migrate dev`, once explicitly) — both
succeeded, `node_modules/@prisma/client` contains the generated client.

## Count-check result
Ran a throwaway `scratch-check-db.ts` (deleted before commit, never
committed) that imported `db` from `lib/db.ts` and called `db.user.count()`:
```
user count: 0
```
Exited cleanly (`$disconnect()` called, no hang, no error). This confirms
`lib/db.ts` connects to the real Postgres instance on 5433 and the schema
tables exist and are queryable.

Also ran `npx tsc --noEmit` — clean, no type errors from the new `lib/db.ts`
or `prisma.config.ts`.

## Docker / connectivity
`docker ps` showed `coworkee_nextjs-db-1` (postgres:16) already up and
bound to `0.0.0.0:5433->5432/tcp` before starting this task — no port
changes made, matches `.env`'s `DATABASE_URL` (`localhost:5433`).

## Commit
```
git add package.json package-lock.json lib/db.ts prisma.config.ts prisma/
git commit -m "feat: prisma schema + migration" (+ Co-Authored-By trailer)
```
Commit hash: `86935dd`
(`.superpowers/` intentionally left untracked, consistent with Task 1's
convention — it holds this report, not app code.)

## Rules followed
- Did not create the seed file (`prisma/seed.ts`) — only wired the npm
  scripts/config pointing to it, as instructed.
- Did not touch auth or app code.
- Did not change the Postgres port (5433 preserved throughout).
