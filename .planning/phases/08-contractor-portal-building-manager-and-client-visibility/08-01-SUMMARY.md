---
phase: 08-contractor-portal-building-manager-and-client-visibility
plan: 01
subsystem: api
tags: [groq, sanity, middleware, astro-actions, magic-link, resend, coi, zod]

# Dependency graph
requires:
  - phase: 07-schema-extensions
    provides: "Contractor schema, building manager object, COIs, legal docs, floor plans, multi-role session model, SendWorkOrderAccess pattern"
provides:
  - "WORK_ORDER_DETAIL_QUERY with information boundary enforcement (no client email/phone)"
  - "BUILDING_MANAGER_PROJECT_QUERY with client contact, COIs, legal docs, contractor names/trades"
  - "PROJECTS_BY_BUILDING_MANAGER_QUERY for dashboard"
  - "SITE_SETTINGS_QUERY for Contact Liz section"
  - "Extended PROJECT_DETAIL_QUERY with CVIS-01 contractor visibility (no appointment notes)"
  - "Schema: appointments[], contractorNotes, submissionNotes[] on contractor assignment"
  - "Building manager middleware route protection (/building/*)"
  - "submitContractorNote Astro Action"
  - "requestBuildingManagerMagicLink Astro Action"
  - "/api/send-building-access API route"
  - "SendBuildingAccessAction Studio document action"
  - "getExpirationStatus COI utility"
affects: [08-02-contractor-portal-ui, 08-03-building-manager-client-visibility-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Information boundary enforcement via GROQ projection exclusions"
    - "COI expiration classification utility (valid/expiring/expired)"
    - "Building manager identified by email (not Sanity document ID)"

key-files:
  created:
    - src/lib/coiUtils.ts
    - src/lib/coiUtils.test.ts
    - src/pages/api/send-building-access.ts
    - src/sanity/actions/sendBuildingAccess.tsx
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/schemas/project.test.ts
    - src/sanity/queries.ts
    - src/sanity/queries.test.ts
    - src/middleware.ts
    - src/middleware.test.ts
    - src/env.d.ts
    - src/actions/portalSchemas.ts
    - src/actions/index.ts
    - sanity.config.ts

key-decisions:
  - "Building manager identified by email not Sanity doc ID -- buildingManager is an inline object on project, not a document type"
  - "CVIS-01 contractor appointments exclude notes field -- information boundary: clients see date/label only"
  - "submitContractorNote uses Sanity patch insert after submissionNotes[-1] pattern (matches milestone/artifact note patterns)"
  - "Building manager magic link stores email as entityId (not a Sanity document _id)"

patterns-established:
  - "Information boundary testing: GROQ query string assertions checking presence/absence of sensitive fields"
  - "COI expiration utility: 30-day threshold for expiring classification"
  - "Building manager auth: email-based identification, commercial project gating"

requirements-completed: [CONTR-03, CONTR-04, BLDG-02, BLDG-03, BLDG-04, BLDG-05, BLDG-06, CVIS-01]

# Metrics
duration: 8min
completed: 2026-03-17
---

# Phase 8 Plan 01: Data Layer, Auth, and Actions Summary

**GROQ queries with information boundary enforcement, building manager auth infrastructure, contractor note submission, COI utility, and schema extensions for all three Phase 8 portal views**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-17T11:51:10Z
- **Completed:** 2026-03-17T11:58:36Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Five new GROQ queries with strict information boundary enforcement (contractor sees client name but not email/phone; building manager sees client contact but not scope/estimates; client sees contractor appointments without notes)
- Complete building manager auth infrastructure: middleware, magic link API route, Astro Action, Studio document action, branded email template
- Schema extended with appointments, contractorNotes, and submissionNotes on contractor assignments
- COI expiration utility with valid/expiring/expired classification

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema extensions, GROQ queries, COI utility, and middleware** - `e33178d` (test: RED) + `70adaec` (feat: GREEN)
2. **Task 2: Contractor note action, building manager magic link, SendBuildingAccessAction** - `c594784` (feat)

## Files Created/Modified
- `src/sanity/schemas/project.ts` - Added appointments[], contractorNotes, submissionNotes[] to contractor assignment inline object
- `src/sanity/schemas/project.test.ts` - Phase 8 schema field tests
- `src/sanity/queries.ts` - 5 new GROQ queries + extended PROJECT_DETAIL_QUERY and PROJECTS_BY_CONTRACTOR_QUERY
- `src/sanity/queries.test.ts` - Information boundary tests for all new queries
- `src/middleware.ts` - Building manager route protection (/building/*)
- `src/middleware.test.ts` - Building manager middleware tests
- `src/env.d.ts` - Added buildingManagerEmail to App.Locals
- `src/lib/coiUtils.ts` - getExpirationStatus + formatExpirationDate utilities
- `src/lib/coiUtils.test.ts` - COI utility tests
- `src/actions/portalSchemas.ts` - Added contractorNoteSchema
- `src/actions/index.ts` - submitContractorNote + requestBuildingManagerMagicLink actions
- `src/pages/api/send-building-access.ts` - Building manager magic link API route
- `src/sanity/actions/sendBuildingAccess.tsx` - SendBuildingAccessAction Studio document action
- `sanity.config.ts` - Registered SendBuildingAccessAction on project type

## Decisions Made
- Building manager identified by email (not Sanity document ID) since buildingManager is an inline object on project, not a separate document type
- CVIS-01 contractor appointments exclude notes field in client-facing query (information boundary)
- submitContractorNote uses same patch insert pattern as milestone/artifact notes
- Building manager magic link stores email as entityId for session creation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Data layer complete for Plan 02 (contractor work order UI pages)
- Data layer complete for Plan 03 (building manager UI and client contractor visibility)
- All GROQ queries ready with information boundaries enforced
- Middleware, actions, and auth flow ready for portal pages

---
*Phase: 08-contractor-portal-building-manager-and-client-visibility*
*Completed: 2026-03-17*
