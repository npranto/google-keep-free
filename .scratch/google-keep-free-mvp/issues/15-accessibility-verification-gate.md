# 15: Accessibility verification gate

**Status:** ready-for-agent
**Classification:** SEQUENTIAL
**Blocked by:** 14 (Responsive layout across breakpoints)

## What to build

The whole app passes an automated `axe-core` CI check and a full manual
keyboard-only pass over the core journey; any real violations found are fixed.

## Scope

Wire `axe-core` into CI (or a scripted local run), fix any violations surfaced,
perform and document a manual keyboard-only pass over create/edit/pin/archive/
trash/search, spot-check aria-labels/landmarks/focus-trap behavior called out
throughout the earlier tickets' constraints.

## Out of scope

Building new accessible primitives — this ticket verifies what 01–14 already
built using Radix/shadcn defaults, not a from-scratch a11y build.

## Acceptance criteria

- [ ] `axe-core` runs in CI and passes (or documented exceptions are recorded
      with rationale).
- [ ] A keyboard-only pass completes the full core flow (create, edit, pin,
      archive, trash, restore, search) with focus never trapped unexpectedly.
- [ ] Landmarks (`<nav>`, `<main>`, banner, `role="search"`) are present and
      correct.
- [ ] Every icon-only button has a real `aria-label`.

## Relevant spec sections

Accessibility section; Testing requirements (axe-core, manual pass);
Acceptance criterion 15.

## Architecture/design constraints

Targeted/pragmatic verification per the spec — not a claim of full WCAG audit or
screen-reader certification.

## Testing expectations

This ticket *is* the testing (axe-core CI job + documented manual pass).

## Demo instructions

Run the CI a11y job green; walk through the core flow using only
Tab/Enter/Escape/Arrow keys, narrating each step.

## Likely files/areas

CI workflow config, any component with a found violation (should be few/none if
earlier tickets followed their stated constraints).

## Risks / conflict hotspots

Low file-conflict risk; the risk here is scope creep into redesigning
components — stay within "verify and fix violations," not "redesign for
accessibility."
