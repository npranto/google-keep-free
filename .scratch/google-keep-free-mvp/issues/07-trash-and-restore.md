# 07: Trash and restore-to-Active from Trash

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 06 (Archive and restore-to-Active)

## What to build

An Active or Archived Note can be moved to Trash (read-only, `trashed_at` set); it
can be restored to Active from Trash.

## Scope

`transition()` extended for `active→trashed`, `archived→trashed`, `trashed→active`
(explicitly no `trashed→archived`), `?view=trash`, `getTrashedNotes()`, Trash view
heading, read-only `NoteCard`/`NoteEditorDialog` variant (static text, no cursor,
toolbar limited to Restore only for now — Delete forever is 08),
`trashNote`/`restoreNote` (extended) Server Actions, Archive toolbar gains its
Trash button (deferred from 06).

## Out of scope

Permanent delete / Empty trash (08).

## Acceptance criteria

- [ ] Trashing an Active or Archived Note removes it from its prior view, shows it
      read-only in Trash, clears `pinned`, sets `trashed_at`.
- [ ] A Trashed Note's editor opens as read-only: no editable text, no autosave
      status.
- [ ] Restoring from Trash returns the Note to Active (never Archived) and clears
      `trashed_at`; it's editable again.
- [ ] There is no UI path from Trashed to Archived.
- [ ] `transition()` unit tests cover the full 5-edge transition graph now,
      including rejecting `trashed→archived`.

## Relevant spec sections

"Trash"/"Restore" journeys; Data requirements (transition graph); UI/UX §7
(read-only variant), §11 (Trash view).

## Architecture/design constraints

Trashed notes have no click target for editing beyond the read-only viewer.

## Testing expectations

Unit: full `transition()` graph including the rejected edge. Integration:
`trashNote` from both Active and Archived; `restoreNote` from Trashed lands on
Active. E2E: trash from Active, trash from Archive, restore from Trash.

## Demo instructions

Trash a Note from Notes view → appears read-only in Trash → open it (read-only) →
Restore → back in Notes, editable.

## Likely files/areas

`lib/notes/state-machine.ts`, `lib/notes/actions.ts` (`trashNote`, extended
`restoreNote`), `lib/notes/queries.ts` (`getTrashedNotes`),
`components/notes/NoteCard.tsx`/`NoteEditorDialog.tsx` (read-only variant),
`app/(app)/page.tsx`.

## Risks / conflict hotspots

Same hot-file chain; this is the last ticket that must touch the state machine,
closing out the transition graph.
