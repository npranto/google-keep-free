import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";
import { signInAsOwner } from "./sign-in";

// The shared test Owner's Notes are never cleaned up (02.03.02 "Decisions"), so
// each test creates its own Note under a unique title and finds it by that.
// Not @smoke: it signs in and writes.

const card = (page: Page, title: string) =>
  page.getByRole("article").filter({ hasText: title });
const openButton = (page: Page, title: string) =>
  page.getByRole("button", { name: `Open note: ${title}`, exact: true });
const editor = (page: Page) => page.getByRole("dialog", { name: "Edit note" });
const titleField = (page: Page) => editor(page).getByLabel("Title");
const bodyField = (page: Page) => editor(page).getByLabel("Note");
const saveStatus = (page: Page) => editor(page).getByRole("status");

// Writes a Note through the composer, as the Owner would, and waits for its card.
async function createNote(page: Page, title: string, body: string) {
  await page.getByRole("textbox", { name: "Take a note", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Note", { exact: true }).fill(body);
  await page.getByRole("button", { name: "Close" }).click();
  await expect(card(page, title)).toBeVisible();
}

test.describe("note editor dialog", () => {
  test("edits a Note, shows Saving… then Saved, and the edit survives a reload", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E editor ${Date.now()}`;
    const edited = `${title} edited`;
    await createNote(page, title, "first draft");

    await openButton(page, title).click();
    await expect(titleField(page)).toHaveValue(title);
    await expect(bodyField(page)).toHaveValue("first draft");
    await expect(saveStatus(page)).toHaveText("");

    // Hold the save back for a moment, so "Saving…" is on screen long enough
    // to be seen. Installed after sign-in so Clerk's POSTs pass through.
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() === "POST" && request.headers()["next-action"]) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      await route.continue();
    });

    await titleField(page).fill(edited);
    await bodyField(page).fill("second draft, typed in the dialog");
    await expect(saveStatus(page)).toHaveText("Saving…");
    await expect(saveStatus(page)).toHaveText("Saved");
    // It fades, then is gone, about 2 seconds after it appeared.
    await expect(saveStatus(page)).toHaveText("", { timeout: 4000 });

    // The grid card shows the edit without a reload.
    await expect(card(page, edited)).toContainText(
      "second draft, typed in the dialog",
    );

    await page.reload();
    await expect(card(page, edited)).toBeVisible();
    await openButton(page, edited).click();
    await expect(titleField(page)).toHaveValue(edited);
    await expect(bodyField(page)).toHaveValue(
      "second draft, typed in the dialog",
    );
  });

  test("opens a body longer than the card preview in full", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E long body ${Date.now()}`;
    const ending = `the very end ${Date.now()}`;
    const body = `${"filler text ".repeat(100)}${ending}`;
    await createNote(page, title, body);

    // The card carries only a 500-character preview ...
    await expect(card(page, title)).not.toContainText(ending);

    // ... and the dialog has the whole Note.
    await openButton(page, title).click();
    await expect(bodyField(page)).toHaveValue(body);
  });

  test("Escape closes the dialog and saves an edit typed just before it", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E escape edit ${Date.now()}`;
    const edited = `${title} edited`;
    await createNote(page, title, "body before");

    await openButton(page, title).click();
    // No pause between typing and closing: nothing may be lost.
    await titleField(page).fill(edited);
    await page.keyboard.press("Escape");
    await expect(editor(page)).toHaveCount(0);

    await expect(card(page, edited)).toBeVisible();
    await page.reload();
    await expect(card(page, edited)).toBeVisible();
  });

  test("saves a field's edit when focus moves to the other field", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E blur ${Date.now()}`;
    const edited = `${title} edited`;
    await createNote(page, title, "body before");

    await openButton(page, title).click();
    // A slow save keeps "Saving…" on screen once it starts.
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (request.method() === "POST" && request.headers()["next-action"]) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      await route.continue();
    });

    await titleField(page).fill(edited);
    await bodyField(page).focus();

    // The save starts when focus leaves the field, not after the 1 second
    // typing pause, so this appears well inside that second.
    await expect(saveStatus(page)).toHaveText("Saving…", { timeout: 500 });
    await expect(saveStatus(page)).toHaveText("Saved");
    await expect(card(page, edited)).toBeVisible();
  });

  test("traps focus, closes on Escape and returns focus to the card", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E focus ${Date.now()}`;
    await createNote(page, title, "body");

    await openButton(page, title).focus();
    await page.keyboard.press("Enter");
    await expect(editor(page)).toBeVisible();
    await expect(titleField(page)).toBeFocused();

    // Tab around more times than the dialog has controls: focus never leaves it.
    for (let press = 0; press < 6; press += 1) {
      await page.keyboard.press("Tab");
      const insideDialog = await page.evaluate(
        () => document.activeElement?.closest('[role="dialog"]') !== null,
      );
      expect(insideDialog).toBe(true);
    }

    // Nothing was edited, so nothing is saved and the grid does not re-render.
    await page.keyboard.press("Escape");
    await expect(editor(page)).toHaveCount(0);
    await expect(openButton(page, title)).toBeFocused();
  });

  test("names the dialog and announces the save status politely", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E a11y ${Date.now()}`;
    await createNote(page, title, "body");

    await openButton(page, title).click();

    await expect(editor(page)).toBeVisible();
    await expect(editor(page)).toHaveAccessibleDescription(
      "Your changes are saved automatically.",
    );
    await expect(
      editor(page).getByRole("button", { name: "Close" }),
    ).toBeVisible();
    await expect(saveStatus(page)).toHaveAttribute("aria-live", "polite");
  });

  test("shows an error, not an empty form, when the Note cannot be read", async ({
    page,
  }) => {
    await signInAsOwner(page);
    const title = `E2E unreadable ${Date.now()}`;
    await createNote(page, title, "body");
    await page.route("**/api/notes/*", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "not_found" }),
      }),
    );

    await openButton(page, title).click();

    await expect(
      editor(page).getByRole("alert").filter({ hasText: "Could not open" }),
    ).toBeVisible();
    await expect(titleField(page)).toHaveCount(0);
  });
});
