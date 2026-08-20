# Installation & self-hosting

Coworkee ships as a Docker image (`ghcr.io/fgilde/coworkeenextjs:latest`) alongside a PostgreSQL 16 database. The app listens on port **3000** and stores uploads in `/app/storage`, which needs a **persistent volume**.

## DEMO vs. real install

This is the single most important setting to understand before you deploy.

| `DEMO` | First visit on an **empty** database | Marketing landing page | Demo logins on `/login` |
|---|---|---|---|
| `1` | Seeds demo data (sample employees, absences, etc.) | Shown at `/` | Shown, click-to-fill |
| unset / `0` | Opens the [**setup wizard**](./setup-wizard) — you create the admin + company | Not shown | Not shown |

- Seeding only ever happens on an **empty** database; it never overwrites existing data.
- `DEMO` is read **at runtime** — flip it and restart the container, no rebuild needed.
- For a production install for a real company, leave `DEMO` **unset** (or `0`).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string read by Prisma and the app. Example: `postgresql://coworkee:PASSWORD@db:5432/coworkee?schema=public` |
| `AUTH_SECRET` | yes (prod) | Signing key for Auth.js sessions. Generate with `openssl rand -base64 32`. |
| `DEMO` | no | `1` = demo instance (seed + marketing + demo logins). Unset/`0` = real install (setup wizard). |

::: warning URL-safe DB password
`POSTGRES_PASSWORD` is embedded inside `DATABASE_URL`, so it **must be URL-safe**. Use hex (`openssl rand -hex 24`) — avoid `/`, `+` and `=`, which break the connection string.
:::

The GHCR image is published by CI on every push to `master` (tag `latest`) and on `v*` tags (semver). The GHCR package must be **public** (GitHub → Packages → the package → Package settings → Change visibility → Public) so servers can pull anonymously; otherwise run `docker login ghcr.io` (with a PAT that has `read:packages`) first.

## 1. One command (any Linux with Docker)

```bash
curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/install.sh | sudo bash
```

The installer:

- installs Docker if it is missing,
- clones the repo to `/opt/coworkee`,
- generates the secrets (`POSTGRES_PASSWORD`, `AUTH_SECRET`),
- asks for an optional domain (leave blank for plain HTTP on port 3000), and
- starts the stack with an **empty** database → the setup wizard.

This is the recommended path for a fresh, real install.

## 2. Docker Compose — prebuilt GHCR image

Recommended for **low-RAM hosts (~1 GB)**: it **pulls** the prebuilt image instead of running `next build`, so it never runs out of memory. Run from the repo root:

```bash
# create deploy/.env with your secrets
cat > deploy/.env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 24)
AUTH_SECRET=$(openssl rand -hex 32)
DEMO=0            # 0 = fresh install (setup wizard); 1 = seed demo data
EOF

docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml pull
docker compose --env-file deploy/.env -f deploy/docker-compose.ghcr.yml up -d
```

This stack includes a **Caddy reverse proxy** with automatic HTTPS. Edit the root `Caddyfile` to your own domain first. For LAN or plain-HTTP use, run `deploy/docker-compose.selfhost-http.yml` instead, which publishes the app directly on port 3000 with no proxy.

::: tip Why the GHCR image?
`next build` is memory-hungry and OOM-kills on small VPS instances. The GHCR image is already built by CI, so the server only ever *pulls* — no build, no OOM. Prefer it on anything with less than ~2 GB RAM.
:::

## 3. Proxmox VE

Run on the **Proxmox host shell** (not inside a container):

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/deploy/proxmox/coworkee.sh)"
```

This creates a Debian 12 LXC (defaults: 2 vCPU, 2 GB RAM, 8 GB disk — the pull path avoids a local build), installs Docker inside it, deploys the GHCR image plus PostgreSQL with generated secrets and an empty database, then prints the container IP and URL (`http://<ip>:3000`).

Override the defaults via environment variables:

```bash
CORES=4 RAM=4096 STORAGE=local-lvm bash -c "$(curl -fsSL .../deploy/proxmox/coworkee.sh)"
```

## 4. Unraid

Coworkee needs a **separate PostgreSQL 16 container** (Unraid Community Applications is per-container). First start a Postgres 16 container (e.g. the `postgres` CA template) with a `coworkee` database and user, then add the Coworkee app:

1. Copy `deploy/unraid/coworkee.xml` to `/boot/config/plugins/dockerMan/templates-user/` on your Unraid server (or add its raw GitHub URL as a private CA template repo under **Apps → Settings**).
2. In the template set `DATABASE_URL` to your Postgres container, e.g. `postgresql://coworkee:PASSWORD@POSTGRES_HOST:5432/coworkee?schema=public`, set `AUTH_SECRET` (`openssl rand -base64 32`), map `/app/storage` to appdata, and leave `DEMO` empty for a fresh install.
3. Open the WebUI at `http://<unraid-ip>:3000`.

## 5. Umbrel

The app files live in `deploy/umbrel/` (`umbrel-app.yml` + `docker-compose.yml`, bundling the app plus PostgreSQL 16). To sideload during development, place the `deploy/umbrel/` folder as `coworkee` in your Community App Store repo and add that repo in the Umbrel App Store settings.

For an official listing, open a PR against [getumbrel/umbrel-apps](https://github.com/getumbrel/umbrel-apps) adding a `coworkee/` directory with these two files plus gallery images.

## Production notes

- **Persistent storage is mandatory.** Documents are stored under `storage/documents/` (mapped to `/app/storage`). Serverless platforms without a persistent disk are unsuitable unless you add object storage.
- **Set `AUTH_SECRET` and a strong DB password** in production. Remember the password must be URL-safe.
- After the container is up on an empty database with `DEMO` unset, your first browser visit lands on the [setup wizard](./setup-wizard).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Build gets OOM-killed | Don't build on the server — use the [GHCR image](#_2-docker-compose-prebuilt-ghcr-image). |
| `docker pull` denied / not found | The GHCR package must be **public**, or run `docker login ghcr.io` with a `read:packages` PAT. |
| Landed on the marketing page unexpectedly | `DEMO=1` is set. Unset it and restart for a real install. |
| Uploads vanish after redeploy | `/app/storage` isn't on a persistent volume. |
| HTTPS not working | Edit the root `Caddyfile` with your real domain and make sure ports 80/443 reach the host. |

See the full [FAQ & troubleshooting](./faq) page for more.
