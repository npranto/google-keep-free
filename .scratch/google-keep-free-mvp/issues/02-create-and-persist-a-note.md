# 02: Create and persist a Note

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 01 (Application foundation)

## What to build

"An authenticated Owner can create a Note and see it after refresh."

## Scope

Full `notes` table per `data-model.md` (all columns: `id`, `owner_id`, `title`,
`body`, `state` enum, `color` enum, `pinned`, `version`, `created_at`, `updated_at`,
`trashed_at`, both indexes) even though only `active` is used yet — creating the
enum/columns piecemeal later would mean repeated migrations for no reason. Inline
expanding `Composer` (title + body, no dialog), `createNote` Server Action
(draft-only until first content, per spec's "Create a Note" journey),
`getActiveNotes()` query + `selectOwnedNotes()` helper, `NoteGrid`/`NoteCard`
(read-only display: title, body preview, no toolbar actions yet),
`lib/notes/validation.ts` (title ≤300, body ≤20000).

## Out of scope

Editing an existing Note (dialog editor), autosave debounce/flush machinery beyond
the initial create, pin/color/labels/archive/trash, any toolbar icons on the card.

## Acceptance criteria

- [ ] Typing into the composer and closing it (blur/close) with content creates a
      Note as `Active`.
- [ ] Closing an empty composer performs no database write.
- [ ] After a full page refresh, the created Note is visible in the grid.
- [ ] Title/body over the char limits are rejected server-side (validated even if
      UI doesn't yet enforce it visually).
- [ ] A second Owner's session never sees this Note.

## Relevant spec sections

Data requirements (`notes` table); "Create a Note" journey; Autosave → "Initial
persistence"; Query architecture.

## Architecture/design constraints

`createNote` is its own Server Action, not a generic patch action. `owner_id =
getOwnerId()` baked into the insert/select, never a separate check.
`revalidatePath("/")` after create.

## Testing expectations

Unit: none yet (no state-machine transitions exercised beyond default `active`).
Integration: `createNote` scopes to owner; empty draft never persists.

## Demo instructions

Sign in → click "Take a note..." → type title/body → click elsewhere to close →
refresh page → Note still shows.

## Likely files/areas

`lib/db/schema.ts`, `lib/db/migrations/`, `lib/notes/actions.ts`,
`lib/notes/queries.ts`, `lib/notes/validation.ts`, `components/notes/Composer.tsx`,
`components/notes/NoteGrid.tsx`, `components/notes/NoteCard.tsx`,
`app/(app)/page.tsx`.

## Risks / conflict hotspots

`schema.ts`, `NoteCard.tsx`, and `lib/notes/actions.ts` become the project's
hottest files starting here — every subsequent lifecycle ticket (03–08) touches at
least one of them. This is why 02–08 are sequential, not a parallelization
opportunity.
