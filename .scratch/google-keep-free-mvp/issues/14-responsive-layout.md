# 14: Responsive layout across breakpoints

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 09 (Color), 11 (Label view), 12 (Edit labels dialog), 13 (Search)

## What to build

The app is fully usable at desktop, tablet, and mobile breakpoints per the
wireframes: sidebar rail/drawer, grid column counts, full-screen mobile editor,
icon-to-field mobile search.

## Scope

Sidebar responsive states (desktop expanded / tablet icon-rail+overlay / mobile
hidden+drawer, scrim-dismissible, closes on Escape), grid `column-count`
responsive breakpoints (4/2-3/1), mobile full-screen `NoteEditorDialog` variant
(back-arrow instead of ×), mobile search icon→full-width field, touch-always-
visible card toolbars (`hover: none` media query) vs. hover/focus-revealed on
pointer devices.

## Out of scope

Any new feature logic — this is layout/interaction-mode only, reusing all
components built in 01–13.

## Acceptance criteria

- [ ] At ≥1024px: sidebar always expanded, 4-column grid.
- [ ] At ~768–1023px: sidebar is an icon rail, toggle opens a temporary overlay
      that auto-collapses on selection; 2–3 column grid.
- [ ] At <768px: sidebar hidden by default, toggle opens a full-height
      scrim-dismissible drawer closing on Escape; single column; editor is
      full-screen with a back-arrow; search collapses to an icon.
- [ ] On touch devices (`hover: none`), card toolbars are always visible
      regardless of viewport width; keyboard focus always reveals the toolbar on
      any device.
- [ ] Sidebar expand/collapse state is ephemeral — always resets to the
      breakpoint default on load.

## Relevant spec sections

UI/UX §2, §3, §12; wireframes.md (Desktop/Mobile notes view, Expanded note
editor mobile variant).

## Architecture/design constraints

Pure CSS multi-column masonry (`column-count`+`break-inside: avoid`), no JS
masonry library. No custom grid arrow-key navigation.

## Testing expectations

Manual/visual verification at each breakpoint (documented). Playwright
viewport-sized smoke checks if convenient, not required by the spec.

## Demo instructions

Resize the browser (or device emulation) through all three breakpoints,
exercising sidebar toggle, grid columns, editor open, and search at each.

## Likely files/areas

`components/shell/Sidebar.tsx`, `components/shell/TopBar.tsx`,
`components/notes/NoteGrid.tsx` (CSS), `components/notes/NoteEditorDialog.tsx`
(mobile variant), `components/notes/SearchInput.tsx`.

## Risks / conflict hotspots

Touches nearly every shell/component file, but only their layout/CSS surface,
not their logic — real conflict risk only if run concurrently with a
logic-changing ticket. Placed after all four organize-phase tickets converge
specifically to avoid that.
