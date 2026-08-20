# Modul-Handbuch

Coworkee ist in neun Module gegliedert, erreichbar über die Sidebar nach der Anmeldung. Diese Seite erklärt die Nutzung jedes Moduls. Welche Aktionen sichtbar sind, hängt von Ihrer [Rolle](./configuration#benutzer-rollen) ab.

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
