# Introduction

Coworkee is modern, self-hosted HR and personnel-management software for **one company** (single-tenant), in the spirit of Personio and HR-Works. It is fully bilingual — **German and English** — and designed to run on your own infrastructure.

A public landing page lives at `/`; the application itself is at `/dashboard` after login.

> "A workplace for everything human."

## What Coworkee gives you

- A single place for the whole employee lifecycle: hiring, onboarding, day-to-day HR, absence, time, performance and offboarding.
- **Data on your own server.** Coworkee ships as a Docker image with a PostgreSQL database; you host it, you own the data.
- **Bilingual throughout.** Every screen is available in German and English; the language is stored per user.
- **Light and dark mode**, plus **theming** — style presets and a corporate identity (accent colour and logo).
- **Role-based access control** (Admin / HR / Manager / Employee), enforced on the server for every write.
- A real **REST API** and an **MCP server**, both authenticated with per-user tokens, so automation and AI clients act with exactly the token owner's permissions.
- An **audit log** for write operations.

## Modules at a glance

| Area | What it does |
|---|---|
| **Employees** | Directory (search / filter / pagination), detail profiles, create / edit, org chart |
| **Absence** | Leave balance, request → approval workflow, team overview, entitlement management |
| **Time tracking** | Clock-in / out, weekly overview + hours, manual entries, team times |
| **Documents** | Secure private storage, access-guarded download, HR upload, profile tab |
| **Onboarding** | Checklist templates + per-employee processes with checkable tasks |
| **Performance** | Goals (with self-service progress) + performance reviews (Draft → Submitted → Acknowledged) |
| **Analytics** | HR dashboard with KPIs + charts (headcount, contract types, new hires, absence days) |
| **Recruiting** | Job postings + applicant pipeline (Kanban, 6 stages) |
| **News** | Announcement feed + in-app notifications (top-bar bell) |

Each module has its own guide — see [Module guides](./modules).

## Technology

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **PostgreSQL** + **Prisma 7** (pg driver adapter)
- **Auth.js v5** (NextAuth) — Credentials provider, JWT session
- **next-intl** (DE/EN, no URL prefixes; cookie-based)
- **Tailwind CSS v4** + **shadcn/ui** (Base UI)
- **Vitest** for unit tests

## Two ways it can run

Coworkee behaves differently depending on the `DEMO` environment variable:

- **`DEMO=1` — demo instance.** On an empty database it seeds sample data on first boot, shows a public marketing landing page, and lists clickable demo logins on `/login`.
- **`DEMO` unset / `0` — real install.** An empty database opens the [setup wizard](./setup-wizard) to create your admin account and company. No sample data, no marketing page.

`DEMO` is read at runtime, so switching it needs no rebuild. See [Installation](./installation#demo-vs-real-install) for the full explanation.

## Where to go next

- **Just want to try it locally?** → [Quick start](./quick-start)
- **Deploying to a server?** → [Installation & self-hosting](./installation)
- **First boot on a fresh database?** → [Setup wizard](./setup-wizard)
- **Automating with the API or an AI client?** → [API & MCP](./api-mcp)
