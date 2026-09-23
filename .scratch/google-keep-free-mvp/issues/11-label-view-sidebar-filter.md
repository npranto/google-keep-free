# 11: Label view: sidebar filter

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 10 (Labels: inline create + assign from the editor)

## What to build

Selecting a label in the sidebar shows that label's Active Notes only; the
composer is present but never auto-tags new Notes with the current label.

## Scope

Sidebar "LABELS" section (alphabetical list of the Owner's labels), `?label=<id>`
param handling in `page.tsx`, `getNotesForLabel(labelId)` query, label-view
heading (the label's name), selected-state highlighting.

## Out of scope

Edit labels dialog (12).

## Acceptance criteria

- [ ] Sidebar lists every label alphabetically under "LABELS".
- [ ] Clicking a label filters the grid to that label's Active Notes, with the
      same pin-grouping/composer behavior as the Active view.
- [ ] A Note created from a label view is Active and not auto-tagged with that
      label.
- [ ] The label's name appears as the page heading.

## Relevant spec sections

"Labels" journey (label view); UI/UX §4 (view table — Label row), wireframes.md
Label view.

## Architecture/design constraints

A label view is a filtered Active view, not a distinct mode/component tree (per
ui-spec.md §4/§20).

## Testing expectations

Integration: `getNotesForLabel` scoped to owner, Active-only. E2E: assign a label
to two notes, one Active one Archived, select the label in sidebar, confirm only
the Active one shows.

## Demo instructions

With labels from ticket 10 assigned, click a label in the sidebar → grid filters
to just that label's Active Notes → create a note here → confirm it's Active and
untagged.

## Likely files/areas

`components/labels/LabelList.tsx`/`LabelNavItem.tsx`, `lib/labels/queries.ts`
(`getNotesForLabel`), `app/(app)/page.tsx`.

## Risks / conflict hotspots

Low — new sidebar subtree, doesn't touch `NoteCard`/`NoteEditorDialog`.
