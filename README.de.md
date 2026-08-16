# Coworkee

*Read this in [English 🇬🇧](README.md).*

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

Querschnitt: **Rollen & Rechte** (ADMIN / HR / MANAGER / EMPLOYEE, server-seitig erzwungen), **DE/EN-i18n** (cookie-basiert, pro Nutzer gespeichert), **Hell/Dunkel-Modus**, **Theming** (Stil-Presets + Corporate Identity: Akzentfarbe & Logo), eine **REST-API + MCP-Server** (Per-User-Tokens) sowie Audit-Log für schreibende Aktionen.

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

Die Zugänge werden auf der Login-Seite angezeigt (Klick füllt das Formular), wenn die Instanz im Demo-Modus läuft (`DEMO=1`).

## Umgebungsvariablen

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | PostgreSQL-Verbindungsstring (Prisma) |
| `AUTH_SECRET` | Signierschlüssel für Auth.js-Sessions (in Produktion zwingend: `openssl rand -base64 32`) |
| `DEMO` | `1` = Demo-Instanz: seedet beim ersten Start automatisch Demo-Daten **falls die DB leer ist** und zeigt die Demo-Logins auf `/login`. Unset/`0` = echte Installation (leere DB → Setup-Assistent). Wird zur Laufzeit gelesen. |

Die DB-URL wird von Prisma 7 aus `prisma.config.ts` (via `dotenv`) gelesen; App/Auth lesen `.env` direkt.

## Skripte

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktions-Build
npm run start      # Produktionsserver (nach build)
npm test           # Vitest
npm run db:migrate # prisma migrate dev
npm run db:seed    # Demo-Daten (idempotent)
```

## API & MCP

Coworkee bietet eine echte REST-API und einen MCP-Server, beide mit **Per-User-API-Tokens** authentifiziert, die exakt die RBAC-Rechte des Users tragen (eine AI/ein Client darf nur, was der User darf).

- Tokens anlegen/widerrufen: **Konto**-Seite (Self-Service, einmalig angezeigt).
- REST-Basis: `GET /api/v1/*` — `me`, Mitarbeitende, Abwesenheit, Zeit, Dokumente, Ziele, Reviews, Recruiting, Ankündigungen … · OpenAPI 3.1 unter `GET /api/v1/openapi.json`.
- MCP-Endpunkt: `POST /api/mcp` (JSON-RPC, RBAC-scoped Tools).
- In-App-Referenz + Client-Config: **`/settings/api`**.

Token als `Authorization: Bearer <token>` senden.

## Wichtige Hinweise für Produktion

- **Dokumente** liegen unter `storage/documents/` → das Hosting braucht **persistenten Speicher** (Volume). Serverlose Plattformen ohne persistente Disk sind ohne Objektspeicher-Anbindung ungeeignet.
- `AUTH_SECRET` und ein sicheres DB-Passwort setzen. `POSTGRES_PASSWORD` muss **URL-sicher** sein (hex — kein `/ + =`), da es in `DATABASE_URL` steckt.
- Ausführliche deutsche Deployment-Anleitung: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Installation & Self-hosting

Coworkee läuft als Docker-Image (`ghcr.io/fgilde/coworkeenextjs:latest`) mit PostgreSQL 16, lauscht auf Port **3000** und legt Uploads in `/app/storage` ab (persistentes Volume nötig).

**Frische Installation vs. Demo:** bei **leerer** DB öffnet der erste Aufruf einen **Setup-Assistenten** zum Anlegen des Admin-Kontos (keine Beispieldaten). `DEMO=1` seedet stattdessen Demo-Daten und zeigt die Demo-Logins auf `/login` (nur bei leerer DB; überschreibt nie vorhandene Daten). `DEMO` wird zur Laufzeit gelesen — kein Rebuild nötig.

Das GHCR-Image wird von der CI bei jedem Push auf `master` (Tag `latest`) und bei `v*`-Tags (semver) veröffentlicht. Das GHCR-Package muss **public** sein (GitHub → Packages → Package → Package settings → Change visibility → Public), damit Server anonym pullen können; sonst vorher `docker login ghcr.io` (PAT mit `read:packages`).

### 1. Ein Befehl (jedes Linux mit Docker)

```bash
curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/install.sh | sudo bash
```

Installiert Docker (falls nötig), klont nach `/opt/coworkee`, generiert Secrets, fragt nach einer optionalen Domain (leer = reines HTTP auf Port 3000) und startet den Stack mit leerer DB → Setup-Assistent.

### 2. Docker Compose — vorgebautes Image (GHCR)

Empfohlen für Hosts mit wenig RAM (~1 GB): **pullt** das fertige Image statt `next build` zu laufen → kein OOM. Vom Repo-Root:

```bash
# deploy/.env mit Secrets anlegen
cat > deploy/.env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -hex 32)
DEMO=0            # 0 = frische Installation (Setup-Assistent); 1 = Demo-Daten
EOF

docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml pull
docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml up -d
```

Dieser Stack enthält einen Caddy-Reverse-Proxy (automatisches HTTPS). Vorher das Root-`Caddyfile` auf deine Domain anpassen; für LAN/HTTP `deploy/docker-compose.selfhost-http.yml` nutzen (App direkt auf Port 3000).

### 3. Proxmox VE

Auf der **Proxmox-Host-Shell** (nicht im Container):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/deploy/proxmox/coworkee.sh)"
```

Legt einen Debian-12-LXC an (Default: 2 vCPU, 2 GB RAM, 8 GB Disk — der Pull-Weg vermeidet einen lokalen Build), installiert Docker darin, deployt das GHCR-Image + PostgreSQL mit generierten Secrets und leerer DB, und gibt Container-IP + URL aus (`http://<ip>:3000`). Defaults per Env überschreibbar, z.B. `CORES=4 RAM=4096 STORAGE=local-lvm bash …`. Script: [`deploy/proxmox/coworkee.sh`](deploy/proxmox/coworkee.sh).

### 4. Unraid

Coworkee braucht einen **separaten PostgreSQL-16-Container** (Unraid Community Applications ist pro Container). Zuerst einen Postgres-16-Container (z.B. das `postgres`-CA-Template) mit `coworkee`-DB + -User starten, dann die App:

1. [`deploy/unraid/coworkee.xml`](deploy/unraid/coworkee.xml) nach `/boot/config/plugins/dockerMan/templates-user/` kopieren (oder die raw-GitHub-URL als privates CA-Template-Repo unter **Apps → Settings** hinzufügen).
2. Im Template `DATABASE_URL` auf deinen Postgres setzen, z.B. `postgresql://coworkee:PASSWORT@POSTGRES_HOST:5432/coworkee?schema=public`, `AUTH_SECRET` setzen (`openssl rand -base64 32`), `/app/storage` auf appdata mappen, `DEMO` leer lassen (frische Installation).
3. WebUI unter `http://<unraid-ip>:3000`.

Ein offizielles Listing in Community Applications erfordert später ein GitHub-Template-Repo + Kontakt zum CA-Maintainer (Squid) im Unraid-Forum.

### 5. Umbrel

Die App-Dateien liegen in [`deploy/umbrel/`](deploy/umbrel/) (`umbrel-app.yml` + `docker-compose.yml`, App + PostgreSQL 16). Zum Sideloaden den Ordner `deploy/umbrel/` als `coworkee` in ein Community-App-Store-Repo legen und dieses in den Umbrel-App-Store-Einstellungen hinzufügen.

Für ein offizielles Listing einen PR gegen [getumbrel/umbrel-apps](https://github.com/getumbrel/umbrel-apps) öffnen (Verzeichnis `coworkee/` mit diesen beiden Dateien + Gallery-Bildern).

## Lizenz

Proprietär – © 2026 Coworkee.
