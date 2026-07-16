# syntax=docker/dockerfile:1
# Coworkee production image — Next.js 16 + Prisma 7 (pg adapter)
FROM node:24-bookworm-slim AS base
# openssl: required by Prisma migration engine
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- deps: full install (incl. dev deps — prisma CLI + tsx needed at deploy) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build: generate Prisma client + build Next ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# --- runner ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/lib ./lib
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/i18n ./i18n
COPY --from=build /app/messages ./messages
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/storage/documents
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
