# Flows

Status: approved for MVP implementation. Component/module names refer to the
structure defined in [`system.md`](./system.md); table/column names refer to
[`data-model.md`](./data-model.md).

Format: `UI → server boundary → application/domain logic → database → response/revalidation → UI`

## Authenticate

```
UI: owner visits app, not signed in
→ (app)/layout.tsx server-side auth check (Clerk) fails
→ redirect to /sign-in (Clerk-hosted UI)
→ owner signs in / signs up via Clerk
→ Clerk redirects back with a verified session
→ (app)/layout.tsx auth check passes; getOwnerId() will resolve this session's userId
→ UI: notes grid renders
```

No local users table is created or touched at any point — Clerk owns the entire
identity lifecycle (ADR 0002). The Clerk `userId` becomes the `owner_id` used by
every subsequent query and mutation.

## Load notes (Active / Archived / Trashed / Label grid)

```
UI: owner navigates to "/" or "/?view=archive" or "/?view=trash" or "/?label=<id>"
→ app/(app)/page.tsx (Server Component) reads searchParams
→ lib/notes/queries.ts: getActiveNotes() / getArchivedNotes() / getTrashedNotes() / getNotesForLabel(id)
  → getOwnerId() resolves owner from session
  → selectOwnedNotes(ownerId, [state/label condition]) - Drizzle query
→ database: SELECT ... WHERE owner_id = ? AND state = ? ORDER BY pinned DESC, updated_at DESC
→ response: array of Note rows, rendered directly (Server Component, no client fetch)
→ UI: <NoteGrid notes={...} /> renders; loading.tsx shown during the navigation transition
```

## Create note

```
UI: owner clicks "New note", starts typing title/body
→ Client Component calls createNote() Server Action
→ lib/notes/actions.ts: createNote(input)
  → getOwnerId()
  → validation.ts: createNoteSchema.parse(input)
  → database: INSERT INTO notes (owner_id, title, body, state, ...) VALUES (...) RETURNING *
→ revalidatePath("/")
→ response: ActionResult<Note> { ok: true, data: note }
→ UI: new note appears in the grid (optimistic insert via useOptimistic, confirmed on response)
```

## Autosave note (edit title/body)

```
UI: owner types in the open note editor
→ components/notes/use-autosave.ts: scheduleSave(title, body) on every keystroke
  → debounced 1s; also flushed immediately on blur, editor close, visibilitychange
  → serialized: if a save is in flight, newer edits queue in pendingRef and flush next
→ flush() calls updateNote({ id, title, body, version }) Server Action
→ lib/notes/actions.ts: updateNote(input)
  → getOwnerId()
  → validation.ts: updateNoteSchema.parse(input) - enforces 300/20,000 char caps server-side
  → database: UPDATE notes SET title=?, body=?, version=version+1, updated_at=now()
              WHERE id=? AND owner_id=? AND version=? RETURNING *
  → zero rows returned → follow-up SELECT to disambiguate stale-version vs not-found/not-yours
→ revalidatePath("/")
→ response: ActionResult<Note>
  → ok: true → UI sets status "saved"
  → ok: false, kind: "conflict" → UI sets status "conflict", shows non-blocking
    "changed elsewhere, reload" banner, stops further autosaves until reload
→ UI: "Saving... / Saved" accessible live-region status updates throughout
```

## Pin / unpin

```
UI: owner clicks the pin icon on a note card
→ useTransition wraps the call; useOptimistic immediately reflects the new pinned state
→ Client Component calls pinNote(noteId) Server Action
→ lib/notes/actions.ts: pinNote(noteId)
  → getOwnerId()
  → database: UPDATE notes SET pinned = NOT pinned, updated_at = now()
              WHERE id=? AND owner_id=? AND state='active' RETURNING *
    (state='active' guard: pinning is only valid on Active notes)
→ revalidatePath("/")
→ response: ActionResult<Note>
  → ok: false → optimistic update rolls back via re-render with server-confirmed state; toast shown
→ UI: note re-sorts to top of grid (pinned-first ordering) on next render
```

## Archive

```
UI: owner clicks "Archive" on a note card or from the open editor
→ Client Component calls archiveNote(noteId) Server Action
→ lib/notes/actions.ts: archiveNote(noteId)
  → getOwnerId()
  → fetch current state+version (small helper read)
  → lib/notes/state-machine.ts: transition(currentState, "archived")
    → validates active→archived or archived→archived is allowed; throws otherwise
    → returns { state: "archived", pinned: false }
  → database: UPDATE notes SET state='archived', pinned=false, updated_at=now()
              WHERE id=? AND owner_id=? RETURNING *
→ revalidatePath("/")
→ response: ActionResult<Note>
→ UI: note disappears from the current (Active) grid view (optimistic removal), appears in Archive view
```

## Trash

```
UI: owner clicks "Move to trash" on a note card, from the open editor, or from Archive view
→ Client Component calls trashNote(noteId) Server Action
→ lib/notes/actions.ts: trashNote(noteId)
  → getOwnerId()
  → fetch current state+version
  → lib/notes/state-machine.ts: transition(currentState, "trashed")
    → allows active→trashed and archived→trashed
  → database: UPDATE notes SET state='trashed', pinned=false, trashed_at=now(), updated_at=now()
              WHERE id=? AND owner_id=? RETURNING *
→ revalidatePath("/")
→ response: ActionResult<Note>
→ UI: note disappears from current view (optimistic removal), appears in Trash view (read-only card)
```

## Restore (from Archived or Trashed)

```
UI: owner clicks "Restore" on an Archived or Trashed note card
→ Client Component calls restoreNote(noteId) Server Action
→ lib/notes/actions.ts: restoreNote(noteId)
  → getOwnerId()
  → fetch current state+version
  → lib/notes/state-machine.ts: transition(currentState, "active")
    → allows archived→active and trashed→active; always lands on active
  → database: UPDATE notes SET state='active', trashed_at=NULL, updated_at=now()
              WHERE id=? AND owner_id=? RETURNING *
    (pinned left as-is per schema default false; no prior pin to preserve)
→ revalidatePath("/")
→ response: ActionResult<Note>
→ UI: note disappears from Archive/Trash view, appears in the Active grid
```

## Permanently delete

```
UI: owner clicks "Delete forever" on a Trashed note card (or "Empty trash")
→ Client Component calls permanentlyDeleteNote(noteId) Server Action
→ lib/notes/actions.ts: permanentlyDeleteNote(noteId)
  → getOwnerId()
  → database: DELETE FROM notes WHERE id=? AND owner_id=? AND state='trashed' RETURNING id
    (state='trashed' guard: only Trashed notes can be permanently deleted)
  → cascades: any note_labels rows for this note are removed automatically (on delete cascade)
→ revalidatePath("/")
→ response: ActionResult<{ id: string }>
→ UI: note removed from Trash view permanently, no restore possible
```

## Labels (create, rename, delete, assign)

```
Create (inline from note editor):
UI: owner types a new label name in the note editor's label picker
→ Client Component calls createLabel(name) Server Action
→ lib/labels/actions.ts: createLabel(name)
  → getOwnerId()
  → validation.ts: createLabelSchema.parse({ name })
  → database: INSERT INTO labels (owner_id, name) VALUES (?, ?) RETURNING *
    (unique index on (owner_id, lower(name)) rejects a case-insensitive duplicate)
→ revalidatePath("/")
→ UI: new label appears in sidebar and note editor's label list

Assign to note:
UI: owner selects a label for the open note
→ Client Component calls assignLabelToNote(noteId, labelId) Server Action
→ lib/labels/actions.ts: assignLabelToNote(noteId, labelId)
  → getOwnerId(); verifies both note and label belong to this owner
  → database: INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)
    (composite PK prevents duplicate assignment)
→ revalidatePath("/")
→ UI: label chip appears on the note card

Rename (from sidebar "Edit labels" dialog):
UI: owner renames a label
→ Client Component calls renameLabel(labelId, newName) Server Action
→ lib/labels/actions.ts: renameLabel(labelId, newName)
  → getOwnerId(); validation
  → database: UPDATE labels SET name=? WHERE id=? AND owner_id=? RETURNING *
→ revalidatePath("/")
→ UI: every note showing this label reflects the new name (labels stored by id, not copied string)

Delete (from sidebar "Edit labels" dialog):
UI: owner deletes a label
→ Client Component calls deleteLabel(labelId) Server Action
→ lib/labels/actions.ts: deleteLabel(labelId)
  → getOwnerId()
  → database: DELETE FROM labels WHERE id=? AND owner_id=? RETURNING id
    (cascades: note_labels rows removed; notes table itself untouched - deleting a
    label only detaches it, per CONTEXT.md)
→ revalidatePath("/")
→ UI: label removed from sidebar; notes that had it lose the chip but are otherwise unaffected
```

## Search

```
UI: owner types in the search input (top bar)
→ components/notes/search-input.tsx: debounced 300ms onChange
→ Client Component calls searchNotes(query) Server Action
→ lib/search/actions.ts: searchNotes(query)
  → getOwnerId()
  → trims query; empty query short-circuits to no results (falls back to normal view)
  → database: SELECT ... WHERE owner_id=? AND state IN ('active','archived')
              AND (title ILIKE '%term%' OR body ILIKE '%term%')
              ORDER BY pinned DESC, updated_at DESC
    (Trashed notes excluded; label names not matched, per CONTEXT.md)
→ response: array of matching Note rows (client-fetched, not a Server Component render)
→ UI: results replace whatever grid is currently shown, using the same <NoteGrid> component;
  clearing the search input reverts to the current view/label filter
```
