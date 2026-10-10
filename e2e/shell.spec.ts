import { clerk } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

// Needs a dedicated Clerk test user whose email contains "+clerk_test" -
// Clerk's dev instances accept the fixed code 424242 for it, no real inbox
// needed. See .scratch/google-keep-free-mvp/issues/01.04-static-app-shell-and-empty-state.md
// "Comments" for how it was created.
const TEST_EMAIL = process.env.E2E_CLERK_TEST_EMAIL;

test.skip(!TEST_EMAIL, "E2E_CLERK_TEST_EMAIL not set");

test("signed-in Owner sees the app shell and Notes empty state", async ({
  page,
}) => {
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: { strategy: "email_code", identifier: TEST_EMAIL! },
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
