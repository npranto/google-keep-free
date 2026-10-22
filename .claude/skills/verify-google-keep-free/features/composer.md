# Composer

**What it is:** the "Take a note..." field at the top of `/` for the signed-in Owner. Collapsed it is one line. Clicking it, or pressing Enter on it, expands it in place into a Title field, a Note textarea that grows with its text, and a Close button. Closing saves a Note that has content (always Active) and writes nothing when both fields are empty or only whitespace.

**How to get to it:** sign in at `/sign-in` as the test Owner (see the Drive section of `SKILL.md`), then use the field above the grid.

**How to drive it:** `playwright-cli` sign-in, `snapshot`, click the "Take a note" textbox, fill "Title" and "Note", then click "Close". Or `npx playwright test e2e/composer.spec.ts`. Check both color schemes with `playwright-cli set-color-scheme dark`; the app follows `prefers-color-scheme`, so toggling a `dark` class does nothing.

**What proves it works:** after Close the composer collapses and a card with the typed title is in the "Notes" list, and it is still there after a reload. Escape and clicking outside the composer save the same way, and Escape returns focus to the collapsed field. An empty or whitespace-only close adds no card and sends no Server Action request (a POST with a `next-action` header). Enter in the Title field moves focus to the Note field and saves nothing (same: no request, no new card); Enter in the Note field adds a line.

**Gotchas:**

- Every run adds Notes to the shared test Owner and nothing deletes them yet (ticket 02.03.02 "Decisions"). Use a unique title and count cards.
- A failed save keeps the composer open with the text and a message in a `role="alert"` line.
- Production has no test Owner, so this flow is proven locally and on preview only.
- Switching browser tabs while typing does not close or save the composer.
