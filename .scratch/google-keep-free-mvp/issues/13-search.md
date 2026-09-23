# 13: Search

**Status:** ready-for-agent
**Classification:** PARALLEL-SAFE
**Blocked by:** 08 (Permanent delete and Empty trash)

## What to build

Typing in the top-bar search field replaces the grid with matching Notes
(title/body substring, Active+Archived, Trashed excluded), globally regardless of
the current view/label.

## Scope

`SearchInput` wired up in the top bar (was static since ticket 01), 300ms
debounce, `searchNotes` Server Action (not a mutation — no `revalidatePath`),
results reuse `NoteGrid`/`NoteCard` flat (no pinned grouping), "Results for
'<query>'" heading, zero-results empty-state copy, clearing the field reverts to
the prior view/label.

## Out of scope

Label-name matching (explicitly excluded), any route/URL change for search.

## Acceptance criteria

- [ ] Debounced (~300ms) search-as-you-type; results replace the grid content in
      place.
- [ ] Matches are case-insensitive substrings of title or body, across Active +
      Archived only.
- [ ] A Note matching only by label name never appears; a Trashed Note never
      appears.
- [ ] Clearing the query reverts to whatever view/label was active before
      searching.
- [ ] Zero matches shows "No notes match '<query>'" / "Try different words."

## Relevant spec sections

"Search" journey; Search section (scope, matching, trigger); Acceptance
criterion 13.

## Architecture/design constraints

`ILIKE`-based, no `pg_trgm` (named upgrade path, not MVP). Search is
client-initiated, not a Server Component render.

## Testing expectations

Integration: `searchNotes` excludes Trashed, doesn't match label names, scoped
per owner. E2E: search for text in an Active note's body, confirm it appears;
search for a Trashed note's text, confirm it doesn't.

## Demo instructions

Type a word known to be in one Note's body → grid narrows to matches under
"Results for '…'" → clear the field → grid reverts to the prior view.

## Likely files/areas

`components/notes/SearchInput.tsx`, `lib/search/actions.ts`, `app/(app)/page.tsx`
(client-side result-swap, no new route).

## Risks / conflict hotspots

Genuinely low conflict — new `lib/search/` module, and its only shared-file touch
is the top bar (stable since ticket 01) and reusing `NoteGrid`/`NoteCard` for
read-only rendering (no new toolbar icons). This is the cleanest parallel
candidate in the whole plan: safe to run concurrently with 09 (Color) even though
09→10 are sequential with each other.
