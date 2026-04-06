---
phase: 22-procurement-foundation
plan: 01
subsystem: ui
tags: [sanity, procurement, constants, gantt, css, typescript]

# Dependency graph
requires:
  - phase: 15-schema-and-read-only-timeline
    provides: Gantt chart types, colors, and transforms with ProcurementStatus type
provides:
  - Shared procurement status constants module (procurementStages.ts) with 6-stage pipeline
  - ProcurementStageKey type as single source of truth for procurement status values
  - Tone-based Badge rendering unblocked (Badge CSS override removed)
  - Gantt chart ProcurementStatus type aliased from shared constants
affects: [23-procurement-list-ui, gantt-chart, sanity-studio-theming]

# Tech tracking
tech-stack:
  added: []
  patterns: [shared-constants-module, type-aliasing-from-source-of-truth]

key-files:
  created:
    - src/lib/procurementStages.ts
    - src/lib/procurementStages.test.ts
  modified:
    - src/sanity/studio.css
    - src/sanity/components/gantt/lib/ganttTypes.ts
    - src/sanity/components/gantt/lib/ganttColors.ts
    - src/sanity/components/gantt/lib/ganttColors.test.ts
    - src/sanity/components/gantt/lib/ganttTransforms.ts

key-decisions:
  - "ProcurementStatus in ganttTypes.ts is now a type alias of ProcurementStageKey -- single source of truth"
  - "Badge CSS override removed entirely rather than scoped -- all Badge components now render native Sanity tones"

patterns-established:
  - "Shared constants module: domain-specific constants live in src/lib/ with types, metadata array, lookup record, and helper functions (follows portalStages.ts pattern)"
  - "Type aliasing: downstream modules alias types from the source-of-truth module rather than redeclaring unions"

requirements-completed: [PROC-01, PROC-02]

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 22 Plan 01: Procurement Status Constants and Badge Fix Summary

**Shared 6-stage procurement constants module with TDD, Badge CSS override removal for tone-based rendering, and Gantt type/color sync from pending to not-yet-ordered**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T12:04:26Z
- **Completed:** 2026-04-06T12:07:16Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created procurementStages.ts constants module exporting 6-stage pipeline (not-yet-ordered through installed) with types, tones, and helper functions
- 10 unit tests covering all exports, ordering, tone assignments, and fallback behavior
- Removed [data-ui="Badge"] CSS override from studio.css, unblocking Sanity tone-based Badge colors for Phase 23 list UI
- Synced Gantt chart ProcurementStatus type to alias from shared constants, updated color map and transforms from "pending" to "not-yet-ordered"

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for procurement stages** - `d626e21` (test)
2. **Task 1 (GREEN): Procurement stages constants module** - `a61d4c6` (feat)
3. **Task 2: CSS Badge fix and Gantt type/color sync** - `3e5011e` (fix)

_Note: Task 1 followed TDD -- RED commit (failing tests) then GREEN commit (implementation)._

## Files Created/Modified
- `src/lib/procurementStages.ts` - Shared constants: 6-stage pipeline with types, metadata, tone lookup, and options list helper
- `src/lib/procurementStages.test.ts` - 10 unit tests covering all exports and edge cases
- `src/sanity/studio.css` - Removed [data-ui="Badge"] selector (unblocks tone-based Badge rendering)
- `src/sanity/components/gantt/lib/ganttTypes.ts` - ProcurementStatus now aliases ProcurementStageKey from shared module
- `src/sanity/components/gantt/lib/ganttColors.ts` - Color map key "pending" renamed to "not-yet-ordered", fallback updated
- `src/sanity/components/gantt/lib/ganttColors.test.ts` - Test updated for renamed status value
- `src/sanity/components/gantt/lib/ganttTransforms.ts` - Fallback status "pending" changed to "not-yet-ordered"

## Decisions Made
- ProcurementStatus in ganttTypes.ts set as type alias of ProcurementStageKey rather than an independent union -- ensures Gantt types stay in sync with the constants module automatically
- Badge CSS override removed entirely (not scoped or moved) -- all Badge components now render with their native Sanity tones, which is the desired behavior for procurement status badges in Phase 23

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated ganttTransforms.ts fallback from "pending" to "not-yet-ordered"**
- **Found during:** Task 2 (CSS and Gantt sync)
- **Issue:** ganttTransforms.ts line 130 used "pending" as fallback status for procurement items, which is no longer a valid ProcurementStatus value
- **Fix:** Changed fallback to "not-yet-ordered"
- **Files modified:** src/sanity/components/gantt/lib/ganttTransforms.ts
- **Verification:** All 50 Gantt + procurement tests pass
- **Committed in:** 3e5011e (Task 2 commit)

**2. [Rule 1 - Bug] Updated ganttColors.test.ts for renamed status value**
- **Found during:** Task 2 (CSS and Gantt sync)
- **Issue:** ganttColors.test.ts tested getProcurementStatusColor("pending") which is no longer a valid key
- **Fix:** Changed test to use "not-yet-ordered"
- **Files modified:** src/sanity/components/gantt/lib/ganttColors.test.ts
- **Verification:** All ganttColors tests pass
- **Committed in:** 3e5011e (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs from rename propagation)
**Impact on plan:** Both auto-fixes necessary for correctness after the pending-to-not-yet-ordered rename. No scope creep.

**Visual audit (D-11):** Skipped -- parallel worktree execution prevents dev server startup without port conflicts. CSS change is a pure selector removal; programmatic verification confirms StatusButton/review-changes-button selectors are preserved and Badge selector is removed.

## Issues Encountered
None -- plan executed smoothly.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shared constants module ready for import by Sanity schema field definitions (Phase 22 Plan 02)
- Badge tone rendering unblocked for Phase 23 procurement list UI
- Gantt chart types and colors aligned with new procurement pipeline values

---
*Phase: 22-procurement-foundation*
*Completed: 2026-04-06*
