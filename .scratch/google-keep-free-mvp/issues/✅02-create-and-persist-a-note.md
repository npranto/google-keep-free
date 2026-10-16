# 02: Create and persist a Note

**Status:** done - all sub-tickets 02.01-02.03 done
**Lane:** each child carries its own
**Classification:** SEQUENTIAL
**Blocked by:** 01 (Application foundation)

## Children

Run in order. Each is its own PR.

- [x] 02.01 Notes table and migration (PR #41, v0.2.12)
- [x] 02.02 createNote action and active Notes query (umbrella: 02.02.01 to 02.02.03, PRs #44, #46, #51)
- [x] 02.03 Composer and Notes grid (umbrella: 02.03.01 and 02.03.02, PRs #53, #57)

The umbrella is done when all three are closed and the acceptance criteria below hold
end to end. Decisions live in the children.

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

- [x] Typing into the composer and closing it (blur/close) with content creates a
      Note as `Active`.
- [x] Closing an empty composer performs no database write.
- [x] After a full page refresh, the created Note is visible in the grid.
- [x] Title/body over the char limits are rejected server-side (validated even if
      UI doesn't yet enforce it visually).
- [x] A second Owner's session never sees this Note.

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

## Comments

- 2026-10-16: done. All five criteria hold and all three children are closed: 02.01
  (PR #41, v0.2.12), 02.02 (PRs #44, #46, #51) and 02.03 (PRs #53, #57, v0.2.28). The
  over-limit and second-Owner criteria rest on the validation unit tests and the
  `getActiveNotes` integration test; the end-to-end create and refresh flow is proven on
  the preview and, for 02.03.02, by the owner's signed-in check on Production (there is no
  Production test account). Next is 03.
