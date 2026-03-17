---
phase: 9
slug: send-update-investment-proposals-and-public-site-polish
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-17
---

# Phase 9 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-00 | 01 | 1 | ALL | test scaffold | `npx vitest run src/sanity/schemas/project.test.ts src/lib/artifactUtils.test.ts src/actions/portalActions.test.ts src/sanity/queries.test.ts` | Extend existing | ⬜ pending |
| 09-01-01 | 01 | 1 | SEND-01 | unit (schema) | `npx vitest run src/sanity/schemas/project.test.ts -t "Phase 9"` | Extend existing | ⬜ pending |
| 09-01-02 | 01 | 1 | SEND-02 | unit (query, HTML) | `npx vitest run src/sanity/queries.test.ts -t "SEND_UPDATE_PROJECT_QUERY"` | Extend existing | ⬜ pending |
| 09-01-03 | 01 | 1 | SEND-03 | unit (log entry) | `npx vitest run src/sanity/schemas/project.test.ts -t "updateLog"` | Extend existing | ⬜ pending |
| 09-02-01 | 02 | 1 | ARTF-05 | unit (schema, types) | `npx vitest run src/lib/artifactUtils.test.ts -t "Investment Summary"` | Extend existing | ⬜ pending |
| 09-02-02 | 02 | 1 | ARTF-06 | unit (schema, action) | `npx vitest run src/actions/portalActions.test.ts -t "selectTier"` | Extend existing | ⬜ pending |
| 09-02-03 | 02 | 1 | ARTF-07 | unit (schema) | `npx vitest run src/actions/portalActions.test.ts -t "eagerness"` | Extend existing | ⬜ pending |
| 09-03-01 | 03 | 2 | BOOK-01 | unit (deletion) | `npx vitest run` (build passes without CalBooking) | N/A -- deletion | ⬜ pending |
| 09-03-02 | 03 | 2 | SITE-08 | manual-only | Manual: visit home page, observe character animation | N/A -- visual | ⬜ pending |

*Status: ⬜ pending / ✅ green / ❌ red / ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Extend `src/sanity/schemas/project.test.ts` -- cover updateLog[] field and investmentSummary nested schema **(Plan 09-01, Task 0)**
- [x] Extend `src/lib/artifactUtils.test.ts` -- cover investment summary type extensions **(Plan 09-01, Task 0)**
- [x] Extend `src/actions/portalActions.test.ts` -- cover selectTier action validation **(Plan 09-01, Task 0)**
- [x] Extend `src/sanity/queries.test.ts` -- cover send-update snapshot query string **(Plan 09-01, Task 0)**
- [x] Add `src/actions/portalSchemas.ts` selectTierSchema -- validation tests **(Plan 09-01, Task 0 via portalActions.test.ts)**

*All Wave 0 test scaffolds are authored in Plan 09-01 Task 0 before any production code changes.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero SplitText animation | SITE-08 | Visual/animation behavior cannot be asserted in unit tests | 1. Visit home page 2. Observe hero text animates in character-by-character with GSAP SplitText 3. Verify animation creates strong visual impression |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (Wave 0 task added to Plan 09-01)
