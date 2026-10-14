import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The database comes from the environment: .env.local on a developer machine,
// DATABASE_URL (and the other variables lib/env.ts needs) set by the caller in
// CI. loadEnvFile never overrides a variable that is already set.
const envFile = fileURLToPath(new URL(".env.local", import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

// These tests write to a real database, so they run only through
// `npm run test:integration`. vitest.config.mts leaves them out of `npm test`.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**"],
    // A suspended Neon compute can take several seconds to wake on the first
    // query, which is longer than Vitest's 5 s default.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
