import { expect, test } from "./fixtures";
import { signInAsOwner } from "./sign-in";

// Not @smoke: it signs in, and production has no test account.
test("signed-in Owner sees the app shell and the Notes area", async ({
  page,
}) => {
  await signInAsOwner(page);

  await expect(page.getByRole("banner").getByText("Keep")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Note views" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Notes", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  // The view heading gives the cards' h2 headings a parent (ui-spec section 19).
  const pageHeading = page.getByRole("heading", { level: 1 });
  await expect(pageHeading).toHaveCount(1);
  await expect(pageHeading).toHaveText("Notes");
  await expect(page.getByPlaceholder("Take a note...")).toBeVisible();
  // The shared test Owner's Notes are never cleaned up (02.03.02 "Decisions"),
  // so the page shows either the grid or the empty state.
  await expect(
    page
      .getByRole("list", { name: "Notes" })
      .or(page.getByText("Notes you add appear here")),
  ).toBeVisible();
});
