# 01: What is `/try-out` for?

**Ticket:** 01.05.01 Try-out page UI
**Decided:** Sun 11 Oct 2026, by the user, during the ticket-level grill in scope-check

## Decision

`/try-out` will become a landing or marketing page later. For now it holds dummy
content shaped like one: a headline and benefits.

## Options rejected

- A no-sign-in demo of the app, later: not what the page is for.
- A scratch page for trying UI ideas: not what the page is for.
- No purpose yet, smallest possible page: the page has a known destination, so the
  placeholder follows its shape.

## Principle

Purpose before shape: placeholder copy still makes a promise about what the page will
become, so the purpose is settled before the layout.

## Undo

Trivial. The copy lives in `app/try-out/page.tsx` and is replaced wholesale.
