# 0001: Production database credential rejected after the Notes grid release

**Date:** 2026-10-15 · **Severity:** medium (signed-in home page down, no data lost) · **Release:** v0.2.24, PR #53 · **Status:** resolved, follow-ups open

Times are US Eastern (EDT). Sources: GitHub run and merge timestamps, Vercel deployment records and runtime logs. A time marked "not recorded" was not captured when it happened.

## Summary

The release that added the Notes grid (02.03.01) made the signed-in home page read the `notes` table. Neon rejected the Production `DATABASE_URL` with `password authentication failed for user 'neondb_owner'`, so every signed-in request to `/` failed with an error page. It was live for about 12 minutes before a rollback to v0.2.23 restored service. After the owner replaced the variable in Vercel, the same version was rebuilt and has served without errors since 01:44.

## Impact

- **User-facing:** a signed-in visit to `https://gfk.lol/` showed "This page couldn't load" (HTTP 500 and an error-level 200 on the streamed response).
- **Duration:** the failing deployment was live from 01:23:13 until the rollback deployment went ready at 01:35:12, about 12 minutes.
- **Scope:** 5 failed requests in the retained logs, from 2 signed-in accounts. Signed-out pages (`/sign-in`, `/sign-up`, `/try-out`) were never affected.
- **Data:** none lost. No write path exists in the UI yet.

## Timeline

| Time | Event |
|---|---|
| 01:22:45 | PR #53 squash-merged as `e154e97`. CI had been green on the PR head. |
| 01:23:13 | Production deployment `7084605745` created from `e154e97`. |
| 01:24:17 | Production smoke E2E passes 7 of 7. It is signed out, so it does not read the database. |
| 01:26:25 | First failed signed-in `GET /` in the retained logs (earliest of the 5 lines kept). Further failures at 01:26:33, 01:26:46, 01:28:07 (twice). Last failure 01:28:07. |
| About 01:28 to 01:31 | Detection: the owner loaded `https://gfk.lol` signed in, as asked at the release hand-off, and reported the error page. The report time was not recorded. |
| After detection | Logs read with `vercel logs --level error`. Cause visible in one read: `NeonDbError: password authentication failed for user 'neondb_owner'`. Mitigation decision put to the owner with three options. |
| 01:34:15 | Rollback workflow started with an empty version, on the owner's go-ahead. |
| 01:34:43 | Its instant-rollback step failed with `User not found. (404)`. The workflow fell through to its rebuild-from-tag path. |
| 01:35:12 | Rollback deployment `dpl_7uB4L3DGYHKRzfJTuxZ2LkWWaC7A` (`c3c7422`, v0.2.23) created and promoted. Signed-in service restored. |
| 01:38 | Logs show no errors on the rollback deployment. |
| Between 01:38 and 01:44, not recorded | Owner updated the Production `DATABASE_URL` in Vercel. |
| 01:44:28 | Owner redeployed `e154e97` as `dpl_GS93Tto11qRBCiHWXwoZPkmhcrCS` and promoted it. Smoke E2E passes at 01:44:50. |
| About 01:48 | Owner confirmed the signed-in empty state loads. Log scan: 0 errors in 34 requests. Verdict HEALTHY. |

## Root cause

The mechanism: the Production `DATABASE_URL` stored in Vercel (created about 6 days earlier) holds a credential that Neon rejects. A Vercel deployment keeps the variables it was created with, so the credential could only be fixed by changing the variable and creating a new deployment.

**Why the credential is rejected is not known.** It was not investigated, and the value is a sensitive variable that cannot be read back. Candidates: a Neon password reset after the variable was set, or a stale or mistyped value from the setup. The owner applied the Production migration on 2026-10-13 from a terminal with their own connection string, which does not exercise the Vercel variable.

**The missing safeguard** is what let it reach users: nothing in the pipeline ever uses the Production database credential before or after a deploy.
- No page read the database until this release.
- The production smoke tests are signed out and never touch the database.
- Production has no signed-in test account, because Clerk's production instance does not accept the test sign-in.
- Preview and local runs use a different database URL that works, so every earlier check passed.

## Contributing factors

- The risk was identified in advance (scope-check "Production read of `notes` is unproven", and again on the release card), but the only planned check was a human load of the page after a merge that deploys to all users at once.
- No feature flag (the profile says `Flags: none`) and Production auto-promotes on merge, so there was no state where the code was deployed but not yet serving users.
- A Vercel sensitive variable cannot be pulled (`vercel env pull` writes it empty), so the credential could not be tested from the agent's side.
- The CI `build` check also failed on the PR for a related reason (the build had no env at all). It was fixed first, and attention then moved to CI being green.
- The Rollback workflow's instant path returned 404, so the rollback took the slower rebuild path. It still finished in about one minute.

## What went well

- The risk was named before the merge, so the owner loaded the signed-in page immediately.
- One log query showed the exact cause. No guessing was needed.
- The mitigate-first decision was put to the owner with options and a rollback recommended. The rollback was confirmed and verified within a minute.
- The change was a read, so no data could be lost or corrupted.
- A rollback target existed and the workflow's fallback path worked.

## Action items

| # | Action | Owner | Ticket |
|---|---|---|---|
| 1 | Replace the Production `DATABASE_URL` and redeploy | @npranto | done 2026-10-15 01:44 |
| 2 | Find out why Neon rejected the old credential, and note how to rotate it safely | @npranto | `01.05.10-production-database-credential-cause.md` |
| 3 | Add a database check that works on Production without a test account, and run it in the production smoke tests | agent, owner reviews | `01.05.08-production-database-health-check.md` |
| 4 | Fix the Rollback workflow's instant path (`User not found`, 404) | agent, owner reviews | `01.05.09-rollback-instant-path-404.md` |

## Related

- Fix: replacing the Production `DATABASE_URL` and a redeploy of `e154e97` (no code change)
- PR: https://github.com/npranto/google-keep-free/pull/53 (Shipped comment, verification comments)
- Rollback run: https://github.com/npranto/google-keep-free/actions/runs/38687492324
- Deployments: failing `7084605745`, rollback `dpl_7uB4L3DGYHKRzfJTuxZ2LkWWaC7A`, fixed `dpl_GS93Tto11qRBCiHWXwoZPkmhcrCS`
- Ticket: `✅02.03.01-notes-grid.md`
