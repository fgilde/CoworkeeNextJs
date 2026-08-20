---
layout: home

hero:
  name: Coworkee
  text: Ein Arbeitsplatz für alles Menschliche.
  tagline: Moderne, selbst gehostete, zweisprachige HR-Software für ein Unternehmen — Mitarbeitende, Abwesenheit, Zeiterfassung, Dokumente, Onboarding, Performance, Analytics, Recruiting und News. Auf Ihrem eigenen Server.
  image:
    src: /icon.png
    alt: Coworkee
  actions:
    - theme: brand
      text: Loslegen
      link: /de/docs/introduction
    - theme: alt
      text: Installation
      link: /de/docs/installation
    - theme: alt
      text: Auf GitHub ansehen
      link: https://github.com/fgilde/CoworkeeNextJs

features:
  - icon: 👥
    title: Mitarbeitende & Org-Chart
    details: Durchsuchbares Verzeichnis, ausführliche Profile, Anlegen und Bearbeiten sowie ein live erzeugtes Organigramm aus den Berichtslinien.
  - icon: 🗓️
    title: Abwesenheit & Freigabe
    details: Urlaubskonten und Ansprüche, Antrag → Freigabe-Workflow und ein Team-Kalender, damit Führungskräfte sehen, wer abwesend ist.
  - icon: ⏱️
    title: Zeiterfassung
    details: Kommen und Gehen, Wochenübersicht der Stunden, manuelle Korrekturen und eine Team-Ansicht für Führungskräfte.
  - icon: 📄
    title: Dokumente
    details: Sichere private Ablage je Mitarbeitendem, zugriffsgeschützte Downloads und HR-Upload — nichts wird öffentlich ausgeliefert.
  - icon: ✅
    title: Onboarding
    details: Wiederverwendbare Checklisten-Vorlagen werden zu prozessbezogenen, abhakbaren Aufgaben je Mitarbeitendem.
  - icon: 🎯
    title: Performance
    details: Ziele mit Self-Service-Fortschritt plus Leistungsbeurteilungen im Ablauf Entwurf → Eingereicht → Bestätigt.
  - icon: 📊
    title: Analytics
    details: Ein HR-Dashboard mit KPIs und Diagrammen — Personalbestand, Vertragsarten, Neueinstellungen und Abwesenheitstage.
  - icon: 💼
    title: Recruiting
    details: Stellenausschreibungen und eine Bewerber-Pipeline als sechsstufiges Kanban-Board.
  - icon: 🔔
    title: News & Benachrichtigungen
    details: Ein Ankündigungs-Feed des Unternehmens mit In-App-Benachrichtigungen in der Topbar.
---

<div style="max-width: 1152px; margin: 4rem auto 0; padding: 0 24px;">

## Eine App für den gesamten Mitarbeiter-Lebenszyklus

Coworkee ist eine Single-Tenant-HR-Plattform im Sinne von Personio und HR-Works, gebaut mit Next.js 16, PostgreSQL und Prisma. Sie läuft vollständig auf **Ihrer** Infrastruktur — ein einzelner Docker-Befehl startet die App und ihre Datenbank. Alles ist auf **Deutsch und Englisch** verfügbar, mit hellem und dunklem Modus sowie konfigurierbarem Theming.

<img src="/screens/dashboard-light.png" alt="Coworkee Dashboard" style="border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); margin: 2rem 0;" />

### Für Self-Hosting gemacht

- **Ein-Befehl-Installation** auf jedem Linux-Host mit Docker, oder ein vorgebautes GHCR-Image für RAM-schwache Server, das keinen Build ausführt.
- **Fertige Rezepte** für Docker Compose, Proxmox, Unraid und Umbrel.
- **Rollenbasierte Zugriffssteuerung** (Admin / HR / Manager / Mitarbeitende), serverseitig durchgesetzt.
- **REST-API + MCP-Server** mit benutzereigenen Tokens, sodass Skripte und KI-Clients genau mit den Rechten des Token-Inhabers handeln.

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin: 2rem 0;">
  <img src="/screens/analytics-light.png" alt="Analytics" style="border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.12);" />
  <img src="/screens/org-light.png" alt="Organigramm" style="border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.12);" />
</div>

<p style="text-align:center; margin-top: 3rem;">
  <a href="/CoworkeeNextJs/de/docs/introduction" style="font-weight:600;">Zur Dokumentation →</a>
</p>

</div>
