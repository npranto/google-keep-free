# Data Model

Status: approved for MVP implementation. Vocabulary source: [`CONTEXT.md`](../../CONTEXT.md).
Overall approach: [`system.md`](./system.md).

Three tables. No local users table — every owned row carries an opaque Clerk user ID
(per [ADR 0002](../adr/0002-clerk-for-authentication.md)).

## `notes`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` primary key, `default random()` | |
| `owner_id` | `text`, not null | Clerk user ID. Every query/mutation filters on this. |
| `title` | `varchar(300)`, not null, default `''` | Server-enforced cap; backstops Zod validation. |
| `body` | `varchar(20000)`, not null, default `''` | Server-enforced cap; backstops Zod validation. |
| `state` | `note_state` enum, not null, default `'active'` | One of `active` / `archived` / `trashed`. See State representation below. |
| `color` | `note_color` enum, not null, default `'default'` | Fixed palette (~8-12 named tokens incl. `default`), not raw hex. Exact token list settled during the design-contract phase. |
| `pinned` | `boolean`, not null, default `false` | Only meaningful when `state = 'active'`; cleared on any transition away from Active. |
| `version` | `integer`, not null, default `1` | Optimistic concurrency. Incremented on every successful `updateNote`. |
| `created_at` | `timestamptz`, not null, default `now()` | |
| `updated_at` | `timestamptz`, not null, default `now()` | Drives grid sort order. |
| `trashed_at` | `timestamptz`, nullable | Set when `state` becomes `trashed`; cleared on restore. Null otherwise. Stored from day one so a future auto-purge job needs no migration. |

**Indexes**:
- `(owner_id, state)` — covers the three grid views (Active/Archive/Trash) filtered per owner.
- `(owner_id, updated_at)` — supports "most-recently-updated first" ordering.

## `labels`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` primary key, `default random()` | |
| `owner_id` | `text`, not null | |
| `name` | `varchar(100)`, not null | Display casing preserved as typed. |
| `created_at` | `timestamptz`, not null, default `now()` | |

**Constraints**:
- Unique functional index on `(owner_id, lower(name))` — enforces "names unique per
  owner, case-insensitive" at the database level (closes the race a check-then-insert
  in application code alone can't close), while `name` itself keeps the original
  display casing.

## `note_labels` (join table)

| Column | Type | Notes |
|---|---|---|
| `note_id` | `uuid`, not null, `references notes(id) on delete cascade` | |
| `label_id` | `uuid`, not null, `references labels(id) on delete cascade` | |

**Constraints**:
- Composite primary key `(note_id, label_id)` — prevents duplicate assignment of the
  same label to the same note; no separate surrogate `id` needed since nothing else
  references rows in this table.
- `on delete cascade` on both foreign keys: deleting a note removes its join rows;
  deleting a label removes its join rows. Per `CONTEXT.md`, deleting a label only
  detaches it from notes — the cascade only ever removes rows in `note_labels`,
  never touches `notes` itself.

**Indexes**:
- `(label_id)` — supports the label-view query ("notes with this label"). The
  primary key's leading column already covers "labels for this note" lookups.

## Relationships

```
notes (1) ──< note_labels >── (1) labels
  │
  owner_id = Clerk userId (opaque, not a foreign key — no local users table)
```

- One Note belongs to exactly one Owner, is in exactly one State, and has exactly
  one Color at a time.
- One Note can carry many Labels; one Label can be attached to many Notes
  (many-to-many via `note_labels`).
- Labels belong to exactly one Owner; names are unique per Owner (case-insensitive).

## Ownership rules

Every read and write includes `owner_id = <verified Clerk session userId>` as a
mandatory condition on the query/statement itself — never a separate check performed
after fetching a row. See `system.md`'s Authorization section for the full reasoning.
There is nothing in this schema that allows a row to exist without an `owner_id`, and
nothing that allows one owner's request to touch another owner's rows at the SQL
level.

## State representation

`state` is a single Postgres enum column (`note_state`: `active` | `archived` |
`trashed`) — not three booleans, not a separate status table. This makes illegal
combinations (e.g. "both archived and trashed") unrepresentable by construction,
rather than something application code has to defensively rule out.

Allowed transitions (enforced by the pure `transition()` function in
`lib/notes/state-machine.ts`, not a DB trigger or check constraint):

```
active   ──▶ archived
active   ──▶ trashed
archived ──▶ trashed
archived ──▶ active     (restore)
trashed  ──▶ active     (restore)
```

There is no `trashed ──▶ archived` transition (trashing an archived note does not
require first restoring it; restoring always lands on `active`, never `archived`).

`pinned` is cleared as a side effect whenever a note transitions away from `active`
(to `archived` or `trashed`); it is left untouched on restore-to-`active` (a note
can't have been pinned while Archived/Trashed, since pinning is only valid on Active
notes).

Permanent deletion is a hard `DELETE` guarded by `WHERE state = 'trashed'` in
addition to the ownership condition — this guard is itself the enforcement that only
Trashed notes can be permanently deleted, per `CONTEXT.md`.

## Concurrency / version behavior

`updateNote` (the only mutation that changes `title`/`body`) performs a single
atomic statement:

```sql
UPDATE notes
SET title = ?, body = ?, version = version + 1, updated_at = now()
WHERE id = ? AND owner_id = ? AND version = ?
RETURNING *;
```

- If the row's current `version` doesn't match the one the client last read, zero
  rows are updated — Postgres itself is the referee; there is no separate locking
  mechanism and no race window between "check the version" and "write."
- Zero rows returned triggers a cheap follow-up `SELECT` to disambiguate "version was
  stale" (real conflict) from "note doesn't exist / isn't yours" (a different
  `ActionResult` error kind) — see `system.md`'s Errors section.
- Every other mutation (`pinNote`, `archiveNote`, `trashNote`, `restoreNote`, label
  assignment) does **not** check `version` — the brief's optimistic-concurrency
  requirement is specifically about concurrent edits to note text, not toggle-style
  state changes, which are idempotent and don't carry a meaningful "stale write"
  risk in the same way.
