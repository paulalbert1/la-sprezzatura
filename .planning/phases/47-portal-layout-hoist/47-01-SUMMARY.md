---
phase: 47-portal-layout-hoist
plan: 01
subsystem: ui
tags: [astro, layout, portal, components, vitest, chrome]

# Dependency graph
requires:
  - phase: 49-impersonation-architecture
    provides: "Astro.locals.role hydration via middleware (impersonation-aware viewer role)"
provides:
  - "PortalHeader.astro standalone chrome component (wordmark + role sub-label + sign-out; bare-mode wordmark-only)"
  - "PortalFooter.astro standalone chrome component (lift-and-shift of inlined footer, no visual change)"
  - "ImpersonationBannerStub.astro empty banner slot harness (renders only data-testid div)"
  - "PortalHeader.test.ts string-grep contract suite with built-in Plan 02 gate (8 passing + 2 expected-RED)"
affects: [47-02, 50, 51]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composite chrome component with bare-mode prop (PortalHeader)"
    - "Astro slot-wiring harness via hidden test-id div (ImpersonationBannerStub)"
    - "Plan-spanning RED contract test (PortalHeader.test.ts → Plan 02 gate)"

key-files:
  created:
    - src/components/portal/PortalHeader.astro
    - src/components/portal/PortalFooter.astro
    - src/components/portal/ImpersonationBannerStub.astro
    - src/components/portal/PortalHeader.test.ts
  modified: []

key-decisions:
  - "Sign-out renders as <a href=...> (GET anchor) per UI-SPEC line 134, not <form method=POST>; CSRF refactor deferred"
  - "Bare-mode header is wordmark-only centered; default-mode is two-column flex with wordmark+sub-label LEFT and sign-out RIGHT"
  - "ImpersonationBannerStub uses HTML `hidden` attribute (zero rendered height), NOT aria-hidden (would consume layout space)"
  - "Test file is 8-pass / 2-RED by design — the two RED assertions on PortalLayout.astro are the Plan 02 (Wave 2) integration gate"

patterns-established:
  - "Role sub-label map (Record<string,string>) lives inside PortalHeader.astro as the single source of truth — Plan 02+ pages must NOT duplicate it"
  - "Sign-out endpoint map likewise scoped inside PortalHeader; pages do not derive logout URL"
  - "Astro string-grep tests via readFileSync (per ProcurementTable.test.ts) remain the repo's portal-component test convention"

requirements-completed: [PORTAL-05]

# Metrics
duration: ~93min (across 4 task commits, 18:34 → 20:07 ET)
completed: 2026-04-30
---

# Phase 47 Plan 01: Portal Chrome Components Summary

**Three standalone Astro chrome components (PortalHeader with bare prop, PortalFooter lift-and-shift, ImpersonationBannerStub) plus a 10-assertion string-grep contract suite with built-in Plan 02 integration gate.**

## Performance

- **Duration:** ~93 min (cross-session — Tasks 1-3 committed 2026-04-30T18:34→18:35 ET in a prior executor session; Task 4 + summary committed 2026-04-30T20:07 ET in this session)
- **Started:** 2026-04-30T22:33:40Z (state record)
- **Completed:** 2026-05-01T00:07:41Z (Task 4 commit)
- **Tasks:** 4 (all `auto`)
- **Files created:** 4
- **Files modified:** 0 (zero existing files touched, per plan scope)

## Accomplishments

- `PortalHeader.astro` — composite chrome with `tenant?` and `bare?` props; reads `Astro.locals.role` (NOT URL prefix) to derive sentence-case sub-labels (`Client portal` / `Trade portal` / `Building portal`) and per-route logout endpoints (`/portal/logout` / `/workorder/logout` / `/building/logout`); renders sign-out as a plain anchor link only on authenticated default-mode pages; bare-mode renders the wordmark centered.
- `PortalFooter.astro` — pure lift-and-shift of the inlined footer at `PortalLayout.astro:68-80`. Byte-equivalent markup wrapped in component frontmatter; `&bull;` HTML entity preserved verbatim per D-5.
- `ImpersonationBannerStub.astro` — single `<div data-testid="banner-slot-mounted" hidden></div>` with explanatory frontmatter comment naming Phase 50 as the replacement target.
- `PortalHeader.test.ts` — vitest contract suite that runs to completion with `8 passed | 2 failed`, exactly the design intent. The two failing assertions are the Wave 2 gate against `PortalLayout.astro` (slot wiring + child-component mount). A header comment names them as the Plan 02 gate so future executors do not roll the test back.

## Task Commits

Each task was committed atomically:

1. **Task 1: PortalFooter.astro lift-and-shift** — `144cc43` (feat)
2. **Task 2: ImpersonationBannerStub.astro slot-wiring harness** — `8bdbb08` (feat)
3. **Task 3: PortalHeader.astro chrome component** — `77b6df5` (feat)
4. **Task 4: PortalHeader/Stub/Layout chrome contract tests** — `efa3307` (test)

## Files Created/Modified

- `src/components/portal/PortalFooter.astro` — Lift-and-shift footer (displayName + Interior Design + contactEmail mailto)
- `src/components/portal/ImpersonationBannerStub.astro` — Hidden test-id div, Phase 47-only stub
- `src/components/portal/PortalHeader.astro` — Wordmark + role sub-label + sign-out (default); wordmark-only centered (bare)
- `src/components/portal/PortalHeader.test.ts` — 10-assertion string-grep contract suite (8 pass + 2 expected-RED Plan 02 gate)

## Decisions Made

- Confirmed sign-out remains a GET anchor `<a href="...">`, NOT a `<form method="POST">` (UI-SPEC line 134 overrides CONTEXT D-4's "form posts" wording). CSRF refactor deferred to a separate security task — Phase 47 does NOT introduce CSRF surface.
- Confirmed sentence-case sub-labels (`"Client portal"` not `"Client Portal"`) per UI-SPEC § Copywriting — pages currently rendering Title Case strings will display the new sentence-case strings after Wave 2 hoists. Visible copy delta documented in PATTERNS.md, picked up by Plan 02.
- The two-RED-test gate against `PortalLayout.astro` is intentional. Plan 02 modifies the layout to (1) expose `<slot name="banner">` and (2) mount `<PortalHeader>` and `<PortalFooter>`. Until then, the test file documents the contract in advance and fails noisily if the layout is shipped without the integration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PortalHeader.test.ts regex `/\bhidden(>|></)/`  failed esbuild parsing**

- **Found during:** Task 4 verification (first vitest run)
- **Issue:** The literal regex `/\bhidden(>|></)/`  copied verbatim from the plan caused esbuild's transform to fail with `Unexpected ")"`. esbuild's lexer treats the unescaped `</` token as an HTML/JSX close marker even inside a regex literal, breaking parsing.
- **Fix:** Escaped the forward slash in the regex alternation: `/\bhidden(>|><\/)/`. Functionally equivalent matcher; survives esbuild transform.
- **Files modified:** `src/components/portal/PortalHeader.test.ts` (line 62)
- **Verification:** vitest runs to completion after fix; 10 tests collected; the regex still matches `<div ... hidden></div>` correctly.
- **Committed in:** `efa3307` (Task 4 commit, included in initial Write).

**2. [Rule 1 - Bug] PortalHeader.test.ts regex `/>Sign Out</`  failed against multi-line anchor**

- **Found during:** Task 4 verification (second vitest run)
- **Issue:** The plan's acceptance criterion `grep -c '>Sign Out<'` passes against a single-line literal, but the actual `PortalHeader.astro` (built per the plan's dictated layout in Task 3) renders the anchor across three lines: `>` then newline+indent then `Sign Out` then newline+indent then `<`. The regex `/>Sign Out</`  required no intermediate whitespace and failed.
- **Fix:** Loosened the regex to `/>\s*Sign Out\s*</`  to allow whitespace/newlines between the surrounding tags and the canonical label.
- **Files modified:** `src/components/portal/PortalHeader.test.ts` (line 47, the "renders Sign Out anchor" assertion)
- **Verification:** Test now passes; canonical `Sign Out` label still asserted with surrounding tag context.
- **Committed in:** `efa3307` (Task 4 commit).

---

**Total deviations:** 2 auto-fixed (Rule 1 bugs in test-source regex literals)
**Impact on plan:** Both fixes were essential — the plan-as-written did not parse. Neither fix relaxed the contract; the assertions remain semantically equivalent to the originals. No scope creep.

## Issues Encountered

- Tasks 1-3 were committed in a prior executor session (commits `144cc43` / `8bdbb08` / `77b6df5` from 2026-04-30T18:34→18:35 ET) before this continuation began. Verified each existing file matches the plan's verbatim source byte-for-byte (Tasks 1-3 acceptance criteria were already in repository). No re-work performed.

## TDD Gate Compliance

The plan declared `tdd="true"` on every task but the tasks-as-written are file-creation tasks (no behavior to drive — they are verbatim copies from PATTERNS.md). The previous executor committed Tasks 1-3 as `feat(47-01): add ...` without the test commit preceding them. This Wave's RED gate is satisfied by Task 4's `test(47-01): add ...` commit at `efa3307`, which is the first test commit covering all three components. The 2-RED assertions in Task 4 also stand as the Wave 2 RED gate (Plan 02 must turn them GREEN).

A strict-RED-then-GREEN ordering would have required Task 4 to ship before Tasks 1-3. The deviation is documented for transparency; functionally the contract test exists and asserts every Plan 01 deliverable.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 02 (Wave 2) is unblocked. It must:
  1. Add `bare?: boolean` to `PortalLayout.astro`'s `Props` interface.
  2. Replace the inlined `<footer>` (lines 68-80) with `<PortalFooter tenant={tenant} />`.
  3. Insert `<PortalHeader tenant={tenant} bare={bare} />` above the page slot.
  4. Wrap a `<slot name="banner">` (with `<ImpersonationBannerStub />` fallback inside) above the existing `?preview=1` cosmetic banner block.
  5. Re-run `npx vitest run src/components/portal/PortalHeader.test.ts` — the two PortalLayout-block assertions must turn GREEN; total result `10 passed | 0 failed`.
- The `?preview=1` cosmetic banner stays in place for Plan 02; Phase 50 removes it.
- Plan 03 (Wave 3 page migrations) consumes the components from Plan 01 and the layout integration from Plan 02 — sign-out, wordmark, and sub-label deletions in 7 dashboard/project pages.

## Self-Check

**Files exist:**
- `src/components/portal/PortalHeader.astro` — FOUND
- `src/components/portal/PortalFooter.astro` — FOUND
- `src/components/portal/ImpersonationBannerStub.astro` — FOUND
- `src/components/portal/PortalHeader.test.ts` — FOUND

**Commits exist:**
- `144cc43` — FOUND (feat 47-01 PortalFooter)
- `8bdbb08` — FOUND (feat 47-01 ImpersonationBannerStub)
- `77b6df5` — FOUND (feat 47-01 PortalHeader)
- `efa3307` — FOUND (test 47-01 PortalHeader.test.ts)

**Verification gates:**
- `test -f` for all 4 files — PASS
- `npx vitest run` — exits with `8 passed | 2 failed` (matches plan's design intent)
- `npm run build` — exits 0, no Astro compile errors
- Off-scope source modifications outside the 4 plan files — 0

## Self-Check: PASSED

---
*Phase: 47-portal-layout-hoist*
*Completed: 2026-04-30*
