# System Architecture

Status: approved architecture for MVP implementation. Builds on
[ADR 0001](../adr/0001-single-full-stack-nextjs-app-on-vercel-and-neon.md) (Next.js
on Vercel + Neon) and [ADR 0002](../adr/0002-clerk-for-authentication.md) (Clerk
auth). Domain vocabulary is in [`CONTEXT.md`](../../CONTEXT.md). Product scope is in
[`docs/product/PROJECT_BRIEF.md`](../product/PROJECT_BRIEF.md).

## Overall architecture

One Next.js (App Router) application, no separate backend service. Reads and writes
both happen inside the same deployable, split by React Server Component conventions
rather than by a network boundary:

- **Reads**: Server Components query Postgres directly via Drizzle during render.
- **Writes**: Server Actions, one per operation, invoked from Client Components.
- **No `/api/*` route handlers**, with one narrow future exception: a Vercel Cron
  endpoint for trash auto-purge, if/when that's built (Cron jobs call a URL, not a
  Server Action). Not part of MVP.

There is no client-side data-fetching library (no React Query/SWR) and no global
client state store (no Redux/Zustand) — Server Components own all read state, and
`useOptimistic`/`useTransition` (React built-ins) own in-flight mutation UI state.

## Frontend / backend boundary

There is no separate "backend" to draw a boundary against — the boundary is between
Server Components/Actions (run only on the server, have direct DB access) and Client
Components (run in the browser, call Server Actions, never touch the database
directly). Every Server Action re-derives the caller's identity from the verified
Clerk session server-side; it never trusts an `ownerId` passed from the client.

## Application / module structure

Feature-folders under `lib/`, colocated by domain concept, not by technical layer:

```
lib/
  db/
    schema.ts          # all Drizzle tables: notes, labels, note_labels
    index.ts             # Drizzle client + Neon connection
    migrations/           # generated SQL migrations, checked into git
  notes/
    queries.ts             # getActiveNotes, getArchivedNotes, getTrashedNotes, getNotesForLabel
    actions.ts               # createNote, updateNote, pinNote, archiveNote, trashNote,
                              # restoreNote, permanentlyDeleteNote
    state-machine.ts          # pure transition() function - no DB, no I/O
    validation.ts               # Zod schemas for note input
  labels/
    queries.ts                    # getLabels, getNotesForLabel (label-side)
    actions.ts                      # createLabel, renameLabel, deleteLabel, assignLabelToNote
    validation.ts
  search/
    actions.ts                        # searchNotes
  auth/
    current-owner.ts                    # getOwnerId(): the one place that calls Clerk's auth()
  shared/
    result.ts                             # ActionResult<T> discriminated union
  env.ts                                    # Zod-validated environment variables
  log.ts                                     # structured logging helper
app/
  layout.tsx                                  # root layout: ClerkProvider, fonts
  (app)/
    layout.tsx                                  # authenticated shell: sidebar + top bar, auth guard
    page.tsx                                      # "/" - reads view/label searchParams, renders grid
    loading.tsx                                     # skeleton grid, shown during navigation
    error.tsx                                         # error boundary for this route segment
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
components/
  notes/                                               # NoteCard, NoteGrid, NoteEditor, SearchInput,
                                                          # use-autosave.ts
  labels/                                                # label sidebar, edit-labels dialog
  ui/                                                     # shadcn/ui primitives
```

Each feature folder is a self-contained vertical slice: implementing or debugging
labels means opening `lib/labels/` and `components/labels/`, not chasing logic across
a controller/service/repository stack. There is no generic repository layer, no
CQRS framework, no dependency injection container — Drizzle's query builder is used
directly, since it's already SQL-shaped (the reason it was chosen over Prisma per
ADR 0001).

## Routing

A single authenticated route (`/`) renders all four grid views (Active, Archived,
Trashed, per-Label), disambiguated by query params (`?view=archive`, `?label=<id>`)
rather than by distinct URLs. This preserves refresh/back-button persistence of the
current filter without needing near-duplicate page files. Search is not a route —
it's a client-side debounced input whose results replace the grid in place, since
search has no bookmarking/deep-link requirement.

## Server responsibilities

- Resolve the authenticated owner from the Clerk session (`getOwnerId()`), never
  from client-supplied input.
- Scope every query and mutation to that owner via `WHERE ownerId = ?` — baked into
  the SQL itself, not a separate authorization middleware layer.
- Validate all mutation input with Zod before touching the database.
- Enforce Note state-transition rules via a pure `transition()` function.
- Enforce optimistic-concurrency version checks atomically inside the mutating SQL
  statement itself.
- Revalidate the shared route after every mutation.

## Client responsibilities

- Render whatever the server sent (Server Components own the data).
- Own transient, browser-only state: the autosave debounce/in-flight/pending queue,
  optimistic UI updates for quick toggles (pin/archive/trash/color), and the search
  input's debounce and result-swap logic.
- Never independently decide authorization or validation outcomes — always defers to
  what the Server Action returns.

## Authorization

Every table row (`notes`, `labels`) carries an opaque `ownerId` (the Clerk user ID,
per ADR 0002 — no local users table). Every query and mutation includes
`ownerId = getOwnerId()` as a mandatory condition on the same statement that reads or
writes the row — not a separate check-then-act step. This makes "not found" and "not
yours" indistinguishable by design (a deliberate choice: no information about another
owner's rows leaks through error responses).

No Postgres Row-Level Security (RLS) for MVP — RLS earns its keep when multiple trust
levels of code touch the same database (an admin tool, a background job with broader
access); this app has exactly one code path (Clerk-authenticated requests through
this app) touching the database, so RLS would defend against a threat model that
doesn't exist yet. Noted here as the concrete upgrade trigger if that ever changes.

## Validation

Zod schemas colocated in each feature's `validation.ts`, parsed at the top of every
Server Action before any database call. The same schemas (and derived constants, like
the color palette) are imported into client-side forms too, so limits (title ≤300
chars, body ≤20,000 chars) are defined once and enforced both for UX (client) and as
the real guarantee (server) — never client-only.

## Query architecture

Named query functions per view (`getActiveNotes()`, `getArchivedNotes()`,
`getTrashedNotes()`, `getNotesForLabel(labelId)`), sharing a private
`selectOwnedNotes()` helper that applies ownership scoping and the grid's sort order
(`pinned desc, updatedAt desc`) once. Search uses its own query (`searchNotes()`,
`ILIKE` on title/body across Active+Archived) since it has a genuinely different
filter shape.

## Mutation architecture

One Server Action per operation (`archiveNote`, `trashNote`, `restoreNote`,
`pinNote`, `updateNote`, `createNote`, `permanentlyDeleteNote`,
`createLabel`/`renameLabel`/`deleteLabel`/`assignLabelToNote`) — not one generic
`updateNoteState(id, patch)`. Each action: resolves `ownerId` → validates input →
(for state transitions) delegates to the pure `transition()` function → executes one
atomically-scoped SQL statement → revalidates → returns an `ActionResult<T>`.

## Autosave

Debounce (1s) and request-serialization (only one save in flight per note, latest
edit queued and flushed next) live entirely in a client hook (`useAutosave`), not in
the Server Action, which stays a plain "save this version of this note" call reusable
by any future manual-save path. Flush is triggered directly (bypassing the debounce
timer) on blur, editor close, and `visibilitychange`.

## Optimistic concurrency

Every note carries an integer `version` column. `updateNote` performs a single atomic
`UPDATE ... WHERE id = ? AND ownerId = ? AND version = ? RETURNING *`; zero rows
returned means a stale write, and a cheap follow-up read disambiguates "stale
version" from "not found/not yours" to return an accurate `ActionResult` error kind.
No pessimistic locking, no separate lock table — the `WHERE` clause is the entire
mechanism.

## Errors

Two tiers. Expected, recoverable outcomes (validation failure, not-found, version
conflict) are returned as `{ ok: false, error: { kind, message } }` from Server
Actions — callers branch on `kind` deliberately. Everything else (a dropped DB
connection, a genuine bug) is left to throw and is caught by Next.js `error.tsx`
boundaries per route segment, or a generic top-level catch for Server Actions,
surfaced to the user as a generic "something went wrong" message.

## Loading and mutation UI state

`useTransition` + `useOptimistic` (React built-ins) for quick toggle mutations
(pin/archive/trash/color) — instant UI feedback, automatic rollback on failure via
re-render with server-confirmed state. `loading.tsx` (Next.js file convention) for
route-level navigation loading between grid views. Autosave keeps its own dedicated
`idle | saving | saved | conflict` status, since its UI ("Saving.../Saved" live
region) doesn't fit the optimistic-toggle pattern.

## Caching / revalidation

`revalidatePath("/")` at the end of every mutating Server Action — covers all four
grid views and search, since they share one route (per the routing decision above).
Drizzle/Postgres reads are not `fetch()` calls, so they are never subject to Next.js's
`fetch` Data Cache in the first place; `revalidatePath` only needs to clear the Router
Cache / full route cache so the next render re-runs the live query. No
`revalidateTag`, no `unstable_cache` — not needed at this app's single-owner-per-page
scale.

## Observability

Vercel's built-in function/request logs are the only log transport — no external
service (Sentry, Datadog) for MVP. All logging goes through one small structured
helper (`lib/log.ts`) that emits JSON lines (`level`, `event`, `timestamp`, context
like `ownerId`/`noteId`, and the error message/stack when present) via
`console.log/warn/error`, so Vercel's log dashboard stays searchable and every
warning/error carries enough context to trace without reproducing. Expected
`ActionResult` failures (validation, conflict) are not logged as warnings/errors —
only genuinely unexpected exceptions are. Sentry-style error tracking and alerting
are the named upgrade path once this has real multi-user traffic or wants proactive
paging — not needed for a solo daily-use tool.

## Environment configuration

A single Zod-validated `lib/env.ts` module (`DATABASE_URL`, Clerk keys, etc.),
parsed once at import time so a missing/malformed variable fails loudly at
build/boot rather than silently mid-request. No direct `process.env.X` access
elsewhere in the codebase. `.env.example` checked into git as the canonical list of
required keys.

## Database migrations

Drizzle Kit's `generate` + `migrate` workflow. Schema changes to `lib/db/schema.ts`
produce a new checked-in SQL migration file (reviewable like any code change);
migrations are applied explicitly (`drizzle-kit migrate`), never auto-run during the
Vercel build. `drizzle-kit push` (direct schema diffing, no migration history) may be
used for rapid local iteration before any real data exists, but is not the
production workflow.

## Testing seams

Three layers, matching the architecture's own layers — no abstraction introduced
solely for testability:

1. **Pure functions** (`transition()`) — unit tested with no I/O.
2. **Server Actions** — integration tested against a real Postgres (local Docker for
   dev, GitHub Actions' built-in Postgres service container for CI — both free, no
   mocked Drizzle client, since the behaviors worth testing, like ownership scoping
   and version-conflict atomicity, are exactly the SQL semantics a mock would have to
   faithfully reimplement).
3. **Playwright E2E** — the full core journey (sign in, create, edit/autosave, pin,
   archive, trash, search) against the running app.

Plus an automated `axe-core` accessibility pass, per the brief.

## Deployment

Vercel's standard git-integration model: `main` → production deployment against
Neon's primary database; any other branch/PR → automatic Vercel Preview Deployment,
optionally against its own Neon branch database. No separate persistent staging
environment — Preview Deployments serve that role per-change. Migrations are applied
manually, as a deliberate step before/alongside a deploy that includes a schema
change — not auto-run as part of the Vercel build, to avoid a partial-migration
build failure and to keep schema-change timing under deliberate control.

## Deliberate non-abstractions

Explicitly not built, because nothing in this MVP's scope needs them yet:

- No microservices — one deployable.
- No event bus / message queue — every mutation is a direct, synchronous DB write.
- No generic repository or DAO framework — Drizzle's query builder is used directly.
- No client-side data-fetching library (React Query/SWR) — Server Components own
  reads.
- No global client state store (Redux/Zustand) — `useOptimistic`/`useTransition`
  cover mutation UI state; there is no cross-cutting client state to manage.
- No Postgres RLS — single trust-level access pattern makes it unnecessary for now.
- No `pg_trgm`/full-text search — plain `ILIKE` is fast enough at this scale; named
  as the explicit upgrade path if search ever needs fuzzy matching or volume grows.
- No pagination / infinite scroll on the grid — the brief states no hard cap on note
  count for MVP; note-count growth large enough to matter is the trigger to revisit
  this, not something pre-built speculatively.
- No external logging/APM service (Sentry, Datadog) — Vercel's built-in logs plus
  structured log lines are sufficient for a solo-maintained, low-traffic app.
- No auto-run migrations in the build pipeline — a deliberate manual step instead.
