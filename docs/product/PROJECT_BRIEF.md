# Project Brief: Google Keep-inspired Notes App

## 1. Problem Statement

People need a fast, low-friction way to capture and organize short-form notes
(quick thoughts, lists, reminders-to-self) without the overhead of heavier
note-taking or productivity tools.

## 2. Product Vision

A production-quality, Keep-like notes app that feels fast and polished: users
can capture a note in seconds, organize it with color and labels, and find it
again quickly, on both desktop and mobile.

## 3. Target User

An individual user managing their own personal notes (not teams). Initial
target is the builder's own daily use case as a senior engineer wanting a
lightweight, self-hosted-quality notes tool.

## 4. Core User Journey

1. User signs up / logs in.
2. User creates a note (title + body); it autosaves as they type.
3. User organizes notes: pin important ones, assign a color, assign labels.
4. User browses/searches the notes grid to find something later.
5. User archives notes they no longer need active, or trashes notes they want
   gone, and can restore either until permanently deleted from trash.

## 5. MVP Capabilities

- Sign up and log in.
- Create, edit notes with title and body.
- Autosave while editing.
- Pin / unpin notes.
- Archive / restore notes.
- Move to trash / restore from trash.
- Permanently delete trashed notes.
- Assign colors to notes.
- Create and assign labels to notes.
- Search notes.
- Responsive notes grid on desktop (Keep-like masonry/grid layout).
- Simplified single-column layout on mobile.
- Fast, polished feel.
- Accessibility considered from the start.

## 6. Explicit Non-Goals

- Realtime collaboration.
- Sharing notes with other users.
- Reminders.
- Image uploads.
- Rich-text editing.
- Offline-first synchronization.

## 7. Constraints

- Built solo by a senior full-stack engineer, with heavy AI assistance.
- Target timeline: roughly 2-3 days to MVP.
- Architecture must remain simple enough for the builder to understand and
  maintain afterward (not just AI-generated complexity).

## 8. Known Facts

- This is a brand-new project; no existing codebase, dependencies, or
  architecture decisions yet.
- This document is a project-capture artifact only; no scaffolding,
  dependencies, architecture, or tickets are being produced at this stage.

## 9. Current Assumptions

- Single-user-per-account model (no shared workspaces/teams) for MVP.
- Labels are user-defined and freeform (not a fixed taxonomy).
- A note has exactly one color at a time (not multiple).
- Trash is not permanently auto-purged on a timer for MVP (manual permanent
  delete only); `trashedAt` is stored from day one so auto-purge can be
  added later without a migration.

## 10. Resolved Decisions

All questions this document originally left open have been resolved through
a dedicated grilling session. Vocabulary lives in [`CONTEXT.md`](../../CONTEXT.md)
at the repo root; hard-to-reverse architectural choices are recorded as ADRs
in [`docs/adr/`](../adr/). The rest are recorded here.

**Stack, hosting, and auth** (see ADRs):
- One full-stack TypeScript app: Next.js (App Router, React), Postgres via
  Drizzle ORM, deployed on Vercel with Neon as the managed Postgres host.
  See [ADR 0001](../adr/0001-single-full-stack-nextjs-app-on-vercel-and-neon.md).
- Authentication is delegated to Clerk (hosted). No local users table; every
  Note and Label is scoped by the Clerk user ID.
  See [ADR 0002](../adr/0002-clerk-for-authentication.md).

**Autosave**: debounce ~1s after the last keystroke, plus immediate flush on
blur, on editor close, and on `visibilitychange` (tab hidden). Saves are
serialized per note (only one in flight; latest text sent next). Conflicts
are handled via optimistic concurrency: each save carries the note's
`version`; a stale save is rejected and the UI shows a non-blocking
"changed elsewhere, reload" state rather than silently overwriting. A
"Saving... / Saved" indicator doubles as an accessible status live region.

**Note lifecycle**: see `State`, `Active`, `Archived`, `Trashed`, `Restore`,
`Pinned` in `CONTEXT.md`. Allowed transitions: Active → Archived, Active →
Trashed, and Archived → Trashed directly (an archived note can be trashed
without first restoring it to Active). Trashed notes are read-only until
restored; restore from either Archived or Trashed always returns a note to
Active. There is no Trashed → Archived transition.

**Trash retention**: manual permanent delete and "Empty trash" only for the
MVP; no scheduled auto-purge. `trashedAt` is stored from day one so a
Vercel Cron auto-purge job can be added later as a small addition, not a
migration.

**Labels**: many-to-many (a note can carry many labels). Names are unique
per Owner, case-insensitive, with display casing preserved. Inline create
and assign from the note editor, plus a minimal "Edit labels" dialog
(rename/delete) reachable from the sidebar. Deleting a label only detaches
it from notes; it never deletes notes. A label view in the sidebar shows
that label's Active notes.

**Color**: a fixed palette of roughly 8-12 named tokens (including a
`default` of no color), stored as a constrained value (Postgres enum or
check constraint), not raw hex. Each token has a light-theme and a
dark-theme shade; contrast is verified once per token rather than at
runtime.

**Search**: matches note title and body only (not label names), across
Active and Archived notes (Trashed excluded). Matching is case-insensitive
substring (`ILIKE`) per Owner, via a debounced search-as-you-type field,
with results shown in the normal grid. `pg_trgm` is the planned upgrade
path if fuzzy/typo-tolerant matching or note volume ever requires it.

**Data limits**: title capped at 300 characters, body at 20,000 characters,
enforced server-side (not just client-side). No hard cap on the number of
notes or labels per Owner for the MVP.

**Accessibility**: WCAG 2.2 AA is the named target (the current W3C
Recommendation as of this project's start, superseding 2.1 AA). Verified
via accessible interactive primitives (Radix / React Aria, per the
design-system decision below), an automated `axe-core` pass in CI, and one
manual keyboard-only pass over the core flow (create, edit, pin, archive,
trash, search) before calling the MVP done. This is targeted, pragmatic
verification, not a claim of exhaustive WCAG audit or full screen-reader
certification.

**Visual/design system**: shadcn/ui (built on Radix) plus Tailwind, with
Radix primitives underneath where applicable. Before implementation,
produce a lightweight design contract (not a large standalone design
system) covering: page/layout structure, desktop/mobile wireframes,
component hierarchy, semantic design tokens, the note color palette,
interaction states, loading/empty/error states, and accessibility
expectations. Implementation follows that approved contract rather than
inventing visual behavior ticket-by-ticket.

**Automated testing**: unit tests for the note state-machine
(Active/Archived/Trashed + pinned transitions) and for the version-conflict
save logic, the `axe-core` accessibility pass, plus Playwright end-to-end
tests covering the core user journey (create, edit, pin, archive, trash,
search).

**Grid ordering**: pinned notes first, most-recently-updated first within
each group (pinned, then the rest). No manual drag-to-reorder for the MVP.
