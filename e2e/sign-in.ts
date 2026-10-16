import { clerk } from "@clerk/testing/playwright";
import type { Page } from "@playwright/test";

import { requireEnv } from "./env";

// Signs in as the shared test Owner and opens the Notes page. Needs a dedicated
// Clerk test user whose email contains "+clerk_test" - Clerk's dev instances
// accept the fixed code 424242 for it, no real inbox needed. See
// .scratch/google-keep-free-mvp/issues/01.04-static-app-shell-and-empty-state.md
// "Comments" for how it was created. Production has no test account, so specs
// that use this are never @smoke.
export async function signInAsOwner(page: Page) {
  const email = requireEnv("E2E_CLERK_TEST_EMAIL");
  requireEnv("CLERK_SECRET_KEY");
  requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: { strategy: "email_code", identifier: email },
  });
  await page.goto("/");
}
