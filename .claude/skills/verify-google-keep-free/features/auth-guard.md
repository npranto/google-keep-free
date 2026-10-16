# Auth guard

**What it is:** everything under the `(app)` route group needs a signed-in Owner. `proxy.ts` only makes the session readable. The `(app)` layout calls `getOwnerId()`, and every Server Action must too.

**How to get to it:** open `/` signed out.

**How to drive it:** `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' <base>/`, or `npx playwright test e2e/redirect.spec.ts`.

**What proves it works:** a signed-out request to `/` answers 307 to `/sign-in`, and the browser ends on `/sign-in`. The sign-in page shows "Sign in to GKF".

**Gotchas:**

- On a preview the first answer can be Vercel's login page, not the app's: that is the deployment protection, not a failing guard. See the Drive section of `SKILL.md`.
- Router prefetches of `/` can log as 200 in the runtime logs. A real signed-out request is 307.
