# 20: Composer: a repeated Escape while a save settles may insert the note twice

**Status:** open (post-MVP: picked up only after tickets 03 to 18 are done)
**Lane:** Quick (reproduce first; if it is real, the fix is a few lines in `Composer.tsx`)
**Relates to:** ✅02.03.02-composer.md (the composer), ✅02.03.05-composer-save-failure-test.md (the request-interception pattern to reuse)
**Blocked by:** None (deferred to after the MVP by the owner's choice, not by a technical dependency)
**Unblocks:** None

## Purpose

Holding Escape while the composer saves a note might insert the same note twice. Nothing is lost and no other user is affected, but the grid would show a duplicate, and delete does not exist until ticket 08, so the user could not remove it.

Numbered 20, a top-level ticket after the planned MVP set (01 to 19), because the owner will only touch it after the MVP. Filed from draft PR #64 (an automated Cursor run, 2026-10-20, branch `cursor/critical-bug-inspection-48c6`, head `8f7bf84`), which was closed without merging. **The bug is not reproduced.** The claim comes from reading the code and from that PR's own test, which fakes the timing with a hand-built thenable and a manual microtask. No browser reproduction has been attempted.

## What the code suggests

In `components/notes/Composer.tsx`, `close()` sets `inFlight.current = true`, then runs `createNote` inside `startTransition`. When the call settles, the success path schedules `reset()` in a second, inner `startTransition`, and the `finally` block clears `inFlight.current` straight away. The reset commits a little later, so for a short window the composer is still open with the draft in it and the guard is down. An Escape key repeat landing in that window calls `close(true)` again and starts a second `createNote`.

The window is a frame or a few tens of milliseconds, and it needs the key held (or a blur and a click in the same gap). That is why it is deferred past the MVP and not treated as critical.

## Scope

1. **Reproduce first**, in a real browser: a Playwright test that holds the save open (route the `createNote` Server Action request and delay its response), presses Escape, releases the response and repeats Escape in the gap. Count the `createNote` requests. If it cannot be made to fail after a fair attempt, close this ticket as not reproducible and say so.
2. **If it is real**, keep the guard up until the render that closes the composer (or shows the error) has committed. The idea in PR #64 was a `pending` state cleared by an effect; judge it against the current `Composer.tsx`, which has changed since (the title-Enter focus move and the IME guard).
3. Keep the test from step 1 as the regression test, seen red before the fix.

## Out of scope

Adding `jsdom` or any component-test dependency (02.03.05 chose a browser test for this reason; PR #64 added `jsdom` and about 650 lockfile lines), other composer behavior changes, and the autosave guard for the editor (ticket 03 has its own one-save-in-flight rule and should not copy this bug).

## Acceptance criteria

- [ ] A browser test shows whether the double insert happens, and the ticket records the result either way.
- [ ] If it happens: the test fails before the fix and passes after, and only one `createNote` request is sent.
- [ ] The existing composer E2E journeys still pass.

## Testing expectations

Playwright only, in `e2e/composer.spec.ts`, next to the 02.03.05 save-failure test and using the same request interception. No new dependency.

## Risks

- The window may be too short to hit reliably in a test. If so, the test should widen it deterministically (delay the response) and not use sleeps.

## Decisions

## Comments

- 2026-10-26: filed after reviewing draft PR #64 and the current `Composer.tsx`. The owner chose to close the PR and keep this ticket for after the MVP, and asked for it to be numbered 20 and not as a 02.03 child. See "Purpose" for what is and is not known.
