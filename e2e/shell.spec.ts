import { clerk } from "@clerk/testing/playwright";

import { requireEnv } from "./env";
import { expect, test } from "./fixtures";

// Needs a dedicated Clerk test user whose email contains "+clerk_test" -
// Clerk's dev instances accept the fixed code 424242 for it, no real inbox
// needed. See .scratch/google-keep-free-mvp/issues/01.04-static-app-shell-and-empty-state.md
// "Comments" for how it was created. Not @smoke: it signs in, and production
// has no test account.
test("signed-in Owner sees the app shell and Notes empty state", async ({
  page,
}) => {
  const email = requireEnv("E2E_CLERK_TEST_EMAIL");
  requireEnv("CLERK_SECRET_KEY");
  requireEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");

  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: { strategy: "email_code", identifier: email },
  });
  await page.goto("/");

  await expect(page.getByRole("banner").getByText("Keep")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Note views" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Notes", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Notes you add appear here")).toBeVisible();
});
