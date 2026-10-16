---
name: verify-google-keep-free
description: How to launch, drive and prove behavior in Google Keep Free, a Next.js notes web app (Clerk sign-in, Neon Postgres, Vercel). Use it when a change needs proof in the running app, locally, on a preview or on production.
---

# Verify Google Keep Free

The surface is a web UI: public pages (`/try-out`, `/about`, `/faq`, `/stuff`), Clerk screens (`/sign-in`, `/sign-up`), and the signed-in app shell at `/` that only an Owner reaches. The feature map is in `features/README.md`. The core flow is "sign in, see the empty Notes shell" (`features/app-shell.md`).

## Launch

A production build, on port 3000, the same way the E2E suite starts it.

```bash
mkdir -p .verification/<branch>
npm run build > .verification/<branch>/build.log 2>&1
(nohup npm run start > .verification/<branch>/server.log 2>&1 & echo $! > .verification/<branch>/server.pid)
lsof -ti tcp:3000 -sTCP:LISTEN > .verification/<branch>/listener.pid
```

Ready when `server.log` says `Ready in` and the doctor passes. Next reads `.env.local` itself. `npm run dev` also works for a quick look, but proof is on the production build.

**Port 3000 is the only port.** `playwright.config.ts` reuses any server already on it, so a stale one makes `npm run e2e` test old code. Port in use before you launch: find out whose it is, and stop it only if you started it.

## Doctor

Read-only. Is this instance worth driving?

```bash
curl -s -o /dev/null -w 'try-out %{http_code}\n' localhost:3000/try-out
curl -s -o /dev/null -w 'root %{http_code} -> %{redirect_url}\n' localhost:3000/
```

Healthy: `try-out 200` and `root 307 -> http://localhost:3000/sign-in`. A 500 means a missing variable: read `server.log` (the app's own `lib/env.ts` names it).

## Drive

`playwright-cli` for a walk, the Playwright suite for a repeatable check. Use roles, labels and route paths, never coordinates.

Sign in as the test Owner. The email is `E2E_CLERK_TEST_EMAIL` and contains `+clerk_test`, so Clerk's dev instance accepts the fixed code `424242`. Take the refs from each `snapshot`.

```bash
playwright-cli open http://localhost:3000/sign-in
playwright-cli snapshot                          # Clerk renders a moment after load: snapshot again if empty
playwright-cli fill <Email address ref> "<the test email>"
playwright-cli click <Continue ref>
playwright-cli snapshot                          # "Check your email", with a verification code box
playwright-cli fill <Enter verification code ref> 424242
playwright-cli snapshot                          # URL is now /, the app shell
```

Read the email from `.env.local` into a shell variable inside the command that uses it. Never print it into evidence. `playwright-cli` writes a `.playwright-cli/` folder in the project root (git-ignored): delete it at the end.

**Preview deployments are protected** (Vercel Authentication). Reach one with the bypass secret in `VERCEL_AUTOMATION_BYPASS_SECRET`, sent to the deployment's own origin only. The suite does this in `e2e/fixtures.ts`, so run a preview with `E2E_BASE_URL=<preview url> npm run e2e`. Without the secret, `vercel env run -- <command>` supplies a short-lived `VERCEL_OIDC_TOKEN`, sent as `x-vercel-trusted-oidc-idp-token` to the same origin only. Neither works: ask the user. Never put a secret in a URL, a log or evidence.

Previews run Clerk in development mode, so the `+clerk_test` sign-in works there. **Production runs a Clerk production instance, where it does not**, and production has no test account: on production, only drive signed-out pages.

Do not wait for `networkidle` on a preview: Clerk keeps connections open and the wait times out. Wait for `load` plus a visible element.

## Secrets

Names only, in `.env.local` (git-ignored), and every one is in `.env.example`:

| Name                                                    | For                                      |
| ------------------------------------------------------- | ---------------------------------------- |
| `E2E_CLERK_TEST_EMAIL`                                  | the `+clerk_test` Owner                  |
| `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | the app, and `@clerk/testing` signing in |
| `DATABASE_URL`                                          | the app (Neon)                           |
| `VERCEL_AUTOMATION_BYPASS_SECRET`                       | reaching a protected preview             |

`vercel env pull .env.local` rewrites the whole file: check afterward, by name, that the bypass secret is still there.

## E2E

`npm run e2e` builds, starts the app and runs the whole suite (Playwright, Chromium). The config loads `.env.local`, and a missing variable fails the run and names it. Signing in is `clerk.signIn` from `@clerk/testing`, wrapped in `signInAsOwner` (`e2e/sign-in.ts`). Tests tagged `@smoke` are signed out and read only: the `/try-out` tests and the `/` redirect.

CI: `.github/workflows/e2e.yml` runs the whole suite on every preview deployment (`E2E (preview)`) and the `@smoke` tests on https://gfk.lol after every production deployment (`E2E (production)`). Tracing stays off.

## Integration tests

A rule with no screen (ownership, limits, a Server Action's insert) is proven by `npm run test:integration`: `*.integration.test.ts` files that run against the real database in `.env.local`, which local and Preview share. Production has its own database and is never touched. `npm test` leaves them out and CI does not run them yet. They use random test Owners and remove only their own rows. A mutation check that breaks the code can leak a row for a fixed id, so use random ids and count the `notes` rows afterward (expect 0).

## Evidence

Into `.verification/<branch>/` (git-ignored): `playwright-cli screenshot --filename=.verification/<branch>/<name>.png`, the server log, and `playwright-cli console` output. Exercise the real user path, capture the action and the resulting state. The test Owner's Notes are shared and never cleaned up yet, so find a Note by its unique title and count cards instead of assuming an empty grid.

Performance: `npx -y lighthouse@latest <url> --only-categories=performance` (the chrome-devtools-axi Lighthouse has no performance category). Mobile lab LCP is about 3.6 s on every public page today, from Clerk's script in the root layout: not a regression of the change under test.

## Cleanup

Stop only what this run started, by the PIDs it wrote down:

```bash
playwright-cli close
kill $(cat .verification/<branch>/listener.pid) $(cat .verification/<branch>/server.pid)
rm -rf .playwright-cli
```

Evidence in `.verification/` survives cleanup.
