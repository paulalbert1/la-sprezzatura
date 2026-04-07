---
phase: 28-artifacts-schedule
plan: 04
subsystem: api
tags: [astro-api-routes, sanity-patch, groq, schedule, gantt, custom-events]

# Dependency graph
requires:
  - phase: 28-01
    provides: Shared Gantt code at src/lib/gantt/ with types and transforms
provides:
  - schedule-date API route for drag-and-drop and click-to-edit date saves
  - schedule-event API route for custom event CRUD (create, update, delete)
  - ADMIN_SCHEDULE_QUERY GROQ query and getAdminScheduleData function
affects: [28-05-schedule-editor, admin-schedule-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Category-based field mapping: fieldMap record maps category to array name and start/end date fields for polymorphic Sanity patches"
    - "Action-based API route: single POST endpoint with action field to dispatch create/update/delete"

key-files:
  created:
    - src/pages/api/admin/schedule-date.ts
    - src/pages/api/admin/schedule-event.ts
  modified:
    - src/sanity/queries.ts

key-decisions:
  - "Used actual schema categories (walkthrough, inspection, punch-list, etc.) instead of plan's incorrect list (design, construction, etc.) -- matched to project.ts customEvents schema definition"
  - "Event _type set to 'scheduleEvent' matching schema's defineArrayMember type name"

patterns-established:
  - "Schedule mutation API routes: auth check, category validation, parameterized Sanity array path expressions [_key==key].field"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 28 Plan 04: Schedule API Routes and GROQ Query Summary

**Two API routes for schedule mutations (date updates + custom event CRUD) and SSR GROQ query for admin Gantt editor data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T21:10:40Z
- **Completed:** 2026-04-07T21:13:38Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- schedule-date API route handles date updates from drag-and-drop and click-to-edit for contractors, milestones, and custom events with procurement explicitly rejected as read-only
- schedule-event API route handles full CRUD for custom events with category validation against schema's 10 allowed values
- ADMIN_SCHEDULE_QUERY returns contractors (with dereferenced name/company/trades), milestones, procurementItems, customEvents, and scheduleDependencies for SSR Gantt rendering

## Task Commits

Each task was committed atomically:

1. **Task 1: Create schedule-date API route for drag and click-to-edit date saves** - `2cc431b` (feat)
2. **Task 2: Create schedule-event API route (custom event CRUD) and GROQ query** - `ef6cc0a` (feat)

## Files Created/Modified
- `src/pages/api/admin/schedule-date.ts` - POST handler for updating schedule item dates (contractors, milestones, custom events) via category-based field mapping
- `src/pages/api/admin/schedule-event.ts` - POST handler for custom event create/update/delete with category and date validation
- `src/sanity/queries.ts` - Added ADMIN_SCHEDULE_QUERY and getAdminScheduleData() export for SSR schedule page

## Decisions Made
- Used actual Sanity schema categories (walkthrough, inspection, punch-list, move, permit, delivery-window, presentation, deadline, access, other) instead of the plan's incorrect list -- the plan referenced Phase 15 D-04 categories but those were superseded by the actual schema implementation
- Set event `_type` to `scheduleEvent` matching the schema's `defineArrayMember` type name rather than `customEvent`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected VALID_CATEGORIES to match actual schema**
- **Found during:** Task 2 (schedule-event.ts)
- **Issue:** Plan specified 10 categories (design, construction, delivery, installation, inspection, meeting, review, deadline, payment, other) but the actual schema at project.ts lines 1102-1113 uses different categories (walkthrough, inspection, punch-list, move, permit, delivery-window, presentation, deadline, access, other)
- **Fix:** Used the actual schema categories in VALID_CATEGORIES
- **Files modified:** src/pages/api/admin/schedule-event.ts
- **Verification:** Categories match project.ts schema exactly
- **Committed in:** ef6cc0a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Auto-fix necessary for correctness -- using wrong categories would cause validation failures when saving events with schema-valid categories. No scope creep.

## Threat Mitigations Applied
- T-28-08: getSession(cookies) + session.role !== "admin" check on both API routes
- T-28-09: Procurement category explicitly rejected with "Procurement dates are read-only" message; YYYY-MM-DD date format regex validation
- T-28-10: Category validated against VALID_CATEGORIES allowlist; event name required; date format validated
- T-28-11: _key values used in parameterized Sanity path expressions [_key=="value"], not in GROQ string concatenation

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both API routes ready for consumption by ScheduleEditor React island (Plan 05)
- ADMIN_SCHEDULE_QUERY ready for SSR schedule page data fetching
- All existing tests pass (3 pre-existing failures in unrelated files: formatCurrency, geminiClient, blob-serve)

## Self-Check: PASSED

---
*Phase: 28-artifacts-schedule*
*Completed: 2026-04-07*
