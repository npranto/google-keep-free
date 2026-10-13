# Try-out page

**What it is:** a public landing-page skeleton at `/try-out`: a hero with one call to action, three benefit cards and a closing band. It holds placeholder copy and sends `noindex` until ticket 01.05.02 ships the real copy.

**How to get to it:** open `/try-out`. Nothing links to it.

**How to drive it:** `playwright-cli open <base>/try-out`, or `npx playwright test e2e/try-out.spec.ts`. Check widths 390, 820 and 1440 with `playwright-cli resize`.

**What proves it works:** 200 signed out. Three sections: a level-1 heading, three cards, a level-2 heading. Cards stack in one column at 390 and sit in three from 768. No horizontal scroll. The tab title is not the site default, the page has `meta name="robots"` with `noindex`, and the one hero link goes to `/sign-up`.

**Gotchas:** when 01.05.02 removes `noindex`, update the `noindex` check in `e2e/try-out.spec.ts` and this file. The tests check shape, never wording.
