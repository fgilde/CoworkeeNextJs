# Einrichtungsassistent

Startet Coworkee gegen eine **leere Datenbank** und ist `DEMO` **nicht** auf `1` gesetzt, öffnet der erste Browser-Besuch den Einrichtungsassistenten unter `/setup`. So wird eine echte Installation initialisiert — es gibt kein Standard-Admin-Passwort zu ändern und keine Beispieldaten aufzuräumen.

::: info Wann erscheint der Assistent?
Nur auf einer leeren Datenbank mit nicht gesetztem `DEMO` (oder `0`). Ist `DEMO=1`, wird die Datenbank stattdessen mit Demo-Daten geseedet und Sie gelangen direkt zur Login-Seite. Siehe [DEMO vs. echte Installation](./installation#demo-vs-echte-installation).
:::

## Was der Assistent abfragt

Der Assistent sammelt in einem Durchgang alles, was zum Anlegen des ersten Kontos und des Unternehmens nötig ist:

1. **Administrator-Konto** — Name, E-Mail und Passwort des ersten Benutzers. Dieses Konto erhält die Rolle **Admin** und vollen Zugriff.
2. **Unternehmen** — der Firmenname, der in der App und in Dokumenten erscheint.
3. **Sprache** — die Standard-Oberflächensprache (Deutsch oder Englisch). Einzelne Benutzer können ihre Sprache später weiterhin selbst ändern.
4. **Theme** — das anfängliche Stil-Preset und das Erscheinungsbild (hell / dunkel). Danach unter den Admin-Einstellungen wieder änderbar.

Beim Absenden legt der Assistent den Admin-Benutzer und den Unternehmensdatensatz an, meldet Sie an und bringt Sie auf das Dashboard. Die Route `/setup` ist danach geschlossen — sobald ein Unternehmen existiert, ist der Assistent nicht mehr erreichbar.

## Nach dem Assistenten

Sie haben nun eine leere, echte Instanz mit einem Admin. Typische nächste Schritte:

- **Mitarbeitende anlegen** — [Mitarbeitende & Organigramm](./modules#mitarbeitende-organigramm).
- **Kolleginnen einladen / Benutzer anlegen und Rollen zuweisen** — [Benutzer & Rollen](./configuration#benutzer-rollen).
- **E-Mail konfigurieren**, damit Passwort-Resets und Benachrichtigungen versendet werden können — [Mail / SMTP](./configuration#mail-smtp).
- **Corporate Identity setzen** — Akzentfarbe und Logo unter [Theming](./configuration#theming).
- **Abwesenheitsansprüche festlegen**, bevor jemand Urlaub beantragt — [Abwesenheit](./modules#abwesenheit-freigabe-workflow).

## Assistenten erneut ausführen

Der Assistent orientiert sich an „ist die Datenbank leer?". Um ihn auf einer Testinstanz erneut zu sehen, starten Sie gegen eine frische Datenbank (Volume löschen / neue `DATABASE_URL`). Tun Sie das niemals auf einer Produktionsinstanz mit echten Daten.
