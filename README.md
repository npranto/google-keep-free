# Google Keep Free

A fast, personal notes app inspired by Google Keep. An individual owner captures short notes quickly, organizes them with pins, colors and labels, and finds them again later. Desktop gets a Keep-like grid; mobile gets a simple single column. See the [project brief](docs/product/PROJECT_BRIEF.md) for the full problem statement and non-goals.

**Status: early scaffold.** Only the Next.js app shell, Tailwind CSS, and a shadcn/ui baseline exist today. Every feature below is **planned**, not yet working.

## MVP capabilities (planned)

- Sign up and log in
- Create and edit notes (title and body) with autosave
- Pin, archive, trash, restore, and permanently delete notes
- Assign a color and labels to notes
- Search notes
- Responsive grid on desktop, single column on mobile, with accessibility built in from the start

Out of scope for the MVP: realtime collaboration, sharing, reminders, image uploads, rich text, and offline sync.

## Tech stack

Current:

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 and shadcn/ui (Radix, class-variance-authority, lucide-react)

Planned (per the architecture docs):

- Server Components for reads and Server Actions for writes, in a single full-stack Next.js app with no separate backend
- Neon Postgres accessed through Drizzle
- Clerk for authentication
- Deployment on Vercel

See the [system architecture](docs/architecture/system.md), [ADR 0001](docs/adr/0001-single-full-stack-nextjs-app-on-vercel-and-neon.md), and [ADR 0002](docs/adr/0002-clerk-for-authentication.md) for the reasoning.

## Getting started

Prerequisites:

- Node.js 20.9.0 or newer (required by Next.js 16)
- npm (this repo uses `package-lock.json`)

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Available scripts:

| Script          | Purpose                      |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Create a production build    |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |

No environment variables, database, or auth setup are needed yet. Those arrive with later tickets (see the roadmap).

## Project structure

```
app/          Next.js App Router: root layout, global styles, favicon, and the (app) route group
components/   Shared components; ui/ holds shadcn/ui primitives (currently Button)
lib/          Shared utilities (currently the cn class-name helper)
docs/         Product, architecture, design, ADR, and agent docs (source of truth)
.scratch/     Local MVP spec and ticket files
```

## Documentation

- [docs/product](docs/product/PROJECT_BRIEF.md) - project brief: scope, journey, non-goals
- [docs/architecture](docs/architecture/system.md) - system design, plus [data model](docs/architecture/data-model.md) and [flows](docs/architecture/flows.md)
- [docs/design](docs/design/ui-spec.md) - UI spec and [wireframes](docs/design/wireframes.md)
- [docs/adr](docs/adr/0001-single-full-stack-nextjs-app-on-vercel-and-neon.md) - architecture decision records
- [CONTEXT.md](CONTEXT.md) - domain vocabulary (Owner, Note, Label, and so on)

## Roadmap

The MVP is broken into tickets under [.scratch/google-keep-free-mvp/](.scratch/google-keep-free-mvp/): start with [spec.md](.scratch/google-keep-free-mvp/spec.md), then browse [issues/](.scratch/google-keep-free-mvp/issues/). Planned but not yet built: environment validation and DB connection, Clerk auth, the app shell, Vercel deploy, and the note features listed above.
