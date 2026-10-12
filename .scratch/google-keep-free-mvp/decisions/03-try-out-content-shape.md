# 03: What does the dummy landing content look like?

**Ticket:** 01.05.01 Try-out page UI
**Decided:** Mon 12 Oct 2026, by the user, during the ticket-level grill in scope-check

## Decision

A small landing skeleton in one file, `app/try-out/page.tsx`: a full-width hero, three
benefit cards that reflow from one to three columns, and a closing band. The hero has one
call to action, a real link to `/sign-up`. Neutral theme tokens only.

The agent recommended the skeleton with no buttons or links. The user added the call to
action.

## Options rejected

- The same pitch copy inside the `/about` card shell: matches two sibling pages, but a
  narrow card is not a landing layout, so the layout would be rebuilt later.
- A headline and one line: says nothing about where the page is going.
- A long colorful page like `/stuff` (704 lines): the user passed on a bigger page.
- A shared page-shell component for the public pages: edits shipped pages, breaks the
  "nothing else changes" criterion, and moves the lane to Standard.
- Inert buttons: the `/stuff` review flagged three of them.

## Accepted risk

The call to action sends real visitors into sign-up from placeholder benefit copy. Kept
small by `noindex` (decision 02), by nothing linking to `/try-out`, and by copy that says
plainly it is placeholder text.

## Evidence

- Measured: `docs/design/` has no landing page design. `Button` in
  `components/ui/button.tsx` supports `asChild`, so it wraps a `next/link` `Link` with no
  change to the component.
- Guess: the real landing page keeps the hero, benefits and closing sections.

## Principle

A placeholder should match the shape, not the detail: get the structure right now, keep
the filling minimal and honest about being fake.

## Undo

Trivial. One file, replaced wholesale.
