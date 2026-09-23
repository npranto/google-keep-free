# 05: Pin / unpin Notes

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 04 (Autosave version-conflict handling)

## What to build

An Active Note can be pinned; pinned Notes group at the top of the grid, sorted
most-recently-updated within each group.

## Scope

`pinned` grouping in `getActiveNotes()`/`selectOwnedNotes()` sort (`pinned DESC,
updated_at DESC`), `PinnedSectionDivider`/"PINNED" header (only shown when ≥1
pinned), always-visible pin icon on the card (filled/outline, not hover-gated), pin
toggle in the editor toolbar, `pinNote` Server Action (`WHERE state='active'`
guard), optimistic UI via `useOptimistic`/`useTransition` with rollback + toast on
failure.

## Out of scope

Archive/Trash (pin is unavailable there — enforced by the `state='active'` guard,
not new UI yet since those views don't exist until 06/07).

## Acceptance criteria

- [ ] Pinning a Note moves it to a "PINNED" group above unpinned Notes on next
      render.
- [ ] Pin icon is always visible on the card (not hover-gated), reflects state via
      filled vs. outline shape.
- [ ] Toggling pin is optimistic (instant) and rolls back with a toast on server
      rejection.
- [ ] Attempting to pin a non-Active Note (server-side) is rejected by the
      `state='active'` guard.

## Relevant spec sections

"Pin / unpin" journey; Grid ordering (data-model.md); UI/UX §8 (card
interactions), §17 (color not the only signal).

## Architecture/design constraints

No manual drag-to-reorder. `pinNote` does not check `version` (idempotent toggle,
per spec).

## Testing expectations

Unit: none new. Integration: `pinNote` no-ops/rejects on a non-active note;
toggling twice returns to original state. E2E: pin a note, confirm it reorders
above others.

## Demo instructions

Create two Notes, pin the second → it jumps above the first under a "PINNED"
header.

## Likely files/areas

`lib/notes/actions.ts` (`pinNote`), `lib/notes/queries.ts` (sort),
`components/notes/NoteCard.tsx`, `components/notes/NoteEditorDialog.tsx`,
`components/notes/NoteGrid.tsx` (grouping/divider).

## Risks / conflict hotspots

Third ticket in a row editing both `NoteCard.tsx` and `NoteEditorDialog.tsx`
toolbars — confirms these two files as the primary sequential-chain bottleneck
through ticket 08.
