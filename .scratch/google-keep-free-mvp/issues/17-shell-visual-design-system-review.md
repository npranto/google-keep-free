# 17: Shell visual design system review

**Status:** open
**Classification:** OPTIONAL-POLISH (not part of MVP-done; does not block 16)
**Blocked by:** 14 (Responsive layout) - review once the shell has settled at
all breakpoints

## What to build

A deliberate decision, revisited with real UI in place, on whether the app
shell (top bar, sidebar) should stay on plain shadcn/Tailwind defaults as
`docs/design/ui-spec.md` Section 19 currently specifies, or adopt a more
distinctive visual identity (brand color, custom spacing/elevation).

## Context

Section 19 of `docs/design/ui-spec.md` is explicit: "Built on shadcn/ui +
Tailwind defaults; no custom scale invented where a default already exists."
01.04 implemented the shell exactly to that spec - default `--radius`,
default semantic color tokens, sidebar distinguished by `border-r` rather
than a fill color. That is not an oversight; it is the documented decision.

This ticket exists because the generic look was flagged during 01.04's
implementation. It is not a bug fix - it is a deliberate re-examination of
an already-made design decision, done later when more of the UI exists to
judge the look against (notes grid, editor, labels), rather than reopening
Section 19 ticket by ticket.

## Scope

Review the shell's current look against the finished product once 02-14 are
built. If a change is wanted: update `docs/design/ui-spec.md` Section 19 (it
is the source of truth, not the other way around), then update
`app/globals.css` tokens and `components/shell/*` to match. If no change is
wanted: close this ticket with that decision recorded.

## Out of scope

Note card color palette (already speced and separately ticketed as 09).
Any change to layout/structure (handled by 14). Changing shadcn component
behavior, only its theming.

## Acceptance criteria

- [ ] Explicit decision recorded: keep defaults, or adopt a specific
      alternative (named tokens/values, not "make it nicer").
- [ ] If changed: `docs/design/ui-spec.md` Section 19 updated first, then
      `app/globals.css` and `components/shell/*` match it exactly.
- [ ] Contrast/accessibility re-verified for any new or changed color token
      (AA, both light and dark), per Section 19's existing bar.

## Relevant spec sections

`docs/design/ui-spec.md` Section 19 (Design tokens).

## Demo instructions

Compare the shell against the rest of the finished UI at `/`; if tokens
changed, show the before/after and the updated Section 19 text.

## Likely files/areas

`docs/design/ui-spec.md`, `app/globals.css`, `components/shell/AppShell.tsx`,
`components/shell/TopBar.tsx`, `components/shell/Sidebar.tsx`.

## Risks / conflict hotspots

Low - theming only, no structural change. Touches files already touched by
14, so sequencing after it avoids merge churn.
