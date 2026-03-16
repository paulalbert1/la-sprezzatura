---
phase: 06-portal-features
plan: 01
subsystem: database, api, util
tags: [sanity, groq, vitest, tdd, currency, tracking, milestones, artifacts, procurement]

# Dependency graph
requires:
  - phase: 05-data-foundation-auth
    provides: "Sanity client/schema, GROQ queries, auth session, vitest config"
provides:
  - "Extended project schema with milestones, procurement, artifacts inline arrays"
  - "PROJECT_DETAIL_QUERY with computed savings and no clientCost leakage"
  - "PROJECTS_BY_CLIENT_QUERY with completedAt/projectStatus for dashboard filtering"
  - "Sanity write client for server-side mutations"
  - "5 utility modules: formatCurrency, trackingUrl, milestoneUtils, artifactUtils, projectVisibility"
  - "TypeScript types: Milestone, MilestoneNote, Artifact, ArtifactVersion, DecisionLogEntry"
affects: [06-02, 06-03, 06-04, 06-05]

# Tech tracking
tech-stack:
  added: ["@sanity/client (write client)"]
  patterns: ["TDD for utility modules", "integer cents for financial values", "GROQ select() for conditional projections", "inline arrays with nested sub-arrays"]

key-files:
  created:
    - src/lib/formatCurrency.ts
    - src/lib/formatCurrency.test.ts
    - src/lib/trackingUrl.ts
    - src/lib/trackingUrl.test.ts
    - src/lib/milestoneUtils.ts
    - src/lib/milestoneUtils.test.ts
    - src/lib/artifactUtils.ts
    - src/lib/artifactUtils.test.ts
    - src/lib/projectVisibility.ts
    - src/lib/projectVisibility.test.ts
    - src/sanity/writeClient.ts
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/queries.ts
    - .env.example

key-decisions:
  - "USPS regex checked before FedEx to avoid false matches on long numeric USPS numbers"
  - "GROQ select() used for conditional procurement inclusion based on engagement type"
  - "Procurement savings computed server-side in GROQ (retailPrice - clientCost) -- clientCost never sent to client"

patterns-established:
  - "Integer cents storage: all financial values use .integer().min(0) validation"
  - "TDD cycle for pure utility modules: failing tests first, then implementation"
  - "Artifact badge styles mapped to Tailwind classes via lookup table"
  - "30-day visibility window with reopened status override"

requirements-completed: [MILE-01, PROC-01, PROC-02, ARTF-01, ARTF-02, ARTF-04, ARTF-08, CLNT-07]

# Metrics
duration: 6min
completed: 2026-03-16
---

# Phase 6 Plan 01: Data Foundation Summary

**Extended Sanity project schema with milestones/procurement/artifacts, GROQ detail query with computed savings, write client, and 5 TDD utility modules (38 tests)**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-16T19:37:37Z
- **Completed:** 2026-03-16T19:44:15Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- 5 utility modules built via TDD with 38 passing tests covering currency formatting, carrier tracking, milestone logic, artifact management, and project visibility
- Project schema extended with 3 new field groups (Milestones, Procurement, Artifacts) and all inline arrays including nested sub-arrays for notes, versions, and decision logs
- PROJECT_DETAIL_QUERY computes savings server-side and never exposes clientCost to the client
- Sanity write client created for server-side mutations with server-only token

## Task Commits

Each task was committed atomically:

1. **Task 1: Utility libraries with tests (TDD RED)** - `aa9b9af` (test)
2. **Task 1: Utility libraries with tests (TDD GREEN)** - `f36a531` (feat)
3. **Task 2: Schema extensions + GROQ query + write client + env** - `4b12e20` (feat)

_TDD task produced 2 commits (RED + GREEN, no refactor needed)_

## Files Created/Modified
- `src/lib/formatCurrency.ts` - Cents-to-USD formatter using Intl.NumberFormat
- `src/lib/formatCurrency.test.ts` - 4 tests for currency formatting
- `src/lib/trackingUrl.ts` - UPS/FedEx/USPS carrier detection and tracking URL builder
- `src/lib/trackingUrl.test.ts` - 5 tests for carrier detection
- `src/lib/milestoneUtils.ts` - Milestone sorting, progress, status, relative dates with types
- `src/lib/milestoneUtils.test.ts` - 10 tests for milestone logic
- `src/lib/artifactUtils.ts` - Artifact type labels, version helpers, contract signing, badge styles with types
- `src/lib/artifactUtils.test.ts` - 12 tests for artifact logic
- `src/lib/projectVisibility.ts` - 30-day visibility window, completion, reopened checks
- `src/lib/projectVisibility.test.ts` - 7 tests for visibility logic
- `src/sanity/writeClient.ts` - Sanity write client with server-only SANITY_WRITE_TOKEN
- `src/sanity/schemas/project.ts` - Extended with 3 groups, 5 inline arrays, projectStatus, completedAt
- `src/sanity/queries.ts` - Added PROJECT_DETAIL_QUERY, updated PROJECTS_BY_CLIENT_QUERY
- `.env.example` - Added SANITY_WRITE_TOKEN documentation

## Decisions Made
- USPS regex checked before FedEx to prevent false positive matches on long numeric USPS tracking numbers
- GROQ select() used for conditional procurement inclusion based on engagementType
- Procurement savings computed server-side in GROQ (retailPrice - clientCost) so clientCost is never sent to the client browser

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing Redis URL double-quoting in local .env causes prerender failures during `npm run build`. This is a local env configuration issue, not caused by this plan's changes. Logged to deferred-items.md. All tests pass and TypeScript compilation succeeds.

## User Setup Required

**External services require manual configuration.** The Sanity write token needs to be added:
- Environment variable: `SANITY_WRITE_TOKEN`
- Source: Sanity Dashboard -> Settings -> API -> Tokens -> Add API token (Editor role)
- Add to `.env` locally and to Vercel environment variables for deployment

## Next Phase Readiness
- Schema foundation complete for all Phase 6 portal components
- Utility modules ready for import by portal pages and server actions
- Write client ready for milestone notes, artifact approvals, warranty claims
- All 93 tests passing (38 new + 55 existing)

## Self-Check: PASSED

All 14 created/modified files verified on disk. All 3 task commits (aa9b9af, f36a531, 4b12e20) found in git history.

---
*Phase: 06-portal-features*
*Completed: 2026-03-16*
