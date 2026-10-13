# Codebase map (deploy-config scope)

Scoped to hosting and deploy. Other areas are not mapped yet.

## Stack

Next.js 16.3.6 (App Router), React 19, Clerk 7 for auth, Drizzle ORM on Neon
Postgres, Tailwind and shadcn/ui. One full-stack app on Vercel (ADR-0001, ADR-0002).

## Auth

`proxy.ts` runs `clerkMiddleware()` only and protects nothing itself. Access is
enforced by `getOwnerId()` (`lib/auth`), called from the `(app)` layout and every
Server Action.

## Database

Tables are defined in `lib/db/schema.ts` and migrated with Drizzle Kit
(`lib/db/migrations/`). Migrations are applied by hand, never in the build, so a
deploy does not change the database. Local and Preview currently share one Neon database (as of ticket 02.01);
Production has its own and needs the migration run against it before the code
that reads the new table is released.

## Hosting and deploy

- Vercel project `google-keep-free`, linked via `.vercel/project.json`.
- No `vercel.json` or `vercel.ts`: all config lives in the Vercel dashboard.
- Production is served at https://gfk.lol. Merging to `main` deploys it.
- `google-keep-free.vercel.app` is a project domain set to redirect (307) to `gfk.lol`.
  This is a Vercel setting, not code (ticket 01.05).
- `www.gfk.lol` is a project domain that redirects (307) to `gfk.lol`. DNS is at Namecheap:
  `@` A `216.198.79.1`, `www` CNAME `c9f568147b62b453.vercel-dns-017.com.`, plus Clerk records.
- Env vars (Production and Preview): `DATABASE_URL`,
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. Validated by `lib/env.ts`.

## CI and release

`.github/workflows/`: `healthcheck.yml` (typecheck, lint, test and build on PRs and pushes to `main`),
`e2e.yml` (the whole Playwright suite on every preview deployment, the `@smoke` tests on
https://gfk.lol after every production deployment), `release.yml` (tag and
GitHub release on merge, at the version the PR wrote into `package.json`; the
`[PATCH]`/`[MINOR]`/`[MAJOR]` marker in the PR title decides that version),
`rollback.yml` (manual, back one version by default).

## Commands

`npm test` (vitest) · `npm run e2e` (Playwright) · `npm run typecheck` ·
`npm run lint` · `npm run format:check` · `npm run db:check-connection` ·
`npm run db:generate` · `npm run db:migrate`

## Documentation gaps

- No whole-system map yet.
- Clerk shows "Communication locked" on the production instance, so email codes
  do not work until Clerk support unlocks it.

## Open questions

None known for hosting.
