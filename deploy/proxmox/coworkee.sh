#!/usr/bin/env bash
# Coworkee — Proxmox VE installer (run on the PVE HOST shell).
#
#   bash -c "$(curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/deploy/proxmox/coworkee.sh)"
#
# Creates a Debian 12 LXC container, installs Docker inside it, and deploys
# Coworkee from the prebuilt GHCR image (pull-based — no local build, so it
# stays light on RAM). Secrets are generated; the database starts empty, so
# the first visit to the app shows the setup wizard to create the admin.
#
# TODO: submit to community-scripts.org (Proxmox VE Helper-Scripts). This
# script is intentionally self-contained and does NOT depend on their
# build.func framework, so it can also be run standalone.
set -euo pipefail

# --- Config (override via env, e.g. `CORES=4 RAM=4096 bash coworkee.sh`) -----
CTID="${CTID:-$(pvesh get /cluster/nextid)}"
HOSTNAME="${HOSTNAME:-coworkee}"
CORES="${CORES:-2}"
RAM="${RAM:-2048}"          # MB — build is skipped (pull image), so 2 GB is plenty
SWAP="${SWAP:-512}"         # MB
DISK="${DISK:-8}"           # GB
BRIDGE="${BRIDGE:-vmbr0}"
STORAGE="${STORAGE:-local-lvm}"      # rootfs storage
TEMPLATE_STORAGE="${TEMPLATE_STORAGE:-local}"  # where the LXC template lives
TEMPLATE="${TEMPLATE:-debian-12-standard}"
IMAGE="${IMAGE:-ghcr.io/fgilde/coworkeenextjs:latest}"

log()  { echo -e "\e[1;34m==>\e[0m $*"; }
die()  { echo -e "\e[1;31mError:\e[0m $*" >&2; exit 1; }

command -v pct >/dev/null 2>&1 || die "run this on the Proxmox VE host (pct not found)."
[ "$(id -u)" -eq 0 ] || die "run as root."

# --- 1. Ensure the Debian LXC template is present ----------------------------
log "Refreshing appliance list..."
pveam update >/dev/null 2>&1 || true

TEMPLATE_FILE="$(pveam available --section system 2>/dev/null | awk -v t="$TEMPLATE" '$2 ~ t {print $2}' | sort -V | tail -n1)"
[ -n "$TEMPLATE_FILE" ] || die "no '$TEMPLATE' template available via pveam."

if ! pveam list "$TEMPLATE_STORAGE" 2>/dev/null | grep -q "$TEMPLATE_FILE"; then
  log "Downloading template $TEMPLATE_FILE to $TEMPLATE_STORAGE..."
  pveam download "$TEMPLATE_STORAGE" "$TEMPLATE_FILE"
fi
TEMPLATE_REF="$TEMPLATE_STORAGE:vztmpl/$TEMPLATE_FILE"

# --- 2. Create the container -------------------------------------------------
# Unprivileged + nesting/keyctl so Docker runs inside the LXC.
log "Creating LXC $CTID ($HOSTNAME): ${CORES} vCPU, ${RAM} MB RAM, ${DISK} GB disk..."
pct create "$CTID" "$TEMPLATE_REF" \
  --hostname "$HOSTNAME" \
  --cores "$CORES" \
  --memory "$RAM" \
  --swap "$SWAP" \
  --rootfs "${STORAGE}:${DISK}" \
  --net0 "name=eth0,bridge=${BRIDGE},ip=dhcp" \
  --features "nesting=1,keyctl=1" \
  --unprivileged 1 \
  --onboot 1

log "Starting container..."
pct start "$CTID"

# Wait for network (DHCP lease).
log "Waiting for network..."
for _ in $(seq 1 30); do
  pct exec "$CTID" -- sh -c 'command -v ip >/dev/null && ip route get 1.1.1.1' >/dev/null 2>&1 && break
  sleep 2
done

# --- 3. Install Docker inside the container ----------------------------------
log "Installing Docker inside the container..."
pct exec "$CTID" -- sh -c 'apt-get update -y && apt-get install -y curl ca-certificates openssl'
pct exec "$CTID" -- sh -c 'command -v docker >/dev/null 2>&1 || curl -fsSL https://get.docker.com | sh'
pct exec "$CTID" -- sh -c 'docker compose version >/dev/null 2>&1' || die "docker compose plugin missing in container."

# --- 4. Generate secrets + compose deployment --------------------------------
POSTGRES_PASSWORD="$(openssl rand -hex 24)"
AUTH_SECRET="$(openssl rand -hex 32)"

log "Writing deployment to /opt/coworkee inside the container..."
pct exec "$CTID" -- sh -c 'mkdir -p /opt/coworkee'

# .env (kept private; secrets never touch the app image)
pct exec "$CTID" -- sh -c "cat > /opt/coworkee/.env <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
AUTH_SECRET=${AUTH_SECRET}
EOF
chmod 600 /opt/coworkee/.env"

# Pull-based compose: GHCR image + Postgres 16, app published on :3000 (LAN).
# No Caddy here — for a domain + HTTPS use deploy/docker-compose.ghcr.yml.
# DEMO=0 -> empty DB -> setup wizard on first visit.
pct exec "$CTID" -- sh -c "cat > /opt/coworkee/docker-compose.yml <<'EOF'
services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: coworkee
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
      POSTGRES_DB: coworkee
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: [\"CMD-SHELL\", \"pg_isready -U coworkee\"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: ${IMAGE}
    restart: unless-stopped
    environment:
      DATABASE_URL: \"postgresql://coworkee:\${POSTGRES_PASSWORD}@db:5432/coworkee?schema=public\"
      AUTH_SECRET: \${AUTH_SECRET}
      AUTH_TRUST_HOST: \"true\"
      NODE_ENV: production
      DEMO: \"0\"
    depends_on:
      db:
        condition: service_healthy
    ports:
      - \"3000:3000\"
    volumes:
      - storage:/app/storage

volumes:
  pgdata: {}
  storage: {}
EOF"

# --- 5. Pull + start ---------------------------------------------------------
log "Pulling image + starting Coworkee..."
pct exec "$CTID" -- sh -c 'cd /opt/coworkee && docker compose --env-file .env pull && docker compose --env-file .env up -d'

# --- 6. Done -----------------------------------------------------------------
IP="$(pct exec "$CTID" -- sh -c "hostname -I | awk '{print \$1}'" 2>/dev/null | tr -d '\r')"
echo
log "Done. Coworkee is starting in LXC $CTID."
log "URL:  http://${IP:-<container-ip>}:3000"
echo "First visit shows the setup wizard to create the admin account (no demo data)."
