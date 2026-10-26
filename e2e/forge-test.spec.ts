import type { Page } from "@playwright/test";

import { expect, test } from "./fixtures";

// One test per user-facing criterion of ticket 02.03.06. The page fetches from
// a public dummy API, so a test never depends on particular rows, or on the API
// being up: a data section is "ready" with items or "unavailable" with its
// message. (The unit tests cover both branches.) All signed out and read only,
// so the whole block is safe on production.
const section = (page: Page, id: string) =>
  page.locator(`[data-section="${id}"]`);

const SERVER_SECTIONS = ["posts", "users", "todos", "quote"];

// The client-fetch section calls the dummy API from the browser, so a test can
// answer it itself. CORS headers are needed because the call is cross-origin.
const PRODUCTS_URL = "**/dummyjson.com/products**";
const respondWithProducts = (page: Page, gate?: Promise<void>) =>
  page.route(PRODUCTS_URL, async (route) => {
    await gate;
    await route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: { products: [{ id: 1, title: "Test product", price: 9 }] },
    });
  });

test.describe("/forge-test", { tag: "@smoke" }, () => {
  test("answers 200 to a signed-out visitor and labels every section with how it renders", async ({
    page,
  }) => {
    const response = await page.goto("/forge-test");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    for (const id of SERVER_SECTIONS) {
      const card = section(page, id);
      await expect(card).toBeVisible();
      await expect(
        card.locator('[data-slot="rendering-mode"]'),
      ).not.toBeEmpty();
      await expect(card).toHaveAttribute("data-state", /^(ready|unavailable)$/);
    }
    await expect(section(page, "quote")).toHaveAttribute(
      "data-rendering",
      "server-cached",
    );

    // Most of the page is server rendered: more cards than all the client ones.
    const serverCards = await page
      .locator('[data-rendering^="server"], [data-rendering="streamed"]')
      .count();
    const allCards = await page.locator("main section").count();
    expect(serverCards).toBeGreaterThan(allCards / 2);

    // The streamed section may still be on its skeleton here.
    const streamed = section(page, "streamed");
    await expect(streamed).toBeVisible();
    await expect(streamed).toHaveAttribute("data-rendering", "streamed");
    await expect(
      streamed.locator('[data-slot="rendering-mode"]'),
    ).not.toBeEmpty();
  });

  test("has its own tab title and asks search engines not to index it", async ({
    page,
  }) => {
    await page.goto("/forge-test");

    await expect(page).toHaveTitle(/.+/);
    await expect(page).not.toHaveTitle("Google Keep Free");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("the products section shows loading, then the data fetched in the browser", async ({
    page,
  }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await respondWithProducts(page, gate);
    await page.goto("/forge-test");

    const products = section(page, "products");
    await expect(products).toHaveAttribute("data-state", "loading");
    release();
    await expect(products).toHaveAttribute("data-state", "ready");
    await expect(products.getByRole("listitem")).toContainText("Test product");
  });

  test("the products section shows a message when the browser's request fails", async ({
    page,
  }) => {
    await page.route(PRODUCTS_URL, (route) => route.abort());
    await page.goto("/forge-test");

    const products = section(page, "products");
    await expect(products).toHaveAttribute("data-state", "unavailable");
    await expect(products).toContainText("unavailable right now");
    // One section failing leaves the rest of the page alone.
    await expect(section(page, "counter")).toBeVisible();
  });

  test("the counter works once the page has hydrated", async ({ page }) => {
    await respondWithProducts(page);
    await page.goto("/forge-test");
    // The products section leaving "loading" proves the page has hydrated: its
    // fetch runs in an effect, and an effect only runs after hydration.
    await expect(section(page, "products")).toHaveAttribute(
      "data-state",
      "ready",
    );

    const counter = section(page, "counter");
    const count = counter.getByRole("status", { name: "Count" });
    await expect(count).toHaveText("0");
    await counter.getByRole("button", { name: "Increase" }).click();
    await counter.getByRole("button", { name: "Increase" }).click();
    await counter.getByRole("button", { name: "Decrease" }).click();
    await expect(count).toHaveText("1");
  });

  test("the lazy section loads its content, and its code, only after the click", async ({
    page,
  }) => {
    await respondWithProducts(page);
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    await page.goto("/forge-test");
    await expect(section(page, "products")).toHaveAttribute(
      "data-state",
      "ready",
    );

    const lazyContent = page.locator('[data-slot="lazy-content"]');
    await expect(lazyContent).toHaveCount(0);
    const before = scripts.length;

    await section(page, "lazy")
      .getByRole("button", { name: "Load the cheat sheet" })
      .click();
    await expect(lazyContent).toBeVisible();
    // The button is gone, so focus moves to the content instead of the body.
    await expect(lazyContent).toBeFocused();
    // A new JavaScript chunk came down with the click.
    expect(scripts.length).toBeGreaterThan(before);
  });

  // The one test that needs the dummy API: streaming only shows when the server
  // really waits on something slow (the section asks the API for a 2 second
  // delay). Without the API there is nothing slow to stream, so it skips.
  test("the streamed section arrives after the page shell and replaces its skeleton", async ({
    page,
    request,
  }) => {
    const probe = await request
      .get("https://dummyjson.com/posts?limit=1")
      .catch(() => null);
    test.skip(
      !probe?.ok(),
      "The dummy API is unreachable, nothing slow to stream.",
    );

    await page.goto("/forge-test", { waitUntil: "commit" });
    const streamed = section(page, "streamed");

    // The shell is up with the skeleton while the server still waits on the API.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(streamed).toHaveAttribute("data-state", "loading");
    await page.evaluate(() => {
      (window as unknown as { shell: boolean }).shell = true;
    });

    await expect(streamed).toHaveAttribute(
      "data-state",
      /^(ready|unavailable)$/,
    );
    // Swapped in place: the same document, not a reload.
    expect(
      await page.evaluate(
        () => (window as unknown as { shell?: boolean }).shell,
      ),
    ).toBe(true);
  });

  // Tailwind's md breakpoint is 768px: the cards stack below it, and sit in
  // two columns from it.
  const widths = [
    { width: 390, columns: 1 },
    { width: 820, columns: 2 },
    { width: 1440, columns: 2 },
  ];

  for (const { width, columns } of widths) {
    test(`holds at ${width}px wide with ${columns} card column(s) and no horizontal scroll`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/forge-test");

      const cards = page.locator("main section");
      await expect(cards.first()).toBeVisible();

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

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });

    // Whatever reaches the page without JavaScript was rendered on the server.
    test("the server sections already hold their data in the served page", async ({
      page,
    }) => {
      await page.goto("/forge-test");

      for (const id of SERVER_SECTIONS) {
        const card = section(page, id);
        await expect(card).toBeVisible();
        const state = await card.getAttribute("data-state");
        if (state === "ready") {
          await expect(card.locator("li, blockquote").first()).toBeVisible();
        } else {
          await expect(card).toContainText("unavailable right now");
        }
      }
    });

    // The client sections are only a frame without JavaScript: the fetch has not
    // run, and the lazy content has not been loaded.
    test("the client sections hold no fetched or lazy content in the served page", async ({
      page,
    }) => {
      await page.goto("/forge-test");

      const products = section(page, "products");
      await expect(products).toHaveAttribute("data-state", "loading");
      await expect(products.getByRole("listitem")).toHaveCount(0);

      await expect(section(page, "lazy")).toBeVisible();
      await expect(page.locator('[data-slot="lazy-content"]')).toHaveCount(0);
      await expect(section(page, "counter").getByRole("status")).toHaveText(
        "0",
      );
    });
  });
});
