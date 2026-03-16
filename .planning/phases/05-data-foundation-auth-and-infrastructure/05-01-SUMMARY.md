---
phase: 05-data-foundation-auth-and-infrastructure
plan: 01
subsystem: database
tags: [sanity, groq, schema, client, project, reference-array]

requires:
  - phase: 03-client-operations-portal
    provides: project schema with pipelineStage, portalToken, portalEnabled fields
provides:
  - Client document type schema with name, email, phone, preferredContact, structured address
  - Project schema extended with clients reference array (isPrimary toggle), engagementType, projectAddress
  - CLIENT_BY_EMAIL_QUERY and getClientByEmail() for magic link auth lookup
  - PROJECTS_BY_CLIENT_QUERY and getProjectsByClientId() for dashboard query
  - PROC-03 integer cents convention documented for Phase 6 procurement fields
  - sanity:client mock for test environment
affects: [05-02, 05-03, 05-04, 06-procurement-schema]

tech-stack:
  added: []
  patterns: [sanity-defineArrayMember-for-array-objects, groq-references-builtin, exported-query-constants-for-testability]

key-files:
  created:
    - src/sanity/schemas/client.ts
    - src/sanity/schemas/client.test.ts
    - src/sanity/schemas/project.test.ts
    - src/sanity/queries.test.ts
    - src/__mocks__/sanity-client.ts
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/schemas/index.ts
    - src/sanity/queries.ts
    - vitest.config.ts

key-decisions:
  - "Export GROQ query strings as constants alongside functions for testability without Sanity client mock"
  - "Mock sanity:client virtual module via vitest alias to enable query module import in tests"
  - "Remove clientName field from project schema (replaced by clients reference array)"

patterns-established:
  - "GROQ query constants: export query strings as named constants (CLIENT_BY_EMAIL_QUERY pattern) so tests can inspect queries without live Sanity connection"
  - "sanity:client mock: vitest.config.ts alias to src/__mocks__/sanity-client.ts for all Sanity query tests"
  - "defineArrayMember: use for array object members in Sanity schemas (not defineField)"
  - "PROC-03: all financial values stored as integer cents with .integer() validation"

requirements-completed: [CLNT-04, CLNT-05, ENGMT-01, PROC-03]

duration: 3min
completed: 2026-03-16
---

# Phase 5 Plan 01: Data Foundation Summary

**Sanity client document type, project schema extensions (clients array, engagement type, structured address), and GROQ auth queries with exported constants for testability**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T15:28:55Z
- **Completed:** 2026-03-16T15:32:22Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- New `client` document type with name, email, phone, preferredContact dropdown, and structured address (street/city/state/zip)
- Project schema extended with `clients` reference array (with isPrimary toggle), `engagementType` dropdown, and `projectAddress` object -- `clientName` field removed
- GROQ query constants and functions for client-by-email lookup and projects-by-client-id dashboard query
- PROC-03 integer cents convention documented as code comment for Phase 6 procurement fields
- All 45 tests pass (18 new + 27 existing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create client schema and extend project schema**
   - `fc170aa` test(05-01): add failing tests for client schema and project schema extensions
   - `461d4c8` feat(05-01): create client schema and extend project schema

2. **Task 2: Add GROQ queries for auth and financial cents validation**
   - `a5f723d` test(05-01): add failing tests for GROQ auth queries
   - `933e7aa` feat(05-01): add GROQ queries for client auth and document PROC-03 convention

_TDD tasks each have RED (test) + GREEN (feat) commits._

## Files Created/Modified
- `src/sanity/schemas/client.ts` - New client document type with all required fields
- `src/sanity/schemas/project.ts` - Extended with clients array, engagementType, projectAddress; clientName removed
- `src/sanity/schemas/index.ts` - Schema registry updated to include client type
- `src/sanity/queries.ts` - Added CLIENT_BY_EMAIL_QUERY, PROJECTS_BY_CLIENT_QUERY, getClientByEmail(), getProjectsByClientId(), PROC-03 comment
- `src/sanity/schemas/client.test.ts` - 7 tests for client schema field presence and structure
- `src/sanity/schemas/project.test.ts` - 5 tests for project schema extensions and clientName removal
- `src/sanity/queries.test.ts` - 6 tests for GROQ query string content
- `src/__mocks__/sanity-client.ts` - Mock for sanity:client virtual module in test environment
- `vitest.config.ts` - Added sanity:client alias for test resolution

## Decisions Made
- **Exported GROQ query constants:** Rather than only exporting async functions, exported the GROQ query strings as named constants (CLIENT_BY_EMAIL_QUERY, PROJECTS_BY_CLIENT_QUERY). This enables testing query content without needing a live Sanity connection or complex mocking.
- **sanity:client mock via vitest alias:** The `sanity:client` virtual module (provided by @sanity/astro at build time) is not available in vitest. Added a vitest.config.ts alias to resolve it to a simple mock, enabling query module imports in tests.
- **Removed clientName (no deprecation period):** The plan specified removing clientName outright rather than keeping it hidden. Since the `[token].astro` page is being replaced with a redirect in Plan 03, and the `getProjectByPortalToken()` query still references it in its inline GROQ string (not affected by schema removal), this is safe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added sanity:client mock for test environment**
- **Found during:** Task 2 (RED phase -- query tests could not import queries.ts)
- **Issue:** `sanity:client` is a virtual module provided by @sanity/astro at build time, not available in vitest
- **Fix:** Created `src/__mocks__/sanity-client.ts` with stub sanityClient, added vitest.config.ts alias
- **Files modified:** vitest.config.ts, src/__mocks__/sanity-client.ts
- **Verification:** All query tests import and run successfully
- **Committed in:** a5f723d (Task 2 RED commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential for test execution. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Client schema and project extensions are ready for Plan 02 (Upstash Redis), Plan 03 (magic link auth), and Plan 04 (dashboard)
- `getClientByEmail()` is ready for magic link lookup in Plan 03
- `getProjectsByClientId()` is ready for dashboard query in Plan 04
- PROC-03 convention established for Phase 6 procurement schema

## Self-Check: PASSED

All 9 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 05-data-foundation-auth-and-infrastructure*
*Completed: 2026-03-16*
