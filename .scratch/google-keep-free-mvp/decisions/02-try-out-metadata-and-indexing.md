# 02: Should the dummy `/try-out` page be indexed, and does it get its own tab title?

**Ticket:** 01.05.01 Try-out page UI
**Decided:** Mon 12 Oct 2026, by the user, during the ticket-level grill in scope-check

## Decision

The page exports its own `metadata`: a page title, and `noindex` for as long as it holds
dummy copy.

The agent recommended no page metadata (option A). The user chose title plus `noindex`
(option C).

## Options rejected

- No page metadata, same as `/about`, `/faq` and `/stuff`: leaves dummy copy indexable.
- Tab title only: same, and adds a placeholder title to rewrite later.
- A site-wide `robots.txt` or sitemap: no acceptance criterion needs one, and it changes
  behavior for every route.

## Known trap

`noindex` must be removed when the real landing copy ships, or the landing page stays
out of search with no error anywhere. Guarded by a comment beside the `metadata` export
in `app/try-out/page.tsx` and a follow-up line in the ticket.

## Evidence

- Measured: `gfk.lol/robots.txt` and `gfk.lol/sitemap.xml` answer 404, nothing links to
  `/try-out`, and only `app/layout.tsx` exports `metadata` today.
- Inferred: an unlinked page with no sitemap is rarely crawled.

## Principle

Prefer the failure that heals itself. The user accepted the stickier failure (a forgotten
`noindex`) in exchange for keeping dummy copy out of search.

## Undo

Trivial: delete the `robots` line from the `metadata` export.
