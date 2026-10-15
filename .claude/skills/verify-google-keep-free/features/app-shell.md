# App shell and Notes empty state (core flow)

**What it is:** the signed-in Owner's home at `/`: a top bar ("Keep" and a search box), a sidebar ("Note views": Notes, Archive, Trash) and a main area that shows the Owner's Active Notes as a read-only grid of cards (a list named "Notes"), or "Notes you add appear here" when there are none. The shared test Owner always has Notes, so the grid shows for it; the empty state shows only when every Note is archived or removed (a proof run can archive the rows and restore them).

**How to get to it:** sign in at `/sign-in` as the test Owner (see the Drive section of `SKILL.md`).

**How to drive it:** `playwright-cli` sign-in, then `snapshot`. Or `npx playwright test e2e/shell.spec.ts`.

**What proves it works:** after sign-in the URL is `/`, the banner shows "Keep", the navigation "Note views" lists Notes, Archive and Trash with Notes marked current, and either the list "Notes" or the text "Notes you add appear here" is visible. The console has 0 errors (Clerk's development-keys warning is expected).

**Gotchas:**
- Signing in takes a few seconds: snapshot again if the page still shows the code box.
- There is no sign-out button yet (ticket 18), so end a run by closing the browser.
- The sidebar buttons do nothing yet.
