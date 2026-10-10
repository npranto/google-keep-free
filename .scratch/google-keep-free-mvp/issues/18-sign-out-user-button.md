# 18: Sign-out control (Clerk UserButton) in the top bar

**Status:** open
**Classification:** GAP (found during 01.04's code review, not in the spec's
15 numbered acceptance criteria - does not block 16)
**Blocked by:** 01.04 (Static app shell)

## What to build

A Clerk `UserButton` in the top bar, as `docs/design/ui-spec.md`'s App shell
bullet already specifies ("sticky top bar (sidebar toggle on tablet/mobile,
search, Clerk `UserButton`)") but no ticket currently implements.

## Context

Found during 01.04's `/ns-to-review`: after 01.04 ships, a signed-in Owner
has no UI path to sign out or see which account they're signed in as -
`TopBar.tsx` only has the brand text and search. Neither 01.04 nor its
parent umbrella ticket (01-application-foundation.md) scoped a `UserButton`
in, and the product spec's 15 numbered acceptance criteria (`spec.md`) don't
mention sign-out either - so ticket 16 (final integration) won't catch this
gap on its own. This ticket exists to close it deliberately rather than
leave it implicit.

## Scope

Add Clerk's `<UserButton />` to `components/shell/TopBar.tsx`, positioned
per the UI-UX spec (end of the top bar). Use Clerk's component as-is, no
custom menu items unless Clerk's defaults are insufficient for sign-out.

## Out of scope

Any other top-bar change. Account settings/profile pages beyond what
Clerk's own `UserButton` provides out of the box.

## Acceptance criteria

- [ ] A signed-in Owner sees a `UserButton` (avatar) in the top bar.
- [ ] Clicking it opens Clerk's menu with a working "Sign out".
- [ ] After signing out, the Owner is redirected per the existing
      `NEXT_PUBLIC_CLERK_SIGN_IN_URL` config (same behavior as the existing
      auth guard's redirect).

## Relevant spec sections

`docs/design/ui-spec.md`, App shell bullet.

## Demo instructions

Sign in, confirm the avatar shows in the top bar, click it, sign out,
confirm redirect to sign-in.

## Likely files/areas

`components/shell/TopBar.tsx`.

## Risks / conflict hotspots

Low - additive to a file already touched by 01.04 and later by 17; no
behavior change to existing elements.
