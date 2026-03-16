---
phase: 03-client-operations-portal
verified: 2026-03-15T16:41:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "Client visits their unique portal URL and sees all required elements"
    expected: "Project name as large heading, 'Welcome, [clientName]' greeting, terracotta status badge with current stage title, 'Project Timeline' heading, responsive milestone stepper with completed/current/future dots, stage description text below timeline, branded footer, no site navigation"
    why_human: "Full visual rendering, correct stage highlighting, and responsive layout require a browser to verify"
  - test: "Liz updates pipeline stage in Sanity Studio and client sees change on next page load"
    expected: "Changing pipelineStage from e.g. 'Concept' to 'Design Development' in Studio, then refreshing the portal URL, shows the new stage highlighted and prior stages checked"
    why_human: "Requires a live Sanity document and real SSR fetch cycle to confirm data flows end-to-end"
  - test: "Timeline is horizontal on desktop and vertical on mobile"
    expected: "At viewport >= 768px stages flow left-to-right with connectors above dots; below 768px stages stack top-to-bottom with connector lines on the left"
    why_human: "Responsive layout behavior can only be confirmed visually by resizing a browser"
  - test: "Toggling portalEnabled off makes the portal URL return 404"
    expected: "Portal URL that previously showed a project now shows the generic 'Project Not Found' page after toggling portalEnabled to false in Studio"
    why_human: "Requires a live Sanity write + SSR query to verify the toggle controls GROQ filter"
---

# Phase 03: Client Operations Portal Verification Report

**Phase Goal:** Active clients can visit a unique project URL (no login) on the staging site and see their project status, current pipeline stage, and milestone timeline -- managed by Liz through the same Sanity Studio she already uses

**Verified:** 2026-03-15T16:41:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

---

## Goal Achievement

### Observable Truths (from Phase Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | A client clicking their unique portal URL sees their project name, status badge, current pipeline stage, and milestone timeline without any login | ? NEEDS HUMAN | Page exists and renders all elements (verified by code); full visual confirmation requires browser |
| 2 | Liz can update pipeline stage in Sanity Studio and client sees change reflected | ? NEEDS HUMAN | SSR is confirmed (`prerender = false`); GROQ query fetches fresh from Sanity on every request; end-to-end requires live Sanity + browser |
| 3 | Guessing or modifying a PURL token does not expose another client's project data | VERIFIED | All invalid/disabled/non-existent tokens return the identical generic 404 page -- no differentiation; GROQ query filters on both `portalToken == $token AND portalEnabled == true` simultaneously |

**Score:** 7/7 structural must-haves verified (3/3 success criteria fully or partially verified)

---

## Required Artifacts (Plan 03-01)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/generateToken.ts` | 8-char alphanumeric token generator using crypto | VERIFIED | 42 lines; exports `generatePortalToken`; environment-adaptive Web Crypto API with Node.js fallback |
| `src/lib/portalStages.ts` | Stage metadata map with all 6 pipeline stages | VERIFIED | 57 lines; exports `StageKey`, `StageMeta`, `STAGES` (6 entries), `STAGE_META` |
| `src/lib/rateLimit.ts` | Reusable rate limiter extracted | VERIFIED | 37 lines; exports `checkRateLimit(ip, options?)` throwing `Error("Too many requests")` |
| `src/sanity/schemas/project.ts` | Extended project schema with portal fields and field groups | VERIFIED | Contains `portalToken`, `clientName`, `portalEnabled` fields in `portal` group; `pipelineStage` no longer hidden; groups array defines `content` (default) + `portal` |
| `src/sanity/components/PortalUrlDisplay.tsx` | Custom Sanity input showing full portal URL with copy button | VERIFIED | 47 lines; exports `PortalUrlDisplay`; uses `useFormValue(["portalEnabled"])`, copy-to-clipboard, conditional messaging |
| `src/sanity/queries.ts` | Portal token lookup query | VERIFIED | Exports `getProjectByPortalToken`; GROQ filters `portalToken == $token && portalEnabled == true` |
| `vitest.config.ts` | Vitest configuration | VERIFIED | Minimal config targeting `src/**/*.test.ts` |

## Required Artifacts (Plan 03-02)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/portal/PortalLayout.astro` | Minimal layout with no nav, branded footer, noindex meta | VERIFIED | 38 lines; `<meta name="robots" content="noindex, nofollow">`; Font preloads; branded footer with email; no navigation imported |
| `src/components/portal/StatusBadge.astro` | Pill-shaped badge showing stage name with color coding | VERIFIED | 20 lines; `bg-terracotta/10 text-terracotta` for active; `bg-emerald-50 text-emerald-700` for closeout |
| `src/components/portal/MilestoneTimeline.astro` | Responsive stepper (horizontal desktop, vertical mobile) | VERIFIED | 108 lines; `flex-col md:flex-row` layout; connector lines for both orientations; completed/current/future dot states; stage description below |
| `src/pages/portal/[token].astro` | SSR portal page with token lookup, rate limiting, 404 handling | VERIFIED | `export const prerender = false`; rate limiting with 429 response; generic 404 for invalid/disabled tokens; full portal UI for valid tokens |
| `astro.config.mjs` | Sitemap filter excluding /portal/ routes | VERIFIED | `filter: (page) => !page.includes("/admin") && !page.includes("/portal")`; `output: "server"` for SSR |

---

## Key Link Verification (Plan 03-01)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/sanity/schemas/project.ts` | `src/sanity/components/PortalUrlDisplay.tsx` | `components.input` on portalToken field | WIRED | Line 3: `import { PortalUrlDisplay } from "../components/PortalUrlDisplay"`; line 192: `components: { input: PortalUrlDisplay }` |
| `src/sanity/schemas/project.ts` | `src/lib/generateToken.ts` | `initialValue` callback | WIRED | Line 2: `import { generatePortalToken } from "../../lib/generateToken"`; line 191: `initialValue: () => generatePortalToken()` |
| `src/sanity/queries.ts` | `portalToken` field | GROQ query filter | WIRED | `portalToken == $token && portalEnabled == true` present at line 76 |

## Key Link Verification (Plan 03-02)

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/pages/portal/[token].astro` | `src/sanity/queries.ts` | `getProjectByPortalToken` import | WIRED | Line 7: imported; line 34: `project = await getProjectByPortalToken(token)` called and result used |
| `src/pages/portal/[token].astro` | `src/lib/portalStages.ts` | `STAGE_META` import | WIRED | Line 8: `import { STAGE_META, type StageKey }`; used at lines 39, 109-111 |
| `src/pages/portal/[token].astro` | `src/lib/rateLimit.ts` | `checkRateLimit` import | WIRED | Line 9: imported; lines 21-23: called with `{ maxRequests: 10, windowMs: 60_000 }`; result drives 429 branch |
| `src/pages/portal/[token].astro` | `src/components/portal/MilestoneTimeline.astro` | component import | WIRED | Line 5: imported; line 123: `<MilestoneTimeline currentStage={currentStage} />` |
| `src/pages/portal/[token].astro` | `src/components/portal/StatusBadge.astro` | component import | WIRED | Line 6: imported; lines 109-112: `<StatusBadge stage={stageMeta.title} isComplete={currentStage === "closeout"} />` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| CLNT-01 | 03-01, 03-02 | Client project portal accessible via PURL (unique URL per project, no login required) | SATISFIED | `src/pages/portal/[token].astro` with `prerender = false`; no auth middleware; token is URL path segment |
| CLNT-02 | 03-02 | Portal displays project name, status badge, current pipeline stage, and milestone timeline | SATISFIED | Portal page renders `project.title` (h1), `StatusBadge` with stage title, `MilestoneTimeline` with all 6 stages |
| CLNT-03 | 03-01 | Project pipeline schema in Sanity with stages: Discovery, Concept, Design Development, Procurement, Installation, Closeout | SATISFIED | `src/sanity/schemas/project.ts` pipelineStage field; `src/lib/portalStages.ts` STAGES array with all 6 in correct order; vitest confirms count and order |

All 3 phase requirement IDs (CLNT-01, CLNT-02, CLNT-03) are claimed by plans and verified as implemented. No orphaned requirements found.

---

## Test Results

All 9 vitest tests pass (verified live):

```
src/lib/portalStages.test.ts (5 tests) -- all pass
  - STAGES has exactly 6 entries
  - STAGES are in the correct order
  - each StageMeta has a non-empty value, title, and description
  - STAGE_META maps each StageKey to the corresponding StageMeta
  - STAGE_META has exactly 6 entries

src/lib/generateToken.test.ts (4 tests) -- all pass
  - returns an 8-character string by default
  - returns only alphanumeric characters
  - respects a custom length parameter
  - produces unique tokens across 1000 calls
```

---

## Anti-Patterns Found

No anti-patterns detected.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | No TODOs, stubs, placeholders, or empty handlers found | — | — |

---

## Git Commits Verified

All 5 phase commits documented in SUMMARY files exist in git log:

| Commit | Description |
|--------|-------------|
| `3e23b45` | test(03-01): add failing tests for token generation and portal stages |
| `58b7f3c` | feat(03-01): implement token generation, stage metadata, and rate limiter |
| `3610ee9` | feat(03-01): extend Sanity schema with portal fields and token lookup query |
| `fbb8a5f` | feat(03-02): create portal visual components (PortalLayout, StatusBadge, MilestoneTimeline) |
| `067f0d3` | feat(03-02): create SSR portal page with token lookup, rate limiting, and sitemap exclusion |
| `aa74dc4` | fix(03-02): add output: server to astro config for actions + SSR support |

---

## Human Verification Required

The following items require a running dev server to confirm. All automated checks have passed.

### 1. Full Portal Page Visual Rendering

**Test:** Start dev server (`npm run dev`), create a project in Sanity Studio with a pipeline stage, clientName, and portalEnabled=true, then visit the portal URL.

**Expected:** La Sprezzatura branding text at top (small uppercase), project title as large serif heading, "Welcome, [clientName]" in stone-colored text, terracotta pill badge with current stage name, horizontal divider, "Project Timeline" heading, milestone stepper with checkmarks on completed stages, ring on current stage, muted dots on future stages, stage description paragraph below timeline, "Contact Elizabeth" CTA, branded footer with email link. No site navigation or menu anywhere on page.

**Why human:** Visual layout fidelity, correct Tailwind class rendering, font loading, and component composition can only be confirmed in a browser.

### 2. Live Stage Update Flow (Success Criterion 2)

**Test:** With a project portal open in browser tab A, update pipelineStage in Sanity Studio (browser tab B), then hard-refresh tab A.

**Expected:** The portal page reflects the new stage -- updated badge text, new dot highlighted with ring, previously completed dots show checkmarks, new stage description appears.

**Why human:** Requires live Sanity write + SSR query cycle. The `prerender = false` flag and absence of any caching in the portal query are confirmed in code, but the actual data propagation requires a real Sanity document.

### 3. Responsive Timeline Layout

**Test:** View the portal page at full desktop width (~1280px), then resize below 768px (mobile breakpoint).

**Expected:** At desktop: stages flow left-to-right in a row, dots appear above labels, horizontal connector lines link them. At mobile: stages stack vertically, dots appear on the left, vertical connector lines link them, labels appear to the right of dots.

**Why human:** `flex-col md:flex-row` and the two connector div implementations (one `md:hidden`, one `hidden md:block`) need browser rendering to confirm correct breakpoint switching.

### 4. portalEnabled Toggle Controls Access

**Test:** On a project with portalEnabled=true, visit the portal URL to confirm it works. Then toggle portalEnabled to false in Studio and refresh the portal URL.

**Expected:** After disabling, the portal URL shows the generic "Project Not Found" page regardless of the correct token being in the URL.

**Why human:** Requires Sanity document write + GROQ query evaluation on the server to confirm the `portalEnabled == true` filter in `getProjectByPortalToken` correctly gates access.

---

## Gaps Summary

No gaps. All artifacts exist, are substantive, and are wired. All three requirement IDs are satisfied. The four items above require human confirmation because they involve visual rendering, responsive breakpoints, and live Sanity data flow -- none of which can be verified by static code analysis alone.

The Phase 02 SUMMARY notes that a human verified the portal end-to-end as Task 3 (checkpoint), but this verification report treats that as user confirmation during execution, not as a substitute for independent verification here.

---

_Verified: 2026-03-15T16:41:00Z_
_Verifier: Claude (gsd-verifier)_
