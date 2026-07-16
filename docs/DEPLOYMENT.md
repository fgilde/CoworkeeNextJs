# Deployment — Coworkee auf VPS mit Docker

Self-hosted Stack: **App (Next.js)** + **PostgreSQL** + **Caddy** (Reverse-Proxy mit automatischem HTTPS) — alles per `docker-compose.prod.yml`. Persistenter Speicher für DB (`pgdata`) und Dokument-Uploads (`storage`).

Ziel-Domain: **coworkee.de** (+ www).

---

## Schnell-Deploy (Copy-Paste)

DNS zuerst: A `@` + A `www` → Server-IP (bei Cloudflare: „DNS only" / graue Wolke).

Dann als root auf dem frischen Ubuntu-Server:

```bash
curl -fsSL https://get.docker.com | sh
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
git clone https://github.com/fgilde/CoworkeeNextJs.git /opt/coworkee && cd /opt/coworkee
cp .env.prod.example .env.prod
sed -i "s|change-me-strong-password|$(openssl rand -base64 24)|" .env.prod
sed -i "s|change-me-openssl-rand-base64-32|$(openssl rand -base64 32)|" .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm app npm run db:seed
docker compose --env-file .env.prod -f docker-compose.prod.yml ps   # alle 3 "Up"?
```

Danach → https://coworkee.de (Caddy holt TLS automatisch, sobald DNS zeigt).

Die Einzelschritte + Betrieb (Logs, Update, Backup) stehen unten.

---

## 0. Voraussetzungen

- Ein VPS mit öffentlicher IPv4 (z.B. Hetzner CX22 ~4 €/Monat, Ubuntu 22.04/24.04). Notiere die **Server-IP**.
- Zugriff auf die DNS-Verwaltung von **coworkee.de** (dein Domain-Registrar).
- SSH-Zugang zum Server.

## 1. DNS setzen (beim Registrar)

Lege diese Records für `coworkee.de` an:

| Typ | Name | Wert | TTL |
|-----|------|------|-----|
| A | `@` | `<SERVER-IPv4>` | 3600 |
| A | `www` | `<SERVER-IPv4>` | 3600 |
| AAAA *(optional)* | `@` | `<SERVER-IPv6>` | 3600 |
| AAAA *(optional)* | `www` | `<SERVER-IPv6>` | 3600 |

Prüfen (lokal): `nslookup coworkee.de` sollte die Server-IP zeigen. Propagation kann bis zu ein paar Stunden dauern — Caddy holt das TLS-Zertifikat erst, wenn die Domain auf den Server zeigt.

## 2. Server vorbereiten

```bash
ssh root@<SERVER-IP>

# Docker + Compose-Plugin
curl -fsSL https://get.docker.com | sh

# Firewall: SSH + HTTP + HTTPS
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable
```

## 3. Code holen

```bash
git clone <REPO-URL> /opt/coworkee
cd /opt/coworkee
```
(Alternativ per `scp`/`rsync` hochladen.)

## 4. Secrets anlegen

```bash
cp .env.prod.example .env.prod
# zwei starke Werte erzeugen:
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)" 
echo "AUTH_SECRET=$(openssl rand -base64 32)"
# beide Werte in .env.prod eintragen (nano .env.prod)
```
`.env.prod` bleibt **nur auf dem Server** (nicht committen).

## 5. Starten

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```
Beim Start des `app`-Containers laufen automatisch die DB-Migrationen (`prisma migrate deploy`).

## 6. Demo-Daten laden (einmalig)

Erzeugt Beispiel-Firma + die Demo-Logins (`admin@ / hr@ / manager@ / employee@coworkee.test`, Passwort `coworkee`), die auf der Login-Seite angezeigt werden:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml run --rm app npm run db:seed
```
> Der Seed ist idempotent und **setzt auf den Demo-Stand zurück** (überschreibt Änderungen). Für eine echte Produktivnutzung nur **einmal** ausführen; für eine reine Demo-Instanz ggf. per Cron täglich neu seeden.

## 7. Fertig

Nach DNS-Propagation + TLS-Ausstellung (Caddy, ein paar Sekunden):

- **https://coworkee.de** → Landingpage
- **https://coworkee.de/login** → Anmeldung (Demo-Zugänge sichtbar)

---

## Betrieb

**Logs**
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f app
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f caddy   # TLS-Probleme hier sichtbar
```

**Update (neue Version deployen)**
```bash
cd /opt/coworkee && git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

**Backup**
```bash
# Datenbank
docker compose --env-file .env.prod -f docker-compose.prod.yml exec db \
  pg_dump -U coworkee coworkee > coworkee-$(date +%F).sql
# Dokumente liegen im Volume "storage" (docker volume inspect … für den Pfad)
```

**Stoppen**
```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml down       # Container weg, Daten bleiben (Volumes)
```

## Sicherheitshinweise für echte Produktion

- Die **Demo-Zugänge sind öffentlich** (auf der Login-Seite angezeigt). Für echten Produktivbetrieb: Demo-Nutzer löschen/Passwörter ändern und die Anzeige entfernen (`components/login-form.tsx`).
- `AUTH_SECRET` und `POSTGRES_PASSWORD` geheim halten, nie committen.
- Regelmäßige Backups (DB + `storage`-Volume) einrichten.
- `www.coworkee.de` leitet über denselben Caddy-Block; für einen Redirect www→apex bei Bedarf den Caddyfile anpassen.
