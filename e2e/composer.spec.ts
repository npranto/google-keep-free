import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { signInAsOwner } from "./sign-in";

// The collapsed field and the expanded body share a placeholder, so each is
// found by its own accessible name instead.
const collapsedField = (page: Page) =>
  page.getByRole("textbox", { name: "Take a note", exact: true });
const titleField = (page: Page) => page.getByLabel("Title", { exact: true });
const bodyField = (page: Page) => page.getByLabel("Note", { exact: true });

// Waits for the page to settle on the grid or the empty state, then counts cards.
async function settledCardCount(page: Page) {
  await expect(
    page
      .getByRole("list", { name: "Notes" })
      .or(page.getByText("Notes you add appear here")),
  ).toBeVisible();
  return page.getByRole("article").count();
}

// A Server Action call (createNote) is a POST with a next-action header. Other
// POSTs, such as Clerk's, are not writes. The returned list fills as they happen.
function watchServerActions(page: Page) {
  const calls: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.headers()["next-action"]) {
      calls.push(request.url());
    }
  });
  return calls;
}

// The shared test Owner's Notes are never cleaned up (02.03.02 "Decisions"), so
// each run uses a unique title and counts cards instead of assuming a clean grid.
// Not @smoke: it signs in and writes.
test.describe("composer", () => {
  test("creates a Note that is still in the grid after a reload", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E note ${Date.now()}`;

    await collapsedField(page).click();
    await titleField(page).fill(title);
    await bodyField(page).fill("Written by the E2E suite");
    await page.getByRole("button", { name: "Close" }).click();

    const card = page.getByRole("article").filter({ hasText: title });
    await expect(card).toBeVisible();
    await expect(card).toContainText("Written by the E2E suite");
    // The composer collapsed back to its single line.
    await expect(titleField(page)).toHaveCount(0);

    await page.reload();
    await expect(
      page.getByRole("article").filter({ hasText: title }),
    ).toBeVisible();
  });

  test("saves when focus leaves the composer and when Escape is pressed", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const blurTitle = `E2E blur ${Date.now()}`;
    const escapeTitle = `E2E escape ${Date.now()}`;

    await collapsedField(page).click();
    await titleField(page).fill(blurTitle);
    // The top-left corner of the content area is always empty: the composer
    // is centered. Clicking it moves focus out of the composer.
    await page.locator("main").click({ position: { x: 4, y: 4 } });
    await expect(
      page.getByRole("article").filter({ hasText: blurTitle }),
    ).toBeVisible();

    await collapsedField(page).click();
    await titleField(page).fill(escapeTitle);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("article").filter({ hasText: escapeTitle }),
    ).toBeVisible();
    // Focus goes back to the collapsed field instead of falling to the page.
    await expect(collapsedField(page)).toBeFocused();
  });

  test("closing an empty or whitespace-only composer adds no card", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const cards = page.getByRole("article");
    const before = await settledCardCount(page);
    const actionCalls = watchServerActions(page);

    await collapsedField(page).click();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(titleField(page)).toHaveCount(0);

    await collapsedField(page).click();
    await titleField(page).fill("   ");
    await page.getByRole("button", { name: "Close" }).click();
    await expect(titleField(page)).toHaveCount(0);

    await expect(cards).toHaveCount(before);
    expect(actionCalls).toEqual([]);
  });

  test("Enter in Title moves focus to Note, and Enter in Note adds a line", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const cards = page.getByRole("article");
    const before = await settledCardCount(page);
    const actionCalls = watchServerActions(page);

    await collapsedField(page).click();
    await titleField(page).fill("E2E enter in title");
    await titleField(page).press("Enter");
    // Focus moved on, and the composer neither closed nor changed the title.
    await expect(bodyField(page)).toBeFocused();
    await expect(titleField(page)).toHaveValue("E2E enter in title");

    await bodyField(page).pressSequentially("first");
    await bodyField(page).press("Enter");
    await bodyField(page).pressSequentially("second");
    await expect(bodyField(page)).toHaveValue("first\nsecond");

    // Leave nothing behind: an empty composer closes without a save.
    await titleField(page).fill("");
    await bodyField(page).fill("");
    await page.keyboard.press("Escape");
    await expect(titleField(page)).toHaveCount(0);

    await expect(cards).toHaveCount(before);
    expect(actionCalls).toEqual([]);
  });
});
