---
phase: 15-schema-and-read-only-timeline
plan: 01
subsystem: database
tags: [sanity, schema, schedule, gantt, procurement, custom-events]

# Dependency graph
requires:
  - phase: 07-schema-extensions
    provides: "contractors array, procurementItems array, engagement type, isCommercial toggle"
  - phase: 09-operations-tooling
    provides: "updates group, updateLog field (schema pattern reference)"
provides:
  - "schedule group on project document"
  - "customEvents[] array field with scheduleEvent members (name, date, endDate, category, notes)"
  - "orderDate and expectedDeliveryDate date fields on procurementItem"
  - "10 event category options (walkthrough, inspection, punch-list, move, permit, delivery-window, presentation, deadline, access, other)"
affects: [15-plan-02-gantt-tab, 15-plan-03-gantt-rendering, 16-drag-and-drop, 17-enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns: ["customEvents[] with scheduleEvent object members", "schedule group hidden by engagementType"]

key-files:
  created: []
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/schemas/project.test.ts

key-decisions:
  - "Schedule group placed after Updates in groups array"
  - "customEvents field added at end of fields array, after updateLog"
  - "orderDate and expectedDeliveryDate placed before installDate in procurementItem per D-03"
  - "Category titles match research spec: Walkthrough, Inspection, Punch List, Move, Permit / Approval, Delivery Window, Client Presentation, Deadline, Site Access, Other"

patterns-established:
  - "Schedule group hidden pattern: same engagementType !== full-interior-design gate as contractors/procurement"
  - "customEvents array preview: event name as title, date as subtitle"

requirements-completed: [SCHED-01, SCHED-02, SCHED-03]

# Metrics
duration: 2min
completed: 2026-04-04
---

# Phase 15 Plan 1: Schema Extensions Summary

**Schedule group, customEvents[] array with 10 event categories, and procurement date fields (orderDate, expectedDeliveryDate) on project document schema**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-04T16:34:39Z
- **Completed:** 2026-04-04T16:36:37Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Added `schedule` group to project document groups array (SCHED-02)
- Added `customEvents[]` array field with scheduleEvent object members containing 5 subfields and 10 category options (SCHED-01)
- Added `orderDate` and `expectedDeliveryDate` optional date fields to procurementItem object, positioned before installDate (SCHED-03)
- All 37 tests pass (29 existing + 8 new)

## Task Commits

Each task was committed atomically (TDD):

1. **Task 1 RED: Failing tests for schedule extensions** - `14f80b5` (test)
2. **Task 1 GREEN: Implement schema changes** - `0d28265` (feat)

## Files Created/Modified
- `src/sanity/schemas/project.ts` - Added schedule group, customEvents[] array field, orderDate/expectedDeliveryDate on procurementItem
- `src/sanity/schemas/project.test.ts` - Added 8 tests in "Phase 15 schedule extensions" describe block

## Decisions Made
- Schedule group placed after "Updates" in the groups array (last position)
- customEvents field added at end of fields array, after updateLog, keeping it cleanly separated
- orderDate and expectedDeliveryDate positioned immediately before installDate per D-03, maintaining logical date ordering in the procurement object
- Category option titles follow the research spec exactly (e.g., "Permit / Approval" not "Permit", "Client Presentation" not "Presentation")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

None - all fields are fully wired with correct types, validation, hidden behavior, and options.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema foundation is in place for Plans 2-3 (Gantt tab wiring and read-only rendering)
- customEvents[] field ready for data entry once Studio is running
- Procurement date fields ready for Phase 17 lifecycle bar rendering
- No blockers

## Self-Check: PASSED

- All files exist (project.ts, project.test.ts, 15-PLAN-1-SUMMARY.md)
- All commits verified (14f80b5, 0d28265)
- 37/37 tests pass

---
*Phase: 15-schema-and-read-only-timeline*
*Completed: 2026-04-04*
