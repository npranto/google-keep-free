# 04: Autosave version-conflict handling

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 03 (Edit a Note with autosave)

## What to build

If a Note changes elsewhere while open, the stale save is rejected, a persistent
"changed elsewhere" banner appears instead of silently overwriting or losing the
edit, and Reload resolves it.

## Scope

Server-side disambiguation in `updateNote` (zero-rows-updated → follow-up `SELECT`
to distinguish stale-version from not-found/not-yours, returned as distinct
`ActionResult` error kinds), conflict banner UI (replaces status region, `warning`
token, "Reload" button), suspending further autosaves until Reload, Reload
re-fetching and discarding local edits, same discard behavior on dialog close while
conflicted.

## Out of scope

Any merge UI (explicitly out of scope for MVP).

## Acceptance criteria

- [ ] Simulating two saves against the same Note with divergent versions: the
      second is rejected, not silently applied.
- [ ] The banner reads "This note changed elsewhere. Reload to see the latest
      version." with a Reload button; no toast is used for this case.
- [ ] Further keystrokes do not trigger new autosave attempts while conflicted.
- [ ] Clicking Reload replaces editor content with the server version and clears
      the conflict state.
- [ ] Closing the dialog while conflicted discards local edits the same way.

## Relevant spec sections

Autosave → "Conflict behavior"; Error behavior → "Autosave version conflict";
Acceptance criterion 4 in spec.

## Architecture/design constraints

Not-found/not-yours and stale-version must resolve via the same "zero rows"
mechanism described in `data-model.md`, not a pre-check-then-write pattern.

## Testing expectations

Integration: two sequential `updateNote` calls with the same stale `version` —
second returns `conflict`; a call against a nonexistent/foreign note id returns a
distinct not-found kind. UI: banner appears and blocks further autosave until
Reload (can be a component-level test, not necessarily E2E yet).

## Demo instructions

Open a Note in two tabs, edit+save in tab A, edit in tab B and let it autosave →
tab B shows the conflict banner → click Reload → tab B shows tab A's content.

## Likely files/areas

`lib/notes/actions.ts` (`updateNote` conflict path),
`components/notes/NoteEditorDialog.tsx`, `components/notes/use-autosave.ts`
(conflict state), `lib/shared/result.ts` (`ActionResult` error kinds).

## Risks / conflict hotspots

Touches the same `NoteEditorDialog.tsx` toolbar/status region as 03 and (later) 05
— kept sequential rather than parallel with 05 for that reason, even though the two
features are conceptually independent.
