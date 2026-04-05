---
phase: 19-gantt-layout-polish
plan: 01
subsystem: ui
tags: [frappe-gantt, css, svg, scroll, vitest, gantt-chart]

# Dependency graph
requires:
  - phase: 15-gantt-schedule
    provides: GanttChart.tsx Frappe Gantt wrapper, gantt.css theme overrides, ganttTypes.ts interfaces
provides:
  - computeSmartScrollTarget pure function for Gantt scroll position
  - Label visibility CSS fixes (font-size, SVG overflow)
  - Post-render scroll correction in GanttChart.tsx
affects: [19-gantt-layout-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure function with date injection for testable scroll logic"
    - "Post-render scroll correction piggybacking on Frappe's existing setTimeout"

key-files:
  created:
    - src/sanity/components/gantt/lib/ganttScroll.ts
    - src/sanity/components/gantt/lib/ganttScroll.test.ts
  modified:
    - src/sanity/components/gantt/gantt.css
    - src/sanity/components/gantt/GanttChart.tsx

key-decisions:
  - "Smart scroll only intervenes when Frappe scroll_to:today fails (scrollLeft === 0)"
  - "250ms post-render delay (up from 200ms) gives Frappe more reliable render time"
  - "computeSmartScrollTarget returns sorted-array index, not pixel offset, for DOM decoupling"

patterns-established:
  - "Pure function + date injection pattern for testable time-dependent Gantt logic"

requirements-completed: [GANTT-01, GANTT-02, GANTT-03, GANTT-04]

# Metrics
duration: 4min
completed: 2026-04-05
---

# Phase 19 Plan 01: Gantt Label & Scroll Fixes Summary

**Label visibility CSS (13px font-size, SVG overflow:visible) and smart scroll-to-task pure function with 6 unit tests wired into GanttChart.tsx post-render**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-05T21:09:51Z
- **Completed:** 2026-04-05T21:13:24Z
- **Tasks:** 2 (Task 1 was TDD with RED/GREEN commits)
- **Files modified:** 4

## Accomplishments
- Fixed Gantt label visibility: explicit 13px font-size on .bar-label and .bar-label.big, SVG overflow:visible prevents label clipping on edge bars (GANTT-01)
- Created computeSmartScrollTarget pure function that determines the best task index to scroll to based on current date vs task dates (GANTT-02, GANTT-04)
- Wired scroll correction into GanttChart.tsx post-render setTimeout at 250ms, only intervening when Frappe's scroll_to:"today" fails (GANTT-02, GANTT-04)
- gantt-test.astro confirmed absent from git history -- file was untracked in main worktree only (GANTT-03)

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Failing tests for computeSmartScrollTarget** - `c4d0543` (test)
2. **Task 1 (TDD GREEN): Label CSS fixes + smart scroll function** - `447d637` (feat)
3. **Task 2: Wire scroll into GanttChart.tsx** - `c51cffb` (feat)

_Note: TDD task had RED and GREEN commits. No refactor needed._

## Files Created/Modified
- `src/sanity/components/gantt/lib/ganttScroll.ts` - Pure function: computeSmartScrollTarget(tasks, now) returns best scroll target index
- `src/sanity/components/gantt/lib/ganttScroll.test.ts` - 6 vitest cases: upcoming, active, all-past, empty, null-end, unsorted input
- `src/sanity/components/gantt/gantt.css` - Added font-size: 13px to .bar-label and .bar-label.big; added overflow:visible on svg.gantt
- `src/sanity/components/gantt/GanttChart.tsx` - Import computeSmartScrollTarget; post-render scroll correction in setTimeout at 250ms

## Decisions Made
- Smart scroll only intervenes when Frappe's scroll_to:"today" fails (scrollLeft === 0) -- avoids fighting with Frappe's built-in scroll when today is within project range
- Increased setTimeout from 200ms to 250ms -- gives Frappe slightly more render time for reliable SVG availability
- computeSmartScrollTarget returns a sorted-array index (not pixel offset) -- keeps the function pure and DOM-free for unit testing; pixel lookup happens in the component
- 100px left padding for active/upcoming tasks (visual context), 50px for chart-start fallback (minimal context)

## Deviations from Plan

### Deviation 1: gantt-test.astro not in git

**Found during:** Task 2
**Issue:** gantt-test.astro was listed in the plan for deletion, but the file only exists as an untracked file in the main working tree. It has never been committed to git. In this worktree, the file does not exist.
**Resolution:** No action needed in this branch. The file remains untracked in the main worktree and should be deleted there or added to .gitignore. The plan's acceptance criteria (file does NOT exist) is satisfied.
**Impact:** None -- the goal (no debug page in production) is met since the file was never deployed.

---

**Total deviations:** 1 (gantt-test.astro not in git -- no action needed)
**Impact on plan:** Minimal. All four GANTT requirements are satisfied.

## Issues Encountered
- Pre-existing test failures in 3 unrelated files (formatCurrency.test.ts, geminiClient.test.ts, blob-serve.test.ts) -- not caused by this plan's changes. All 46 gantt-related tests pass.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None -- all data flows are wired to live Frappe Gantt rendering and Sanity document data.

## Next Phase Readiness
- GANTT-01 through GANTT-04 complete -- Gantt chart labels are visible and scroll position is intelligent
- Plan 02 (LAYOUT-01: MutationObserver pane hiding) can proceed independently
- Visual verification recommended via Playwright snapshot of Gantt chart with real project data

## Self-Check: PASSED

- All 4 created/modified files verified on disk
- All 3 task commits (c4d0543, 447d637, c51cffb) verified in git log
- ganttScroll.test.ts: 6/6 tests pass
- No untracked files left behind

---
*Phase: 19-gantt-layout-polish*
*Completed: 2026-04-05*
