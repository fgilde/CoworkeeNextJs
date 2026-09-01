# Installation & Self-Hosting

Coworkee kommt als Docker-Image (`ghcr.io/fgilde/coworkeenextjs:latest`) zusammen mit einer PostgreSQL-16-Datenbank. Die App lauscht auf Port **3000** und legt Uploads in `/app/storage` ab, wofür ein **persistentes Volume** nötig ist.

## DEMO vs. echte Installation

Das ist die wichtigste Einstellung, die man vor dem Ausrollen verstehen sollte.

| `DEMO` | Erster Besuch auf **leerer** Datenbank | Marketing-Landingpage | Demo-Logins auf `/login` |
|---|---|---|---|
| `1` | Seedet Demo-Daten (Beispiel-Mitarbeitende, Abwesenheiten usw.) | Wird unter `/` angezeigt | Angezeigt, Klick füllt Formular |
| nicht gesetzt / `0` | Öffnet den [**Einrichtungsassistenten**](./setup-wizard) — Sie legen Admin + Unternehmen an | Nicht angezeigt | Nicht angezeigt |

- Seeding passiert nur auf einer **leeren** Datenbank; bestehende Daten werden nie überschrieben.
- `DEMO` wird zur **Laufzeit** gelesen — umschalten und Container neu starten, kein Rebuild nötig.
- Für eine Produktionsinstallation eines echten Unternehmens `DEMO` **weglassen** (oder `0`).

## Umgebungsvariablen

| Variable | Pflicht | Zweck |
|---|---|---|
| `DATABASE_URL` | ja | PostgreSQL-Connection-String, gelesen von Prisma und der App. Beispiel: `postgresql://coworkee:PASSWORT@db:5432/coworkee?schema=public` |
| `AUTH_SECRET` | ja (Prod) | Signaturschlüssel für Auth.js-Sessions. Erzeugen mit `openssl rand -base64 32`. |
| `DEMO` | nein | `1` = Demo-Instanz (Seed + Marketing + Demo-Logins). Nicht gesetzt/`0` = echte Installation (Einrichtungsassistent). |

::: warning URL-sicheres DB-Passwort
`POSTGRES_PASSWORD` wird in `DATABASE_URL` eingebettet und muss daher **URL-sicher** sein. Verwenden Sie Hex (`openssl rand -hex 24`) — vermeiden Sie `/`, `+` und `=`, die den Connection-String zerstören.
:::

Das GHCR-Image wird von der CI bei jedem Push auf `master` (Tag `latest`) und bei `v*`-Tags (Semver) veröffentlicht. Das GHCR-Paket muss **öffentlich** sein (GitHub → Packages → das Paket → Package settings → Change visibility → Public), damit Server anonym pullen können; andernfalls zuerst `docker login ghcr.io` (mit einem PAT mit `read:packages`) ausführen.

## 1. Ein Befehl (jedes Linux mit Docker)

```bash
curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/install.sh | sudo bash
```

Der Installer:

- installiert Docker, falls nicht vorhanden,
- klont das Repo nach `/opt/coworkee`,
- generiert die Secrets (`POSTGRES_PASSWORD`, `AUTH_SECRET`),
- fragt nach einer optionalen Domain (leer = einfaches HTTP auf Port 3000) und
- startet den Stack mit **leerer** Datenbank → Einrichtungsassistent.

Das ist der empfohlene Weg für eine frische, echte Installation.

## 2. Docker Compose — vorgebautes GHCR-Image

Empfohlen für **RAM-schwache Hosts (~1 GB)**: Es **pullt** das vorgebaute Image, statt `next build` auszuführen, und läuft daher nie in ein OOM. Aus dem Repo-Root ausführen:

```bash
# deploy/.env mit Ihren Secrets erstellen
cat > deploy/.env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -hex 32)
DEMO=0            # 0 = frische Installation (Assistent); 1 = Demo-Daten seeden
EOF

docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml pull
docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml up -d
```

Dieser Stack enthält einen **Caddy-Reverse-Proxy** mit automatischem HTTPS. Passen Sie zuerst das `Caddyfile` im Repo-Root auf Ihre Domain an. Für LAN- oder reinen HTTP-Betrieb verwenden Sie stattdessen `deploy/docker-compose.selfhost-http.yml`, das die App direkt auf Port 3000 ohne Proxy veröffentlicht.

::: tip Warum das GHCR-Image?
`next build` ist speicherhungrig und wird auf kleinen VPS per OOM abgebrochen. Das GHCR-Image ist bereits von der CI gebaut, der Server *pullt* also nur — kein Build, kein OOM. Auf allem mit weniger als ~2 GB RAM bevorzugen.
:::

## 3. Proxmox VE

Auf der **Proxmox-Host-Shell** ausführen (nicht innerhalb eines Containers):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/deploy/proxmox/coworkee.sh)"
```

Erstellt einen Debian-12-LXC (Standard: 2 vCPU, 2 GB RAM, 8 GB Disk — der Pull-Pfad vermeidet einen lokalen Build), installiert Docker darin, rollt das GHCR-Image plus PostgreSQL mit generierten Secrets und leerer Datenbank aus und gibt dann Container-IP und URL aus (`http://<ip>:3000`).

Standardwerte per Umgebungsvariablen überschreiben:

```bash
CORES=4 RAM=4096 STORAGE=local-lvm bash -c "$(curl -fsSL .../deploy/proxmox/coworkee.sh)"
```

## 4. Unraid

Coworkee benötigt einen **separaten PostgreSQL-16-Container** (Unraid Community Applications ist pro Container). Starten Sie zuerst einen Postgres-16-Container (z. B. das `postgres`-CA-Template) mit Datenbank und Benutzer `coworkee`, und fügen Sie dann die Coworkee-App hinzu:

1. Kopieren Sie `templates/coworkee.xml` nach `/boot/config/plugins/dockerMan/templates-user/` auf Ihrem Unraid-Server (oder fügen Sie die rohe GitHub-URL als privates CA-Template-Repo unter **Apps → Settings** hinzu).
2. Setzen Sie im Template `DATABASE_URL` auf Ihren Postgres-Container, z. B. `postgresql://coworkee:PASSWORT@POSTGRES_HOST:5432/coworkee?schema=public`, setzen Sie `AUTH_SECRET` (`openssl rand -base64 32`), mappen Sie `/app/storage` auf appdata und lassen Sie `DEMO` für eine frische Installation leer.
3. Öffnen Sie die WebUI unter `http://<unraid-ip>:3000`.

## 5. Umbrel

Dieses Repository *ist* ein Community-App-Store: `umbrel-app-store.yml` im Wurzelverzeichnis benennt ihn, `fgilde-coworkee/` ist die App (`umbrel-app.yml` + `docker-compose.yml`, App plus PostgreSQL 16 gebündelt). In Umbrel unter **App Store → ⋯ → Community app stores** `https://github.com/fgilde/CoworkeeNextJs` hinzufügen.

## 6. CasaOS

**App Store → Add source** mit `https://github.com/fgilde/CoworkeeNextJs/releases/download/store/casaos-appstore.zip`. Das Archiv wird bei jedem Push aus `store/casaos/` neu gebaut. Die App bringt ihre eigene PostgreSQL mit; `AUTH_SECRET` im Installationsdialog ersetzen, denn der Wert im Paket ist öffentlich.

## 7. Cosmos

`store/cosmos/servapps/Coworkee/` ist eine ServApp mit eigener PostgreSQL. Das Installationsformular fragt das Session-Secret ab und erzeugt das Datenbank-Passwort — beides kommt also nicht aus einer öffentlichen Datei.

Für ein offizielles Listing öffnen Sie einen PR gegen [getumbrel/umbrel-apps](https://github.com/getumbrel/umbrel-apps) mit einem `coworkee/`-Verzeichnis samt dieser beiden Dateien plus Galeriebildern.

## Produktionshinweise

- **Persistente Ablage ist zwingend.** Dokumente liegen unter `storage/documents/` (gemappt auf `/app/storage`). Serverlose Plattformen ohne persistente Disk sind ungeeignet, außer Sie ergänzen Object-Storage.
- **Setzen Sie `AUTH_SECRET` und ein starkes DB-Passwort** in Produktion. Denken Sie daran, dass das Passwort URL-sicher sein muss.
- Läuft der Container auf leerer Datenbank mit nicht gesetztem `DEMO`, landet Ihr erster Browser-Besuch auf dem [Einrichtungsassistenten](./setup-wizard).

## Fehlerbehebung

| Symptom | Ursache / Lösung |
|---|---|
| Build wird per OOM abgebrochen | Nicht auf dem Server bauen — das [GHCR-Image](#_2-docker-compose-vorgebautes-ghcr-image) verwenden. |
| `docker pull` verweigert / nicht gefunden | Das GHCR-Paket muss **öffentlich** sein, oder `docker login ghcr.io` mit `read:packages`-PAT. |
| Unerwartet auf der Marketing-Seite gelandet | `DEMO=1` ist gesetzt. Weglassen und neu starten für eine echte Installation. |
| Uploads verschwinden nach Redeploy | `/app/storage` liegt nicht auf einem persistenten Volume. |
| HTTPS funktioniert nicht | `Caddyfile` im Root mit Ihrer echten Domain anpassen und sicherstellen, dass Ports 80/443 den Host erreichen. |

Weitere Punkte auf der Seite [FAQ & Fehlerbehebung](./faq).
