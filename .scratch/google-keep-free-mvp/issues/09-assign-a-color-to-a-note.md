# 09: Assign a color to a Note

**Status:** ready-for-agent
**Classification:** PARALLEL-SAFE (relative to 13; see execution note below)
**Blocked by:** 08 (Permanent delete and Empty trash)

## What to build

An Owner can assign one color from the fixed palette to a Note from the card
toolbar or the open editor; the card/editor background reflects it.

## Scope

`note_color` enum already exists from 02 (10 named tokens + `default`);
`ColorPickerPopover` (swatch grid, Radix roving-tabindex, `aria-label` per
swatch), wiring into `NoteCard` toolbar and `NoteEditorDialog` toolbar,
`setNoteColor` Server Action, light/dark verified token shades (design tokens
already named in ui-spec.md — this ticket implements the CSS values for
`coral`/`peach`/`sand`/`sage`/`fog`/`storm`/`dusk`/`blossom`/`clay`/`chalk`/
`default`).

## Out of scope

Labels (10).

## Acceptance criteria

- [ ] Selecting a color from either the card or editor toolbar updates the Note's
      background/border immediately (optimistic).
- [ ] Only one color is active at a time; selecting a new one replaces the old.
- [ ] Each swatch has an `aria-label` naming the color (color is never the only
      signal).
- [ ] Every token's text-on-background pairing meets 4.5:1 body / 3:1 large-text
      contrast in both light and dark themes.

## Relevant spec sections

"Color" journey; UI/UX §19 (Note color palette, contrast); Accessibility
(contrast verified once at token definition).

## Architecture/design constraints

Color stored as the constrained enum, never raw hex/free input.

## Testing expectations

Integration: color-set action persists and scopes to owner. Visual/contrast check
documented (not automated per-pixel, but the token values recorded as
AA-verified).

## Demo instructions

Open a Note, pick a color from the popover → card and editor both reflect it →
toggle dark mode, confirm the shade adapts and stays legible.

## Likely files/areas

`lib/notes/actions.ts` (color action), `components/notes/ColorPickerPopover.tsx`,
`components/notes/NoteCard.tsx`, `components/notes/NoteEditorDialog.tsx`,
Tailwind/CSS token definitions for the 11 colors.

## Risks / conflict hotspots

Conceptually independent of 10 (Labels), but both add a new toolbar icon to the
same `NoteCard.tsx`/`NoteEditorDialog.tsx` toolbar row — literally adjacent JSX.
**Execution recommendation: run 09 before 10 on the same worker/session, not
concurrently with it**, to avoid a near-certain merge conflict on those two
files. 09 is, however, safe to run in parallel with ticket 13 (Search), which
touches an entirely different file set.
