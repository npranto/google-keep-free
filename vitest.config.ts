import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirror the "@/*" path alias from tsconfig.json so tested code can use it.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    // e2e/ runs under Playwright's own runner (npm run e2e), not Vitest.
    // *.integration.test.ts needs a real database: npm run test:integration.
    exclude: ["**/node_modules/**", "**/e2e/**", "**/*.integration.test.ts"],
  },
});
