# Public pages

**What it is:** pages open to signed-out visitors: `/about`, `/faq`, `/stuff` (all static placeholders), and the Clerk screens `/sign-in` and `/sign-up`.

**How to get to it:** open the path. The two Clerk screens link to each other.

**How to drive it:** `playwright-cli open <base>/<path>`, then `snapshot`. Clerk renders a moment after load.

**What proves it works:** each answers 200. The three static pages show their level-1 heading in the HTML ("About Google Keep Free", "Frequently asked questions", "Stuff"). The Clerk screens draw theirs in the browser ("Sign in to GKF" on `/sign-in`), so check them with a snapshot, not `curl`. The console has 0 errors.

**Gotchas:**
- No E2E test covers these yet.
- Production's Clerk instance shows "Communication locked" for email codes, so only Google sign-in can work there (`docs/architecture/codebase-map.md`, "Documentation gaps").
- `/stuff` is 704 lines of placeholder UI: expect inert buttons.
