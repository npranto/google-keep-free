# 06: Archive and restore-to-Active

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 05 (Pin / unpin Notes)

## What to build

An Active Note can be archived (leaves the Active grid, appears under a new
Archive view, no longer pinned) and restored back to Active from Archive.

## Scope

`note_state` enum + `state`/`trashed_at` already exist from 02;
`lib/notes/state-machine.ts` pure `transition()` function (first real use:
`active→archived`, `archived→active`), `?view=archive` query-param handling in
`page.tsx`, `getArchivedNotes()` query, Archive page heading, Archive card toolbar
(Restore only for now — Trash button is deferred to ticket 07), `archiveNote`
Server Action, optimistic removal from Active grid.

## Out of scope

Trashing from Archive (07), permanent delete, color/label toolbar icons (09/10).

## Acceptance criteria

- [ ] Archiving an Active Note removes it from the Active grid and it appears
      under Archive.
- [ ] Archiving clears `pinned`.
- [ ] Restoring from Archive returns the Note to Active (and it's editable there
      again).
- [ ] `transition()` rejects invalid transitions (e.g. `archived→archived` no-ops
      or is rejected per the pure function's contract) with unit tests.
- [ ] Sidebar "Archive" nav item selects `?view=archive` and highlights correctly.

## Relevant spec sections

"Archive"/"Restore" journeys; Data requirements (state transitions); UI/UX §4
(view table), §11.

## Architecture/design constraints

`transition()` is pure, no I/O, lives in `lib/notes/state-machine.ts`, not a DB
trigger/check constraint. `archiveNote` clears `pinned` as part of the same atomic
UPDATE.

## Testing expectations

Unit: `transition()` covers `active→archived` and `archived→active`, clearing
`pinned` on the former, leaving it untouched-but-irrelevant on the latter.
Integration: `archiveNote`/`restoreNote` scoped to owner. E2E: archive a note, see
it in Archive, restore it, see it back in Active.

## Demo instructions

Archive a Note from its card → confirm it's gone from Notes → switch to Archive →
confirm it's there, unpinned → Restore → back in Notes.

## Likely files/areas

`lib/notes/state-machine.ts`, `lib/notes/actions.ts` (`archiveNote`,
`restoreNote`), `lib/notes/queries.ts` (`getArchivedNotes`), `app/(app)/page.tsx`
(view param), `components/notes/NoteCard.tsx`/`NoteEditorDialog.tsx`
(Archive/Restore buttons).

## Risks / conflict hotspots

Same hot-file set as 05. Also first ticket to introduce a second "view" — worth
confirming `page.tsx`'s view-switch structure here since 07/11/13 all extend it.
