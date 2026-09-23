# 08: Permanent delete and Empty trash

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 07 (Trash and restore-to-Active from Trash)

## What to build

A Trashed Note can be permanently deleted (with confirmation), or the whole Trash
emptied at once (with confirmation); both are irreversible.

## Scope

`permanentlyDeleteNote` Server Action (`DELETE ... WHERE state='trashed' AND
owner_id`), "Empty trash" action (delete-all-trashed for owner, disabled when
Trash is empty), shared `ConfirmDeleteDialog` (`AlertDialog` wrapper, reused with
per-action copy, Cancel default-focused), wiring into Trash card toolbar and Trash
view heading.

## Out of scope

Color, labels, search — this closes out the full note-lifecycle chain (02–08).

## Acceptance criteria

- [ ] "Delete forever" on a Trashed Note requires confirmation naming the specific
      Note; confirming removes it permanently (not restorable).
- [ ] "Empty trash" requires confirmation covering all Trashed Notes at once;
      disabled when Trash is already empty.
- [ ] Attempting to permanently delete a non-Trashed Note is not reachable through
      any UI path (guarded server-side regardless).
- [ ] Cancel is the default-focused button in both confirmations.

## Relevant spec sections

"Permanent deletion" journey; Data requirements (`DELETE ... WHERE
state='trashed'`); Error behavior → Destructive confirmations; Acceptance
criterion 9 in spec.

## Architecture/design constraints

This is one of only three actions requiring an `AlertDialog` confirmation for MVP
(delete-forever, empty-trash, delete-label) — don't add confirmations elsewhere.

## Testing expectations

Integration: `permanentlyDeleteNote` guarded by `state='trashed'` — attempting on
an active/archived note id (bypassing UI) is rejected; cascades remove any
`note_labels` rows (label table doesn't exist yet at this point, so this assertion
is deferred/no-op until ticket 10 — note it as a follow-up check). E2E: delete
forever a note, confirm gone; empty trash with 2+ notes, confirm all gone.

## Demo instructions

Trash a Note → open Trash → "Delete forever" → confirm dialog → confirm → gone.
Trash a second note → "Empty trash" → confirm → Trash shows empty state.

## Likely files/areas

`lib/notes/actions.ts` (`permanentlyDeleteNote`, `emptyTrash`),
`components/notes/ConfirmDeleteDialog.tsx`, `components/notes/NoteCard.tsx`, Trash
view heading.

## Risks / conflict hotspots

Last ticket in the mandatory sequential trunk. After this, `NoteCard.tsx`/
`NoteEditorDialog.tsx`/`actions.ts` stabilize enough that genuine parallel lanes
open up.
