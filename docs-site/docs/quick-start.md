# Quick start (local development)

This is the fastest way to get Coworkee running on your own machine for development or evaluation. For deploying to a server, see [Installation & self-hosting](./installation) instead.

## Requirements

- **Node.js 20+**
- **Docker** (for a local PostgreSQL) — or your own PostgreSQL 16 instance
- **git**

## Steps

```bash
# 1. Clone
git clone https://github.com/fgilde/CoworkeeNextJs.git
cd CoworkeeNextJs

# 2. Install dependencies
npm install

# 3. Environment variables
cp .env.example .env        # adjust DATABASE_URL + AUTH_SECRET if needed

# 4. Start PostgreSQL (Docker, host port 5433)
docker compose up -d

# 5. Migrate the schema and load demo data
npx prisma migrate dev
npm run db:seed

# 6. Start the dev server
npm run dev
```

The app is now at **http://localhost:3000**.

::: tip Demo mode locally
The seed script loads demo data and the login page shows clickable demo logins when the instance runs with `DEMO=1`. To try the real first-run experience instead, leave `DEMO` unset and start from an empty database — you'll get the [setup wizard](./setup-wizard).
:::

## Demo logins

All passwords are `coworkee`.

| Role | Email |
|---|---|
| Administrator | `admin@coworkee.test` |
| HR | `hr@coworkee.test` |
| Manager | `manager@coworkee.test` |
| Employee | `employee@coworkee.test` |

When the instance runs in demo mode (`DEMO=1`), these are shown on the login page and clicking one fills the form.

## Useful scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # production server (after build)
npm test           # Vitest unit tests
npm run db:migrate # prisma migrate dev
npm run db:seed    # demo data (idempotent — never overwrites existing rows)
```

## How configuration is read

Prisma 7 reads `DATABASE_URL` from `prisma.config.ts` (via `dotenv`), while the app and Auth.js read `.env` directly. Both point at the same `.env` file, so a single connection string is enough.

## Project layout (excerpt)

```
app/
  page.tsx              # public landing page (/)
  (auth)/login/         # login (split-screen + demo logins)
  (auth)/setup/         # first-run setup wizard (empty DB)
  (app)/                # protected app (sidebar shell)
    dashboard/ employees/ org/ absences/ time/ documents/
    onboarding/ performance/ analytics/ recruiting/ news/
    settings/ account/ notifications/
  actions/              # server actions (Zod-validated, audited)
  api/
    auth/[...nextauth]/ # Auth.js
    v1/                 # REST API (Bearer token, OpenAPI)
    mcp/                # MCP server (RBAC-scoped)
    documents/[id]/     # access-guarded file download
components/             # UI (shadcn), feature components, marketing
lib/                    # db, rbac, auth helpers, domain logic (tested)
messages/               # de.json, en.json (i18n)
prisma/                 # schema.prisma, migrations, seed.ts
deploy/                 # self-host / GHCR / Proxmox / Unraid / Umbrel packaging
storage/                # uploaded documents (not in repo, not public)
```
