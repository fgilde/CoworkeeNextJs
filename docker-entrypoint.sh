#!/bin/sh
# Apply committed DB migrations, then start whatever CMD was given.
set -e
echo "[coworkee] applying database migrations…"
npx prisma migrate deploy

if [ "$DEMO" = "1" ]; then
  echo "[coworkee] DEMO=1 -> seeding demo data if DB is empty…"
  npm run db:seed-if-empty || echo "[coworkee] seed skipped/failed (non-fatal)"
fi

echo "[coworkee] migrations done — starting app"
exec "$@"
