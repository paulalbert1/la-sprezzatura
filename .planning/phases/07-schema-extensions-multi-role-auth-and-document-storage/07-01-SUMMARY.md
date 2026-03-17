---
phase: 07-schema-extensions-multi-role-auth-and-document-storage
plan: 01
subsystem: database
tags: [sanity, schema, groq, contractor, field-gating, tdd]

# Dependency graph
requires:
  - phase: 05-data-foundation-auth
    provides: "Client schema pattern, GROQ query constants pattern, vitest setup with sanity:client mock"
  - phase: 06-portal-features
    provides: "Project schema with milestones, procurement, artifacts, engagement type field"
provides:
  - "Contractor document type with name, email, phone, company, trades fields"
  - "Project schema extensions: contractors[], floorPlans[], buildingManager, cois[], legalDocs[], isCommercial"
  - "Field-level hidden callbacks for engagement type gating and commercial toggle gating"
  - "GROQ queries: CONTRACTOR_BY_EMAIL_QUERY, CONTRACTOR_BY_ID_QUERY, PROJECTS_BY_CONTRACTOR_QUERY"
  - "Contractor registered in Sanity Studio sidebar"
affects: [07-02-blob-storage, 07-03-contractor-auth-portal]

# Tech tracking
tech-stack:
  added: []
  patterns: [field-level-hidden-callbacks, engagement-type-gating, commercial-toggle-gating]

key-files:
  created:
    - src/sanity/schemas/contractor.ts
    - src/sanity/schemas/contractor.test.ts
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/schemas/project.test.ts
    - src/sanity/schemas/index.ts
    - sanity.config.ts
    - src/sanity/queries.ts
    - src/sanity/queries.test.ts

key-decisions:
  - "File string fields store Vercel Blob pathnames (BlobFileInput component wired in Plan 02)"
  - "procurementItems field gated by engagement type hidden callback (previously ungated)"
  - "Contractor sidebar item placed after Clients in Studio navigation"

patterns-established:
  - "Engagement type gating: hidden callback checks document.engagementType !== 'full-interior-design'"
  - "Commercial toggle gating: hidden callback checks !document.isCommercial"
  - "Blob file fields: string type storing Vercel Blob pathnames, custom component wired later"

requirements-completed: [CONTR-01, CONTR-05, CONTR-06, CONTR-07, BLDG-01, ENGMT-02, PRJT-01, PRJT-02]

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 7 Plan 01: Schema Extensions Summary

**Contractor document type with trades list, project schema extended with 6 new field groups, engagement type and commercial toggle field gating, and GROQ contractor queries**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T01:58:26Z
- **Completed:** 2026-03-17T02:02:40Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Contractor document type with name, email, phone, company, and 11-item trades list registered in Sanity Studio
- Project schema extended with contractors[], floorPlans[], buildingManager, cois[], legalDocs[], isCommercial -- 6 new fields with field-level hidden callbacks
- Engagement type gating: contractors, floorPlans, and procurementItems hidden for non-Full Interior Design projects
- Commercial toggle gating: buildingManager, cois, legalDocs hidden for non-commercial projects
- GROQ queries for contractor email lookup, ID lookup, and project-contractor assignment with date projections

## Task Commits

Each task was committed atomically (TDD: test + feat):

1. **Task 1: Contractor schema + project extensions** - `c23abde` (test) + `e69aae3` (feat)
2. **Task 2: GROQ contractor queries** - `38e87e5` (test) + `2f66700` (feat)

_TDD tasks have separate RED (test) and GREEN (feat) commits_

## Files Created/Modified
- `src/sanity/schemas/contractor.ts` - Contractor document type with name, email, phone, company, trades
- `src/sanity/schemas/contractor.test.ts` - Contractor schema tests (6 tests)
- `src/sanity/schemas/project.ts` - Extended with contractors group, 6 new fields, hidden callbacks on procurementItems
- `src/sanity/schemas/project.test.ts` - Extended with Phase 7 field gating tests (11 new tests)
- `src/sanity/schemas/index.ts` - Contractor added to schemaTypes array
- `sanity.config.ts` - Contractors sidebar item added after Clients
- `src/sanity/queries.ts` - 3 new GROQ query constants + 3 async functions
- `src/sanity/queries.test.ts` - 10 new query string content tests

## Decisions Made
- File string fields (estimateFile, COI file, floor plan file, legal doc file) use string type storing Vercel Blob pathnames; BlobFileInput custom component will be wired in Plan 02
- procurementItems field now gated by engagement type hidden callback (previously visible for all engagement types)
- Contractor sidebar item placed after Clients in Studio navigation for logical grouping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Contractor schema and project extensions ready for Plan 02 (Blob storage: BlobFileInput component for file upload fields)
- GROQ queries ready for Plan 03 (contractor auth + portal: magic link login, contractor dashboard)
- All 38 new tests pass; pre-existing milestoneUtils date tests fail (timezone boundary issue, unrelated)

## Self-Check: PASSED

All 8 files verified present. All 4 commit hashes verified in git log.

---
*Phase: 07-schema-extensions-multi-role-auth-and-document-storage*
*Completed: 2026-03-16*
