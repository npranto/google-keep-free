import { defineConfig } from "drizzle-kit";

import { env } from "./lib/env.ts";

// Run via `npm run db:generate` / `npm run db:migrate`, which load .env.local.
// Migrations are applied by hand, never as part of the Vercel build.
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dbCredentials: { url: env.DATABASE_URL },
});
