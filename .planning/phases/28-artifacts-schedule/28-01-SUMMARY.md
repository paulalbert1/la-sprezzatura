---
phase: 28-artifacts-schedule
plan: 01
subsystem: gantt
tags: [frappe-gantt, code-relocation, gantt-chart, shared-library]

# Dependency graph
requires:
  - phase: 15-schema-and-read-only-timeline
    provides: Original Gantt chart implementation in src/sanity/components/gantt/
provides:
  - Shared Gantt code at src/lib/gantt/ importable by both Studio and admin
  - GanttChart.tsx wrapper, ganttTransforms.ts, ganttTypes.ts, ganttColors.ts, ganttDates.ts
  - CSS files (gantt.css, frappe-gantt.css) at shared location
  - Re-export barrel at src/sanity/components/gantt/GanttChart.tsx for backward compatibility
affects: [28-05-schedule-editor, admin-schedule-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared lib extraction: reusable code in src/lib/ with re-export barrels for backward compatibility"

key-files:
  created:
    - src/lib/gantt/GanttChart.tsx
    - src/lib/gantt/ganttTransforms.ts
    - src/lib/gantt/ganttTypes.ts
    - src/lib/gantt/ganttColors.ts
    - src/lib/gantt/ganttDates.ts
    - src/lib/gantt/gantt.css
    - src/lib/gantt/frappe-gantt.css
    - src/lib/gantt/ganttTransforms.test.ts
    - src/lib/gantt/ganttColors.test.ts
    - src/lib/gantt/ganttDates.test.ts
  modified:
    - src/sanity/components/gantt/GanttChart.tsx
    - src/sanity/components/gantt/hooks/useGanttData.ts
    - src/sanity/components/gantt/GanttLegend.tsx

key-decisions:
  - "Re-export barrel pattern for backward compatibility: GanttChart.tsx at old path re-exports from new shared location"
  - "procurementStages import path updated from ../../../../lib/ to ../procurementStages for new location in src/lib/gantt/"

patterns-established:
  - "Shared lib extraction: move reusable code to src/lib/{domain}/, create re-export barrel at old location"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-04-07
---

# Phase 28 Plan 01: Shared Gantt Code Relocation Summary

**Relocated all shared Gantt code (transforms, types, colors, dates, CSS, wrapper) from src/sanity/components/gantt/ to src/lib/gantt/ with re-export barrel for Studio backward compatibility**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-07T20:52:02Z
- **Completed:** 2026-04-07T20:58:00Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- All shared Gantt code (7 source files + 3 test files) relocated to src/lib/gantt/
- Studio imports updated to point to new shared location (useGanttData.ts, GanttLegend.tsx)
- Re-export barrel created at old GanttChart.tsx path so GanttScheduleView lazy import works unchanged
- Old src/sanity/components/gantt/lib/ directory fully removed
- All 40 Gantt-specific tests pass from new location; 140 total tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Move shared Gantt files to src/lib/gantt/** - `3acb2bc` (refactor)
2. **Task 2: Update Studio GanttScheduleView imports to use shared location** - `e95268a` (refactor)

## Files Created/Modified
- `src/lib/gantt/GanttChart.tsx` - Frappe Gantt vanilla JS wrapper (base read-only component)
- `src/lib/gantt/ganttTransforms.ts` - Pure transform functions: Sanity data to Gantt tasks
- `src/lib/gantt/ganttTypes.ts` - GanttTask, GanttLink, ScheduleConflict, ResolvedContractor types
- `src/lib/gantt/ganttColors.ts` - Contractor palette and category color constants
- `src/lib/gantt/ganttDates.ts` - Sanity date parsing and serialization helpers
- `src/lib/gantt/gantt.css` - Custom Gantt theme CSS (contractor colors, category colors, conflict indicator)
- `src/lib/gantt/frappe-gantt.css` - Frappe Gantt base CSS
- `src/lib/gantt/ganttTransforms.test.ts` - 23 transform tests
- `src/lib/gantt/ganttColors.test.ts` - 7 color tests
- `src/lib/gantt/ganttDates.test.ts` - 10 date parsing tests
- `src/sanity/components/gantt/GanttChart.tsx` - Re-export barrel pointing to shared location
- `src/sanity/components/gantt/hooks/useGanttData.ts` - Updated imports to ../../../../lib/gantt/
- `src/sanity/components/gantt/GanttLegend.tsx` - Updated imports to ../../../lib/gantt/

## Decisions Made
- Used re-export barrel pattern at old GanttChart.tsx path rather than modifying GanttScheduleView's lazy import, minimizing changes to Studio code
- Updated ganttTypes.ts procurementStages import from deep relative path (../../../../lib/) to sibling relative path (../procurementStages) for the new src/lib/gantt/ location

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- src/lib/gantt/ is ready for the admin ScheduleEditor (Plan 05) to import shared Gantt code
- Studio Gantt chart continues to work identically via re-export barrel
- All tests green; no regressions

## Self-Check: PASSED

---
*Phase: 28-artifacts-schedule*
*Completed: 2026-04-07*
