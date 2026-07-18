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

Für manuelles Deployment oder die Demo-Variante (mit Caddy-Domain-Fixierung + Seed-Daten) siehe `docs/DEPLOYMENT.md`. Die öffentliche Demo-Instanz setzt zusätzlich `DEMO=1` (zur Laufzeit, kein Rebuild nötig) um die Demo-Logins auf `/login` anzuzeigen, und wird geseedet.

## Lizenz

Proprietär – © 2026 Coworkee.
