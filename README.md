# Coworkee

*Read this in [Deutsch 🇩🇪](README.de.md).*

[![QuickRun](https://quickrun.org/badge.svg)](https://quickrun.org/run?repo=fgilde/CoworkeeNextJs)

Modern, self-hosted HR / personnel-management software in the spirit of Personio / HR-Works — for **one** company (single-tenant). Fully available in **German and English**, and extensible.

> "A workplace for everything human."

Public landing page at `/`, the application after login at `/dashboard`.

## Modules

| Area | Features |
|---|---|
| **Employees** | Directory (search/filter/pagination), detail profiles, create/edit, org chart |
| **Absence** | Leave balance, request → approval workflow, team overview, entitlement management |
| **Time tracking** | Clock-in/out, weekly overview + hours, manual entries, team times |
| **Documents** | Secure private storage, access-guarded download, HR upload, profile tab |
| **Onboarding** | Checklist templates + per-employee processes with checkable tasks |
| **Performance** | Goals (with self-service progress) + performance reviews (Draft → Submitted → Acknowledged) |
| **Analytics** | HR dashboard with KPIs + charts (headcount, contract types, new hires, absence days) |
| **Recruiting** | Job postings + applicant pipeline (Kanban, 6 stages) |
| **News** | Announcement feed + in-app notifications (topbar bell) |

Cross-cutting: **roles & permissions** (ADMIN / HR / MANAGER / EMPLOYEE, enforced server-side), **DE/EN i18n** (cookie-based, stored per user), **light/dark mode**, **theming** (style presets + corporate identity: accent color & logo), a **REST API + MCP server** (per-user tokens), and an audit log for write operations.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **PostgreSQL** + **Prisma 7** (pg driver adapter)
- **Auth.js v5** (NextAuth) — Credentials, JWT session
- **next-intl** (DE/EN, no URL prefixes)
- **Tailwind CSS v4** + **shadcn/ui** (Base UI)
- **Vitest** (unit tests)

## Requirements

- Node.js 20+
- Docker (for local PostgreSQL) — or your own PostgreSQL instance

## Quick start (local)

```bash
# 1. Dependencies
npm install

# 2. Environment variables
cp .env.example .env        # adjust DATABASE_URL + AUTH_SECRET if needed

# 3. Start PostgreSQL (Docker, host port 5433)
docker compose up -d

# 4. Migrate schema + load demo data
npx prisma migrate dev
npm run db:seed

# 5. Dev server
npm run dev
```

App: http://localhost:3000

### Demo logins

All passwords: `coworkee`

| Role | Email |
|---|---|
| Administrator | `admin@coworkee.test` |
| HR | `hr@coworkee.test` |
| Manager | `manager@coworkee.test` |
| Employee | `employee@coworkee.test` |

The logins are shown on the login page (click fills the form) when the instance runs in demo mode (`DEMO=1`).

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `AUTH_SECRET` | Signing key for Auth.js sessions (required in production: `openssl rand -base64 32`) |
| `DEMO` | `1` = demo instance: auto-seeds demo data on first boot **if the DB is empty** and shows the demo logins on `/login`. Unset/`0` = real install (empty DB → setup wizard). Read at runtime. |

The DB URL is read by Prisma 7 from `prisma.config.ts` (via `dotenv`); the app/auth read `.env` directly.

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # production server (after build)
npm test           # Vitest
npm run db:migrate # prisma migrate dev
npm run db:seed    # demo data (idempotent)
```

## Project structure (excerpt)

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
    branding/logo/      # tenant logo
    version/            # version endpoint
components/             # UI (shadcn), feature components, marketing
lib/                    # db, rbac, auth helpers, domain logic (tested)
messages/               # de.json, en.json (i18n)
prisma/                 # schema.prisma, migrations, seed.ts
deploy/                 # self-host / GHCR / Proxmox / Unraid / Umbrel packaging
storage/                # uploaded documents (not in repo, not public)
```

## API & MCP

Coworkee exposes a real REST API and an MCP server, both authenticated with **per-user API tokens** that carry exactly that user's RBAC permissions (an AI/client can only do what the user may do).

- Create/revoke tokens: **Account** page (self-service, shown once).
- REST base: `GET /api/v1/*` — `me`, employees, absences, time, documents, goals, reviews, recruiting, announcements, … · OpenAPI 3.1 at `GET /api/v1/openapi.json`.
- MCP endpoint: `POST /api/mcp` (JSON-RPC, RBAC-scoped tools).
- In-app reference + client config: **`/settings/api`**.

Send the token as `Authorization: Bearer <token>`.

## Production notes

- **Documents** are stored under `storage/documents/` → hosting needs **persistent storage** (a volume). Serverless platforms without a persistent disk are unsuitable without object-storage integration.
- Set `AUTH_SECRET` and a strong DB password in production. `POSTGRES_PASSWORD` must be **URL-safe** (use hex — no `/ + =`), since it is embedded in `DATABASE_URL`.
- German deployment reference: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Installation & self-hosting

Coworkee ships as a Docker image (`ghcr.io/fgilde/coworkeenextjs:latest`) with a PostgreSQL 16 database. It listens on port **3000** and stores uploads in `/app/storage` (needs a persistent volume).

**Fresh install vs. demo:** on an **empty** database the first visit opens a **setup wizard** to create the admin account (no sample data). Set `DEMO=1` to instead seed demo data and show the demo logins on `/login` (only on an empty DB; it never overwrites existing data). `DEMO` is read at runtime — no rebuild needed.

The GHCR image is published by CI on every push to `master` (tag `latest`) and on `v*` tags (semver). The GHCR package must be **public** (GitHub → Packages → the package → Package settings → Change visibility → Public) so servers can pull anonymously; otherwise run `docker login ghcr.io` (PAT with `read:packages`) first.

### 1. One command (any Linux with Docker)

```bash
curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/install.sh | sudo bash
```

Installs Docker if missing, clones to `/opt/coworkee`, generates secrets, asks for an optional domain (blank = plain HTTP on port 3000), and starts the stack with an empty database → setup wizard.

### 2. Docker Compose — prebuilt image (GHCR)

Recommended for low-RAM hosts (~1 GB): it **pulls** the prebuilt image instead of running `next build`, so it never OOMs. Run from the repo root:

```bash
# create deploy/.env with your secrets
cat > deploy/.env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -hex 32)
DEMO=0            # 0 = fresh install (setup wizard); 1 = seed demo data
EOF

docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml pull
docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml up -d
```

This stack includes a Caddy reverse proxy (automatic HTTPS). Edit the root `Caddyfile` to your own domain first, or for LAN/plain-HTTP use `deploy/docker-compose.selfhost-http.yml` (app published directly on port 3000).

### 3. Proxmox VE

On the **Proxmox host shell** (not inside a container):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/deploy/proxmox/coworkee.sh)"
```

Creates an unprivileged Debian LXC (defaults: 2 vCPU, 4 GB RAM, 12 GB disk), installs PostgreSQL and Node in it, builds Coworkee from its newest tag, generates the database password and the session secret, and leaves a systemd service behind — then prints the container IP and URL (`http://<ip>:3020`). Override defaults via env, e.g. `CORES=4 RAM_MB=8192 STORAGE=local-lvm bash …`. Scripts: [`deploy/proxmox/coworkee.sh`](deploy/proxmox/coworkee.sh) on the host, [`deploy/proxmox/install.sh`](deploy/proxmox/install.sh) inside — the second one works on any Debian machine and is also how you update: run it again.

**No Docker in there, deliberately.** On a current Proxmox an unprivileged container runs no Docker container at all — runc writes `net.ipv4.ip_unprivileged_port_start` and `/proc/sys` is read-only — and a privileged container buys that back by handing the container root on the host. The database, the generated secrets and the uploaded documents survive an update.

### 4. Unraid

Coworkee needs a **separate PostgreSQL 16 container** (Unraid Community Applications is per-container). First start a Postgres 16 container (e.g. the `postgres` CA template) with a `coworkee` database and user, then add the Coworkee app:

1. Copy [`templates/coworkee.xml`](templates/coworkee.xml) to `/boot/config/plugins/dockerMan/templates-user/` on your Unraid server (or add its raw GitHub URL as a private CA template repo under **Apps → Settings**).
2. In the template set `DATABASE_URL` to your Postgres container, e.g. `postgresql://coworkee:PASSWORD@POSTGRES_HOST:5432/coworkee?schema=public`, set `AUTH_SECRET` (`openssl rand -base64 32`), map `/app/storage` to appdata, and leave `DEMO` empty for a fresh install.
3. Open the WebUI at `http://<unraid-ip>:3000`.

Official listing in Community Applications later requires publishing the template to a GitHub template repo and contacting the CA maintainer (Squid) on the Unraid forums.

### 5. Umbrel

This repository is itself a community app store: `umbrel-app-store.yml` names it and [`fgilde-coworkee/`](fgilde-coworkee/) is the app (`umbrel-app.yml` + `docker-compose.yml`, bundling the app + PostgreSQL 16). In Umbrel, **App Store → ⋯ → Community app stores**, add `https://github.com/fgilde/CoworkeeNextJs`.

### CasaOS

**App Store → Add source** with `https://github.com/fgilde/CoworkeeNextJs/releases/download/store/casaos-appstore.zip`, rebuilt from [`store/casaos/`](store/casaos/) on every push.

### Cosmos

[`store/cosmos/servapps/Coworkee/`](store/cosmos/servapps/Coworkee/) is a ServApp with its own PostgreSQL; the installer form asks for the session secret.

For an official listing, open a PR against [getumbrel/umbrel-apps](https://github.com/getumbrel/umbrel-apps) adding a `coworkee/` directory with these two files plus gallery images.

## License

Proprietary – © 2026 Coworkee.
