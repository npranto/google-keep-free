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

- Node.js 20.9.0 or newer (required by Next.js 16); 20.19.0 or newer to run `npm test` (required by Vitest's Vite)
- npm (this repo uses `package-lock.json`)

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Available scripts:

| Script                 | Purpose                       |
| ---------------------- | ----------------------------- |
| `npm run dev`          | Start the development server  |
| `npm run build`        | Create a production build     |
| `npm run start`        | Serve the production build    |
| `npm run lint`         | Run ESLint                    |
| `npm run typecheck`    | Run the TypeScript compiler   |
| `npm run format`       | Format code with Prettier     |
| `npm run format:check` | Check formatting              |
| `npm test`             | Run unit tests (Vitest)       |

Copy [`.env.example`](.env.example) to `.env.local` and fill it in: a Neon `DATABASE_URL` and the Clerk publishable and secret keys from your Clerk application. [`lib/env.ts`](lib/env.ts) validates them with Zod and fails fast on a missing or malformed value. Signed-out visitors to `/` are redirected to `/sign-in`.

## Project structure

```
app/          Next.js App Router: root layout, global styles, favicon, and the (app) route group
components/   Shared components; ui/ holds shadcn/ui primitives (currently Button)
lib/          Shared utilities (the cn class-name helper and the Zod-validated env module)
docs/         Product, architecture, design, ADR, and agent docs (source of truth)
.scratch/     Local MVP spec and ticket files
```

## Releases

Every merge to `main` gets a version, a `vX.Y.Z` tag, and a GitHub release, created by the [Release workflow](.github/workflows/release.yml). The pull request title picks the bump (markers are case-insensitive):

| PR title | 0.1.0 becomes |
|---|:---:|
| `Fix sign-in redirect` (or `[PATCH] ...`) | 0.1.1 |
| `[MINOR] Archive a note` | 0.2.0 |
| `[MAJOR] Remove the v1 notes API` | 1.0.0 |

The first merge after the workflow lands releases `v0.1.0`. If several pull requests merge between versions, the largest bump wins. The tag is the only record of the version: `package.json` is not changed.

To put production back on an earlier version, run **Actions > Rollback > Run workflow**. Leave `version` empty to go back one version, or enter a tag such as `v0.1.0`. Turn on `dry_run` first to see which version and deployment it would use. It needs the repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`. Rollback moves production only: revert the bad pull request afterwards.

## Documentation

- [docs/product](docs/product/PROJECT_BRIEF.md) - project brief: scope, journey, non-goals
- [docs/architecture](docs/architecture/system.md) - system design, plus [data model](docs/architecture/data-model.md) and [flows](docs/architecture/flows.md)
- [docs/design](docs/design/ui-spec.md) - UI spec and [wireframes](docs/design/wireframes.md)
- [docs/adr](docs/adr/0001-single-full-stack-nextjs-app-on-vercel-and-neon.md) - architecture decision records
- [CONTEXT.md](CONTEXT.md) - domain vocabulary (Owner, Note, Label, and so on)

## Roadmap

The MVP is broken into tickets under [.scratch/google-keep-free-mvp/](.scratch/google-keep-free-mvp/): start with [spec.md](.scratch/google-keep-free-mvp/spec.md), then browse [issues/](.scratch/google-keep-free-mvp/issues/). Planned but not yet built: the app shell, Vercel deploy, and the note features listed above.
