# Modul-Handbuch

Coworkee ist in eine Reihe von Modulen gegliedert, erreichbar über die Sidebar nach der Anmeldung. Diese Seite erklärt die Nutzung jedes Moduls. Welche Aktionen sichtbar sind, hängt von Ihrer [Rolle](./configuration#benutzer-rollen) ab.

## Mitarbeitende & Organigramm

Das **Mitarbeitenden**-Verzeichnis ist das Herz von Coworkee.

- **Verzeichnis** — durchsuchen, filtern und paginieren über alle. Jeder kann stöbern; **HR/Admin** können anlegen und bearbeiten.
- **Profile** — jede/r Mitarbeitende hat ein Detailprofil: Kontaktdaten, Rolle, Abteilung, Vertragsart, Führungskraft, Eintrittsdatum, plus Tabs für [Dokumente](#dokumente) und [Abwesenheit](#abwesenheit-freigabe-workflow).
- **Anlegen / Bearbeiten** — HR/Admin fügen neue Mitarbeitende hinzu und halten Datensätze aktuell. Das Setzen der **Führungskraft** baut die Berichtslinien auf.
- **Organigramm** (`/org`) — ein live aus diesen Berichtslinien erzeugtes Organigramm. Ändern Sie eine Führungskraft, aktualisiert sich das Chart.

![Organigramm](/screens/org-light.png)

## Abwesenheit & Freigabe-Workflow

Verwalten Sie Urlaub vom Antrag bis zur Freigabe, mit Ansprüchen je Mitarbeitendem.

- **Ansprüche** — HR/Admin legen den Urlaubsanspruch je Mitarbeitendem fest (das Jahreskonto). Vor den ersten Anträgen erledigen.
- **Antrag** — ein/e Mitarbeitende/r beantragt Abwesenheit für einen Zeitraum und Typ; das Konto wird geprüft.
- **Freigabe-Workflow** — der Antrag geht an die freigebende Stelle (**Manager** für das Team, oder **HR/Admin**), die genehmigt oder ablehnt. Bei Freigabe aktualisiert sich das Konto.
- **Team-Übersicht** — ein Kalender, der zeigt, wer abwesend ist, damit Überschneidungen vor der Freigabe sichtbar sind.

![Abwesenheiten](/screens/absences-light.png)

## Zeiterfassung

- **Kommen / Gehen** — Mitarbeitende erfassen Arbeitszeit per Start/Stopp.
- **Wochenübersicht** — Stunden pro Tag und Wochensummen für die Person.
- **Manuelle Einträge** — Einträge ergänzen oder korrigieren, wenn ein Einstempeln vergessen wurde.
- **Team-Zeiten** — Führungskräfte sehen die erfassten Zeiten ihres Teams.

## Dokumente

Sichere, private Dokumentenablage je Mitarbeitendem — nichts davon wird jemals öffentlich ausgeliefert.

- **Private Ablage** — Dateien liegen unter `storage/documents/` auf dem Server (ein persistentes Volume), nie im öffentlichen Web-Root.
- **Zugriffsgeschützter Download** — jeder Download durchläuft eine Zugriffsprüfung (`/api/documents/[id]`); Sie erhalten nur erlaubte Dateien.
- **HR-Upload** — HR/Admin laden Dokumente auf das Profil einer/eines Mitarbeitenden (Verträge, Zeugnisse usw.).
- **Profil-Tab** — Dokumente erscheinen auf dem Profil unter einem Dokumente-Tab.

## Onboarding

Verwandeln Sie eine wiederholbare Checkliste in einen nachverfolgten Prozess je Neuzugang.

- **Vorlagen** — HR/Admin bauen wiederverwendbare Onboarding-Checklisten-Vorlagen (die Aufgabenliste für neue Mitarbeitende).
- **Prozesse je Mitarbeitendem** — instanziieren Sie eine Vorlage für eine konkrete Person; daraus wird ein lebendiger Prozess.
- **Aufgaben zum Abhaken** — Aufgaben werden bei Erledigung abgehakt, sodass der Onboarding-Fortschritt auf einen Blick sichtbar ist.

## Performance

Zwei verbundene Werkzeuge: Ziele und Beurteilungen.

- **Ziele** — Objektive mit Zielwert setzen; Mitarbeitende aktualisieren ihren **Fortschritt** selbst (Self-Service), sodass Ziele aktuell bleiben, ohne dass die Führungskraft nachhaken muss.
- **Leistungsbeurteilungen** — eine Beurteilung durchläuft **Entwurf → Eingereicht → Bestätigt**. Die beurteilende Person entwirft und reicht ein; die/der Mitarbeitende bestätigt und schließt den Kreis.

![Performance](/screens/performance-light.png)

## Analytics

Ein HR-Dashboard (**HR/Admin**) mit KPIs und Diagrammen:

- **Personalbestand** über die Zeit,
- Aufschlüsselung nach **Vertragsarten**,
- **Neueinstellungen**,
- **Abwesenheitstage**.

Damit erkennen Sie Trends — Wachstum, Fluktuation, Abwesenheitslast — auf einen Blick.

![Analytics](/screens/analytics-light.png)

## Recruiting

- **Stellenausschreibungen** — offene Positionen anlegen und verwalten.
- **Bewerber-Pipeline** — ein **Kanban-Board mit sechs Stufen**; ziehen Sie Bewerbende weiter, während sie den Prozess durchlaufen.

![Recruiting](/screens/recruiting-light.png)

## News & Benachrichtigungen

- **Ankündigungs-Feed** — HR/Admin veröffentlichen Unternehmensnews; alle sehen den Feed.
- **In-App-Benachrichtigungen** — die **Glocke in der Topbar** zeigt Benachrichtigungen (neue Ankündigungen, Abwesenheitsentscheidungen usw.) ohne E-Mail.

## Mitarbeitergespräche (1:1 & Jahresgespräche)

Konfigurierbare Mitarbeitergespräche (`/talks`), getrennt vom starren Performance-Review.

- **Vorlagen** — eine Führungskraft (oder HR/Admin) gestaltet eine wiederverwendbare Agenda: Abschnitte plus typisierte Fragen (Freitext, Bewertung 1–5, Ja/Nein). HR/Admin können organisationsweite **geteilte** Vorlagen veröffentlichen.
- **Ansetzen & Freigeben** — eine Führungskraft setzt aus einer Vorlage ein Gespräch für ein Teammitglied an; die Agenda wird **gesnapshottet**, spätere Vorlagenänderungen ändern laufende Gespräche nicht. Die Freigabe macht es für die/den Mitarbeitende/n sichtbar und benachrichtigt sie/ihn.
- **Gemeinsam vorbereiten** — Führungskraft und Mitarbeitende/r füllen ihre Antworten **Seite an Seite** aus; die Führungskraft schließt das Gespräch mit einer gemeinsamen Zusammenfassung ab.
- **Sichtbarkeit folgt den Rollen** — Sie sehen ein Gespräch, wenn Sie Mitarbeiter/in, Führungskraft oder HR/Admin sind. Wer selbst Führungskraft ist und trotzdem eine/n Vorgesetzte/n hat, sieht **beides**: die eigenen Gespräche (mit dem/der Vorgesetzten) und die selbst geführten. Entwürfe sehen Mitarbeitende nie.

## Umfragen & Pulse

Engagement- und Pulse-Umfragen (`/surveys`), HR/Admin.

- **Erstellen** — einen Entwurf mit **Skala (1–5)**, **eNPS (0–10)** und **Freitext**-Fragen anlegen.
- **Öffnen / Schließen** — beim Öffnen werden alle eingeladen und die Bearbeitung gesperrt; beim Schließen sind keine Antworten mehr möglich.
- **Anonym von Grund auf** — anonyme Antworten tragen keine Identität; ein separater Teilnahme-Marker verhindert trotzdem eine zweite Abgabe.
- **Ergebnisse** — pro Frage aggregiert: Durchschnitt und Verteilung bei Skalen, ein **eNPS-Wert** bei NPS und die Liste der Textantworten.

## Skills & Nachfolge

- **Skill-Matrix** (`/skills`) — HR/Admin pflegen einen Skill-Katalog. Alle bewerten ihre eigenen Skills selbst (1–5); Führungskräfte/HR bewerten ihr Team, dargestellt als schreibgeschützte Matrix.
- **Nachfolge** (`/skills/succession`, HR/Admin) — einen Plan für eine/n Schlüsselrollen-Inhaber/in anlegen und interne Kandidaten mit einer **Bereitschaft** hinzufügen (sofort / 1–2 Jahre / 3+ Jahre).

## Schulungen

Ein schlankes LMS (`/trainings`).

- **Kurskatalog** — Führungskräfte/HR/Admin fügen Kurse hinzu (Titel, Anbieter, Link).
- **Zuweisen** — einen Kurs einem/einer Mitarbeitenden im eigenen Bereich zuweisen.
- **Eigener Status** — Mitarbeitende führen ihre Zuweisungen durch **Zugewiesen → In Bearbeitung → Abgeschlossen**.

## Schichten

Schichtplanung (`/shifts`).

- **Planen** — Führungskräfte/HR/Admin erstellen Schichten fürs Team (Datum, Beginn/Ende, Rolle, Ort).
- **Meine Schichten** — alle sehen ihre eigenen bevorstehenden Schichten.

## Spesen

Spesenanträge mit Genehmigungs-Workflow (`/expenses`).

- **Einreichen** — ein/e Mitarbeitende/r reicht eine Ausgabe ein (Betrag, Kategorie, Datum, Notiz).
- **Genehmigen / Ablehnen** — die Führungskraft (oder HR/Admin) entscheidet; die/der Mitarbeitende wird benachrichtigt.
- **Erstatten** — HR/Admin markieren eine genehmigte Ausgabe als erstattet.

## Benefits

- **Katalog** — HR/Admin pflegen einen Benefits-Katalog (aktiv/inaktiv).
- **Self-Service** — Mitarbeitende treten aktiven Benefits selbst bei oder verlassen sie.

## Betriebsmittel

Inventar für Firmen-Ausstattung (`/assets`, HR/Admin).

- **Bestand** — Betriebsmittel hinzufügen (Name, Kategorie, Seriennummer).
- **Zuweisen / Zurücknehmen / Ausmustern** — ein Betriebsmittel einem/einer Mitarbeitenden zuweisen, zurücknehmen oder ausmustern. Mitarbeitende sehen unter **Meine Ausstattung**, was ihnen aktuell zugewiesen ist.

## Vergütung

Gehaltsverfolgung (`/compensation`) — **nur HR/Admin**. Keine Lohnabrechnungs-Engine (keine Steuer, keine Abrechnungsläufe).

- **Einträge** — Vergütungseinträge pro Mitarbeiter/in hinzufügen (Betrag, Währung, Häufigkeit, gültig ab) — das ergibt einen Gehaltsverlauf.
- **Meine Vergütung** — jede/r sieht die eigene aktuelle Vergütung und Historie; keine fremde.

## E-Signaturen

Schlankes Bestätigungs-Signieren (`/signatures`) — ein Bestätigungsnachweis, **keine** kryptografische/qualifizierte E-Signatur.

- **Anfragen** — Führungskraft/HR/Admin senden einen Dokumenttext an eine/n Unterzeichner/in.
- **Unterschreiben / Ablehnen** — die/der Unterzeichner/in tippt den vollständigen Namen zum Unterschreiben oder lehnt ab; die anfragende Person wird benachrichtigt.

## Single Sign-on (SSO)

Optionales Enterprise-**OIDC**-Login (Keycloak, Entra ID, Okta, Authentik, Google Workspace, …). Es ist nur aktiv, wenn die `SSO_*`-Umgebungsvariablen gesetzt sind; ohne sie nutzt Coworkee nur E-Mail/Passwort. SSO **authentifiziert bestehende Benutzer per E-Mail — es legt nie neue Konten an**. Die Umgebungsvariablen finden Sie unter [Konfiguration](./configuration).

## Audit-Log

**HR/Admin** können das Audit-Log unter `/settings/audit` durchsuchen — wer was geändert hat, mit Filter über Aktion, Objekt und ID.
