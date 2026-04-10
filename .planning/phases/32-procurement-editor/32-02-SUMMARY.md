---
phase: 32-procurement-editor
plan: 02
subsystem: api
tags: [astro-api-route, sanity-mutations, ship24, vercel-cron, procurement, tracking]

# Dependency graph
requires:
  - phase: 32-01
    provides: "Sanity schema (procurementItem fields), Ship24 client (getTrackingResults, extractTrackingData, isShip24Configured), GROQ query (getAdminProcurementCronData), utility functions (isProcurementOverdue, getNetPrice)"
provides:
  - "POST /api/admin/procurement -- action-based CRUD for procurement items (create, update, delete, update-status, force-refresh)"
  - "GET /api/cron/tracking-sync -- Vercel Cron endpoint for daily Ship24 batch sync"
  - "vercel.json cron schedule (0 11 * * * = 11:00 UTC daily)"
affects: [32-03-procurement-editor-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Vercel Cron GET endpoint with CRON_SECRET Bearer auth", "Promise.allSettled for parallel tracking sync with per-item failure resilience", "syncSource management: null on manual change, 'manual' on force-refresh, 'cron' on batch sync"]

key-files:
  created:
    - src/pages/api/admin/procurement.ts
    - src/pages/api/admin/procurement.test.ts
    - src/pages/api/cron/tracking-sync.ts
    - src/pages/api/cron/tracking-sync.test.ts
  modified:
    - vercel.json

key-decisions:
  - "Tenant ID 'lasprezzatura' hardcoded in cron endpoint with TODO for multi-tenant iteration"
  - "12-hour skip window on cron sync to avoid redundant Ship24 API calls and Vercel function timeout"
  - "Force-refresh returns status 200 with success:false for unconfigured Ship24 or failed lookups (not server errors)"

patterns-established:
  - "Vercel Cron pattern: GET export, CRON_SECRET Bearer auth, isShip24Configured early exit, Promise.allSettled parallel processing"
  - "syncSource lifecycle: null (manual status change) -> 'manual' (force-refresh) -> 'cron' (batch sync)"

requirements-completed: [PROC-01, PROC-02, PROC-05, PROC-06, PROC-07]

# Metrics
duration: 6min
completed: 2026-04-09
---

# Phase 32 Plan 02: API Routes and Cron Sync Summary

**Action-based procurement CRUD API (5 actions) with daily Ship24 tracking sync cron endpoint, syncSource lifecycle management, and 37 passing tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-10T02:31:10Z
- **Completed:** 2026-04-10T02:37:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Procurement API route handles all 5 actions (create, update, delete, update-status, force-refresh) with full auth, validation, and activity logging
- update-status always clears syncSource to null (D-12), force-refresh sets syncSource to "manual"
- Vercel Cron endpoint at GET /api/cron/tracking-sync with CRON_SECRET auth, 12-hour skip window, and parallel Promise.allSettled processing
- vercel.json configured for daily execution at 11:00 UTC (~6 AM ET)
- 37 tests pass across both test files (26 procurement + 11 cron)

## Task Commits

Each task was committed atomically:

1. **Task 1: Procurement API route with all 5 actions (TDD)**
   - `a3374d5` test: add failing tests for procurement API route (RED)
   - `0bccf07` feat: implement procurement API route with all 5 actions (GREEN)

2. **Task 2: Vercel Cron endpoint for daily tracking sync (TDD)**
   - `69d77f4` test: add failing tests for tracking sync cron endpoint (RED)
   - `e27ca9c` feat: implement tracking sync cron endpoint and vercel.json config (GREEN)

## Files Created/Modified
- `src/pages/api/admin/procurement.ts` - Action-based POST handler for procurement CRUD, status updates, and force-refresh
- `src/pages/api/admin/procurement.test.ts` - 26 unit tests for all 5 procurement API actions
- `src/pages/api/cron/tracking-sync.ts` - Vercel Cron GET handler for daily Ship24 sync
- `src/pages/api/cron/tracking-sync.test.ts` - 11 unit tests for cron auth and sync logic
- `vercel.json` - Added crons array with daily tracking-sync schedule

## Decisions Made
- Used tenant ID "lasprezzatura" (correct from tenants.json) in cron endpoint rather than plan's suggested "la-sprezzatura" (deviation Rule 1: bug fix)
- Force-refresh and unconfigured Ship24 return HTTP 200 with success:false (not 4xx/5xx) since these are expected states, not errors
- Cron skips items synced within 12 hours to avoid redundant Ship24 API calls and respect Vercel function 60s timeout

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected tenant ID from "la-sprezzatura" to "lasprezzatura"**
- **Found during:** Task 2 (Cron endpoint implementation)
- **Issue:** Plan suggested `getTenantClient("la-sprezzatura")` but actual tenant ID in tenants.json is `"lasprezzatura"` (no hyphen)
- **Fix:** Used correct tenant ID "lasprezzatura"
- **Files modified:** src/pages/api/cron/tracking-sync.ts
- **Committed in:** e27ca9c

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential correction for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required

External services require manual configuration before the cron endpoint will function:

- **SHIP24_API_KEY**: Required for tracking sync. Obtain from Ship24 Dashboard -> API Keys (https://panel.ship24.com/)
- **CRON_SECRET**: Required for cron endpoint auth. Generate a random secret and add to Vercel project env vars (Settings -> Environment Variables)

Both endpoints gracefully degrade when these are not configured (return success with skip/error messages).

## Next Phase Readiness
- API backbone complete: Plan 03 (React UI component) can now call all 5 procurement actions
- Schema, queries, utility functions, Ship24 client, and API routes are all wired and tested
- vercel.json cron configuration ready for deployment

## Self-Check: PASSED

All 6 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 32-procurement-editor*
*Completed: 2026-04-09*
