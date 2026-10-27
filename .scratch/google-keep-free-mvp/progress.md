# Progress: 02 Create and persist a Note (umbrella, split into 02.01, 02.02.01-03, 02.03.01-02), all shipped

**Recipe:** ticket ([DELIVER]) x3 · **Mode:** guided · **Teach level:** deep

tickets  ✅ 02.01 ─ ✅ 02.02.01 ─ ✅ 02.02.02 ─ ✅ 02.02.03 ─ ✅ 02.03.01 ─ ✅ 02.03.02   6 of 6 shipped

02.03 was split into 02.03.01 (grid) and 02.03.02 (composer) on 2026-10-14. Planning phases
(discover, grill, architect, design, spec, tickets) were already done, so `/ns-flow-feature`
went straight to the ticket loop.

## 02.04 Switch the package to ES modules · Standard · branch feat/02.04-package-type-module

**Mode:** step (`/forge-route`, then `/forge-flow-ticket`)

- [x] scope-check (all OK; five risks listed, each settled by a run)
- [x] branch, build (`"type": "module"` in `package.json`; no other file needed to change)
- [x] verify (local) baseline on `main` unit 54 and integration 14; after: same counts, E2E 26 of 26 none skipped, typecheck, lint, format clean, `db:generate` no changes, no build warning, `dev` redirect ok
- [x] review (skipped; LOW risk, one-line diff, self-reviewed)
- [x] pr (#71, v0.2.41, CI green including `E2E (preview)` 26 of 26)
- [x] release (merged `2419e8d`, v0.2.41)
- [x] verify (production) Healthcheck, Release and Production E2E (19 smoke) passed; `gfk.lol/` 307 to `/sign-in`, which answers 200
- [x] close (CLOSED)

## 02.03.06 /forge-test rendering demo page · Standard · branch feat/02.03.06-forge-test-rendering-demo-page

**Mode:** step (`/forge-route`, then `/forge-feature`) · ledger run `forge-test-rendering-demo-page-02-03-06`

- [x] inspect, plan (decisions settled with Next 16 docs and an API probe: DummyJSON, Cache Components off, `no-store` for request-time cards, lazy via a client wrapper)
- [x] build (3 slices: server cards, client cards, streamed card)
- [x] verify (local) unit 54 of 54, Playwright 26 of 26, axe 0 violations, 6 red checks seen
- [x] review (independent cold pass: request-changes with 3 important, all fixed; approved)
- [x] pr (#69, v0.2.39, CI green, `E2E (preview)` 26 of 26 none skipped)
- [x] release (merged `059a1c6`, v0.2.39)
- [x] verify (production) Production E2E passed; `gfk.lol/forge-test` 200, `no-store`, `noindex`, server cards `ready`
- [x] close (CLOSED; the page is a demo, unlinked)

## 02.03.05 Composer save-failure test · Quick · branch feat/02.03.05-composer-save-failure-test

**Mode:** step (`/forge-route`, then `/forge-ticket`)

- [x] scope-check (seam: a browser test that aborts the `createNote` request; no new dependency)
- [x] implement (`e2e/composer.spec.ts`; the new test was seen red with the catch path changed to `reset()`)
- [x] verify (local) composer E2E 5 of 5, full suite 14 of 14, unit 43 of 43, lint, typecheck, format clean
- [x] pr (#67, v0.2.37, CI green including `E2E (preview)`)
- [x] release (merged `84eb23b`, v0.2.37)
- [x] verify (production) Healthcheck, Release and Production E2E passed; no product code changed
- [x] close (CLOSED)

## 02.03.04 Composer title: Enter moves focus · Quick · branch feat/02.03.04-composer-title-enter-focus

**Mode:** step (`/ns-route`)

- [x] split-ticket (skipped, Quick)
- [x] branch (from main @ ef40eba)
- [x] scope-check (all OK, no trim, no design choice)
- [x] implement (`Composer.tsx`, `e2e/composer.spec.ts`; the new test was seen failing first)
- [x] verify (local) manual, 92 / 100 SAFE TO RELEASE (first scored 95, corrected: undo 2 of 5)
- [x] understand
- [x] review (main session, one pass: Approve with nits, both fixed)
- [x] quality-check (everything available: 14 pass, 1 not applicable)
- [x] save (2 commits, then the `chore(release)` bump)
- [x] pr (#65, preview 93 / 100, CI 7 of 7, E2E on the preview 13 of 13)
- [x] release (merged `e725ee9`, v0.2.35)
- [x] verify (production) PARTIAL: smoke E2E 7 of 7, signed-out pages clean, signed-in criteria not run (no test account, same accepted gap as 02.03.01 and 02.03.02)
- [x] observe (healthy, low tier: 0 errors and 0 5xx in 50 requests, one Server Action call, 200)
- [x] shipped
- [x] close (CLOSED; the three findings made along the way were not ticketed, by choice; 02.04 filed)

## 02.03.02 Composer · Standard · branch feat/02.03.02-composer

**Mode:** autopilot (watched verify)

- [x] split-ticket (skipped, small)
- [x] branch (from main @ 9a13f7e)
- [x] scope-check
- [x] implement (`Composer.tsx`, `page.tsx`, `e2e/composer.spec.ts`, shared `e2e/sign-in.ts`; 43 unit tests)
- [x] verify (local) watched, VERIFIED; E2E 12 of 12; Lighthouse, tablet and automated accessibility scan not run
- [x] understand
- [x] review (one subagent: request changes (light), 0 blocking, 4 should-fix and 4 nits fixed, B5 accepted)
- [x] quality-check (13 pass, 1 skipped (no migrations), 1 inferred (performance); docs updated)
- [x] save
- [x] pr (#57, preview SMOKE PASS, CI green on `2f1ed20`, E2E on the preview 12 of 12)
- [x] release (merged `98b21e6`, v0.2.28)
- [x] verify (production) PARTIAL: smoke E2E 7 of 7, signed-out pages clean, signed-in criteria not run (no test account, same accepted gap as 02.03.01)
- [x] observe (healthy, medium tier: 0 errors and 0 5xx in about 50 requests, 6 Server Action calls from the owner all 200)
- [x] shipped
- [x] close (CLOSED, PR #58; follow-ups 02.03.04 and 02.03.05)

Done since: 01.05.08 (Production database health check, PR #55, v0.2.26, closed in #56) shipped
as a `prebuild` check. #59 (Next.js bump to 16.4.2 for the Server Action denial of service,
app 0.2.30) merged outside a ticket; ticket 19 was closed against it on 2026-10-19.

02.03.03 (Notes view page heading, PR #62, v0.2.33), 02.03.04 (Composer title: Enter moves
focus, PR #65, v0.2.35, run through `/ns-route` in step mode) and 02.03.05 (Composer
save-failure test, PR #67, v0.2.37) are closed. 02.03.06 (`/forge-test` rendering demo page,
PR #69, v0.2.39, run through `/forge-route` in step mode) is closed too. 02.04
(`"type": "module"`, PR #71, v0.2.41, run through `/forge-flow-ticket` in step mode) is closed.

01.05.10 (why Neon rejected the Production credential) was closed on 2026-10-26 without the
investigation, by the owner's decision: the cause stays unknown and no rotation note exists.

01.05.09 (Rollback instant path returns 404) was closed on 2026-10-26 without the fix, by the
owner's decision: the instant path is presumed still broken and the rebuild fallback is the undo.

Ticket 20 (composer: a repeated Escape may insert the note twice) was filed on 2026-10-26 from
draft PR #64, which was closed unmerged. It is not reproduced and is deferred until after the MVP.

**Next:** 03 Edit a note with autosave (unblocked). No open follow-ups from 01.05.

## 02.03.01 Notes grid · Standard · branch feat/02.03.01-notes-grid

**Mode:** step

- [x] split-ticket (02.03 split in two, user's choice)
- [x] branch
- [x] scope-check (design A, mapper in `lib/notes/card.ts`; `color` and `pinned` kept; Production read carried as a release check)
- [x] implement (TDD inline, 6 kept unit tests, shell E2E now accepts grid or empty state)
- [x] verify (local) watched, VERIFIED; Lighthouse and mobile not run
- [x] understand
- [x] review (main session, approve with nits; N1 and N2 fixed, N3 left)
- [x] quality-check (15 stages: 14 pass, 1 n/a; docs updated)
- [x] save (2 commits: the code and tests, then the docs and ticket records)
- [x] pr (#53, v0.2.24; the first push failed CI `build`, fixed in `94f4d03`; preview 96, CI 7 of 7, E2E 9 of 9)
- [x] release (merged `e154e97` at 01:22 EDT)
- [x] verify (production) PARTIAL: smoke E2E 7 of 7, signed-out pages clean, the signed-in grid not run (no test account)
- [x] incident: the Production `DATABASE_URL` was rejected by Neon, so signed-in `/` failed for about 12 minutes; rolled back to v0.2.23 at 01:35, credential replaced, `e154e97` redeployed at 01:44 (`docs/incidents/0001-production-database-credential-rejected.md`)
- [x] observe (healthy, medium tier: 0 errors and 0 5xx in 34 requests since 01:44)
- [x] shipped
- [x] close (CLOSED; Production criteria gap accepted; follow-ups 01.05.08, 01.05.09, 01.05.10, 02.03.03; next is 02.03.02)

## 02.01 Notes table and migration · Standard · branch feat/02.01-notes-table-and-migration

- [x] branch
- [x] scope-check 
- [x] implement
- [x] verify (local) 97, VERIFIED
- [x] understand
- [x] review (approve with nits, fixed)
- [x] quality-check (14/14 passed)
- [x] save
- [x] pr (#41)
- [x] release (merged, v0.2.12; Production migration deferred to before 02.02)
- [x] verify (production)
- [x] observe (healthy)
- [x] shipped
- [x] close

02.02 was split into 02.02.01 (Quick), 02.02.02 and 02.02.03 (Standard) on 2026-10-13.

## 02.02.01 Note validation and ActionResult · Quick · branch feat/02.02.01-note-validation-and-action-result

- [x] branch
- [x] scope-check
- [x] implement
- [x] verify (local) 28 tests, mutation-checked, VERIFIED
- [x] understand
- [x] review (approve with one note, fixed: NUL character)
- [x] quality-check (14 stages, 11 run, 3 skipped, passed)
- [x] save
- [x] pr (#44, v0.2.15)
- [x] release (merged b18c00f, v0.2.15)
- [x] verify (production) smoke pass
- [x] observe (healthy)
- [x] shipped
- [x] close

Each remaining ticket follows the same checklist on its own branch.

## 02.02.02 createNote action and integration harness · Standard · branch feat/02.02.02-create-note-action-and-integration-harness

**Mode:** step · **Teach level:** deep

- [x] branch
- [x] scope-check (keep as one; separate env-driven integration config; flows.md fixed in this PR)
- [x] implement (TDD, six slices, inline)
- [x] verify (local) 96, VERIFIED, 7 of 7 mutation checks caught
- [x] understand
- [x] review (approve with nits, both should-fix fixed)
- [x] quality-check (15 stages: 12 pass, 3 not applicable)
- [x] save
- [x] pr (#46, v0.2.17)
- [x] release (merged a8843d8, v0.2.17)
- [x] verify (production) smoke pass
- [x] observe (healthy)
- [x] shipped
- [x] close

## 02.02.03 getActiveNotes and owner-scoped queries · Standard · branch feat/02.02.03-active-notes-query

**Mode:** step · **Teach level:** deep

- [x] branch
- [x] scope-check (nothing trimmed; EXPLAIN check and abuse cases carried forward)
- [x] implement (TDD inline, 5 kept tests, EXPLAIN recorded in the ticket)
- [x] verify (local) 100, VERIFIED, 7 of 7 mutation checks caught (before the review fixes; M5 and M6 re-run after)
- [x] understand
- [x] review (full: 3 reviewers + security-review; request changes, 2 should-fix and 4 nits fixed, 3 follow-ups recorded)
- [x] quality-check (15 stages, all run, all pass or n/a; docs updated; `next` audit advisory found outside the ticket)
- [x] save (2 commits: the code and tests, then the docs and ticket records)
- [x] pr (#51, v0.2.22, preview smoke pass, E2E 9 of 9, 5 of 5 required checks green)
- [x] release (merged 157ce18, v0.2.22)
- [x] verify (production) smoke pass, E2E 7 of 7
- [x] observe (healthy, low tier: 0 errors and 0 5xx in 24 requests, console clean on the public pages)
- [x] shipped
- [x] close (CLOSED; `server-only` guard accepted as a risk; next is 02.03)

## 02.03.03 Notes view page heading (delegated) · branch feat/02.03.03-notes-view-heading

**Mode:** hand to an agent (`/ns-flow-delegate`) · started 2026-10-19

- agent `t020303` · Herdr workspace `w4` · pane `w4:p1` · worktree `../google-keep-free-wt/02.03.03` · branch `feat/02.03.03-notes-view-heading` · base `main` @ `449bbb3`
- settled by the user: visible `h1` "Notes", `.env.local` copied, HTTPS push
- [x] implement, verify (local), review, quality-check (by the agent: lint, types, format, 43 unit, E2E 12 of 12, axe 0)
- [x] pr (#62; Cursor review nit fixed in `f77e095`; CI green)
- [x] verify (preview) PARTIAL, 96 / 100, 3 of 3 criteria, Lighthouse not run
- [x] release (merged `cbe4b00`, v0.2.33)
- [x] verify (production) PARTIAL: smoke E2E 7 of 7; the signed-in criteria not run (no test account)
- [x] observe (healthy, low tier: 0 errors, 0 5xx; the changed page had no traffic yet)
- [x] shipped (Shipped comment on #62)
- [x] close (CLOSED; follow-ups 02.03.04 and 02.03.05 stay open; next is 03)

