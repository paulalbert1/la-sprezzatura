---
phase: 47-portal-layout-hoist
plan: 03
subsystem: ui
tags: [astro, pages, portal, migration, chrome-hoist]

# Dependency graph
requires:
  - phase: 47-portal-layout-hoist
    plan: 02
    provides: "PortalLayout shell mounting PortalHeader (with bare prop) + PortalFooter + banner slot"
provides:
  - "5 /portal/* pages migrated off per-page inlined chrome — wordmark + sign-out now sourced exclusively from PortalLayout"
  - "/portal/login and /portal/role-select pass bare to PortalLayout (wordmark-only header)"
  - "Half of ROADMAP Success Criterion 1 (single-component brand-mark edit propagates to every portal page)"
affects: [47-04, 47-05, 50, 51]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Page-level chrome strip: each /portal/* page now contains only page body content; chrome rendered by PortalLayout shell"
    - "bare prop adoption pattern (login + role-select): PortalLayout title=... tenant=... bare>"

key-files:
  created: []
  modified:
    - src/pages/portal/dashboard.astro
    - src/pages/portal/project/[projectId].astro
    - src/pages/portal/[token].astro
    - src/pages/portal/login.astro
    - src/pages/portal/role-select.astro

key-decisions:
  - "/portal/[token] does NOT receive bare prop — default mode renders wordmark-only because Astro.locals.role is undefined on this public path (showSignOut=false), which is functionally equivalent to bare without coupling [token] to the bare contract"
  - "'Back to Dashboard' link on project/[projectId] is page-level navigation, NOT chrome — preserved per PATTERNS.md explicit callout"
  - "Sentence-case 'Client portal' string moves into PortalHeader (single source of truth); pages no longer carry the legacy Title-Case 'Client Portal' string"

patterns-established:
  - "Portal pages render page body only; PortalLayout owns wordmark, role sub-label, and sign-out (CONTEXT D-1, D-4)"
  - "bare prop is canonical Astro shorthand (matches client:load precedent); do NOT use bare={true}"

requirements-completed: []  # PORTAL-05 closes when 47-04 and 47-05 also land

# Metrics
duration: ~2min
completed: 2026-05-01
---

# Phase 47 Plan 03: Portal Pages Chrome Migration Summary

**Migrated all five /portal/* recipient pages off their per-page inlined wordmark + sign-out blocks. Two pages adopted the `bare` prop (login + role-select); three pages dropped chrome only. PortalLayout shell now provides the wordmark, role sub-label, and sign-out anchor for every portal page consistently.**

## Performance

- **Duration:** ~2 min (3 atomic task commits + summary; clean execution, zero deviations)
- **Started:** 2026-05-01T00:24:10Z
- **Completed:** 2026-05-01T00:26:21Z
- **Tasks:** 3 (all `auto`)
- **Files created:** 0
- **Files modified:** 5

## Accomplishments

- **`src/pages/portal/dashboard.astro`** — removed inlined wordmark + "Client Portal" sub-label `<p>` block (lines 53-57 of pre-plan file) and the bordered sign-out anchor block (lines 192-200). PortalLayout invocation unchanged (no `bare` — authenticated default mode).
- **`src/pages/portal/project/[projectId].astro`** — removed inlined wordmark `<p>` block (lines 65-69 of pre-plan file) and the inlined sign-out anchor block (lines 112-119). "Back to Dashboard" page-level affordance preserved per PATTERNS.md callout. PortalLayout invocation unchanged.
- **`src/pages/portal/[token].astro`** (PURL upgrade landing) — removed inlined wordmark block (lines 16-19 of pre-plan file). Did NOT add `bare`: default mode renders wordmark-only on this public path because `Astro.locals.role` is undefined → `showSignOut === false` → no sub-label rendered, which is visually equivalent to bare-mode.
- **`src/pages/portal/login.astro`** — added `bare` to `<PortalLayout title=... tenant=... bare>` (line 19) and removed inlined wordmark block (lines 22-25). PortalHeader now renders the wordmark centered above the page body's `<h1>Welcome to Your Portal</h1>`.
- **`src/pages/portal/role-select.astro`** — added `bare` to PortalLayout invocation (line 43) and removed inlined wordmark block (lines 46-49). RoleSelectionForm intact.
- All 10 `PortalHeader.test.ts` assertions remain GREEN (Plan 02 RED-GREEN gate preserved).
- `npm run build` exits 0 after each task; all 13 pages currently consuming PortalLayout continue to compile.

## Task Commits

1. **Task 1: Strip inlined chrome from /portal/dashboard.astro and /portal/project/[projectId].astro** — `032bdae` (feat) — 2 files, -29 lines
2. **Task 2: Strip inlined wordmark from /portal/[token].astro** — `4a009ed` (feat) — 1 file, -5 lines
3. **Task 3: Add bare prop and strip wordmark from /portal/login.astro and /portal/role-select.astro** — `724eba5` (feat) — 2 files, +2 / -12 lines

## Files Created/Modified

- `src/pages/portal/dashboard.astro` — Removed inlined wordmark + "Client Portal" sub-label + bordered sign-out anchor block. Page now renders only its body (greeting, project cards, past projects accordion).
- `src/pages/portal/project/[projectId].astro` — Removed inlined wordmark + inlined sign-out anchor block. "Back to Dashboard" page-level link preserved.
- `src/pages/portal/[token].astro` — Removed inlined wordmark + brand-mark comment.
- `src/pages/portal/login.astro` — Added `bare` to PortalLayout; removed inlined wordmark + brand-mark comment.
- `src/pages/portal/role-select.astro` — Added `bare` to PortalLayout; removed inlined wordmark + brand-mark comment.

## Decisions Made

- **`/portal/[token]` stays in default mode** (no `bare`) per UI-SPEC §Component Inventory — the default-mode header renders the wordmark only on this public path because `Astro.locals.role` is undefined (`showSignOut === false` → no sub-label rendered). This matches the bare-mode visual without coupling `[token]` to the bare contract.
- **"Back to Dashboard" preserved on project page** — it is a page-level navigation affordance, NOT chrome (PATTERNS.md explicit callout). Sign-out is the only chrome element being deleted from the project page.
- **No PortalLayout invocation changes on dashboard / project / [token]** — those pages continue using the default mode (no `bare`), so PortalHeader will show the full chrome (wordmark, role sub-label "Client portal", and sign-out anchor) on `dashboard` and `project/[projectId]`. On `[token]` it shows wordmark-only via the auto-fallback (no role).

## Deviations from Plan

None — plan executed exactly as written. All grep acceptance criteria, the vitest gate (10/10 pass), and `npm run build` (exit 0) all green on first attempt for each task.

**Note on grep tool quirk during plan-level verification:** the literal regex `tenant={tenant} bare>` triggered a parser error in the system grep variant (ugrep) due to the curly braces. Used `grep -lF` (fixed-string) as a substitute — confirmed only `login.astro` and `role-select.astro` contain the bare prop. Functional contract verified.

## Issues Encountered

None.

## Plan Success Criteria — All Green

- [x] All 5 portal pages strip their inlined wordmark blocks
- [x] dashboard.astro and project/[projectId].astro strip their inlined sign-out anchors
- [x] login.astro and role-select.astro pass `bare` to PortalLayout
- [x] [token].astro does NOT pass `bare` (default mode renders wordmark-only because role is undefined)
- [x] No `href="/portal/logout"` strings remain inside `src/pages/portal/` (anchor moved to PortalHeader)
- [x] `npm run build` exits 0
- [x] `npx vitest run src/components/portal/PortalHeader.test.ts` exits 0 with `10 passed | 0 failed`

## TDD Gate Compliance

This plan does not declare `tdd="true"` on any task. The vitest gate from Plan 02 (`PortalHeader.test.ts`, 10/10 GREEN) is the standing contract test for portal chrome. Re-running it after each task confirmed no regression. No new test commits were required for this plan because all changes are pure deletions (and a single `bare` token addition) verified by the existing contract suite plus targeted grep checks.

## User Setup Required

None.

## Next Phase Readiness

- **Plan 04 (Wave 3, parallel) unblocked.** Plan 04 migrates `/workorder/*` pages with the same pattern. Plan 04 will additionally need to add the `getPortalBrand()` fetch + `tenant={tenant}` pass-through on the `workorder/*` pages that don't currently fetch tenant — PATTERNS.md flagged this as an action item for those pages.
- **Plan 05 (Wave 3, parallel) unblocked.** Plan 05 migrates `/building/*` pages (same pattern, same potential `tenant` pass-through fix).
- **PORTAL-05 requirement** closes when Plan 04 and Plan 05 ship — this plan does NOT close the requirement, only delivers the `/portal/*` half.
- **Visual regression boundary closed for `/portal/*`.** After this plan, `/portal/*` pages no longer render duplicate wordmarks. The duplicate-wordmark caveat called out in 47-02 SUMMARY for `/portal/*` is resolved. (`/workorder/*` and `/building/*` still render duplicates until Plans 04 and 05 land.)

## Self-Check

**Files exist (modified, present in tree):**
- `src/pages/portal/dashboard.astro` — FOUND
- `src/pages/portal/project/[projectId].astro` — FOUND
- `src/pages/portal/[token].astro` — FOUND
- `src/pages/portal/login.astro` — FOUND
- `src/pages/portal/role-select.astro` — FOUND

**Commits exist:**
- `032bdae` — FOUND (`feat(47-03): strip inlined chrome from /portal/dashboard and /portal/project/[projectId]`)
- `4a009ed` — FOUND (`feat(47-03): strip inlined wordmark from /portal/[token] PURL upgrade landing`)
- `724eba5` — FOUND (`feat(47-03): add bare prop + strip wordmark from /portal/login and /portal/role-select`)

**Verification gates:**
- All Task 1 / 2 / 3 grep acceptance criteria — PASS
- Plan-level verification: no inlined wordmark blocks remain across `/portal/*` — PASS
- Plan-level verification: no `href="/portal/logout"` strings remain across `/portal/*` — PASS
- bare prop only on `login.astro` and `role-select.astro` — PASS
- `npx vitest run src/components/portal/PortalHeader.test.ts` — `10 passed | 0 failed` — PASS
- `npm run build` — exit 0, all pages compile — PASS
- Off-scope source modifications outside the 5 plan files — 0

## Self-Check: PASSED

---
*Phase: 47-portal-layout-hoist*
*Completed: 2026-05-01*
