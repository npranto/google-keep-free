import { defineConfig, devices } from "@playwright/test";

import { requireEnv } from "./e2e/env";

// Load the local env file so a local run sees the same names CI passes in.
// A value already in the environment wins, so CI is unaffected.
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const deployedUrl = process.env.E2E_BASE_URL;

// Without a deployed URL the suite builds and starts the app itself, and the
// app refuses to start without these (lib/env.ts).
if (!deployedUrl) {
  for (const name of [
    "DATABASE_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
  ]) {
    requireEnv(name);
  }
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
  use: {
    baseURL: deployedUrl || "http://localhost:3000",
    // A trace records request headers and every typed value, and the bypass
    // secret and test sign-in travel in both.
    trace: "off",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: deployedUrl
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
