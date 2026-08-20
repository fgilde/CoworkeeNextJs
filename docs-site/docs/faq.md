# FAQ & troubleshooting

## Installation

### The build gets killed / runs out of memory

`next build` is memory-hungry and OOM-kills on small VPS instances (~1 GB). Don't build on the server — use the **prebuilt GHCR image**, which only *pulls* a ready-made image. See [Docker Compose — prebuilt GHCR image](./installation#_2-docker-compose-prebuilt-ghcr-image).

### `docker pull` says denied or not found

The GHCR package must be **public** so servers can pull anonymously: GitHub → Packages → the package → Package settings → Change visibility → Public. If it must stay private, run `docker login ghcr.io` first with a PAT that has `read:packages`.

### I get the marketing landing page instead of the setup wizard

`DEMO=1` is set. That turns the instance into a demo (seeded data, marketing page, demo logins). For a real install, **unset `DEMO`** (or set `0`) and restart the container. On an empty database you'll then get the [setup wizard](./setup-wizard). See [DEMO vs. real install](./installation#demo-vs-real-install).

### I get the setup wizard but expected demo data

The database is empty and `DEMO` is not `1`. Set `DEMO=1` and restart against an empty database to seed demo data. Seeding never overwrites existing rows.

### Uploaded documents disappear after a redeploy

`/app/storage` isn't on a persistent volume. Documents live under `storage/documents/`; map that path to a persistent volume. Serverless platforms without a persistent disk need object storage instead.

### The database won't connect

Check `DATABASE_URL`. A common cause is a password with `/`, `+` or `=` in it — the password is embedded in the URL and **must be URL-safe**. Regenerate with `openssl rand -hex 24`.

## TLS, domains and reverse proxy

### How do I get HTTPS?

The GHCR compose stack includes a **Caddy** reverse proxy with automatic HTTPS. Edit the root `Caddyfile` with your real domain, and make sure ports 80 and 443 reach the host so Caddy can obtain certificates. For LAN or plain-HTTP use, run `deploy/docker-compose.selfhost-http.yml`, which publishes the app directly on port 3000 without a proxy.

### Can I run it behind my own reverse proxy?

Yes — use the plain-HTTP compose file and point your existing proxy (nginx, Traefik, etc.) at the app on port 3000.

## Email

### Password-reset emails don't arrive

If mail is on the **LOG** fallback (no transport configured), the reset link is written to the application log instead of being emailed. Configure a real transport (SMTP / SendGrid / sendmail) under [Mail / SMTP](./configuration#mail-smtp) and use the **Send test email** button to verify.

## Usage

### How do I change the language?

Per user, from the [Account page](./account#language) or the language switch. It's stored per user and doesn't affect anyone else.

### How do I let an AI assistant use Coworkee?

Create an [API token](./account#api-tokens) under a user whose role has the access you want, then point your MCP client at `/api/mcp` with that token. See [API & MCP](./api-mcp).

### Who can approve absence / edit employees / see analytics?

That depends on the role. See the [permission matrix](./configuration#permission-matrix).

## Still stuck?

Open an issue on the [GitHub repository](https://github.com/fgilde/CoworkeeNextJs).
