---
phase: 29-tenant-aware-platform-foundation
plan: 03
subsystem: admin
tags: [multi-tenant, sanity-client, tenant-scoped, admin-api, audit-test]

# Dependency graph
requires:
  - phase: 29-tenant-aware-platform-foundation
    plan: 01
    provides: getTenantClient factory, getTenantById lookup, session with tenantId
provides:
  - Tenant-scoped admin API routes (all 5 use getTenantClient instead of sanityWriteClient)
  - Tenant-scoped admin query functions (SanityClient parameter injection)
  - Dynamic AdminNav brand from tenant config
  - Hardcoded string audit test for ongoing compliance
affects: [29-04-PLAN, admin-middleware, admin-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [tenant-scoped-api-route, client-parameter-injection, static-audit-test]

key-files:
  created:
    - src/lib/tenantAudit.test.ts
  modified:
    - src/pages/api/admin/artifact-crud.ts
    - src/pages/api/admin/artifact-version.ts
    - src/pages/api/admin/schedule-event.ts
    - src/pages/api/admin/schedule-dependency.ts
    - src/pages/api/admin/schedule-date.ts
    - src/sanity/queries.ts
    - src/pages/admin/projects/[projectId]/artifacts.astro
    - src/pages/admin/projects/[projectId]/schedule.astro
    - src/components/admin/AdminNav.tsx
    - src/layouts/AdminLayout.astro

key-decisions:
  - "Explicit tenantId null check (403) before getTenantClient call in all API routes for defense-in-depth"
  - "AdminLayout fallback businessName of 'Studio' when tenantId is not set (safe default for edge cases)"
  - "Audit test uses static file scanning with comment-line exclusion to avoid false positives"

patterns-established:
  - "Admin API route pattern: session check -> tenantId check (403) -> getTenantClient(session.tenantId) -> use client for all Sanity operations"
  - "Admin query function pattern: accept SanityClient as first parameter instead of using module-scoped sanityClient"
  - "Admin .astro page pattern: read tenantId from Astro.locals, create tenant client, pass to query functions"
  - "Static audit test pattern: scan admin source files for forbidden hardcoded patterns with comment exclusion"

requirements-completed: [PLAT-02, PLAT-04, PLAT-05]

# Metrics
duration: 6min
completed: 2026-04-08
---

# Phase 29 Plan 03: Admin Tenant-Scoping and Hardcoded String Audit Summary

**All admin API routes, query functions, and pages refactored to use tenant-scoped Sanity clients with automated audit test confirming zero hardcoded single-tenant strings**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-08T17:46:02Z
- **Completed:** 2026-04-08T17:51:42Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Replaced sanityWriteClient with getTenantClient(session.tenantId) in all 5 admin API routes with explicit tenantId validation
- Updated 3 admin query functions (getAdminArtifactData, getAdminScheduleData, getAllContractors) to accept SanityClient parameter
- Refactored 2 admin .astro pages to create tenant client from Astro.locals.tenantId and pass to query functions
- Made AdminNav brand dynamic via businessName prop from tenant config lookup in AdminLayout
- Created automated audit test scanning all admin files for forbidden hardcoded patterns (6 tests, all pass)
- Non-admin code (portal actions, rendering API, public site) completely untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor 5 admin API routes and 3 query functions** - `6e050fb` (feat)
2. **Task 2: Dynamic AdminNav brand and audit test** (TDD)
   - `e28336f` (test: failing audit test)
   - `615700c` (feat: AdminNav/AdminLayout changes that make test pass)

## Files Created/Modified
- `src/pages/api/admin/artifact-crud.ts` - Replaced sanityWriteClient with tenant-scoped client
- `src/pages/api/admin/artifact-version.ts` - Replaced sanityWriteClient with tenant-scoped client
- `src/pages/api/admin/schedule-event.ts` - Replaced sanityWriteClient with tenant-scoped client
- `src/pages/api/admin/schedule-dependency.ts` - Replaced sanityWriteClient with tenant-scoped client
- `src/pages/api/admin/schedule-date.ts` - Replaced sanityWriteClient with tenant-scoped client
- `src/sanity/queries.ts` - Added SanityClient type import, updated 3 admin query function signatures
- `src/pages/admin/projects/[projectId]/artifacts.astro` - Creates tenant client from locals, passes to query
- `src/pages/admin/projects/[projectId]/schedule.astro` - Creates tenant client from locals, passes to queries
- `src/components/admin/AdminNav.tsx` - Accepts businessName prop, renders dynamically
- `src/layouts/AdminLayout.astro` - Looks up tenant via getTenantById, passes businessName to AdminNav
- `src/lib/tenantAudit.test.ts` - Static analysis audit test for forbidden hardcoded patterns

## Decisions Made
- Added explicit `if (!session.tenantId)` check returning 403 in all API routes rather than relying solely on non-null assertion -- defense-in-depth against missing middleware
- Used "Studio" as fallback businessName in AdminLayout for edge cases where tenantId is not yet set
- Audit test excludes comment lines (// and /* and *) to avoid false positives on documentation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Threat Surface Scan

No new threat surfaces beyond those in the plan's threat model. Mitigations implemented:
- T-29-10: Every admin API route extracts tenantId from session with explicit null check before client creation
- T-29-12: Each admin route uses tenant-scoped client; no global sanityWriteClient remains in admin code

## Next Phase Readiness
- All admin API routes and query functions are tenant-aware
- AdminNav displays dynamic brand from tenant config
- Audit test will catch any future introduction of hardcoded single-tenant strings
- Ready for Plan 04 (admin middleware and remaining tenant integration)

## Self-Check: PASSED

All 9 modified/created files verified on disk. All 3 task commits verified in git log (6e050fb, e28336f, 615700c).

---
*Phase: 29-tenant-aware-platform-foundation*
*Completed: 2026-04-08*
