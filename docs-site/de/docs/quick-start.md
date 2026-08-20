# Schnellstart (lokale Entwicklung)

Das ist der schnellste Weg, Coworkee auf dem eigenen Rechner zum Laufen zu bringen — für Entwicklung oder zum Ausprobieren. Für den Betrieb auf einem Server siehe stattdessen [Installation & Self-Hosting](./installation).

## Voraussetzungen

- **Node.js 20+**
- **Docker** (für ein lokales PostgreSQL) — oder eine eigene PostgreSQL-16-Instanz
- **git**

## Schritte

```bash
# 1. Klonen
git clone https://github.com/fgilde/CoworkeeNextJs.git
cd CoworkeeNextJs

# 2. Abhängigkeiten installieren
npm install

# 3. Umgebungsvariablen
cp .env.example .env        # DATABASE_URL + AUTH_SECRET bei Bedarf anpassen

# 4. PostgreSQL starten (Docker, Host-Port 5433)
docker compose up -d

# 5. Schema migrieren und Demo-Daten laden
npx prisma migrate dev
npm run db:seed

# 6. Dev-Server starten
npm run dev
```

Die App läuft nun unter **http://localhost:3000**.

::: tip Demo-Modus lokal
Das Seed-Skript lädt Demo-Daten und die Login-Seite zeigt anklickbare Demo-Logins, wenn die Instanz mit `DEMO=1` läuft. Um stattdessen den echten Erststart zu erleben, lassen Sie `DEMO` weg und starten mit leerer Datenbank — dann erscheint der [Einrichtungsassistent](./setup-wizard).
:::

## Demo-Logins

Alle Passwörter lauten `coworkee`.

| Rolle | E-Mail |
|---|---|
| Administrator | `admin@coworkee.test` |
| HR | `hr@coworkee.test` |
| Manager | `manager@coworkee.test` |
| Mitarbeitende | `employee@coworkee.test` |

Läuft die Instanz im Demo-Modus (`DEMO=1`), werden diese auf der Login-Seite angezeigt; ein Klick füllt das Formular.

## Nützliche Skripte

```bash
npm run dev        # Dev-Server
npm run build      # Produktions-Build
npm run start      # Produktions-Server (nach dem Build)
npm test           # Vitest Unit-Tests
npm run db:migrate # prisma migrate dev
npm run db:seed    # Demo-Daten (idempotent — überschreibt keine bestehenden Zeilen)
```

## Wie die Konfiguration gelesen wird

Prisma 7 liest `DATABASE_URL` aus `prisma.config.ts` (über `dotenv`), während App und Auth.js `.env` direkt lesen. Beide zeigen auf dieselbe `.env`, ein einziger Connection-String genügt also.

## Projektstruktur (Auszug)

```
app/
  page.tsx              # öffentliche Landingpage (/)
  (auth)/login/         # Login (Split-Screen + Demo-Logins)
  (auth)/setup/         # Einrichtungsassistent (leere DB)
  (app)/                # geschützte App (Sidebar-Shell)
    dashboard/ employees/ org/ absences/ time/ documents/
    onboarding/ performance/ analytics/ recruiting/ news/
    settings/ account/ notifications/
  actions/              # Server-Actions (Zod-validiert, auditiert)
  api/
    auth/[...nextauth]/ # Auth.js
    v1/                 # REST-API (Bearer-Token, OpenAPI)
    mcp/                # MCP-Server (RBAC-beschränkt)
    documents/[id]/     # zugriffsgeschützter Datei-Download
components/             # UI (shadcn), Feature-Komponenten, Marketing
lib/                    # db, rbac, Auth-Helfer, Domänenlogik (getestet)
messages/               # de.json, en.json (i18n)
prisma/                 # schema.prisma, Migrationen, seed.ts
deploy/                 # Self-Host / GHCR / Proxmox / Unraid / Umbrel
storage/                # hochgeladene Dokumente (nicht im Repo, nicht öffentlich)
```
