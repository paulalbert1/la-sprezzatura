---
phase: 15-schema-and-read-only-timeline
plan: 02
subsystem: ui
tags: [gantt, svar-react-gantt, date-fns, sanity-studio, document-view, typescript]

# Dependency graph
requires:
  - phase: 07-schema-extensions
    provides: project schema with contractors, procurement, milestones arrays
provides:
  - "@svar-ui/react-gantt and date-fns npm packages installed"
  - "TypeScript interfaces for Gantt data transformation (GanttTask, GanttScale, ResolvedContractor, SanityProjectData)"
  - "Date parsing utilities with timezone-safe Sanity date handling (parseSanityDate, parseSanityDatetime, serializeSanityDate)"
  - "Contractor color palette (10 colors) and category color assignment utilities"
  - "Procurement status color mapping"
  - "structure.ts with getDefaultDocumentNode wiring Schedule tab for project documents"
  - "GanttScheduleView shell with engagement type gating (D-06)"
  - "getPatchId helper for Phase 16 draft vs published patching"
affects: [15-PLAN-3-gantt-render, 16-drag-and-drop, 17-enhancement-polish]

# Tech tracking
tech-stack:
  added: ["@svar-ui/react-gantt@2.6.1", "date-fns@4.1.0"]
  patterns: ["document view tab via S.view.component()", "engagement type gating in view components", "T12:00:00 noon parsing for Sanity date fields"]

key-files:
  created:
    - src/sanity/components/gantt/lib/ganttTypes.ts
    - src/sanity/components/gantt/lib/ganttDates.ts
    - src/sanity/components/gantt/lib/ganttDates.test.ts
    - src/sanity/components/gantt/lib/ganttColors.ts
    - src/sanity/components/gantt/lib/ganttColors.test.ts
    - src/sanity/components/gantt/GanttScheduleView.tsx
    - src/sanity/structure.ts
  modified:
    - sanity.config.ts
    - package.json

key-decisions:
  - "parseSanityDate appends T12:00:00 to avoid UTC midnight off-by-one in US timezones"
  - "serializeSanityDate uses getFullYear/getMonth/getDate (local methods), not toISOString().slice()"
  - "CONTRACTOR_PALETTE uses 10 Tailwind 500-weight colors with modulo wrapping"
  - "getPatchId helper established now for Phase 16 write-back safety"
  - "GanttScheduleView shows loading placeholder for qualifying projects (Plan 3 replaces with Gantt)"

patterns-established:
  - "Document view tab via getDefaultDocumentNode in structure.ts"
  - "Engagement type gating: engagementType === 'full-interior-design' || isCommercial === true"
  - "Sanity date field parsing: always append T12:00:00 for date-only strings"
  - "Color-by-contractor-index with modulo wrapping over 10-color palette"

requirements-completed: [SCHED-04]

# Metrics
duration: 4min
completed: 2026-04-04
---

# Phase 15 Plan 2: Gantt Foundation Summary

**SVAR React Gantt + date-fns installed, Gantt type contracts and date/color utility libraries with 17 tests, Schedule document view tab wired via structure.ts with engagement type gating shell**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-04T16:35:55Z
- **Completed:** 2026-04-04T16:40:01Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Installed @svar-ui/react-gantt@2.6.1 and date-fns@4.1.0 as npm dependencies
- Created complete TypeScript type contracts (GanttTask, GanttScale, ResolvedContractor, SanityProjectData, ProcurementStatus) for Plan 3 data transformation
- Built timezone-safe date parsing utilities with T12:00:00 noon strategy to prevent off-by-one bugs
- Created 10-color contractor palette with modulo wrapping and procurement status color mapping
- Wired Schedule document view tab into Sanity Studio via structure.ts and sanity.config.ts
- Created GanttScheduleView shell with engagement type gating per D-06

## Task Commits

Each task was committed atomically:

1. **Task 1: Install npm deps, create type contracts, date utilities, and color utilities with tests**
   - `7a5f282` (test) - failing tests for date and color utilities (TDD RED)
   - `220276a` (feat) - implementation making all 17 tests pass (TDD GREEN)

2. **Task 2: Create structure.ts, wire Schedule tab, and create GanttScheduleView shell** - `a26b754` (feat)

## Files Created/Modified
- `src/sanity/components/gantt/lib/ganttTypes.ts` - TypeScript interfaces for Gantt data (GanttTask, GanttScale, ResolvedContractor, SanityProjectData, ProcurementStatus, getPatchId)
- `src/sanity/components/gantt/lib/ganttDates.ts` - Safe date parsing for Sanity date/datetime fields with T12:00:00 off-by-one prevention
- `src/sanity/components/gantt/lib/ganttDates.test.ts` - 10 tests for date parsing and serialization
- `src/sanity/components/gantt/lib/ganttColors.ts` - Contractor palette (10 colors), category colors, procurement status colors
- `src/sanity/components/gantt/lib/ganttColors.test.ts` - 7 tests for color utilities
- `src/sanity/components/gantt/GanttScheduleView.tsx` - Document view shell with engagement type gating
- `src/sanity/structure.ts` - getDefaultDocumentNode adding Schedule view for project documents
- `sanity.config.ts` - Added defaultDocumentNode import and config
- `package.json` - Added @svar-ui/react-gantt and date-fns dependencies

## Decisions Made
- parseSanityDate appends T12:00:00 to YYYY-MM-DD strings to avoid UTC midnight off-by-one in US timezones (Pitfall 2 from RESEARCH.md)
- serializeSanityDate uses local date methods (getFullYear, getMonth, getDate), never toISOString().slice() which would be UTC
- getPatchId helper function established in ganttTypes.ts for Phase 16 write-back (Pitfall 1 prevention)
- GanttScheduleView renders a loading Spinner placeholder for qualifying projects -- Plan 3 will replace this with the full Gantt chart
- PROCUREMENT_STATUS_COLORS maps warehouse and in-transit to the same amber as ordered (per UI-SPEC grouping)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Known Stubs

- **GanttScheduleView.tsx (line ~53)**: Loading Spinner placeholder for qualifying projects. This is intentional -- Plan 3 replaces it with the full Gantt chart render. Not a blocking stub.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All lib utilities (types, dates, colors) are ready for Plan 3 data transformation layer
- Schedule tab is wired and rendering in Sanity Studio -- Plan 3 replaces the loading placeholder with GanttChart, useGanttData hook, ScaleToggle, Legend, and EmptyState
- SVAR React Gantt is installed and ready to import
- The color spike (D-12) for per-task color assignment via taskTemplate can begin in Plan 3

## Self-Check: PASSED

All 9 files verified present. All 3 commit hashes verified in git log.

---
*Phase: 15-schema-and-read-only-timeline*
*Completed: 2026-04-04*
