---
phase: 47-portal-layout-hoist
plan: 04
subsystem: ui
tags: [astro, pages, workorder, migration, chrome-hoist]

# Dependency graph
requires:
  - phase: 47-portal-layout-hoist
    plan: 02
    provides: "PortalLayout shell with PortalHeader (tenant + bare props) + PortalFooter + banner slot"
provides:
  - "3 /workorder/* pages migrated off per-page inlined chrome — wordmark + sub-label + sign-out now sourced exclusively from PortalLayout"
  - "/workorder/login passes bare={true} to PortalLayout (wordmark-only header)"
  - "All three workorder pages now fetch tenant via getPortalBrand and pass it through (none did before)"
  - "Legacy 'Contractor Portal' Title-Case sub-label retired site-wide; PortalHeader renders 'Trade portal' (sentence case) per v5.2 trades-milestone unification"
  - "Hardcoded 'La Sprezzatura' wordmark string eliminated from all 3 workorder pages (CONTEXT D-1 / PATTERNS.md action item closed)"
affects: [47-05, 50, 51]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Workorder page chrome strip: each /workorder/* page renders only its body content; PortalLayout owns wordmark, sub-label, sign-out"
    - "Tenant fetch added to workorder routes (was missing): import sanityClient + getPortalBrand, await getPortalBrand(sanityClient), pass tenant={tenant}"

key-files:
  created: []
  modified:
    - src/pages/workorder/dashboard.astro
    - src/pages/workorder/project/[projectId].astro
    - src/pages/workorder/login.astro

key-decisions:
  - "/workorder/dashboard renders 'Trade portal' sub-label (sentence case) — replacing legacy 'Contractor Portal' (Title Case) is the intended deliverable per CONTEXT D-1, not a regression"
  - "Hardcoded 'La Sprezzatura' wordmark string removed from titles too — all three pages now interpolate ${tenant.displayName} instead, sourcing from siteSettings"
  - "Inlined wordmark on workorder/project/[projectId] (lines 67-72 of pre-plan file, NOT explicitly enumerated in PATTERNS.md but flagged via STEP A scan in plan) deleted — PortalHeader renders it in default mode"

patterns-established:
  - "All recipient pages (/portal/* + /workorder/*) now fetch tenant via getPortalBrand and pass tenant={tenant} to PortalLayout — 8 pages consistently use this pattern (5 portal + 3 workorder)"
  - "Workorder login follows the same bare-mode pattern as portal login + role-select: <PortalLayout title=... tenant={tenant} bare>"

requirements-completed: []  # PORTAL-05 closes when 47-05 also lands (building/* migration)

# Metrics
duration: ~3min
completed: 2026-05-01
---

# Phase 47 Plan 04: Workorder Pages Chrome Migration Summary

**Migrated all three `/workorder/*` recipient pages off their per-page inlined chrome and onto the hoisted PortalLayout shell. Larger lift than Plan 03 (`/portal/*`): every page also needed a brand-tenant fetch added to its frontmatter (none of the workorder pages previously fetched siteSettings) and the legacy "Contractor Portal" sub-label string retired in favor of PortalHeader's role-aware "Trade portal" map.**

## Performance

- **Duration:** ~3 min (3 atomic task commits + summary; clean execution, zero deviations)
- **Started:** 2026-05-01T00:34:55Z
- **Completed:** 2026-05-01T00:37:34Z
- **Tasks:** 3 (all `auto`)
- **Files created:** 0
- **Files modified:** 3

## Accomplishments

- **`src/pages/workorder/dashboard.astro`** — added `getPortalBrand` import + `tenant` fetch (was missing); switched PortalLayout invocation from `title="Work Orders | La Sprezzatura"` to `title={\`Work Orders | ${tenant.displayName}\`} tenant={tenant}`; deleted inlined wordmark (`text-stone tracking-[0.2em] uppercase font-body mb-8 text-center` block) and inlined "Contractor Portal" sub-label and inlined bordered sign-out anchor (the most evolved per-page sign-out variant in the repo, with `border border-stone-light/30 rounded`).
- **`src/pages/workorder/project/[projectId].astro`** — added `getPortalBrand` import + `tenant` fetch (3-level path: `../../../lib/portal/portalBrand`); switched PortalLayout invocation to interpolate `${tenant.displayName}` and pass `tenant={tenant}`; deleted inlined centered wordmark `<p>` block above page header and deleted `{/* Sign Out */}` anchor block at end of body. Preserved "Back to Dashboard" page-level link, ConfidentialityBanner, and all six page sections (Appointments, Scope of Work, Floor Plans, Estimate, Notes from Liz, Your Notes, Contact Liz).
- **`src/pages/workorder/login.astro`** — added `getPortalBrand` import + `tenant` fetch; added `bare` to PortalLayout invocation alongside `tenant={tenant}`; switched title from `"Work Order Access | La Sprezzatura"` literal to interpolated `${tenant.displayName}`; deleted inlined wordmark block. PortalHeader bare-mode renders the wordmark centered above the page body.
- All 10 `PortalHeader.test.ts` assertions remain GREEN (Plan 02 RED-GREEN gate preserved across this plan's three commits).
- `npm run build` exits 0 after each task; all pages compile.

## Task Commits

1. **Task 1: Migrate /workorder/dashboard.astro** — `204f0ff` (feat) — 1 file, +3 / -16 lines
2. **Task 2: Migrate /workorder/project/[projectId].astro** — `325b571` (feat) — 1 file, +4 / -17 lines
3. **Task 3: Migrate /workorder/login.astro to bare mode** — `b4558d9` (feat) — 1 file, +5 / -6 lines

## Files Created/Modified

- `src/pages/workorder/dashboard.astro` — Added `getPortalBrand` import + tenant fetch in frontmatter; threaded `tenant={tenant}` to PortalLayout; deleted inlined wordmark + "Contractor Portal" sub-label + bordered sign-out anchor.
- `src/pages/workorder/project/[projectId].astro` — Added `sanityClient` + `getPortalBrand` imports (3-level path) + tenant fetch; threaded `tenant={tenant}` to PortalLayout; deleted inlined centered wordmark block + inlined sign-out anchor block. Preserved all six page sections, "Back to Dashboard" link, ConfidentialityBanner, siteContact mailto links.
- `src/pages/workorder/login.astro` — Added `sanityClient` + `getPortalBrand` imports + tenant fetch; switched PortalLayout invocation to `tenant={tenant} bare`; deleted inlined wordmark block.

## Decisions Made

- **Hardcoded "La Sprezzatura" string removal extends to titles.** PATTERNS.md explicitly flagged the body-level hardcoded wordmark as the action item; the plan's edits also replaced the title-string literal `"... | La Sprezzatura"` with `\`... | ${tenant.displayName}\`` interpolation so the brand source-of-truth is consistent across `<title>` and rendered chrome. Acceptance criterion `! grep -E '>\s*La Sprezzatura\s*<'` only checks rendered text nodes; the title-string upgrade is additive and aligns with how `src/pages/portal/login.astro:19` already does it.
- **`/workorder/project/[projectId].astro` had its own inlined wordmark block** (pre-plan lines 67-72) that PATTERNS.md called out as "partial visibility — executor must read the full file to confirm." Confirmed and removed; PortalHeader default mode now renders it.
- **Legacy "Contractor Portal" sub-label retired site-wide.** Pre-plan files used the Title Case + longer "Contractor Portal" string. PortalHeader's `ROLE_SUBLABEL.contractor === "Trade portal"` (sentence case, shorter) is the locked single source of truth per CONTEXT D-1 and the v5.2 trades-milestone unification (memory: `project_trades_milestone.md`). This is the intended deliverable, not a regression — Liz unified Contractor/Vendor → Trades in v5.2 and the portal chrome catches up here.
- **Sign-out endpoint unchanged.** `GET /workorder/logout` remains the destination; only the rendering location moves (page body → PortalHeader). No CSRF refactor introduced (CONTEXT D-4 / UI-SPEC line 134).

## Deviations from Plan

None — plan executed exactly as written. All grep acceptance criteria, the vitest gate (10/10 pass), and `npm run build` (exit 0) all green on first attempt for each task.

## Issues Encountered

None.

## Plan Success Criteria — All Green

- [x] All 3 workorder pages add `getPortalBrand` fetch and pass `tenant={tenant}` to PortalLayout
- [x] All 3 pages strip their inlined wordmarks (and dashboard's inlined sub-label)
- [x] dashboard.astro and project/[projectId].astro strip their inlined sign-out anchors
- [x] login.astro adds `bare` to its PortalLayout invocation
- [x] No `href="/workorder/logout"` strings remain inside `src/pages/workorder/`
- [x] No legacy "Contractor Portal" or hardcoded "La Sprezzatura" strings remain inside `src/pages/workorder/`
- [x] `npm run build` exits 0
- [x] `npx vitest run src/components/portal/PortalHeader.test.ts` exits 0 with `10 passed | 0 failed`

## TDD Gate Compliance

This plan does not declare `tdd="true"` on any task. The vitest gate from Plan 02 (`PortalHeader.test.ts`, 10/10 GREEN) is the standing contract test for portal chrome. Re-running it after the three task commits confirmed no regression. No new test commits were required for this plan because all changes are mechanical migrations verified by the existing contract suite plus targeted grep checks.

## User Setup Required

None — no external service configuration, no environment variable additions, no DNS or auth gate.

## Next Phase Readiness

- **Plan 05 (Wave 3, last) unblocked.** Plan 05 migrates `/building/*` pages with the same pattern (same shape: tenant fetch addition + chrome strip + bare prop on login). Once Plan 05 lands, PORTAL-05 closes.
- **Visual regression boundary closed for `/workorder/*`.** After this plan, workorder pages no longer render duplicate wordmarks. The duplicate-wordmark caveat called out in 47-02 SUMMARY for `/workorder/*` is resolved. (`/building/*` still renders duplicates until Plan 05 lands.)
- **Phase 50 readiness:** the banner slot is reachable from all migrated pages because they all share the PortalLayout shell. Phase 50's `<ImpersonationBanner />` will surface on `/workorder/*` automatically.

## Self-Check

**Files exist (modified, present in tree):**
- `src/pages/workorder/dashboard.astro` — FOUND
- `src/pages/workorder/project/[projectId].astro` — FOUND
- `src/pages/workorder/login.astro` — FOUND

**Commits exist:**
- `204f0ff` — FOUND (`feat(47-04): migrate /workorder/dashboard to PortalLayout chrome`)
- `325b571` — FOUND (`feat(47-04): migrate /workorder/project/[projectId] to PortalLayout chrome`)
- `b4558d9` — FOUND (`feat(47-04): migrate /workorder/login to bare PortalLayout chrome`)

**Verification gates:**
- All Task 1 / 2 / 3 grep acceptance criteria — PASS
- Plan-level verification: every workorder page now fetches tenant via getPortalBrand — PASS
- Plan-level verification: no inlined wordmark blocks remain across `/workorder/*` — PASS
- Plan-level verification: no `href="/workorder/logout"` strings remain across `/workorder/*` — PASS
- Plan-level verification: no `Contractor Portal` strings remain inside `src/pages/workorder/` — PASS
- Plan-level verification: no hardcoded `La Sprezzatura` wordmark text-node strings remain — PASS
- bare prop only on `login.astro` — PASS
- `npx vitest run src/components/portal/PortalHeader.test.ts` — `10 passed | 0 failed` — PASS
- `npm run build` — exit 0, all pages compile — PASS
- Off-scope source modifications outside the 3 plan files — 0

## Self-Check: PASSED

---
*Phase: 47-portal-layout-hoist*
*Completed: 2026-05-01*
