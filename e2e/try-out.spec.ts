import { expect, test } from "./fixtures";

// One test per user-facing criterion of ticket 01.05.01. The page holds
// placeholder copy for now (ticket 01.05.02 replaces it), so the tests check
// its shape and behavior and never its words. All signed out and read only,
// so the whole block is safe on production.
test.describe("/try-out", { tag: "@smoke" }, () => {
  test("shows a hero, three benefit cards and a closing band to a signed-out visitor", async ({
    page,
  }) => {
    const response = await page.goto("/try-out");
    expect(response?.status()).toBe(200);

    const sections = page.locator("main > section");
    await expect(sections).toHaveCount(3);
    await expect(
      sections.nth(0).getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(sections.nth(1).getByRole("listitem")).toHaveCount(3);
    await expect(
      sections.nth(2).getByRole("heading", { level: 2 }),
    ).toBeVisible();
  });

  // Tailwind's md breakpoint is 768px: the cards stack below it, and sit in
  // three columns from it.
  const widths = [
    { width: 390, columns: 1 },
    { width: 820, columns: 3 },
    { width: 1440, columns: 3 },
  ];

  for (const { width, columns } of widths) {
    test(`holds at ${width}px wide with ${columns} card column(s) and no horizontal scroll`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/try-out");

      const cards = page.locator("main > section").nth(1).getByRole("listitem");
      await expect(cards).toHaveCount(3);

      const lefts = await cards.evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().x)),
      );
      expect(new Set(lefts).size).toBe(columns);

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("has its own tab title and asks search engines not to index it", async ({
    page,
  }) => {
    await page.goto("/try-out");

    // The title comes from the page's own `metadata`, not the site default.
    await expect(page).toHaveTitle(/.+/);
    await expect(page).not.toHaveTitle("Google Keep Free");
    // Remove this check with the `robots` line when the real copy ships (01.05.02).
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("has one call to action, and it leads to sign-up", async ({ page }) => {
    await page.goto("/try-out");

    const hero = page.locator("main > section").first();
    const cta = hero.getByRole("link");
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute("href", "/sign-up");

    await cta.click();
    await expect(page).toHaveURL(/\/sign-up/);
  });
});
