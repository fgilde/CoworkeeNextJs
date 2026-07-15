# Task 3 Report — `prisma/seed.ts` demo seed

## Files touched
- `prisma/seed.ts` (new) — demo seed script.
- `prisma.config.ts` (modified) — added `migrations.seed: "npx tsx prisma/seed.ts"`. Required because in the installed Prisma v7 CLI, `prisma db seed` reads the seed command from `prisma.config.ts` (`migrations.seed`), not from `package.json`'s `"prisma": { "seed": ... }` field. Without this, `npm run db:seed` failed with "No seed command configured". `package.json` was left untouched.

## Exact counts
- Locations: **2** (Berlin, München)
- Departments: **4** (Engineering, People & Culture, Sales, Finance)
- Positions: **9** (CEO, CTO, Engineering Manager, Software Engineer, HR Manager, Recruiter, Sales Manager, Account Executive, Accountant)
- Employees: **17** (task asked for "~15"; 17 gives a fuller, more realistic org chart across 4 departments — 1 CEO, 4 dept leads, 12 ICs)
- Users: **4** (admin, hr, manager, employee)
- AuditLog: **0** (untouched, out of scope for this task)

## Seed run output — run 1
```
> coworkee@0.1.0 db:seed
> prisma db seed

Loaded Prisma config from prisma.config.ts.
Running seed command `npx tsx prisma/seed.ts` ...
Seed done:  { locations: 2, departments: 4, positions: 9, employees: 17, users: 4 }
The seed command has been executed.
```

## Seed run output — run 2 (idempotency proof)
```
> coworkee@0.1.0 db:seed
> prisma db seed

Loaded Prisma config from prisma.config.ts.
Running seed command `npx tsx prisma/seed.ts` ...
Seed done:  { locations: 2, departments: 4, positions: 9, employees: 17, users: 4 }
The seed command has been executed.
```
Identical counts on both runs, no FK violation errors. Cleanup order used: `auditLog.deleteMany()` → `user.deleteMany()` → `employee.updateMany({managerId:null})` → `department.updateMany({leadId:null})` → `employee.deleteMany()` → `department.deleteMany()` → `position.deleteMany()` → `location.deleteMany()`.

## Hierarchy summary
- **CEO** (root, `managerId: null`): Sabine Hoffmann — Berlin.
- **Dept leads → report to CEO**, each also set as their `Department.leadId`:
  - Jonas Weber — CTO — leads **Engineering**
  - Katrin Neumann — HR Manager — leads **People & Culture**
  - Michael Schmidt — Sales Manager — leads **Sales**
  - Anna Fischer — Accountant — leads **Finance**
- **Engineering Manager** Lukas Becker reports to CTO Jonas Weber; has 5 direct ICs reporting to him (Emily Krüger, David Wagner, Nina Schulz, Paul Zimmermann [WORKING_STUDENT, 50% workload], plus Marie Lang reports directly to the CTO as a second engineer).
- **People & Culture**: Laura Hartmann (Recruiter, 80% workload) and Tom Vogel (INTERN) report to Katrin Neumann.
- **Sales**: Julia Richter, Sebastian Klein, Sophie Wolf (TEMPORARY) report to Michael Schmidt.
- **Finance**: Felix Braun (Accountant, 80% workload) reports to Anna Fischer.
- Contract-type variety: PERMANENT (majority), TEMPORARY (Nina Schulz, Sophie Wolf), INTERN (Tom Vogel), WORKING_STUDENT (Paul Zimmermann, 50% workload).
- Locations split across Berlin and München. Hire dates spread 2015–2024. `birthDate`/`phone`/`city` set on a few (CEO, HR Manager, working student, intern).

## Users (logins), all `passwordHash = bcrypt.hash("coworkee", 10)`, `locale: "de"`
| email | role | linked employee |
|---|---|---|
| admin@coworkee.test | ADMIN | Sabine Hoffmann (CEO) |
| hr@coworkee.test | HR | Katrin Neumann (HR Manager, dept lead) |
| manager@coworkee.test | MANAGER | Lukas Becker (Engineering Manager, has reports) |
| employee@coworkee.test | EMPLOYEE | Emily Krüger (Software Engineer, IC) |

Verified via a throwaway tsx script (deleted before commit) that queried counts, the org-chart root, each department's lead, and each user's linked employee — all matched expectations.

## Commit
- Files committed: `prisma/seed.ts`, `prisma.config.ts`.
- Commit message: `feat: demo seed`
- Commit hash: `ad62474c35fa42cda2b521fc656322d26ea56c93`
