# 19: Bump Next.js to clear high-severity advisories

**Status:** closed
**Classification:** DEPENDENCY (found during 01.05's `/ns-to-quality-check`, stage 7 -
not part of the spec's 15 numbered acceptance criteria, does not block 16)
**Blocked by:** None (can start immediately)

## What to build

Upgrade `next` from 16.3.6 to a release outside the affected range
(16.0.0 to 16.3.7), so `npm audit --omit=dev` reports no high-severity findings.

## Context

`npm audit --omit=dev` on 10 Oct 2026 reported one high-severity vulnerability in
`next` with these advisories: GHSA-3w37-wq28-93x7 (Draft Mode leak through a pending
`use cache` fill), GHSA-4jqv-mc3x-m676 and GHSA-mcj8-r9mp-w47p (cache poisoning of
SSG/ISR pages, partly self-hosted only), GHSA-39w2-rjm5-chcv (dev-server MCP endpoint),
GHSA-f87g-xv8r-7p7x (metadata image routes) and GHSA-cjq9-62q9-8jv4 (SSRF in image
optimization). `npm audit` offers `next@16.4.0`, which is outside the current
`^16.3.6` range. The app is hosted on Vercel, not self-hosted, which reduces the
exposure to some of them. The advisory existed before 01.05 and its diff did not touch
`package.json`.

## Scope

Bump `next` (and `eslint-config-next` if it is pinned alongside it) to the fixed
version. Re-run types, lint, tests, build and e2e. Read the release notes for breaking
changes between 16.3.6 and the fixed version before changing anything else.

## Out of scope

Any other package upgrade. Using new Next.js features. Adding a scheduled dependency
audit to CI (decide that separately).

## Acceptance criteria

- [x] `npm audit --omit=dev` reports 0 high or critical vulnerabilities.
- [x] Types, lint, format, tests, build and the e2e job all pass on the PR.
- [x] The signed-out redirect to `/sign-in` and the signed-in empty shell still work on
      the preview deployment.

## Demo / verification

Run `npm audit --omit=dev` before and after. On the preview, visit signed-out, sign in,
see the shell.

## Review budget / risk

Small. Risk is medium: a framework upgrade touches routing, `proxy.ts` and
`@clerk/nextjs` compatibility, so keep it a single-purpose PR.

## Comments

- 2026-10-19: CLOSED, delivered by PR #59 (`c249bc2`, app v0.2.30), which had no ticket of its own. It moved `next` and `eslint-config-next` from 16.3.6 to 16.4.2. 16.4.0, the version named above, is still affected by GHSA-p3m5-59mp-jv5r (a crafted unauthenticated request to a Server Action, such as `createNote`, can exhaust CPU), so the target became 16.4.1 or later. `package-lock.json` resolves `next` to 16.4.2.
- 2026-10-19: proof. `npm audit --omit=dev` reports 0 vulnerabilities. On #59, typecheck, lint, unit tests and build pass, and `E2E (preview)` passed 12 of 12 against the preview, including the signed-out redirect to `/sign-in` and the signed-in shell. After the merge, `E2E (production)` passed 7 of 7 on `c249bc2`. #59 itself reported that signed-in E2E had not been run where it was authored; CI covered that.
- 2026-10-19: not in scope, not ticketed: `npm audit` (all dependencies) still reports 9 findings (5 high, 4 moderate), all dev-only, from the `eslint-config-next` chain and `drizzle-kit`'s `@esbuild-kit` chain.
