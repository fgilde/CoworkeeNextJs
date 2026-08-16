# Coworkee

Moderne, self-hosted Personalverwaltungssoftware (HR) im Stil von Personio/HR-Works — für **ein** Unternehmen (single-tenant). Voll auf Deutsch **und** Englisch, erweiterbar.

> „Ein Arbeitsplatz für alles Menschliche."

Öffentliche Landingpage unter `/`, die Anwendung nach Login unter `/dashboard`.

## Module

| Bereich | Funktionen |
|---|---|
| **Mitarbeitende** | Verzeichnis (Suche/Filter/Paginierung), Detailprofile, Anlegen/Bearbeiten, Org-Chart |
| **Abwesenheit** | Urlaubs-/Abwesenheitssaldo, Antrag → Genehmigungs-Workflow, Team-Übersicht, Kontingent-Verwaltung |
| **Zeiterfassung** | Clock-in/out, Wochenübersicht + Stunden, manuelle Einträge, Team-Zeiten |
| **Dokumente** | Sichere private Ablage, zugriffsgeschützter Download, Upload durch HR, Profil-Tab |
| **Onboarding** | Checklisten-Templates + pro Mitarbeiter Prozesse mit abhakbaren Aufgaben |
| **Performance** | Ziele (mit Self-Service-Fortschritt) + Leistungsbeurteilungen (Entwurf → Eingereicht → Bestätigt) |
| **Analysen** | HR-Dashboard mit KPIs + Diagrammen (Headcount, Vertragsarten, Neueinstellungen, Abwesenheitstage) |
| **Recruiting** | Stellen + Bewerbungs-Pipeline (Kanban, 6 Phasen) |
| **Neuigkeiten** | Ankündigungs-Feed + In-App-Benachrichtigungen (Topbar-Glocke) |

Querschnitt: **Rollen & Rechte** (ADMIN / HR / MANAGER / EMPLOYEE, server-seitig erzwungen), **DE/EN-i18n** (cookie-basiert, pro Nutzer gespeichert), **Hell/Dunkel-Modus**, Audit-Log für schreibende HR-Aktionen.

## Tech-Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **PostgreSQL** + **Prisma 7** (pg Driver-Adapter)
- **Auth.js v5** (NextAuth) — Credentials, JWT-Session
- **next-intl** (DE/EN, ohne URL-Präfixe)
- **Tailwind CSS v4** + **shadcn/ui** (Base UI)
- **Vitest** (Unit-Tests)

## Voraussetzungen

- Node.js 20+
- Docker (für lokales PostgreSQL) — oder eine eigene PostgreSQL-Instanz

## Schnellstart (lokal)

```bash
# 1. Abhängigkeiten
npm install

# 2. Umgebungsvariablen
cp .env.example .env        # DATABASE_URL + AUTH_SECRET anpassen falls nötig

# 3. PostgreSQL starten (Docker, Host-Port 5433)
docker compose up -d

# 4. Schema migrieren + Demo-Daten laden
npx prisma migrate dev
npm run db:seed

# 5. Dev-Server
npm run dev
```

App: http://localhost:3000

### Demo-Zugänge

Alle Passwörter: `coworkee`

| Rolle | E-Mail |
|---|---|
| Administrator | `admin@coworkee.test` |
| HR | `hr@coworkee.test` |
| Manager | `manager@coworkee.test` |
| Mitarbeiter | `employee@coworkee.test` |

Die Zugänge werden auf der Login-Seite angezeigt (Klick füllt das Formular).

## Umgebungsvariablen

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindungsstring (Prisma) |
| `AUTH_SECRET` | Signierschlüssel für Auth.js-Sessions (in Produktion zwingend setzen: `openssl rand -base64 32`) |

Die DB-URL wird von Prisma 7 aus `prisma.config.ts` (via `dotenv`) gelesen; die App/Auth lesen `.env` direkt.

## Skripte

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktions-Build
npm run start      # Produktionsserver (nach build)
npm test           # Vitest
npm run db:migrate # prisma migrate dev
npm run db:seed    # Demo-Daten (idempotent)
```

## Projektstruktur (Auszug)

```
app/
  page.tsx              # öffentliche Landingpage (/)
  (auth)/login/         # Login (Split-Screen + Demo-Zugänge)
  (app)/                # geschützte App (Sidebar-Shell)
    dashboard/ employees/ org/ absences/ time/ documents/
    onboarding/ performance/ analytics/ recruiting/ news/
    settings/ account/ notifications/
  actions/              # Server Actions (Zod-validiert, Audit)
  api/
    auth/[...nextauth]/ # Auth.js
    documents/[id]/     # zugriffsgeschützter Datei-Download
components/             # UI (shadcn), Feature-Komponenten, Marketing
lib/                    # db, rbac, auth-Helper, Domänenlogik (getestet)
messages/               # de.json, en.json (i18n)
prisma/                 # schema.prisma, migrations, seed.ts
storage/                # hochgeladene Dokumente (nicht im Repo, nicht öffentlich)
```

## Wichtige Hinweise für Produktion

- **Dokumente** werden im lokalen Verzeichnis `storage/documents/` abgelegt → das Hosting braucht **persistenten Speicher** (Volume). Serverlose Plattformen ohne persistente Disk sind ohne Objektspeicher-Anbindung ungeeignet.
- `AUTH_SECRET` und ein sicheres DB-Passwort in Produktion setzen.
- Deployment-Anleitung: siehe `docs/DEPLOYMENT.md`.

## Self-hosting (ein Befehl)

Eigener Server (Domain oder reines LAN/HTTP), Docker vorausgesetzt:

```bash
curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/install.sh | sudo bash
```

Installiert Docker (falls nötig), klont nach `/opt/coworkee`, fragt nach einer Domain (leer = lokaler HTTP-Betrieb) und startet den Stack mit einer **leeren** Datenbank — kein Demo-Seed. Beim ersten Aufruf zeigt die App den **Setup-Assistenten** zum Anlegen des Admin-Kontos.

Für manuelles Deployment oder die Demo-Variante (mit Caddy-Domain-Fixierung) siehe `docs/DEPLOYMENT.md`. Die öffentliche Demo-Instanz setzt zusätzlich `DEMO=1` (zur Laufzeit, kein Rebuild nötig) — das eine Flag seedet beim ersten Start automatisch die Demo-Daten (nur falls die DB leer ist) **und** zeigt die Demo-Logins auf `/login`. Ohne `DEMO` bleibt die DB leer → Setup-Assistent.

### Prebuilt image (GHCR)

CI publishes the Docker image to `ghcr.io/fgilde/coworkeenextjs` on every push to `master`
(tag `latest`) and on `v*` tags (semver). Small servers (~1 GB RAM) that OOM on a local
`next build` can deploy by **pulling** this image instead of building — use
`deploy/docker-compose.ghcr.yml`, run from the repo root:

```bash
docker compose --env-file .env.prod -f deploy/docker-compose.ghcr.yml pull
docker compose --env-file .env.prod -f deploy/docker-compose.ghcr.yml up -d
```

The GHCR package must be set **public** once in GitHub (Packages → the package → Package
settings → Change visibility → Public) so the server can pull anonymously. Otherwise run
`docker login ghcr.io` on the server first (with a PAT that has `read:packages`).

## Installation (English)

Coworkee ships as a Docker image (`ghcr.io/fgilde/coworkeenextjs:latest`) with a
PostgreSQL 16 database. It listens on port **3000** and stores uploaded documents in
`/app/storage`, which needs a persistent volume.

**Fresh install vs. demo:** on an **empty** database the first visit opens a **setup
wizard** to create the admin account (no sample data). Set `DEMO=1` instead to seed
demo data and show the demo logins on `/login` (only on an empty DB; it never
overwrites existing data). `DEMO` is read at runtime — no rebuild needed.

The German deployment reference is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### 1. One command (any Linux with Docker)

```bash
curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/install.sh | sudo bash
```

Installs Docker if missing, clones to `/opt/coworkee`, generates secrets, asks for an
optional domain (blank = plain HTTP on port 3000), and starts the stack with an empty
database → setup wizard.

### 2. Docker Compose — prebuilt image (GHCR)

Recommended for low-RAM hosts (~1 GB): it **pulls** the prebuilt image instead of
running `next build`, so it never OOMs. Run from the repo root:

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

This stack includes a Caddy reverse proxy (automatic HTTPS). Edit the root `Caddyfile`
to your own domain first, or for LAN/plain-HTTP use `deploy/docker-compose.selfhost-http.yml`
(app published directly on port 3000).

> The GHCR package must be **public** (GitHub → Packages → the package → Package
> settings → Change visibility → Public) so the server can pull anonymously. Otherwise
> run `docker login ghcr.io` on the server first (PAT with `read:packages`).

### 3. Proxmox VE

On the **Proxmox host shell** (not inside a container):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/deploy/proxmox/coworkee.sh)"
```

Creates a Debian 12 LXC (defaults: 2 vCPU, 2 GB RAM, 8 GB disk — the pull path avoids
a local build), installs Docker inside it, deploys the GHCR image + PostgreSQL with
generated secrets and an empty database, then prints the container IP and URL
(`http://<ip>:3000`). Override defaults via env, e.g. `CORES=4 RAM=4096 STORAGE=local-lvm bash …`.
Script: [`deploy/proxmox/coworkee.sh`](deploy/proxmox/coworkee.sh).

### 4. Unraid

Coworkee needs a **separate PostgreSQL 16 container** (Unraid Community Applications is
per-container). First start a Postgres 16 container (e.g. the `postgres` CA template)
with a `coworkee` database and user, then add the Coworkee app:

1. Copy [`deploy/unraid/coworkee.xml`](deploy/unraid/coworkee.xml) to
   `/boot/config/plugins/dockerMan/templates-user/` on your Unraid server (or add its
   raw GitHub URL as a private CA template repo under **Apps → Settings**).
2. In the template set `DATABASE_URL` to your Postgres container, e.g.
   `postgresql://coworkee:PASSWORD@POSTGRES_HOST:5432/coworkee?schema=public`, set
   `AUTH_SECRET` (`openssl rand -base64 32`), map `/app/storage` to appdata, and leave
   `DEMO` empty for a fresh install.
3. Open the WebUI at `http://<unraid-ip>:3000`.

Official listing in Community Applications later requires publishing the template to a
GitHub template repo and contacting the CA maintainer (Squid) on the Unraid forums.

### 5. Umbrel

The app files live in [`deploy/umbrel/`](deploy/umbrel/) (`umbrel-app.yml` +
`docker-compose.yml`, bundling the app + PostgreSQL 16). To sideload during development,
place the `deploy/umbrel/` folder as `coworkee` in your Community App Store repo and add
that repo in the Umbrel App Store settings.

For an official listing, open a PR against
[getumbrel/umbrel-apps](https://github.com/getumbrel/umbrel-apps) adding a `coworkee/`
directory with these two files plus gallery images.

## Lizenz

Proprietär – © 2026 Coworkee.
