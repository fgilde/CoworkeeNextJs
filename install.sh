#!/bin/bash
# Coworkee one-command self-host installer.
#
#   curl -fsSL https://raw.githubusercontent.com/fgilde/CoworkeeNextJs/master/install.sh | bash
#
# Installs Docker (if missing), clones Coworkee to /opt/coworkee, generates
# secrets, and starts the stack. The database is left empty — first visit
# to the app shows the setup wizard to create the admin account.
set -euo pipefail

REPO_URL="https://github.com/fgilde/CoworkeeNextJs.git"
INSTALL_DIR="/opt/coworkee"

log() { echo "==> $*"; }
die() { echo "Error: $*" >&2; exit 1; }

# 1. Root + Linux check -------------------------------------------------
[ "$(id -u)" -eq 0 ] || die "please run as root (e.g. curl ... | sudo bash)."
[ "$(uname -s)" = "Linux" ] || die "this installer supports Linux only."

ensure_pkg() {
  command -v "$1" >/dev/null 2>&1 && return 0
  if command -v apt-get >/dev/null 2>&1; then
    log "Installing $2..."
    apt-get update -y && apt-get install -y "$2"
  else
    die "$1 not found and no apt-get available; install $2 manually."
  fi
}

ensure_pkg git git
ensure_pkg openssl openssl

# 2. Docker + compose plugin ---------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || die "docker compose plugin missing after install."

# 3. Get the code ---------------------------------------------------------
if [ -d "$INSTALL_DIR/.git" ]; then
  log "Existing install found at $INSTALL_DIR — pulling latest..."
  git -C "$INSTALL_DIR" pull
else
  log "Cloning Coworkee to $INSTALL_DIR..."
  git clone "$REPO_URL" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# 4. Ask for a domain (optional) ------------------------------------------
printf 'Domain (leer lassen für lokalen HTTP-Betrieb): '
read -r DOMAIN < /dev/tty || DOMAIN=""

# 5. Generate deploy/.env (kept on re-run so redeploys reuse secrets) -----
ENV_FILE="$INSTALL_DIR/deploy/.env"
mkdir -p "$INSTALL_DIR/deploy"

if [ -f "$ENV_FILE" ]; then
  log "$ENV_FILE already exists — keeping existing secrets."
else
  log "Generating $ENV_FILE..."
  POSTGRES_PASSWORD=$(openssl rand -hex 24)
  AUTH_SECRET=$(openssl rand -base64 32)
  DATABASE_URL="postgresql://coworkee:${POSTGRES_PASSWORD}@db:5432/coworkee?schema=public"

  {
    echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}"
    echo "AUTH_SECRET=${AUTH_SECRET}"
    echo "DATABASE_URL=${DATABASE_URL}"
    if [ -n "$DOMAIN" ]; then
      echo "DOMAIN=${DOMAIN}"
    else
      echo "HTTP_PORT=3000"
    fi
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

# 6. Pick the compose file for this run ------------------------------------
if [ -n "$DOMAIN" ]; then
  COMPOSE_FILE="deploy/docker-compose.selfhost.yml"
  if command -v ufw >/dev/null 2>&1; then
    log "Opening firewall ports 80/443 (ufw)..."
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
  fi
else
  COMPOSE_FILE="deploy/docker-compose.selfhost-http.yml"
fi

# 7. Start the stack (no seeding — fresh DB shows the setup wizard) -------
log "Starting Coworkee (first build can take a few minutes)..."
docker compose -p coworkee --env-file deploy/.env -f "$COMPOSE_FILE" up -d --build

# 8. Done -------------------------------------------------------------------
echo
if [ -n "$DOMAIN" ]; then
  log "Done. Once DNS for ${DOMAIN} points at this server: https://${DOMAIN}"
else
  SERVER_IP=$(curl -fsSL https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  PORT=$(grep '^HTTP_PORT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2)
  log "Done. http://${SERVER_IP}:${PORT:-3000}"
fi
echo "First visit shows the setup wizard to create the admin account (no demo data)."
