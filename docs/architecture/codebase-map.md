# Codebase map (deploy-config scope)

Scoped to hosting and deploy. Other areas are not mapped yet.

## Stack

Next.js 16.3.6 (App Router), React 19, Clerk 7 for auth, Drizzle ORM on Neon
Postgres, Tailwind and shadcn/ui. One full-stack app on Vercel (ADR-0001, ADR-0002).

## Auth

`proxy.ts` runs `clerkMiddleware()` only and protects nothing itself. Access is
enforced by `getOwnerId()` (`lib/auth`), called from the `(app)` layout and every
Server Action.

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

`.github/workflows/`: `healthcheck.yml` (checks on PRs and pushes to `main`), `release.yml` (version,
tag, GitHub release on merge; `[PATCH]`/`[MINOR]`/`[MAJOR]` in the PR title),
`rollback.yml` (manual, back one version by default).

## Commands

`npm test` (vitest) · `npm run e2e` (Playwright) · `npm run typecheck` ·
`npm run lint` · `npm run format:check` · `npm run db:check-connection`

## Documentation gaps

- No whole-system map yet.
- Clerk shows "Communication locked" on the production instance, so email codes
  do not work until Clerk support unlocks it.

## Open questions

None known for hosting.
