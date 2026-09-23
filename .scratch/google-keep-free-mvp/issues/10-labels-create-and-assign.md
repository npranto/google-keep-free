# 10: Labels: inline create + assign from the editor

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 09 (Assign a color to a Note)

## What to build

From the open Note editor, typing a new label name creates and assigns it;
selecting an existing one assigns it. Assigned labels show as chips on the card.

## Scope

`labels` and `note_labels` tables per `data-model.md` (unique functional index on
`(owner_id, lower(name))`, composite PK + cascading FKs on the join table),
`LabelPickerPopover` (create-or-select combobox), `createLabel`/
`assignLabelToNote` Server Actions, label chips on `NoteCard` and in the editor,
`lib/labels/queries.ts` (`getLabels`), `lib/labels/validation.ts`.

## Out of scope

Sidebar label-view filtering (11), rename/delete via the Edit labels dialog (12).

## Acceptance criteria

- [ ] Typing a new name in the label picker and confirming creates the label and
      assigns it to the open Note; it appears as a chip immediately.
- [ ] Selecting an existing label assigns it without creating a duplicate.
- [ ] A name matching an existing label case-insensitively is rejected (uniqueness
      enforced at the DB level via the functional index, not just app-level
      check-then-insert).
- [ ] Display casing as typed is preserved.
- [ ] Label chips wrap on the card and appear in the editor's label row.

## Relevant spec sections

"Labels" journey; Data requirements (`labels`, `note_labels`); Acceptance
criteria 11–12 in spec; UI/UX §10.

## Architecture/design constraints

No creation from the sidebar dialog (that's rename/delete only, ticket 12).
Deleting a label (future, 12) never deletes Notes — this ticket doesn't touch
delete, just confirms the schema's cascade is join-table-only.

## Testing expectations

Integration: case-insensitive duplicate rejected via the unique index (not a
race-prone check-then-insert); `assignLabelToNote` scoped to owner for both the
note and label id; composite PK prevents duplicate assignment. E2E: create+assign
a label from the editor, see the chip on the card.

## Demo instructions

Open a Note → open label picker → type "groceries" → Enter → chip appears on card
and in editor → reopen picker, select "groceries" on a different note → same
chip, no duplicate label created.

## Likely files/areas

`lib/db/schema.ts` (new tables), `lib/labels/actions.ts`, `lib/labels/queries.ts`,
`lib/labels/validation.ts`, `components/notes/LabelPickerPopover.tsx`,
`components/notes/NoteCard.tsx`, `components/notes/NoteEditorDialog.tsx`.

## Risks / conflict hotspots

Same `schema.ts`/`NoteCard.tsx`/`NoteEditorDialog.tsx` conflict surface as 09 —
run sequentially after 09 on the same worker rather than concurrently (see 09's
risk note). This is also the last schema-migration ticket in the plan.
