# Forge-test rendering demo page

**What it is:** a public demo page at `/forge-test` that shows every way a page can render, with dummy data from DummyJSON (`https://dummyjson.com`, no key). Eight cards, each labelled with its mode: four server rendered at request time or cached (`data-rendering="server"` and `"server-cached"`), one streamed behind Suspense, and three client (a counter, a fetch after mount, a lazy section loaded on click). Sends `noindex`. Nothing links to it. Ticket 02.03.06.

**How to get to it:** open `/forge-test`.

**How to drive it:** `playwright-cli open <base>/forge-test`, or `npx playwright test e2e/forge-test.spec.ts`. Check widths 390, 820 and 1440. For the server proof, `curl <base>/forge-test` and look for the dummy rows in the HTML.

**What proves it works:** 200 signed out. Every card has a `data-section` and a mode label. The server cards hold their rows in the served HTML (`curl`, or JavaScript off). Products shows loading, then rows, only after the page loads. The cheat sheet card is absent until its button is clicked, and a new script chunk downloads with the click. The streamed card shows a skeleton first, then its comments about 2 seconds later, without a reload. Cards sit in one column at 390 and two from 768, with no horizontal scroll. The response is dynamic (`cache-control: private, no-store`).

**Gotchas:**

- The page needs the internet from the server and the browser. If DummyJSON is down, each card shows "unavailable right now" and the page still answers 200. The streaming test skips itself when the API is unreachable.
- Do not wait for `networkidle`. The streamed card holds the response open for about 2 seconds.
- A test that clicks a client button before the page hydrates does nothing. Wait for the Products card to leave `data-state="loading"` first: its fetch runs in an effect, so it proves hydration.
- Request-time cards must keep `cache: "no-store"`. Next 16's default fetch is prerendered once at build time.
