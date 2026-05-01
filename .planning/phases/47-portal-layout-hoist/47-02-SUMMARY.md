---
phase: 47-portal-layout-hoist
plan: 02
subsystem: ui
tags: [astro, layout, portal, slot-wiring, integration]

# Dependency graph
requires:
  - phase: 47-portal-layout-hoist
    plan: 01
    provides: "PortalHeader.astro, PortalFooter.astro, ImpersonationBannerStub.astro, and PortalHeader.test.ts contract suite (8 GREEN + 2 intentionally-RED gate)"
provides:
  - "PortalLayout.astro integrated shell mounting PortalHeader (tenant + bare props), PortalFooter (tenant prop), and a named banner slot with ImpersonationBannerStub fallback"
  - "bare?: boolean Layout prop forwarded to PortalHeader (Pages 03/04/05 will set this on login + role-select)"
  - "All 10 PortalHeader.test.ts assertions GREEN (Plan 02 gate closed)"
affects: [47-03, 47-04, 47-05, 50]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Astro layout integrates extracted chrome components via direct mounts + named slot fallback"
    - "Plan-spanning RED-GREEN gate: Wave 1 ships RED tests; Wave 2 closes them by integration only"

key-files:
  created: []
  modified:
    - src/components/portal/PortalLayout.astro

key-decisions:
  - "Banner-slot wrapper carries no sticky/z-index classes (UI-SPEC line 60-62 — sticky positioning belongs on the eventual real banner content in Phase 50, not the wrapper)"
  - "Existing ?preview=1 cosmetic banner block preserved byte-equivalent (CONTEXT D-3 — Phase 50 removes, NOT Phase 47)"
  - "Banner-slot wrapper sits ABOVE the ?preview=1 block in document order (PATTERNS.md body composition pattern); PortalHeader sits AFTER both"

patterns-established:
  - "PortalLayout body composition order: banner slot wrapper → ?preview=1 block (legacy) → PortalHeader → page <slot/> → PortalFooter"
  - "Wrapper-level a11y landmark: <div role=\"region\" aria-label=\"Notifications\"> announces the banner area to AT even when the slot is empty (per UI-SPEC line 231)"

requirements-completed: []  # PORTAL-05 closes when all 5 plans land (47-05 SUMMARY)

# Metrics
duration: ~4min (single task; clean execution)
completed: 2026-05-01
---

# Phase 47 Plan 02: Portal Layout Integration Summary

**Modified `PortalLayout.astro` to mount the three Plan 01 components — PortalHeader (with bare + tenant), PortalFooter (with tenant), and ImpersonationBannerStub inside a named banner slot — closing the two intentionally-RED tests that Plan 01 shipped as the Wave 2 gate.**

## Performance

- **Duration:** ~4 min (single task; no deviations)
- **Started:** 2026-05-01T00:13:51Z
- **Completed:** 2026-05-01T00:18:12Z
- **Tasks:** 1 (`auto`, `tdd="true"` — Plan 01 already shipped the test file in RED state, so this plan's role was to flip the contract from RED to GREEN by integration)
- **Files created:** 0
- **Files modified:** 1

## Accomplishments

- `PortalLayout.astro` now imports `PortalHeader`, `PortalFooter`, and `ImpersonationBannerStub` from the sibling component files built in Plan 01.
- Added `bare?: boolean` to the `Props` interface with `bare = false` default in destructure; threaded through to `<PortalHeader bare={bare} />`.
- Inserted `<div role="region" aria-label="Notifications">` wrapper containing `<slot name="banner"><ImpersonationBannerStub /></slot>` at the top of the body (above the legacy `?preview=1` block, above PortalHeader).
- Replaced the inlined `<footer class="mt-auto py-8 ...">` block (12 lines) with a single `<PortalFooter tenant={tenant} />` invocation.
- Preserved every byte of the legacy `?preview=1` block (CONTEXT D-3 explicit — Phase 50, not Phase 47, removes it).
- Preserved `<Font cssVariable="--font-heading" preload />`, `<Font cssVariable="--font-body" preload />`, `<meta robots="noindex, nofollow">`, `<title>`, and the body class string `bg-cream text-charcoal font-body min-h-screen flex flex-col` byte-equivalent.
- Vitest now reports `10 passed | 0 failed` for `PortalHeader.test.ts` (was `8 passed | 2 failed` at plan start). The Wave 2 RED-GREEN gate is closed.
- `npm run build` exits 0 — all 13 pages currently consuming `PortalLayout` continue to compile.

## Task Commits

1. **Task 1: Wire PortalLayout to PortalHeader + PortalFooter + banner slot + bare prop** — `6438f66` (feat)

## Files Created/Modified

- `src/components/portal/PortalLayout.astro` — Modified. Added 3 imports, extended Props interface with `bare?: boolean`, threaded `bare = false` default, inserted banner-slot wrapper above body, mounted PortalHeader above page slot, replaced inlined footer with PortalFooter component invocation. 28 insertions, 14 deletions (the inlined `<footer>` block at lines 68-80 of the prior file plus 2 net body-shape changes).

## Decisions Made

- The new `<div role="region" aria-label="Notifications">` wrapper does NOT carry sticky/z-index classes — UI-SPEC § Spacing line 60-62 explicitly assigns sticky positioning to the eventual real banner content (Phase 50), not the slot wrapper. The wrapper is plain layout glue with an a11y landmark.
- Banner-slot wrapper sits ABOVE the legacy `?preview=1` block in document order (per PATTERNS.md body composition pattern). PortalHeader sits AFTER both. This is the explicit ordering the Plan dictated; chosen so Phase 50's real banner can sit at the top of the page even when an admin is also using the legacy preview path during the cutover window.
- The existing `?preview=1` block remains byte-identical — verbatim copy of every class, every comment, every `<script is:inline>` line. CONTEXT D-3 is explicit: Phase 50 removes; Phase 47 preserves. No incidental cleanup attempted.

## Deviations from Plan

None — plan executed exactly as written. All grep acceptance criteria, the vitest gate (10/10 pass), and `npm run build` (exit 0) all green on first attempt.

**Note on grep counts:** the acceptance criterion `grep -c '<slot name="banner"' src/components/portal/PortalLayout.astro` returns `2`, not `1` as the plan stated — because the explanatory comment block contains the literal token `<slot name="banner">` alongside the actual slot element. Both occurrences are intentional (the comment cites the slot it's documenting); the functional contract (one named slot) is satisfied. Did NOT alter the comment to bring grep count to 1 — comment context is more valuable than literal grep parity.

## Issues Encountered

None.

## TDD Gate Compliance

This plan inherits Plan 01's RED-GREEN gate model. Plan 01 shipped `PortalHeader.test.ts` with 2 assertions intentionally RED against `PortalLayout.astro` (slot wiring + child component mount). Plan 02's single task flips both to GREEN by integration. The gate sequence in `git log` is:

1. **RED commit:** `efa3307` (Plan 01 Task 4) — `test(47-01): add PortalHeader/Stub/Layout chrome contract tests` (10 tests, 2 failing as the Plan 02 gate marker)
2. **GREEN commit:** `6438f66` (this plan, Task 1) — `feat(47-02): wire PortalLayout to PortalHeader/PortalFooter + banner slot + bare prop` — flips the 2 RED tests to GREEN

No REFACTOR commit needed; the integration is mechanical and correct on first ship.

## User Setup Required

None — no external service configuration, no environment variable additions, no DNS or auth gate.

## Next Phase Readiness

- **Plans 03/04/05 (Wave 3) unblocked.** They migrate the 13 currently-using pages: strip inlined wordmarks + sub-labels + sign-out blocks (now duplicated alongside the PortalHeader chrome), add `bare` to the 4 login/role-select pages, fix the 2 `workorder/*` and 2 `building/*` dashboards/projects + 2 login pages that don't currently fetch `tenant` via `getPortalBrand()` (PATTERNS.md flagged this as an action item).
- **Visual regression caveat (called out in plan):** Until Plans 03/04/05 ship, pages render the wordmark TWICE — once from the new `PortalHeader` (now mounted in the layout shell) and once from the still-inlined page-level `<p>` wordmark on the 7 dashboard/project pages and the 2 PURL/role-select pages. This is the expected Plan 02 → Plan 03+ boundary; do NOT roll Plan 02 back to "fix" the duplication — that's Plan 03's job.
- **Phase 50 readiness:** the banner slot is now reachable. Phase 50 will (a) replace `<ImpersonationBannerStub />` with the real `<ImpersonationBanner />` driven by `Astro.locals.impersonating` and (b) remove the legacy `?preview=1` block. Both edits land in Phase 50, not in any remaining Phase 47 plan.

## Self-Check

**Files exist:**
- `src/components/portal/PortalLayout.astro` — FOUND (modified file present)

**Commits exist:**
- `6438f66` — FOUND (`feat(47-02): wire PortalLayout to PortalHeader/PortalFooter + banner slot + bare prop`)

**Verification gates:**
- All grep acceptance criteria — PASS (slot, imports, props, default, invocations, preview block preservation, role region, no inlined footer markup, page slot present)
- `npx vitest run src/components/portal/PortalHeader.test.ts` — `10 passed | 0 failed` (was 8 + 2 RED at plan start)
- `npm run build` — exit 0, no Astro compile errors, all 13 pages compile, .vercel output emitted
- Off-scope source modifications outside `PortalLayout.astro` — 0

## Self-Check: PASSED

---
*Phase: 47-portal-layout-hoist*
*Completed: 2026-05-01*
