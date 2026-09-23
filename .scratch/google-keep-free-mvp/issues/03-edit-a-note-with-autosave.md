# 03: Edit a Note with autosave

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 02 (Create and persist a Note)

## What to build

Clicking a Note opens an editable dialog; edits autosave without an explicit Save
button, with a "Saving…/Saved" status.

## Scope

`NoteEditorDialog` (centered `Dialog`, title/body fields, empty toolbar shell for
now), `useAutosave` hook (1s debounce; flush on blur/close/`visibilitychange`;
serialized — one save in flight, latest edit queued), `updateNote` Server Action
(atomic `UPDATE ... WHERE id AND owner_id AND version`, success path only —
conflict handling is ticket 04), `aria-live="polite"` status region.

## Out of scope

Version-conflict banner/handling (04), pin/color/labels/archive/trash toolbar
buttons, read-only/Trashed variant.

## Acceptance criteria

- [ ] Clicking a Note card opens the dialog with current title/body.
- [ ] Typing stops for 1s → autosave fires → status shows "Saving…" then "Saved"
      (fades after ~2s).
- [ ] Blurring a field, closing the dialog, or hiding the tab flushes immediately
      (bypassing the debounce).
- [ ] Rapid typing produces exactly one in-flight save at a time; a newer edit made
      mid-save is queued and sent right after.
- [ ] Closing and reopening (or refreshing) shows the saved content.

## Relevant spec sections

"Edit / autosave a Note" journey; Autosave section (Debounce, Flush,
Serialization, Status feedback); UI/UX §16, §7.

## Architecture/design constraints

Debounce/serialization logic lives entirely client-side in `useAutosave`, not in
the Server Action. `updateNote` stays a plain "save this version" call, reusable
later.

## Testing expectations

Unit: `useAutosave` debounce/serialization behavior (fake timers). Integration:
`updateNote` persists and increments `version`/`updated_at`; rejects another
owner's note id.

## Demo instructions

Open a Note → edit title/body → watch status region → stop typing → confirm
"Saved" → refresh → edit persisted.

## Likely files/areas

`components/notes/NoteEditorDialog.tsx`, `components/notes/use-autosave.ts`,
`lib/notes/actions.ts` (`updateNote`), `components/notes/NoteCard.tsx`
(click-to-open).

## Risks / conflict hotspots

`NoteEditorDialog.tsx` becomes the second hottest shared file (toolbar fills in
over 04, 05, 06, 07, 09, 10) — same sequential-chain reasoning as `NoteCard.tsx`.
