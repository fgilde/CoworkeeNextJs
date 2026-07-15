# Task 1 Report — Project scaffold + Postgres + tooling

## Summary
Scaffolded a Next.js (App Router, TypeScript) app with Tailwind v4 + shadcn/ui,
added a Postgres docker-compose, installed Prisma/next-auth/next-intl/zod/bcryptjs,
and wired up Vitest. Build succeeds, `npm run test` exits 0.

## Scaffold gotcha (step 1)
`create-next-app .` also rejects the *directory basename* as the derived npm
package name when it's used with a path of `.` in a directory whose name has
capital letters (`Coworkee_NEXTJS`) — moving `docs`/`.superpowers` out of the
way was not sufficient by itself. Fix used:
1. Moved `docs` → `../docs_tmp`, `.superpowers` → `../superpowers_tmp`.
2. Ran `create-next-app` into a **sibling temp dir** with a valid lowercase
   name (`../coworkee-scaffold-tmp`) instead of `.`, using the exact flags
   from the task (`--ts --tailwind --app --src-dir=false --import-alias "@/*"
   --no-eslint --use-npm --yes`), plus `--disable-git` since the target has
   no `.git` of its own.
3. Fixed `"name"` in the generated `package.json` from `coworkee-scaffold-tmp`
   to `coworkee`.
4. Moved every generated file/folder into the repo root, removed the now-empty
   temp dir.
5. Moved `docs` and `.superpowers` back into place.
6. Verified with `git status`/`git diff --stat` that all previously tracked
   files (under `docs/`, plus repo history) are byte-identical to before —
   confirmed clean, no diff.

## Versions installed
- next: 16.2.10 (Turbopack)
- react / react-dom: 19.2.4
- typescript: ^5, tailwindcss: ^4, @tailwindcss/postcss: ^4
- next-auth: ^5.0.0-beta.31, @auth/prisma-adapter: ^2.11.2, @prisma/client: ^7.8.0
- next-intl: ^4.13.2, zod: ^4.4.3, bcryptjs: ^3.0.3
- dev: prisma ^7.8.0, vitest ^4.1.10, @types/bcryptjs ^2.4.6, tsx ^4.23.1
- shadcn init pulled in: @base-ui/react, class-variance-authority, clsx,
  lucide-react, shadcn CLI, tailwind-merge, tw-animate-css
- shadcn `components.json`: style `base-nova` (current shadcn default),
  baseColor `neutral` (as requested), rsc true, no CSS prefix.

**Concern:** `npx create-next-app@latest` (per the task's literal command)
resolved to Next.js **16.2.10**, not the "Next.js 15" mentioned in the task
title/goal. Followed the literal command as instructed rather than pinning a
version; flagging the mismatch for visibility. If Next 15 is a hard
requirement, re-run with `create-next-app@15` and reinstall.

## Files created
- `docker-compose.yml` — postgres:16, user/pass/db `coworkee`, port 5432,
  named volume `coworkee_pg`.
- `.env` — DATABASE_URL + AUTH_SECRET (dev values, git-ignored).
- `.env.example` — same keys, placeholder values (NOT git-ignored: added
  `!.env.example` after the blanket `.env*` ignore rule in `.gitignore`).
- `vitest.config.ts` — node environment, `include: ["**/*.test.ts"]`, plus
  `passWithNoTests: true` (added beyond the literal snippet in the task —
  needed so `npm run test` exits 0 with zero test files, which the task's
  own acceptance criterion requires; default Vitest 4 exits 1 otherwise).
- `package.json` — added `"test": "vitest run"` script.
- `app/page.tsx` — replaced the default create-next-app marketing page with
  a one-line placeholder (`<main className="p-8">Coworkee</main>`).
- Standard create-next-app/shadcn output: `app/layout.tsx`, `app/globals.css`,
  `app/favicon.ico`, `components/ui/button.tsx`, `lib/utils.ts`,
  `components.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`,
  `public/*.svg`, `AGENTS.md`, `CLAUDE.md` (project-level, just `@AGENTS.md`),
  `README.md`, `.gitignore`.

Not modified/committed: `.superpowers/` was restored exactly as it was
(confirmed via git diff) and was never git-tracked before this task, so it
was left out of this commit (it holds this report + the sdd progress ledger,
not app scaffolding) — added to the working tree only.

## Verification

### docker-compose
Port 5432 on this dev machine is already bound by an unrelated, pre-existing
container (`havewa-db`, postgres:16-alpine, from a different project) — not
something this task should touch or stop. `docker-compose up -d` therefore
fails to bind with the exact port from the spec:
```
Error response from daemon: failed to set up container networking: driver failed
programming external connectivity on endpoint coworkee_nextjs-db-1 (...):
Bind for 0.0.0.0:5432 failed: port is already allocated
```
`docker-compose.yml` was left exactly as specified (port 5432:5432) since
that's an environment conflict, not a config defect. Verified equivalently:
- `docker-compose config` — compose file parses correctly, image/env/volume
  all resolve as expected.
- `docker run --rm -d -e POSTGRES_USER=coworkee -e POSTGRES_PASSWORD=coworkee
  -e POSTGRES_DB=coworkee -p 5434:5432 postgres:16` — booted cleanly, logged
  "database system is ready to accept connections", `pg_isready -U coworkee`
  returned "accepting connections". Container then stopped/removed.

On a machine where port 5432 is free, `docker-compose up -d` will bind
correctly with this file.

### npm run build (tail)
```
▲ Next.js 16.2.10 (Turbopack)
- Environments: .env

  Creating an optimized production build ...
✓ Compiled successfully in 3.0s
  Running TypeScript ...
  Finished TypeScript in 5.1s ...
  Collecting page data using 5 workers ...
  Generating static pages using 5 workers (0/4) ...
✓ Generating static pages using 5 workers (4/4) in 419ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found

○  (Static)  prerendered as static content
```

### npm run test
```
 RUN  v4.1.10 C:/dev/privat/github/Coworkee_NEXTJS
No test files found, exiting with code 0
```
Exit code confirmed 0.

## Commit
`git add -A -- . ':!.superpowers'` (excluded the untracked `.superpowers/`
working dir, which was never part of git history and holds this report /
progress ledger, not app code) then committed as:
`chore: scaffold Next.js + Postgres + tooling`

Commit hash: `d118788`
