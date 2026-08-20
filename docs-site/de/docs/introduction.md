# Einführung

Coworkee ist moderne, selbst gehostete HR- und Personalverwaltungssoftware für **ein Unternehmen** (Single-Tenant), im Sinne von Personio und HR-Works. Sie ist vollständig zweisprachig — **Deutsch und Englisch** — und für den Betrieb auf Ihrer eigenen Infrastruktur ausgelegt.

Eine öffentliche Landingpage liegt unter `/`; die Anwendung selbst ist nach der Anmeldung unter `/dashboard` erreichbar.

> „Ein Arbeitsplatz für alles Menschliche."

## Was Coworkee bietet

- Ein zentraler Ort für den gesamten Mitarbeiter-Lebenszyklus: Einstellung, Onboarding, tägliche HR-Arbeit, Abwesenheit, Zeit, Performance und Offboarding.
- **Daten auf Ihrem eigenen Server.** Coworkee kommt als Docker-Image mit PostgreSQL-Datenbank; Sie hosten es, die Daten gehören Ihnen.
- **Durchgängig zweisprachig.** Jeder Bildschirm ist auf Deutsch und Englisch verfügbar; die Sprache wird pro Benutzer gespeichert.
- **Heller und dunkler Modus** sowie **Theming** — Stil-Presets und Corporate Identity (Akzentfarbe und Logo).
- **Rollenbasierte Zugriffssteuerung** (Admin / HR / Manager / Mitarbeitende), serverseitig bei jedem Schreibvorgang durchgesetzt.
- Eine echte **REST-API** und ein **MCP-Server**, beide mit benutzereigenen Tokens authentifiziert, sodass Automatisierung und KI-Clients genau mit den Rechten des Token-Inhabers handeln.
- Ein **Audit-Log** für Schreibvorgänge.

## Module im Überblick

| Bereich | Was es tut |
|---|---|
| **Mitarbeitende** | Verzeichnis (Suche / Filter / Paginierung), Detailprofile, Anlegen / Bearbeiten, Organigramm |
| **Abwesenheit** | Urlaubskonto, Antrag → Freigabe-Workflow, Team-Übersicht, Anspruchsverwaltung |
| **Zeiterfassung** | Kommen / Gehen, Wochenübersicht + Stunden, manuelle Einträge, Team-Zeiten |
| **Dokumente** | Sichere private Ablage, zugriffsgeschützter Download, HR-Upload, Profil-Tab |
| **Onboarding** | Checklisten-Vorlagen + prozessbezogene Aufgaben je Mitarbeitendem zum Abhaken |
| **Performance** | Ziele (mit Self-Service-Fortschritt) + Beurteilungen (Entwurf → Eingereicht → Bestätigt) |
| **Analytics** | HR-Dashboard mit KPIs + Diagrammen (Bestand, Vertragsarten, Neueinstellungen, Abwesenheitstage) |
| **Recruiting** | Stellenausschreibungen + Bewerber-Pipeline (Kanban, 6 Stufen) |
| **News** | Ankündigungs-Feed + In-App-Benachrichtigungen (Glocke in der Topbar) |

Zu jedem Modul gibt es ein eigenes Handbuch — siehe [Modul-Handbuch](./modules).

## Technologie

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **PostgreSQL** + **Prisma 7** (pg-Driver-Adapter)
- **Auth.js v5** (NextAuth) — Credentials-Provider, JWT-Session
- **next-intl** (DE/EN, ohne URL-Präfixe; cookie-basiert)
- **Tailwind CSS v4** + **shadcn/ui** (Base UI)
- **Vitest** für Unit-Tests

## Zwei Betriebsarten

Coworkee verhält sich je nach Umgebungsvariable `DEMO` unterschiedlich:

- **`DEMO=1` — Demo-Instanz.** Auf einer leeren Datenbank werden beim ersten Start Beispieldaten geladen, eine öffentliche Marketing-Landingpage wird angezeigt und auf `/login` erscheinen anklickbare Demo-Logins.
- **`DEMO` nicht gesetzt / `0` — echte Installation.** Eine leere Datenbank öffnet den [Einrichtungsassistenten](./setup-wizard), um Admin-Konto und Unternehmen anzulegen. Keine Beispieldaten, keine Marketing-Seite.

`DEMO` wird zur Laufzeit gelesen — ein Umschalten erfordert keinen Rebuild. Siehe [Installation](./installation#demo-vs-echte-installation) für die vollständige Erklärung.

## Wie es weitergeht

- **Nur lokal ausprobieren?** → [Schnellstart](./quick-start)
- **Auf einen Server ausrollen?** → [Installation & Self-Hosting](./installation)
- **Erster Start auf leerer Datenbank?** → [Einrichtungsassistent](./setup-wizard)
- **Mit API oder KI-Client automatisieren?** → [API & MCP](./api-mcp)
