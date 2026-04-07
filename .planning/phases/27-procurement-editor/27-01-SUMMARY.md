---
phase: 27-procurement-editor
plan: 01
subsystem: api
tags: [groq, sanity, utilities, procurement, typescript]

# Dependency graph
requires:
  - phase: 22-procurement-foundation
    provides: procurement schema fields and procurementStages lib
  - phase: 23-custom-list-ui
    provides: ProcurementListItem component with inline isOverdue
provides:
  - "Shared isOverdue() utility at src/lib/isOverdue.ts"
  - "Shared getCarrierFromUrl() utility at src/lib/carrierFromUrl.ts"
  - "GROQ getAdminProcurementData() query with full 14-field projection including clientCost"
affects: [27-procurement-editor]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared-utility-extraction, admin-query-pattern-with-clientCost]

key-files:
  created:
    - src/lib/isOverdue.ts
    - src/lib/isOverdue.test.ts
    - src/lib/carrierFromUrl.ts
    - src/lib/carrierFromUrl.test.ts
  modified:
    - src/sanity/queries.ts
    - src/sanity/components/ProcurementListItem.tsx
    - src/sanity/components/__tests__/ProcurementListItem.test.tsx

key-decisions:
  - "carrierFromUrl uses URL hostname matching (not tracking number regex) for URL-based carrier detection"
  - "ADMIN_PROCUREMENT_QUERY is module-scoped const (not exported) -- only the function is exported, matching existing query patterns"

patterns-established:
  - "Shared utility extraction: domain logic extracted from components to src/lib/ for reuse across admin and Studio"
  - "Admin queries include clientCost; portal queries exclude it -- enforced by separate GROQ projections"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-04-07
---

# Phase 27 Plan 01: Shared Utilities & Admin GROQ Query Summary

**Extracted isOverdue() and created carrierFromUrl() shared utilities, added GROQ query for admin procurement data with full 14-field projection including clientCost**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-07T12:43:41Z
- **Completed:** 2026-04-07T12:45:58Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Extracted isOverdue() from ProcurementListItem.tsx to shared src/lib/isOverdue.ts with 7 test cases migrated
- Created getCarrierFromUrl() at src/lib/carrierFromUrl.ts detecting FedEx, UPS, USPS, DHL from tracking URL domains with 7 tests
- Added getAdminProcurementData() GROQ query to queries.ts with full 14-field projection including admin-only clientCost field
- ProcurementListItem component refactored to import from shared lib -- all existing tests still pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract isOverdue to shared lib and create carrierFromUrl utility** - `9936eb4` (feat)
2. **Task 2: Add GROQ query for admin procurement data** - `e1bdc09` (feat)

## Files Created/Modified
- `src/lib/isOverdue.ts` - Shared overdue detection function extracted from ProcurementListItem
- `src/lib/isOverdue.test.ts` - 7 test cases for isOverdue (migrated from ProcurementListItem tests)
- `src/lib/carrierFromUrl.ts` - URL-domain-based carrier detection (FedEx, UPS, USPS, DHL)
- `src/lib/carrierFromUrl.test.ts` - 7 test cases for carrier detection
- `src/sanity/queries.ts` - Added ADMIN_PROCUREMENT_QUERY and getAdminProcurementData()
- `src/sanity/components/ProcurementListItem.tsx` - Replaced inline isOverdue with import from shared lib
- `src/sanity/components/__tests__/ProcurementListItem.test.tsx` - Updated import path to shared lib

## Decisions Made
- carrierFromUrl uses URL hostname matching rather than tracking number regex patterns, since the admin editor stores full tracking URLs (not just tracking numbers)
- ADMIN_PROCUREMENT_QUERY is a module-scoped const (not exported) with only the async function exported, matching the established pattern in queries.ts

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- isOverdue() and getCarrierFromUrl() are ready for import by Plan 03 (procurement editor React island)
- getAdminProcurementData() is ready for use by Plan 02 (API route) to fetch procurement data
- All existing tests continue to pass; no regressions introduced

## Self-Check: PASSED

All files verified present, all commits verified in git log.

---
*Phase: 27-procurement-editor*
*Completed: 2026-04-07*
