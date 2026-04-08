---
phase: 30-dashboard-and-task-management
plan: 01
subsystem: database, api
tags: [sanity, groq, date-fns, vitest, schema, dashboard]

# Dependency graph
requires:
  - phase: 29-tenant-aware-platform-foundation
    provides: tenant-scoped client factory (getTenantClient), SanityClient type
provides:
  - tasks[] inline array on project schema
  - activityLog[] inline array on project schema
  - pipelineStageChangedAt datetime field on project schema
  - getAdminDashboardData GROQ query function (5 parallel queries)
  - getAdminProjectDetail GROQ query function
  - isTaskOverdue, isMilestoneOverdue, getDaysInStage, getOverdueBannerData utility functions
affects: [30-02-task-api, 30-03-dashboard-ui, 30-04-project-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dashboard data fetched via 5 parallel GROQ queries, flattened server-side"
    - "Overdue detection uses end-of-day semantics (T23:59:59) so items due today are not overdue"
    - "Days-in-stage uses coalesce(pipelineStageChangedAt, _createdAt) for backwards compatibility"

key-files:
  created:
    - src/lib/dashboardUtils.ts
    - src/lib/dashboardUtils.test.ts
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/schemas/project.test.ts
    - src/sanity/queries.ts

key-decisions:
  - "Used ClipboardIcon from @sanity/icons for the tasks group (checked available exports)"
  - "Activity action enum includes 6 values: task-created, task-completed, task-reopened, milestone-completed, procurement-status-changed, document-uploaded"
  - "Dashboard activity feed takes top 5 per project, then merges and sorts, keeping top 15 total"

patterns-established:
  - "Dashboard GROQ pattern: separate focused queries run in parallel via Promise.all, then flatten per-project arrays into flat lists with projectId/projectTitle references"
  - "Overdue detection pattern: parseISO(dateString + 'T23:59:59') with isPast() for end-of-day semantics"
  - "Schema inline array pattern for tasks: mirrors milestones[] with defineArrayMember name matching _type"

requirements-completed: [DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, TASK-03]

# Metrics
duration: 6min
completed: 2026-04-08
---

# Phase 30 Plan 01: Schema + Queries + Utils Summary

**Project schema extended with tasks[], activityLog[], pipelineStageChangedAt; 5 dashboard GROQ queries and 4 tested utility functions for overdue detection and days-in-stage**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-08T20:05:45Z
- **Completed:** 2026-04-08T20:12:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended Sanity project schema with tasks[], activityLog[] (readOnly), and pipelineStageChangedAt fields following established inline array patterns
- Created 5 dashboard GROQ queries (projects, milestones, deliveries, tasks, activity) with getAdminDashboardData parallel fetch function
- Built dashboardUtils module with isTaskOverdue, isMilestoneOverdue, getDaysInStage, getOverdueBannerData -- all with 17 passing unit tests
- Added getAdminProjectDetail query for project detail navigation target

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend project schema with tasks[], activityLog[], pipelineStageChangedAt** - `044315f` (feat)
2. **Task 2: Create dashboard GROQ queries and dashboardUtils with tests** - `555befc` (feat)

_Note: Both tasks used TDD (test -> implement -> verify)_

## Files Created/Modified
- `src/sanity/schemas/project.ts` - Added tasks[] array (task objects), activityLog[] array (activityEntry objects), pipelineStageChangedAt datetime, tasks group with ClipboardIcon
- `src/sanity/schemas/project.test.ts` - Added 10 structural tests for Phase 30 schema fields
- `src/lib/dashboardUtils.ts` - Utility functions: isTaskOverdue, isMilestoneOverdue, getDaysInStage, getOverdueBannerData
- `src/lib/dashboardUtils.test.ts` - 17 unit tests covering all utility functions with edge cases
- `src/sanity/queries.ts` - Added SanityClient type import, 5 dashboard GROQ queries, getAdminDashboardData, getAdminProjectDetail

## Decisions Made
- Used ClipboardIcon from @sanity/icons for tasks group (verified available via runtime check)
- Activity action enum values: task-created, task-completed, task-reopened, milestone-completed, procurement-status-changed, document-uploaded
- Dashboard activity feed: top 5 entries per project, merged and sorted by timestamp, capped at 15 total (per D-13 discretion)
- End-of-day semantics for overdue: tasks/milestones due "today" are not overdue until tomorrow (parseISO with T23:59:59)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failures in formatCurrency.test.ts, geminiClient.test.ts, and blob-serve.test.ts (unrelated to Phase 30 changes) -- these are out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Schema fields ready for Plan 02 (task API routes) to write tasks[] and activityLog[]
- GROQ queries ready for Plan 03 (dashboard UI) to render all 5 dashboard cards
- dashboardUtils ready for both Plan 03 (dashboard) and Plan 04 (project detail) to use overdue detection
- getAdminProjectDetail query ready for Plan 04 (project detail page)

## Self-Check: PASSED

- FOUND: src/lib/dashboardUtils.ts
- FOUND: src/lib/dashboardUtils.test.ts
- FOUND: src/sanity/schemas/project.ts
- FOUND: src/sanity/schemas/project.test.ts
- FOUND: src/sanity/queries.ts
- FOUND: .planning/phases/30-dashboard-and-task-management/30-01-SUMMARY.md
- FOUND: commit 044315f (Task 1)
- FOUND: commit 555befc (Task 2)

---
*Phase: 30-dashboard-and-task-management*
*Completed: 2026-04-08*
