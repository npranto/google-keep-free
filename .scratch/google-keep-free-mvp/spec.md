Status: ready-for-agent

# Google Keep Free MVP — Implementation Specification

Consolidates decisions from `CONTEXT.md`, `docs/product/PROJECT_BRIEF.md`,
`docs/adr/0001-single-full-stack-nextjs-app-on-vercel-and-neon.md`,
`docs/adr/0002-clerk-for-authentication.md`, `docs/architecture/system.md`,
`docs/architecture/data-model.md`, `docs/architecture/flows.md`,
`docs/design/ui-spec.md`, and `docs/design/wireframes.md` into one
implementation-ready contract. All product, domain, architecture, and design
decisions referenced here are settled; this document synthesizes them, it
does not reopen them.

## Problem

People need a fast, low-friction way to capture and organize short-form
notes (quick thoughts, lists, reminders-to-self) without the overhead of
heavier note-taking or productivity tools.

## Goals

The MVP must let an individual Owner:

- Sign up / log in via Clerk.
- Create a Note (title + body) that autosaves as they type.
- Organize Notes: pin, assign a color, assign Labels.
- Browse and search their Notes grid to find something later.
- Archive Notes they no longer need active, or Trash Notes they want gone,
  and restore either until permanently deleted.
- Experience this as fast and polished on both desktop and mobile, with
  accessibility considered from the start (WCAG 2.2 AA target).

## Non-goals

Explicitly excluded from MVP (per `PROJECT_BRIEF.md`):

- Realtime collaboration or sharing Notes with other users.
- Reminders.
- Image uploads.
- Rich-text editing (plain text title/body only).
- Offline-first synchronization.
- Scheduled trash auto-purge (manual "Delete forever" / "Empty trash" only;
  `trashed_at` is stored so this can be added later without a migration).
- Pagination / infinite scroll on the grid.
- Merge UI for autosave version conflicts.

## Domain model

Canonical terms and definitions live in `CONTEXT.md`; do not rename or
reinterpret them. Key relationships and invariants an implementation agent
must preserve:

- A **Note** belongs to exactly one **Owner**, is in exactly one **State**
  (`Active` / `Archived` / `Trashed`), and has exactly one **Color** at a
  time.
- A **Note** can carry many **Labels**; a **Label** can be attached to many
  Notes (many-to-many).
- **Label** names are unique per Owner, case-insensitive, with display
  casing preserved.
- **Pinned** is only meaningful on an Active Note; it is cleared whenever a
  Note transitions away from Active (to Archived or Trashed), and left
  untouched when restoring to Active.
- Allowed State transitions: `Active → Archived`, `Active → Trashed`,
  `Archived → Trashed`, `Archived → Active` (restore), `Trashed → Active`
  (restore). There is no `Trashed → Archived` transition.
- Only a Trashed Note can be permanently deleted.
- Deleting a Label only detaches it from Notes; it never deletes the Notes
  themselves.
- Identity is entirely owned by Clerk; there is no local users table. The
  Clerk user ID is the opaque `owner_id` on every owned row.

## User journeys

**Authenticate**: an unauthenticated visitor is redirected to Clerk's
hosted sign-in/sign-up; on a verified session, the app resolves the Clerk
`userId` as the Owner for all subsequent reads/writes and renders the Notes
grid. No local user record is created.

**Create a Note**: Owner clicks "Take a note...", the composer expands
in-place (not a dialog); typing begins autosave immediately; there is no
explicit Save button. The expanded composer begins as client-local draft
state only — no database Note exists while both title and body are empty.
The first autosave/flush that contains any content calls `createNote`,
which persists the Note and returns its id and `version`; every subsequent
autosave for that draft uses `updateNote` with that id/version (see the
Autosave section). Closing a composer that never received any content
performs no database write and discards the draft silently. A new Note is
always created as Active, regardless of whether the composer was opened
from the Notes view or a Label view (Labels are never auto-assigned from
the current view).

**Edit / autosave a Note**: opening a Note card (except a Trashed one) opens
a `Dialog` (full-screen on mobile) with editable title/body. Every keystroke
schedules a debounced save; flush also happens on blur, dialog close, and
(best-effort) `visibilitychange`. Status is shown as "Saving.../Saved" in an
accessible live region. See the dedicated Autosave section below for full
behavior.

**Pin / unpin**: available only on Active Notes; toggling re-sorts the
Note to the pinned group at the top of the grid; optimistic UI reflects the
change instantly and rolls back on server rejection.

**Archive**: moves an Active Note to Archived; clears `pinned`; the Note
leaves the current grid and appears under Archive.

**Trash**: moves an Active or Archived Note to Trashed; clears `pinned`;
sets `trashed_at`; the Note becomes read-only.

**Restore**: moves an Archived or Trashed Note back to Active (always to
Active, never to Archived); clears `trashed_at` if set.

**Permanent deletion**: irreversibly deletes a Trashed Note (or all Trashed
Notes via "Empty trash"); requires an `AlertDialog` confirmation since it is
the only truly destructive, unrecoverable action along with "Empty trash"
and "Delete label".

**Color**: Owner assigns one color from a fixed named palette (including a
`default` of no color) via a `ColorPickerPopover`, available from the Note
card toolbar and the open editor.

**Labels**: Owner creates and assigns Labels inline from the note editor's
label picker (typing a new name creates it; selecting an existing one
assigns it). A sidebar "Edit labels" dialog allows renaming and deleting
existing Labels (no creation there). Selecting a Label in the sidebar shows
that Label's Active Notes only.

**Search**: Owner types in the top-bar search field (debounced ~300ms);
results are a case-insensitive substring match on title/body across Active
+ Archived Notes (Trashed excluded, Label names not matched); results
replace the grid content in place without changing the URL/route; clearing
the query reverts to the prior view/label.

## Functional requirements

- Sign up and log in (Clerk-hosted).
- Create, edit Notes with title and body; autosave while editing.
- Pin / unpin Notes (Active only).
- Archive / restore Notes.
- Move to Trash / restore from Trash.
- Permanently delete a single Trashed Note, or empty the entire Trash.
- Assign one color per Note from the fixed palette.
- Create, assign, rename, and delete Labels; view Notes filtered by Label.
- Search Notes by title/body substring across Active + Archived.
- Responsive Notes grid: masonry-style multi-column on desktop/tablet,
  single column on mobile.
- No hard cap on the number of Notes or Labels per Owner for MVP.
- Title capped at 300 characters, body at 20,000 characters, enforced
  server-side.

## Architecture constraints

Implementation must follow the approved architecture in
`docs/architecture/system.md` as-is — do not introduce new architectural
patterns. Key constraints:

- One Next.js (App Router) application; no separate backend service, no
  `/api/*` route handlers for MVP (the one named future exception, a Vercel
  Cron endpoint for trash auto-purge, is out of scope now).
- **Reads**: Server Components query Postgres directly via Drizzle at
  render time. No client-side data-fetching library (no React Query/SWR).
- **Writes**: one Server Action per operation (`createNote`, `updateNote`,
  `pinNote`, `archiveNote`, `trashNote`, `restoreNote`,
  `permanentlyDeleteNote`, `createLabel`, `renameLabel`, `deleteLabel`,
  `assignLabelToNote`) — not one generic patch-style action. `searchNotes`
  is not a mutation; it is the dedicated client-initiated server-side read
  used by search (see Search section) and does not call `revalidatePath`.
- No global client state store (no Redux/Zustand); `useOptimistic` /
  `useTransition` (React built-ins) own in-flight mutation UI state.
- A single authenticated route (`/`) renders all four grid views (Active,
  Archived, Trashed, per-Label) disambiguated by `?view=`/`?label=` query
  params. Search is not a route; it's a client-side debounced overlay.
- Feature-folder module structure under `lib/` (`db`, `notes`, `labels`,
  `search`, `auth`, `shared`) and `components/` (`notes`, `labels`, `ui`),
  colocated by domain concept, not technical layer. No generic
  repository/DAO layer, no CQRS framework, no dependency injection
  container — Drizzle's query builder is used directly.
- **Server responsibilities**: resolve the Owner from the verified Clerk
  session (`getOwnerId()`), never from client input; scope every query and
  mutation with `WHERE owner_id = ?` on the same statement that reads or
  writes; validate all mutation input with Zod before touching the
  database; enforce Note state transitions via a pure `transition()`
  function (no DB trigger); enforce optimistic-concurrency version checks
  atomically inside the mutating SQL statement; call `revalidatePath("/")`
  after every mutation.
- **Client responsibilities**: render what the server sent; own only
  transient browser-only state (autosave debounce/in-flight/pending queue,
  optimistic toggle state, search debounce/result-swap); never independently
  decide authorization or validation outcomes.
- **Query architecture**: named query functions per view (`getActiveNotes`,
  `getArchivedNotes`, `getTrashedNotes`, `getNotesForLabel`) sharing a
  private `selectOwnedNotes()` helper for ownership scoping and sort order
  (`pinned DESC, updated_at DESC`). `searchNotes()` is a separate query
  (`ILIKE` on title/body, Active + Archived only).
- **Caching/revalidation**: `revalidatePath("/")` after every mutating
  Server Action is sufficient, since all views share one route. Drizzle
  reads are not `fetch()` calls and are not subject to the Next.js fetch
  Data Cache. No `revalidateTag`, no `unstable_cache`.
- **Errors**: expected/recoverable outcomes (validation failure, not-found,
  version conflict) are returned as `{ ok: false, error: { kind, message } }`
  from Server Actions; everything else throws and is caught by Next.js
  `error.tsx` boundaries, shown as a generic "something went wrong" message.
- No Postgres Row-Level Security, no event bus, no microservices, no
  external logging/APM service, no `pg_trgm`/full-text search, no
  auto-run migrations in the build pipeline — all explicitly deferred
  upgrade paths, not gaps to fill now.

## Data requirements

Source of truth: `docs/architecture/data-model.md`. Three tables, no local
users table:

- **`notes`**: `id` (uuid pk), `owner_id` (text, Clerk user ID), `title`
  (varchar(300), default `''`), `body` (varchar(20000), default `''`),
  `state` (`note_state` enum: `active`/`archived`/`trashed`, default
  `active`), `color` (`note_color` enum, ~10 named tokens + `default`),
  `pinned` (boolean, default `false`), `version` (integer, default `1`,
  incremented on every successful `updateNote`), `created_at`,
  `updated_at`, `trashed_at` (nullable, set on trash, cleared on restore).
  Indexes: `(owner_id, state)`, `(owner_id, updated_at)`.
- **`labels`**: `id` (uuid pk), `owner_id`, `name` (varchar(100), casing
  preserved). Unique functional index on `(owner_id, lower(name))`.
- **`note_labels`** (join table): `note_id`, `label_id`, composite primary
  key, both foreign keys `on delete cascade`. Index on `(label_id)` for
  label-view lookups.
- `state` is a single enum column, not booleans or a status table, making
  illegal combinations unrepresentable.
- `updateNote` is the only mutation touching `title`/`body`, and is the
  only one that checks `version` (single atomic
  `UPDATE ... WHERE id=? AND owner_id=? AND version=? RETURNING *`; zero
  rows returned means stale write or not-found/not-yours, disambiguated by
  a cheap follow-up `SELECT`). Toggle-style mutations (`pinNote`,
  `archiveNote`, `trashNote`, `restoreNote`, label assignment) do not check
  `version` — they are idempotent state changes, not concurrent-edit risks.
- Permanent deletion is a hard `DELETE` guarded by
  `WHERE state = 'trashed'` in addition to the ownership condition.

## UI/UX requirements

Source of truth: `docs/design/ui-spec.md` and `docs/design/wireframes.md`.
Summary only — implementation follows those documents' exact behavior, not
a reinterpretation:

- **App shell**: sticky top bar (sidebar toggle on tablet/mobile, search,
  Clerk `UserButton`), left sidebar (Notes/Archive/Trash/Labels
  navigation), main content (composer + grid). Structurally identical
  across views; only heading/selection/grid contents change.
- **Navigation**: sidebar always expanded on desktop, an icon rail with
  expandable overlay on tablet, a hidden full-height overlay drawer on
  mobile. Sidebar state is ephemeral, not persisted.
- **Note creation**: inline expanding composer (not a dialog), no explicit
  Save; empty composer discards silently on close; always creates Active.
- **Note cards**: title/body preview truncated, wrapping label chips,
  color-reflecting background/border; pin icon always visible (filled vs.
  outline, not hover-gated); action toolbar hover/focus-revealed on
  pointer devices, always visible on touch devices, always revealed on
  keyboard focus.
- **Editor**: centered `Dialog` (desktop/tablet) or full-screen `Dialog`
  (mobile); flushes pending autosave on close; Trashed Notes open a
  read-only variant (static text, Restore + Delete forever only, no
  autosave status).
- **Search**: persistent field (desktop/tablet), icon-to-full-width on
  mobile; results replace the grid in place with a "Results for '<query>'"
  heading, flat (no pinned grouping), no result count or highlighting.
- **Archive/Trash views**: same grid/card components, no composer, no
  pinned grouping; Trash cards are read-only with only Restore/Delete
  forever; Trash heading includes an "Empty trash" button (disabled when
  empty).
- **Labels**: inline create+assign from the editor's label picker; a
  separate "Edit labels" dialog (sidebar) for rename/delete only.
- **Responsive behavior**: grid columns 4 (desktop) / 2-3 (tablet) / 1
  (mobile); pure CSS multi-column masonry (`column-count` +
  `break-inside: avoid`), column-major fill order accepted as a tradeoff.
- **Keyboard**: Escape closes the topmost layer (popover → dialog →
  collapse empty composer); Enter in title moves focus to body; standard
  Tab/Shift+Tab focus trapping in open Dialogs/Popovers (Radix default);
  native Radix roving-tabindex for swatch grids/menus. No custom global
  shortcuts, no custom grid arrow-key navigation.
- **Status feedback**: plain-text "Saving.../Saved" live region in the
  editor's toolbar only (not the inline composer), `aria-live="polite"`,
  fading to nothing ~2s after "Saved".
- **Loading states**: `loading.tsx` skeleton grid for route-level view
  navigation; existing grid dimmed (no skeleton swap) during the ~300ms
  search debounce; toggle mutations rely solely on optimistic UI, no
  separate loading state.
- **Empty states**: one shared `EmptyState` component with per-view copy
  (Notes / Archive / Trash / Label / Search), per `ui-spec.md` Section 14.
- **Error states**: non-blocking toast for expected/recoverable failures
  and failed optimistic toggles (with rollback); route-segment `error.tsx`
  fallback for unexpected/thrown errors; version conflicts use a persistent
  inline banner, not a toast (see Autosave section); `AlertDialog`
  confirmation only for permanent delete (single note), empty trash, and
  delete label — every other transition (trash, archive, restore) is
  one-click, no confirmation.

## Autosave

- **Debounce**: 1 second after the last keystroke, scheduled entirely in a
  client hook (`useAutosave`), not in the Server Action.
- **Flush** (bypasses the debounce timer): on blur, on editor dialog close,
  and on `visibilitychange` (tab hidden). The `visibilitychange` flush is
  best-effort only — it is initiated when the event fires, but nothing
  guarantees the browser lets it complete if the tab/window is suspended
  or closed immediately afterward. It is not a durability guarantee; it
  only narrows the window in which unsaved edits could be lost.
- **Serialization**: only one save in flight per Note at a time; a newer
  edit made while a save is in flight is queued and flushed immediately
  after the in-flight save resolves.
- **Initial persistence**: while a Note draft has no database row yet (see
  "Create a Note" above), the first debounce/flush that has any content
  calls `createNote` instead of `updateNote`, and stores the returned id
  and `version` for all subsequent saves of that Note. A draft that is
  closed before any save ever fires never calls `createNote`.
- **Version handling**: once a Note exists, each save carries its
  `version`; the server performs a single atomic
  `UPDATE ... WHERE id=? AND owner_id=? AND version=? RETURNING *`,
  incrementing `version` and `updated_at` on success.
- **Conflict behavior**: zero rows returned means either a stale version or
  a not-found/not-yours condition (disambiguated server-side and returned
  as a distinct `ActionResult` error kind). On a genuine version conflict,
  the UI replaces the status text with a persistent inline warning banner:
  "This note changed elsewhere. Reload to see the latest version." Further
  autosaves are suspended until "Reload" is clicked (which re-fetches the
  server version and discards local unsaved edits — no merge UI). Closing
  the dialog while conflicted discards local edits the same way.
- **Status feedback**: `idle | saving | saved | conflict` states drive a
  plain-text, `aria-live="polite"` status region in the editor toolbar:
  "Saving..." while in flight, "Saved" for ~2s then fading to idle, or the
  conflict banner described above.

## Authentication and authorization

- Identity comes entirely from Clerk (ADR 0002); there is no local users
  table and no local password/session handling.
- Owner identity is always derived server-side via one function
  (`getOwnerId()`) that reads the verified Clerk session — never accepted
  as a parameter from the client.
- A client-provided `ownerId`/owner identifier is never trusted for any
  query or mutation, under any circumstance.
- Every Owner-owned query and mutation (`notes`, `labels`, `note_labels`
  indirectly via its parents) must include `owner_id = getOwnerId()` as a
  mandatory condition on the same SQL statement that reads or writes the
  row — never a separate check-then-act step. A row belonging to another
  Owner and a nonexistent row must be indistinguishable in the response
  (no information leak about other Owners' data).

## Validation

- Zod schemas colocated in each feature's `validation.ts`
  (`lib/notes/validation.ts`, `lib/labels/validation.ts`), parsed at the
  top of every Server Action before any database call.
- Title: max 300 characters. Body: max 20,000 characters. Both enforced
  server-side as the real guarantee (backstopped further by the Postgres
  column types), and mirrored client-side (same schemas/derived constants)
  for UX only — never client-only enforcement.
- Label name: max 100 characters; uniqueness per Owner is enforced at the
  database level via a case-insensitive functional unique index (not just
  application-level check-then-insert), closing the race condition a
  check-then-insert alone cannot close.
- Color must be one of the fixed enum tokens (not raw hex or free input).

## Accessibility

Target: WCAG 2.2 AA (the current W3C Recommendation as of project start).

MVP verification is targeted and pragmatic, not an exhaustive audit:

- Use accessible interactive primitives (Radix / shadcn) as-is rather than
  custom-building focus/keyboard/ARIA behavior.
- Every icon-only action has a visible-to-assistive-tech `aria-label`
  (never relying on a tooltip alone).
- Color is never the only signal (pin uses filled-vs-outline shape; color
  swatches carry `aria-label`s; conflict/error states pair icon + text).
- Every input has a real associated `<label>` (visually hidden via
  `sr-only` where appropriate) — never placeholder-as-label.
- Contrast for every note color token's text-on-background pairing is
  verified once at WCAG AA during token definition, not re-checked at
  runtime.
- An automated `axe-core` pass runs in CI.
- One manual keyboard-only pass over the core flow (create, edit, pin,
  archive, trash, search) is performed before calling the MVP done.

## Search

- Scope: Note `title` and `body` only — Label names are never matched.
- Included states: Active and Archived Notes. Trashed Notes are always
  excluded.
- Matching: case-insensitive substring (`ILIKE`), scoped per Owner.
- Trigger: client-side debounced (~300ms) search-as-you-type input in the
  top bar; not a route/URL change.
- Scope of search is global (Active + Archived) regardless of which
  view/Label was selected when typing began — it does not narrow to the
  currently selected view.
- Results reuse the standard grid/card components, flat (no pinned
  grouping), no result count, no matched-text highlighting.
- Clearing the query reverts to whichever view/Label was selected before
  searching.
- Named upgrade path (not MVP scope): `pg_trgm` for fuzzy/typo-tolerant
  matching if volume or requirements ever demand it.

## Error behavior

- **Validation failures / not-found / not-yours** (Server Action returns
  `ok: false`): non-blocking toast with a specific, actionable message.
- **Failed optimistic toggle** (pin/archive/trash/restore/color rejected by
  the server): UI rolls back to server-confirmed state via re-render, plus
  a toast: "Couldn't update note - please try again."
- **Autosave version conflict**: not a toast — a persistent inline warning
  banner in the editor with a "Reload" action, per the Autosave section.
  Non-blocking: the Owner can keep reading/typing, but further autosaves
  are suspended until Reload.
- **Unexpected/thrown errors** (dropped DB connection, genuine bug): caught
  by the nearest route-segment `error.tsx`, showing "Something went wrong"
  and a "Try again" (`reset()`) button — no stack trace or technical detail
  shown to the Owner.
- **Destructive confirmations**: an `AlertDialog` names the specific
  consequence for permanent delete (single Note), "Empty trash", and
  delete Label; "Cancel" is the default-focused button. No confirmation for
  trash/archive/restore (all reversible).
- No dedicated offline-detection UI; network failures surface through the
  same toast/rollback path as any other failure.

## Testing requirements

Three layers, matching the architecture's own layers (per `system.md`):

- **Domain/unit tests**: the pure `transition()` function in
  `lib/notes/state-machine.ts` (Active/Archived/Trashed + pinned-clearing
  transitions), with no I/O or mocking.
- **Integration/server behavior**: Server Actions tested against a real
  Postgres (local Docker for dev, GitHub Actions' Postgres service
  container for CI) — no mocked Drizzle client, since ownership scoping and
  version-conflict atomicity are exactly the SQL semantics a mock would
  have to reimplement. Must cover: ownership scoping (an Owner cannot read
  or mutate another Owner's rows), the version-conflict `updateNote` path
  (stale version vs. not-found/not-yours disambiguation), and state
  transition guards (e.g. pin only on Active, permanent delete only on
  Trashed).
- **Accessibility checks**: an automated `axe-core` pass in CI.
- **Playwright end-to-end tests**: the full core user journey — sign in,
  create, edit/autosave, pin, archive, trash, restore, search.
- **Manual verification**: one keyboard-only pass over the core flow
  before calling the MVP done.

## Performance / quality expectations

Only what is already implied or explicitly decided — no invented targets:

- Toggle-style mutations (pin/archive/trash/color) must feel instant via
  optimistic UI (`useOptimistic`/`useTransition`), not through a specific
  numeric latency target.
- Autosave debounce is 1s after the last keystroke; search debounce is
  ~300ms — both explicit, agreed values, not tunable performance knobs.
- No hard cap on Note/Label count for MVP; note-count growth large enough
  to matter is the named trigger to revisit pagination, not something
  pre-built speculatively.
- No specific page-load / Core Web Vitals numeric target has been set for
  MVP; the architecture's choice to avoid unnecessary client-side
  data-fetching layers and to keep Server Components as the default read
  path is the agreed mechanism for keeping the app fast.

## Acceptance criteria

1. Given an unauthenticated visitor, when they open the app, then they are
   redirected to Clerk's hosted sign-in, and no local user record is ever
   created.
2. Given an authenticated Owner, when they create a Note with a title and
   body and refresh the page, then the Note remains visible in the Active
   grid.
3. Given an authenticated Owner editing a Note, when they stop typing for
   1 second (or blur the field, close the editor, or switch tabs), then
   their edit is saved without an explicit save action, and the status
   region reflects "Saving..." then "Saved".
4. Given an authenticated Owner with the same Note open and edited
   elsewhere first, when they attempt to save a stale version, then the
   save is rejected, a "changed elsewhere" banner appears, and their local
   edit is not silently overwritten or silently discarded until they
   choose Reload or close the dialog.
5. Given an authenticated Owner, when they pin an Active Note, then it
   appears in a pinned group above unpinned Notes on next render, and
   pinning is unavailable on Archived/Trashed Notes.
6. Given an authenticated Owner, when they archive an Active Note, then it
   disappears from the Active grid, appears in Archive, and is no longer
   pinned.
7. Given an authenticated Owner, when they trash an Active or Archived
   Note, then it disappears from its prior view, appears read-only in
   Trash, and is no longer pinned.
8. Given an authenticated Owner, when they restore a Note from Archive or
   Trash, then it appears in the Active grid (never Archived) and is
   editable again.
9. Given an authenticated Owner, when they permanently delete a Trashed
   Note (or empty the Trash) after confirming, then the Note is gone and
   cannot be restored; attempting to permanently delete a non-Trashed Note
   is not possible through the UI.
10. Given an authenticated Owner, when they assign a color to a Note, then
    the Note's card and editor reflect that color, and only one color is
    ever active at a time.
11. Given an authenticated Owner, when they create a Label inline from a
    Note editor and assign it, then the Label appears in the sidebar and
    on the Note's card; renaming it updates every Note showing it; deleting
    it removes the chip from Notes without deleting any Note.
12. Given an authenticated Owner, when they attempt to create a Label whose
    name matches an existing Label case-insensitively, then the duplicate
    is rejected.
13. Given an authenticated Owner, when they search for text that appears in
    an Active or Archived Note's title or body, then that Note appears in
    the results; a Trashed Note containing the same text never appears,
    and a Note matching only by Label name never appears.
14. Given two different Owners, when either one queries or mutates a Note
    or Label, then they can never read or affect the other Owner's rows,
    regardless of client-supplied identifiers.
15. Given an authenticated Owner using only a keyboard, when they perform
    the core flow (create, edit, pin, archive, trash, restore, search),
    then every action is reachable and operable without a mouse, and focus
    is never trapped unexpectedly.

## Out of scope

Repeated here so implementation agents do not expand scope:

- Realtime collaboration or sharing Notes with other users.
- Reminders.
- Image uploads.
- Rich-text editing.
- Offline-first synchronization.
- Scheduled/automatic trash purging (manual only for MVP).
- Merge UI for autosave conflicts (Reload/discard only).
- Pagination or infinite scroll on the grid.
- Any `/api/*` route handlers (no Vercel Cron endpoint yet).
- Postgres Row-Level Security.
- `pg_trgm`/full-text/fuzzy search.
- External logging/APM/error-tracking service.
- A separate persistent staging environment (Vercel Preview Deployments
  serve that role).

## Open questions

None. Every decision needed to begin implementation was found already
resolved across `CONTEXT.md`, the ADRs, and the architecture/design docs.
No contradictions or impossible requirements were found between these
sources.

## Implementation constraints

- Do not change approved domain vocabulary (`CONTEXT.md` is authoritative;
  use "Owner", "Note", "State", "Active"/"Archived"/"Trashed", "Restore",
  "Label", "Color", "Pinned" exactly as defined there).
- Do not redesign the architecture in `docs/architecture/system.md` or the
  schema in `docs/architecture/data-model.md` — implement them as
  specified.
- Do not invent new product or UI behavior beyond `docs/design/ui-spec.md`
  and `docs/design/wireframes.md`.
- Do not introduce unnecessary abstractions (no generic repository layer,
  no CQRS, no dependency injection container, no client-side data-fetching
  library, no global client state store) — all explicitly ruled out.
- Do not trust client-provided ownership identifiers under any
  circumstance; always derive the Owner from the verified Clerk session
  server-side.
- Do not add dependencies without a concrete need already named in the
  architecture docs (e.g. do not add a JS masonry library, React
  Query/SWR, Redux/Zustand, or an external logging service).
- Do not auto-run database migrations during the Vercel build.
