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
- "Search" covers note title, body, and possibly labels (scope TBD).
- Trash is not permanently auto-purged on a timer for MVP (manual permanent
  delete only), unless decided otherwise later.

## 10. Important Unresolved Questions

- What auth approach (email/password, magic link, OAuth, third-party auth
  provider) and how much of it to build vs. use off-the-shelf?
- What stack/framework choices for frontend, backend, and database?
- Hosting/deployment target for MVP?
- Exact autosave behavior: debounce interval, save-on-blur, conflict handling
  if same note is edited in two tabs?
- Is a note's color a fixed palette (like Keep) or open/custom colors?
- Can a note have multiple labels, and is there a labels management UI in
  MVP, or just inline creation?
- What does search match on, and is it exact/substring or fuzzy?
- Any data limits (note size, number of notes, number of labels)?
- Specific accessibility bar (e.g. WCAG level) and how it's verified?
- Is there a defined visual/design system to follow, or is that decided
  during implementation?
- Any requirement for automated testing coverage during this fast build?
