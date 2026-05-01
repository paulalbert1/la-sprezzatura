---
phase: 47-portal-layout-hoist
plan: 05
subsystem: ui
tags: [astro, pages, building, migration, chrome-hoist]

# Dependency graph
requires:
  - phase: 47-portal-layout-hoist
    plan: 02
    provides: "PortalLayout shell with PortalHeader (tenant + bare props) + PortalFooter + banner slot"
  - phase: 47-portal-layout-hoist
    plan: 04
    provides: "Sibling /workorder/* migration pattern reused byte-for-byte"
provides:
  - "3 /building/* pages migrated off per-page inlined chrome — wordmark + sub-label + sign-out now sourced exclusively from PortalLayout"
  - "/building/login passes bare={true} to PortalLayout (wordmark-only header)"
  - "All three building pages now fetch tenant via getPortalBrand and pass it through (none did before)"
  - "Legacy 'Building Manager Portal' Title-Case sub-label retired site-wide; PortalHeader renders 'Building portal' (sentence case)"
  - "Hardcoded 'La Sprezzatura' wordmark string eliminated from all 3 building pages (CONTEXT D-1 / PATTERNS.md action item closed)"
  - "PORTAL-05 closed (Phase 47 cross-cutting requirement satisfied across all 11 in-scope pages: 5 portal + 3 workorder + 3 building)"
affects: [50, 51]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Building page chrome strip: each /building/* page renders only its body content; PortalLayout owns wordmark, sub-label, sign-out"
    - "Tenant fetch added to building routes (was missing): import sanityClient + getPortalBrand, await getPortalBrand(sanityClient), pass tenant={tenant}"

key-files:
  created: []
  modified:
    - src/pages/building/dashboard.astro
    - src/pages/building/project/[projectId].astro
    - src/pages/building/login.astro

key-decisions:
  - "/building/dashboard renders 'Building portal' sub-label (sentence case) — replacing legacy 'Building Manager Portal' (Title Case) is the intended deliverable per CONTEXT D-1, not a regression"
  - "Hardcoded 'La Sprezzatura' wordmark string removed from titles too — all three pages now interpolate ${tenant.displayName} instead, sourcing from siteSettings (matches Plan 04 building-side analog)"
  - "Inlined wordmark on building/project/[projectId] (lines 49-51 of pre-plan file) confirmed and deleted — PortalHeader renders it in default mode"
  - "Out-of-scope finding: src/pages/portal/client/[token].astro retains an inlined wordmark; Plan 03 line 52 explicitly excludes /portal/client/* from this phase's scope. Logged to .planning/phases/47-portal-layout-hoist/deferred-items.md"

patterns-established:
  - "All recipient pages (/portal/* + /workorder/* + /building/*) now fetch tenant via getPortalBrand and pass tenant={tenant} to PortalLayout — 11 pages consistently use this pattern (5 portal + 3 workorder + 3 building)"
  - "Building login follows the same bare-mode pattern as portal/workorder login + role-select: <PortalLayout title=... tenant={tenant} bare>"

requirements-completed: [PORTAL-05]

# Metrics
duration: ~9min
completed: 2026-05-01
---

# Phase 47 Plan 05: Building Pages Chrome Migration Summary

**Migrated all three `/building/*` recipient pages off their per-page inlined chrome and onto the hoisted PortalLayout shell. Same shape as Plan 04 (`/workorder/*`): every page also needed a brand-tenant fetch added to its frontmatter (none of the building pages previously fetched siteSettings) and the legacy "Building Manager Portal" sub-label string retired in favor of PortalHeader's role-aware "Building portal" map. Closes PORTAL-05 — the cross-cutting Phase 47 requirement now applies uniformly across all 11 in-scope pages.**

## Performance

- **Duration:** ~9 min (3 atomic task commits + summary; clean execution, zero deviations)
- **Started:** 2026-05-01T00:45:56Z
- **Completed:** 2026-05-01T01:54:41Z (wall clock; active work ~9 min)
- **Tasks:** 3 (all `auto`)
- **Files created:** 0
- **Files modified:** 3

## Accomplishments

- **`src/pages/building/dashboard.astro`** — added `sanityClient` + `getPortalBrand` imports + `tenant` fetch (was missing); switched PortalLayout invocation from `title="Building Portal | La Sprezzatura"` to `title={\`Building Portal | ${tenant.displayName}\`} tenant={tenant}`; deleted inlined wordmark (`text-xs text-stone tracking-[0.2em] uppercase font-body mb-8 text-center` block) and inlined "Building Manager Portal" sub-label (`text-xs text-stone/60 ... -mt-6` block) and inlined bordered sign-out anchor (`border border-stone-light/30 rounded` variant).
- **`src/pages/building/project/[projectId].astro`** — added `sanityClient` + `getPortalBrand` imports + tenant fetch (3-level path: `../../../lib/portal/portalBrand`); switched PortalLayout invocation to interpolate `${tenant.displayName}` and pass `tenant={tenant}`; deleted inlined centered wordmark `<p>` block above page header; deleted `{/* Sign Out */}` anchor block at end of body. Preserved "Back to Dashboard" page-level link, ConfidentialityBanner, all five page sections (Client Contact, Certificates of Insurance, Legal Documents, Contractors, Contact Liz), and siteContact mailto/tel links.
- **`src/pages/building/login.astro`** — added `sanityClient` + `getPortalBrand` imports + tenant fetch; switched title from `"Building Portal | La Sprezzatura"` literal to interpolated `${tenant.displayName}`; added `bare` to PortalLayout invocation alongside `tenant={tenant}`; deleted inlined wordmark block. PortalHeader bare-mode renders the wordmark centered above the page body.
- All 10 `PortalHeader.test.ts` assertions remain GREEN (Plan 02 RED-GREEN gate preserved across this plan's three commits).
- `npm run build` exits 0 after each task; all pages compile.

## Task Commits

1. **Task 1: Migrate /building/dashboard.astro** — `7d6c4fe` (feat) — 1 file, +5 / -16 lines
2. **Task 2: Migrate /building/project/[projectId].astro** — `fdd956b` (feat) — 1 file, +5 / -15 lines
3. **Task 3: Migrate /building/login.astro to bare mode** — `31a089e` (feat) — 1 file, +5 / -6 lines

## Files Created/Modified

- `src/pages/building/dashboard.astro` — Added `sanityClient` + `getPortalBrand` imports + tenant fetch in frontmatter; threaded `tenant={tenant}` to PortalLayout with interpolated displayName title; deleted inlined wordmark + "Building Manager Portal" sub-label + bordered sign-out anchor.
- `src/pages/building/project/[projectId].astro` — Added `sanityClient` + `getPortalBrand` imports (3-level path) + tenant fetch; threaded `tenant={tenant}` to PortalLayout with interpolated displayName title; deleted inlined centered wordmark block + inlined sign-out anchor block. Preserved all five page sections, "Back to Dashboard" link, ConfidentialityBanner, siteContact mailto/tel links.
- `src/pages/building/login.astro` — Added `sanityClient` + `getPortalBrand` imports + tenant fetch; switched PortalLayout invocation to `tenant={tenant} bare`; deleted inlined wordmark block.
- `.planning/phases/47-portal-layout-hoist/deferred-items.md` — NEW (out-of-scope tracking): logs `src/pages/portal/client/[token].astro` as still containing an inlined wordmark; explicitly out of scope per Plan 03 line 52.

## Decisions Made

- **Hardcoded "La Sprezzatura" string removal extends to titles.** PATTERNS.md flagged the body-level hardcoded wordmark as the action item; this plan's edits mirrored Plan 04's approach by also replacing the title-string literal `"... | La Sprezzatura"` with `\`... | ${tenant.displayName}\`` interpolation so the brand source-of-truth is consistent across `<title>` and rendered chrome. Acceptance criterion `! grep -E '>\s*La Sprezzatura\s*<'` only checks rendered text nodes; the title-string upgrade is additive and aligns with Plan 04 SUMMARY decisions and the existing pattern at `src/pages/portal/login.astro`.
- **`/building/project/[projectId].astro` had its own inlined wordmark block** at pre-plan lines 49-51 (PATTERNS.md flagged the workorder analog as "partial visibility — executor must read the full file to confirm"; the building analog mirrors that finding). Confirmed and removed; PortalHeader default mode now renders it.
- **Legacy "Building Manager Portal" sub-label retired site-wide.** Pre-plan dashboard.astro used the Title Case + longer "Building Manager Portal" string. PortalHeader's `ROLE_SUBLABEL.building_manager === "Building portal"` (sentence case, shorter) is the locked single source of truth per CONTEXT D-1. This is the intended deliverable, not a regression.
- **Sign-out endpoint unchanged.** `GET /building/logout` remains the destination; only the rendering location moves (page body → PortalHeader). No CSRF refactor introduced (CONTEXT D-4 / UI-SPEC line 134).
- **Out-of-scope finding documented (not fixed):** `src/pages/portal/client/[token].astro` still contains an inlined wordmark. Plan 03 explicitly excludes `/portal/client/*` from Phase 47 scope (line 52). Logged to `.planning/phases/47-portal-layout-hoist/deferred-items.md` for follow-up in v5.3 or v6.0; not a Phase 47 regression.

## Deviations from Plan

None — plan executed exactly as written. All grep acceptance criteria, the vitest gate (10/10 pass), and `npm run build` (exit 0) all green on first attempt for each task.

## Issues Encountered

None.

## Plan Success Criteria — All Green

- [x] All 3 building pages add `getPortalBrand` fetch and pass `tenant={tenant}` to PortalLayout
- [x] All 3 pages strip their inlined wordmarks (and dashboard's inlined sub-label)
- [x] dashboard.astro and project/[projectId].astro strip their inlined sign-out anchors
- [x] login.astro adds `bare` to its PortalLayout invocation
- [x] No `href="/building/logout"` strings remain inside `src/pages/building/`
- [x] No legacy "Building Manager Portal" or hardcoded "La Sprezzatura" strings remain inside `src/pages/building/`
- [x] `npm run build` exits 0
- [x] `npx vitest run src/components/portal/PortalHeader.test.ts` exits 0 with `10 passed | 0 failed`

## Phase-Level Integration Check (Phase 47 Success Criterion 1)

Per the plan's `<verification>` § Phase-level integration check:

- [x] **(1) No portal/workorder/building page inlines its own wordmark** — single hit at `src/pages/portal/client/[token].astro` is OUT OF SCOPE per Plan 03 line 52; logged to `deferred-items.md`. All 11 in-scope pages clean.
- [x] **(2) No portal/workorder/building page inlines its own sign-out anchor** — clean across all in-scope pages.
- [x] **(3) No legacy sub-label strings remain anywhere in src/pages** — `"Client Portal"` / `"Contractor Portal"` / `"Building Manager Portal"` all absent.
- [x] **(4) PortalHeader is the sole location of the role sub-label map** — `"Trade portal"` only appears in `src/components/portal/PortalHeader.astro` and its test file.
- [x] **(5) PortalHeader is the sole location of the canonical "Sign Out" anchor** — `Sign Out` literal only appears in `src/components/portal/PortalHeader.astro` and its test file (within `src/components/portal/`).
- [x] **(6) ROADMAP Success Criterion 1 — change wordmark in ONE place, update everywhere** — left to manual smoke (per plan: "Optional but the most direct verification of Success Criterion 1"). The mechanical pre-condition (every recipient page sources from `getPortalBrand` → PortalLayout `tenant` prop → PortalHeader/PortalFooter render via `tenant.wordmark`) is satisfied.

## TDD Gate Compliance

This plan does not declare `tdd="true"` on any task. The vitest gate from Plan 02 (`PortalHeader.test.ts`, 10/10 GREEN) is the standing contract test for portal chrome. Re-running it after the three task commits confirmed no regression. No new test commits were required for this plan because all changes are mechanical migrations verified by the existing contract suite plus targeted grep checks.

## User Setup Required

None — no external service configuration, no environment variable additions, no DNS or auth gate.

## Next Phase Readiness

- **Phase 47 complete.** All 5 plans landed; PORTAL-05 closes with this summary. The orchestrator should run the phase verifier against ROADMAP Success Criteria 1, 2, 3.
- **Visual regression boundary closed for `/building/*`.** After this plan, building pages no longer render duplicate wordmarks. The duplicate-wordmark caveat called out in 47-02 SUMMARY for `/building/*` is resolved. All three recipient surfaces (`/portal/*`, `/workorder/*`, `/building/*`) now share one chrome source-of-truth.
- **Phase 50 readiness:** the banner slot is reachable from all migrated pages because they all share the PortalLayout shell. Phase 50's `<ImpersonationBanner />` will surface on `/building/*` automatically.
- **Out-of-scope follow-up:** `src/pages/portal/client/[token].astro` migration deferred to v5.3 or v6.0; logged in `.planning/phases/47-portal-layout-hoist/deferred-items.md`.

## Self-Check

**Files exist (modified, present in tree):**
- `src/pages/building/dashboard.astro` — FOUND
- `src/pages/building/project/[projectId].astro` — FOUND
- `src/pages/building/login.astro` — FOUND
- `.planning/phases/47-portal-layout-hoist/deferred-items.md` — FOUND

**Commits exist:**
- `7d6c4fe` — FOUND (`feat(47-05): migrate /building/dashboard to PortalLayout chrome`)
- `fdd956b` — FOUND (`feat(47-05): migrate /building/project/[projectId] to PortalLayout chrome`)
- `31a089e` — FOUND (`feat(47-05): migrate /building/login to bare PortalLayout chrome`)

**Verification gates:**
- All Task 1 / 2 / 3 grep acceptance criteria — PASS
- Plan-level verification: every building page now fetches tenant via getPortalBrand — PASS
- Plan-level verification: no inlined wordmark blocks remain across `/building/*` — PASS
- Plan-level verification: no `href="/building/logout"` strings remain across `/building/*` — PASS
- Plan-level verification: no `Building Manager Portal` strings remain inside `src/pages/building/` — PASS
- Plan-level verification: no hardcoded `La Sprezzatura` wordmark text-node strings remain — PASS
- bare prop only on `login.astro` — PASS
- Phase-level integration check (1)-(5) — PASS (with documented out-of-scope finding for `/portal/client/[token]`)
- `npx vitest run src/components/portal/PortalHeader.test.ts` — `10 passed | 0 failed` — PASS
- `npm run build` — exit 0, all pages compile — PASS
- Off-scope source modifications outside the 3 plan files — 0

## Self-Check: PASSED

---
*Phase: 47-portal-layout-hoist*
*Completed: 2026-05-01*
