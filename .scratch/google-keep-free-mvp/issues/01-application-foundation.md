# 01: Application foundation: scaffold, auth, empty shell

**Status:** ready-for-agent
**Classification:** FOUNDATION
**Blocked by:** None (can start immediately)

## What to build

An unauthenticated visitor is redirected to Clerk's hosted sign-in; an authenticated
Owner sees the app shell (top bar, sidebar with Notes/Archive/Trash, empty
"Notes you add appear here" state) with no Notes yet.

## Scope

Next.js App Router project, Tailwind + shadcn/ui install, Drizzle + Neon connection
(`lib/db/index.ts`, empty `schema.ts` placeholder), Clerk integration
(`ClerkProvider`, sign-in/sign-up routes, `(app)/layout.tsx` auth guard),
`lib/auth/current-owner.ts` (`getOwnerId()`), `lib/env.ts` Zod-validated env, static
`AppShell`/`TopBar`/`Sidebar` (Notes/Archive/Trash nav items only, no Labels section
yet), shared `EmptyState` component, `.env.example`, Vercel deploy.

## Out of scope

Any Note data, database tables beyond an empty schema file, labels nav, search field
wiring (input can render but does nothing), composer.

## Acceptance criteria

- [ ] Visiting the app signed-out redirects to Clerk sign-in; no local user record is
      ever created.
- [ ] Signing in lands on `/` showing the shell and the Notes empty state ("Notes you
      add appear here").
- [ ] Sidebar highlights "Notes" as selected; Archive/Trash nav items are present but
      inert (routes not yet meaningful).
- [ ] `getOwnerId()` throws/redirects if called with no session; never accepts a
      client-supplied id.

## Relevant spec sections

Authentication and authorization; UI/UX requirements (App shell, Navigation);
Architecture constraints (Server responsibilities, feature-folder structure).

## Architecture/design constraints

No `/api/*` route handlers. No client data-fetching library, no global client store.
One route (`/`) — don't build separate pages per view yet.

## Testing expectations

Smoke test that the auth guard redirects signed-out visitors; no integration/unit
tests needed yet (nothing to test).

## Demo instructions

`vercel dev` or deployed preview → visit signed-out (redirect to Clerk) → sign in →
see empty shell.

## Likely files/areas

`app/layout.tsx`, `app/(app)/layout.tsx`, `app/sign-in`, `app/sign-up`,
`lib/env.ts`, `lib/auth/current-owner.ts`, `lib/db/index.ts`, `components/ui/*`
(shadcn init), `components/notes/EmptyState.tsx`, `app/(app)/page.tsx`.

## Risks / conflict hotspots

None yet (first ticket, no contention). Sets the shape every later ticket builds on
— worth getting shell component boundaries right here since they become hot files
immediately after.
