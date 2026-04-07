---
phase: 26-project-list-overview
plan: 01
subsystem: api, ui
tags: [groq, sanity, astro, breadcrumbs, admin-dashboard]

# Dependency graph
requires:
  - phase: 25-admin-shell-auth
    provides: AdminLayout shell, sidebar nav, dashboard page, admin auth middleware
provides:
  - Four admin GROQ queries (ADMIN_PROJECTS_QUERY, ADMIN_PROJECT_DETAIL_QUERY, ACTIVE_PROJECT_COUNT_QUERY, ALL_CLIENTS_QUERY)
  - Breadcrumb-capable AdminLayout with backward-compatible fallback
  - Dashboard Active Projects card wired to real Sanity count
affects: [26-02, 26-03, 27-procurement]

# Tech tracking
tech-stack:
  added: []
  patterns: [admin GROQ queries without portal-scoping filters, breadcrumb nav via optional Astro prop]

key-files:
  created: []
  modified:
    - src/sanity/queries.ts
    - src/sanity/queries.test.ts
    - src/layouts/AdminLayout.astro
    - src/pages/admin/dashboard.astro

key-decisions:
  - "Admin queries omit portalEnabled and references($clientId) filters -- admin sees all projects unconditionally"
  - "Breadcrumb uses / separator (not >) for cleaner visual hierarchy matching the interior design aesthetic"

patterns-established:
  - "Admin GROQ queries: export named constant + async function, no visibility filters, dereferenced client name via clients[isPrimary == true][0].client->name"
  - "AdminLayout breadcrumb: pass optional BreadcrumbItem[] prop, items with href render as links, final item without href renders as current page span"

requirements-completed: [D-01, D-02, D-07]

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 26 Plan 01: Admin Data Layer and Layout Infrastructure Summary

**Four admin GROQ queries (projects list, project detail, active count, all clients) with unit tests, breadcrumb-capable AdminLayout, and dashboard wired to real Sanity count**

## Performance

- **Duration:** 3 min 28s
- **Started:** 2026-04-07T01:18:51Z
- **Completed:** 2026-04-07T01:22:19Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Four new GROQ queries for admin project management: list all projects, single project detail with counts, active project count, all clients for dropdowns
- AdminLayout extended with optional breadcrumb navigation (backward-compatible -- existing pages unchanged)
- Dashboard Active Projects card displays real count from Sanity instead of placeholder

## Task Commits

Each task was committed atomically:

1. **Task 1: Add admin GROQ queries and unit tests (TDD)**
   - RED: `a71ca76` (test) -- 13 failing tests for admin query constants
   - GREEN: `48c9554` (feat) -- implement all four queries, 51/51 tests pass
2. **Task 2: Extend AdminLayout with breadcrumb support and wire dashboard count** - `1ceaf34` (feat)

## Files Created/Modified
- `src/sanity/queries.ts` - Added ADMIN_PROJECTS_QUERY, ADMIN_PROJECT_DETAIL_QUERY, ACTIVE_PROJECT_COUNT_QUERY, ALL_CLIENTS_QUERY with async wrapper functions
- `src/sanity/queries.test.ts` - Added 13 unit tests for admin query constants (field projections, filter exclusions, sort order)
- `src/layouts/AdminLayout.astro` - Added BreadcrumbItem type, optional breadcrumbs prop, conditional breadcrumb nav rendering
- `src/pages/admin/dashboard.astro` - Imported getActiveProjectCount, replaced Active Projects placeholder with real count

## Decisions Made
- Admin queries intentionally omit portalEnabled and references($clientId) filters -- admin sees all projects regardless of portal status or client association (per D-01 requirement)
- Breadcrumb separator uses `/` instead of `>` for a cleaner look matching the design aesthetic
- Pending Orders and Overdue Items dashboard cards left as `--` placeholders per plan (depend on Phase 27 procurement logic)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Queries and layout infrastructure ready for Wave 2 parallel execution
- Plan 02 (project list page) can import getAdminProjects and use breadcrumbs prop
- Plan 03 (project overview page) can import getAdminProjectDetail, getAllClients, and use breadcrumbs prop
- All pre-existing test failures (formatCurrency, geminiClient, milestoneUtils, blob-serve) are unrelated to this plan's changes

## Self-Check: PASSED

All 4 modified files confirmed present. All 3 commit hashes (a71ca76, 48c9554, 1ceaf34) verified in git log.

---
*Phase: 26-project-list-overview*
*Completed: 2026-04-06*
