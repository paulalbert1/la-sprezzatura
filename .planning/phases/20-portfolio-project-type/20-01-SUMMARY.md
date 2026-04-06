---
phase: 20-portfolio-project-type
plan: 01
subsystem: database
tags: [sanity, schema, portfolio, defineType, defineField, pure-function]

# Dependency graph
requires: []
provides:
  - "portfolioProject Sanity document schema with 16 fields"
  - "Schema registered in schemaTypes array"
  - "buildPortfolioPayload pure utility for admin-to-portfolio field mapping"
affects: [20-02, 20-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "portfolioProject schema using defineType/defineField (same as project.ts)"
    - "Pure function payload builder with image selection parameter"
    - "TDD for schema field validation and utility function tests"

key-files:
  created:
    - src/sanity/schemas/portfolioProject.ts
    - src/sanity/schemas/portfolioProject.test.ts
    - src/lib/portfolioSpawn.ts
    - src/lib/portfolioSpawn.test.ts
  modified:
    - src/sanity/schemas/index.ts

key-decisions:
  - "Used simple img-N _key pattern for gallery images instead of nanoid"
  - "Spread full image objects (hotspot, crop, alt, caption) per Research Pitfall 4"
  - "Rich text blocks copied as-is preserving existing _key values per Research Pitfall 3"

patterns-established:
  - "portfolioProject schema: 16-field document type for public-facing curated projects"
  - "buildPortfolioPayload: pure function pattern for field mapping, testable without Sanity client"

requirements-completed: [PORT-01, PORT-04, PORT-05]

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 20 Plan 01: Schema & Payload Builder Summary

**portfolioProject Sanity schema (16 fields, no style) with buildPortfolioPayload pure utility for admin-to-portfolio field mapping including image selection**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T01:15:54Z
- **Completed:** 2026-04-06T01:18:42Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- portfolioProject document schema with all 16 fields per D-03, registered in schemaTypes
- sourceAdminProjectId as readOnly string for audit trail (PORT-05 / D-08)
- buildPortfolioPayload pure function that maps admin project fields to portfolio payload with image selection
- 40 total passing tests (20 schema + 20 utility) covering all fields, types, image handling, and edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Create portfolioProject schema and tests** - `7ce88fc` (feat)
2. **Task 2: Create buildPortfolioPayload utility and tests** - `c4d0594` (feat)

_Both tasks followed TDD: RED (failing tests) then GREEN (implementation passing)_

## Files Created/Modified
- `src/sanity/schemas/portfolioProject.ts` - portfolioProject document schema with 16 fields, preview config
- `src/sanity/schemas/portfolioProject.test.ts` - 20 tests covering all fields, types, readOnly, no-style, preview
- `src/sanity/schemas/index.ts` - Added portfolioProject import and schemaTypes registration
- `src/lib/portfolioSpawn.ts` - Pure buildPortfolioPayload function for admin-to-portfolio field mapping
- `src/lib/portfolioSpawn.test.ts` - 20 tests covering all field copies, image selection, _key generation

## Decisions Made
- Used simple `img-${i}` pattern for gallery image `_key` values instead of nanoid -- simpler, deterministic, sufficient for document creation
- Spread entire image objects including hotspot/crop data per Research Pitfall 4 -- preserves focal point positioning
- Rich text blocks (challenge, approach, outcome) copied as-is per Research Pitfall 3 -- existing _key values are unique within the new document

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data sources are wired and functional.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema and payload builder ready for Plan 02 (spawn action with image selection dialog)
- portfolioProject registered in schemaTypes -- Studio will recognize the document type
- buildPortfolioPayload tested and ready for use in the document action's create flow

## Self-Check: PASSED

- All 6 files verified present on disk
- Commit `7ce88fc` (Task 1) verified in git log
- Commit `c4d0594` (Task 2) verified in git log
- 40 tests passing (20 schema + 20 utility)

---
*Phase: 20-portfolio-project-type*
*Completed: 2026-04-06*
