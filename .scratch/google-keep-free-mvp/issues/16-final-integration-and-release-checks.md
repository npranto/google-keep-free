# 16: Final integration and release checks

**Status:** ready-for-agent
**Classification:** FINAL-INTEGRATION
**Blocked by:** 02–15 (every prior ticket)

## What to build

The full core user journey passes as one Playwright E2E run against the
deployed/running app; ownership-scoping and version-conflict integration tests
are consolidated and green in CI; the app is ready to call MVP-done.

## Scope

Playwright E2E covering the complete journey (sign in → create → edit/autosave →
pin → archive → trash → restore → search) in one suite, consolidating the
integration-test coverage already added incrementally in 02–13 (ownership
scoping across all mutations, `updateNote` conflict disambiguation, transition
guards) into one CI-green run, README/deploy checklist, verifying all 15
acceptance criteria from the spec end-to-end.

## Out of scope

Any new product behavior — this ticket should find zero missing features if
01–15 were implemented to spec; if it does find a gap, that's a signal a spec
section was missed, not new scope to invent.

## Acceptance criteria

- [ ] All 15 acceptance criteria in the spec's "Acceptance criteria" section are
      demonstrably true.
- [ ] Playwright E2E core-journey suite is green in CI.
- [ ] Integration tests for ownership scoping (two Owners, cross-access
      impossible) and version-conflict atomicity are green in CI.
- [ ] Migrations are applied (not auto-run in the Vercel build), `.env.example`
      is current, deploy checklist documented.

## Relevant spec sections

Testing requirements; all 15 acceptance criteria; Deployment (system.md).

## Architecture/design constraints

No auto-run migrations in the build pipeline (re-confirm this hasn't
regressed).

## Testing expectations

This ticket is the test suite's final integration point.

## Demo instructions

Run the full Playwright suite and CI pipeline green, then walk through the
spec's 15 acceptance criteria live against the deployed preview.

## Likely files/areas

`e2e/` (Playwright), CI workflow, `README.md`/deploy docs.

## Risks / conflict hotspots

None structurally (nothing else depends on it), but it's the ticket most likely
to surface anything earlier tickets under-scoped — expect small fix-up churn
here, not new features.
