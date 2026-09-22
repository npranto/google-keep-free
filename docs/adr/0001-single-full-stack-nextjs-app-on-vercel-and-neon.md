# Single full-stack Next.js app on Vercel with Neon Postgres

The MVP is one full-stack TypeScript application: Next.js (App Router, React) serving both UI and server code, backed by Postgres accessed through Drizzle ORM, deployed on Vercel with Neon as the managed Postgres host.

We chose one deployable over a separate SPA plus API (two things to build, deploy, and keep in sync) and over a backend-as-a-service such as Supabase or Firebase (data access rules would live in vendor config and be hard to move off). Next.js was picked over React Router v7, SvelteKit, and TanStack Start for ecosystem depth and reliability of AI-assisted code, accepting App Router complexity. Postgres was picked over SQLite for built-in full-text and trigram search and a production-grade bar. Drizzle was picked over Prisma for SQL-shaped, readable queries. Vercel plus Neon was picked over a single container on Railway or Fly.io for the fastest path to a working deploy, accepting coupling to Vercel's serverless model (connection pooling, cold starts).

Consequences: keep the server surface small (server actions or a few route handlers, no clever caching layer), and use Neon's pooled or serverless driver connection from Vercel functions.
