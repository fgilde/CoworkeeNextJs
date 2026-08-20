# FAQ & Fehlerbehebung

## Installation

### Der Build wird abgebrochen / geht der Speicher aus

`next build` ist speicherhungrig und wird auf kleinen VPS (~1 GB) per OOM abgebrochen. Bauen Sie nicht auf dem Server — nutzen Sie das **vorgebaute GHCR-Image**, das nur ein fertiges Image *pullt*. Siehe [Docker Compose — vorgebautes GHCR-Image](./installation#_2-docker-compose-vorgebautes-ghcr-image).

### `docker pull` sagt „denied" oder „not found"

Das GHCR-Paket muss **öffentlich** sein, damit Server anonym pullen können: GitHub → Packages → das Paket → Package settings → Change visibility → Public. Muss es privat bleiben, zuerst `docker login ghcr.io` mit einem PAT mit `read:packages`.

### Ich sehe die Marketing-Landingpage statt des Einrichtungsassistenten

`DEMO=1` ist gesetzt. Das macht die Instanz zur Demo (geseedete Daten, Marketing-Seite, Demo-Logins). Für eine echte Installation `DEMO` **weglassen** (oder `0`) und den Container neu starten. Auf einer leeren Datenbank erscheint dann der [Einrichtungsassistent](./setup-wizard). Siehe [DEMO vs. echte Installation](./installation#demo-vs-echte-installation).

### Ich sehe den Assistenten, erwartete aber Demo-Daten

Die Datenbank ist leer und `DEMO` ist nicht `1`. Setzen Sie `DEMO=1` und starten Sie gegen eine leere Datenbank neu, um Demo-Daten zu seeden. Seeding überschreibt nie bestehende Zeilen.

### Hochgeladene Dokumente verschwinden nach einem Redeploy

`/app/storage` liegt nicht auf einem persistenten Volume. Dokumente liegen unter `storage/documents/`; mappen Sie diesen Pfad auf ein persistentes Volume. Serverlose Plattformen ohne persistente Disk brauchen stattdessen Object-Storage.

### Die Datenbank verbindet sich nicht

Prüfen Sie `DATABASE_URL`. Häufige Ursache ist ein Passwort mit `/`, `+` oder `=` — das Passwort ist in der URL eingebettet und **muss URL-sicher** sein. Neu erzeugen mit `openssl rand -hex 24`.

## TLS, Domains und Reverse Proxy

### Wie bekomme ich HTTPS?

Der GHCR-Compose-Stack enthält einen **Caddy**-Reverse-Proxy mit automatischem HTTPS. Passen Sie das `Caddyfile` im Root mit Ihrer echten Domain an und stellen Sie sicher, dass Ports 80 und 443 den Host erreichen, damit Caddy Zertifikate beziehen kann. Für LAN oder reinen HTTP-Betrieb nutzen Sie `deploy/docker-compose.selfhost-http.yml`, das die App direkt auf Port 3000 ohne Proxy veröffentlicht.

### Kann ich es hinter meinem eigenen Reverse Proxy betreiben?

Ja — nutzen Sie die reine HTTP-Compose-Datei und richten Sie Ihren bestehenden Proxy (nginx, Traefik usw.) auf die App auf Port 3000 aus.

## E-Mail

### Passwort-Reset-Mails kommen nicht an

Steht Mail auf dem **LOG**-Fallback (kein Transport konfiguriert), wird der Reset-Link ins Anwendungs-Log geschrieben statt gemailt. Konfigurieren Sie einen echten Transport (SMTP / SendGrid / sendmail) unter [Mail / SMTP](./configuration#mail-smtp) und prüfen Sie ihn mit dem Button **Test-E-Mail senden**.

## Nutzung

### Wie ändere ich die Sprache?

Pro Benutzer, über die [Konto-Seite](./account#sprache) oder den Sprachumschalter. Sie wird pro Benutzer gespeichert und betrifft niemanden sonst.

### Wie lasse ich einen KI-Assistenten Coworkee nutzen?

Erstellen Sie ein [API-Token](./account#api-tokens) unter einem Benutzer mit der gewünschten Rolle und richten Sie Ihren MCP-Client mit diesem Token auf `/api/mcp` aus. Siehe [API & MCP](./api-mcp).

### Wer darf Abwesenheit genehmigen / Mitarbeitende bearbeiten / Analytics sehen?

Das hängt von der Rolle ab. Siehe die [Berechtigungsmatrix](./configuration#berechtigungsmatrix).

## Immer noch festgefahren?

Öffnen Sie ein Issue im [GitHub-Repository](https://github.com/fgilde/CoworkeeNextJs).
