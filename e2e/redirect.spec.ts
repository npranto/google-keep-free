import { expect, test } from "./fixtures";

test.describe("signed out", { tag: "@smoke" }, () => {
  test("a visitor to / ends up on the sign-in page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
