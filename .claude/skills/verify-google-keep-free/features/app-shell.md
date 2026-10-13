# App shell and Notes empty state (core flow)

**What it is:** the signed-in Owner's home at `/`: a top bar ("Keep" and a search box), a sidebar ("Note views": Notes, Archive, Trash) and a main area that says "Notes you add appear here". All static today.

**How to get to it:** sign in at `/sign-in` as the test Owner (see the Drive section of `SKILL.md`).

**How to drive it:** `playwright-cli` sign-in, then `snapshot`. Or `npx playwright test e2e/shell.spec.ts`.

**What proves it works:** after sign-in the URL is `/`, the banner shows "Keep", the navigation "Note views" lists Notes, Archive and Trash with Notes marked current, and the text "Notes you add appear here" is visible. The console has 0 errors (Clerk's development-keys warning is expected).

**Gotchas:**
- Signing in takes a few seconds: snapshot again if the page still shows the code box.
- There is no sign-out button yet (ticket 18), so end a run by closing the browser.
- The sidebar buttons do nothing yet.
