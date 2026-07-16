#!/bin/sh
# Apply committed DB migrations, then start whatever CMD was given.
set -e
echo "[coworkee] applying database migrations…"
npx prisma migrate deploy
echo "[coworkee] migrations done — starting app"
exec "$@"
