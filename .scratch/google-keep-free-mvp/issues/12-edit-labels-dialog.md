# 12: Edit labels dialog (rename / delete)

**Status:** ready-for-agent
**Classification:** PARALLEL-SAFE
**Blocked by:** 10 (Labels: inline create + assign from the editor)

## What to build

From the sidebar's "+ Edit labels", an Owner can rename or delete existing
labels; deleting only detaches the label from Notes, never deletes Notes.

## Scope

`EditLabelsDialog` (row per label, inline-editable name, delete icon per row),
`renameLabel`/`deleteLabel` Server Actions, confirmation on delete
(`ConfirmDeleteDialog` reuse), empty-state copy inside the dialog.

## Out of scope

Creating labels here (explicitly editor-only, per 10).

## Acceptance criteria

- [ ] Renaming a label updates every Note currently showing its chip (labels
      referenced by id, not copied string).
- [ ] Deleting a label (after confirmation) removes the chip from all Notes but
      deletes no Notes.
- [ ] The dialog shows "You don't have any labels yet - add one from a note."
      when there are none.
- [ ] Enter/blur commits a rename; Escape cancels.

## Relevant spec sections

"Labels" journey; UI/UX §10 (Edit labels dialog); Acceptance criterion 11
(rename/delete clauses).

## Architecture/design constraints

Delete requires the shared `AlertDialog` confirmation (this is the third and last
of the three MVP confirmations).

## Testing expectations

Integration: `renameLabel`/`deleteLabel` scoped to owner; delete cascades only
`note_labels` rows, `notes` table untouched. E2E: rename a label, confirm chip
text updates everywhere; delete a label, confirm chips disappear but notes
remain.

## Demo instructions

Sidebar → "+ Edit labels" → rename "groceries" to "shopping" → confirm chip
updates on the note from ticket 10 → delete "work" (confirm) → chip gone, note
itself untouched.

## Likely files/areas

`components/labels/EditLabelsDialog.tsx`, `lib/labels/actions.ts`
(`renameLabel`, `deleteLabel`), sidebar "+ Edit labels" trigger.

## Risks / conflict hotspots

Touches the sidebar trigger area that 11 also touches, but as an addition (a
dialog trigger row), not a shared logic path — low real conflict despite the file
overlap. Doesn't touch `NoteCard`/`NoteEditorDialog` at all, which is why it's
safe to run alongside 11 and 13.
