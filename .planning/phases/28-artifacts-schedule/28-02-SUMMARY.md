---
phase: 28-artifacts-schedule
plan: 02
subsystem: api
tags: [sanity, api-routes, file-upload, groq, astro]

# Dependency graph
requires:
  - phase: 27-procurement-editor
    provides: Admin API route pattern (auth, Sanity patch, FormData)
provides:
  - artifact-version API route (upload, set-current, upload-signed)
  - artifact-crud API route (add with first version, remove)
  - ADMIN_ARTIFACT_QUERY GROQ query and getAdminArtifactData function
affects: [28-03 ArtifactManager React island, 28-04 artifacts Astro page]

# Tech tracking
tech-stack:
  added: []
  patterns: [Sanity asset pipeline for file-type fields, artifact version append with decision log]

key-files:
  created:
    - src/pages/api/admin/artifact-version.ts
    - src/pages/api/admin/artifact-crud.ts
  modified:
    - src/sanity/queries.ts

key-decisions:
  - "Sanity asset pipeline used instead of Vercel Blob because schema versions[].file is Sanity type file expecting asset references"
  - "Add artifact includes first version in same patch to avoid Pitfall 6 race condition"

patterns-established:
  - "Sanity asset pipeline pattern: Buffer.from(file.arrayBuffer()) -> sanityWriteClient.assets.upload -> asset._id reference"
  - "Dual content-type dispatch: FormData for file actions, JSON for non-file actions in single POST handler"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-04-07
---

# Phase 28 Plan 02: Artifact API Routes and GROQ Query Summary

**Sanity asset pipeline API routes for artifact version upload, set-current, add/remove, and admin GROQ query returning full artifact data with versions, decisionLog, signedFile, and investmentSummary**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T20:52:38Z
- **Completed:** 2026-04-07T20:55:06Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created artifact-version API route handling three actions: upload (Sanity asset pipeline), set-current, and upload-signed for contract artifacts
- Created artifact-crud API route with add (includes first version in one atomic patch) and remove actions, validated against ARTIFACT_TYPES
- Added ADMIN_ARTIFACT_QUERY GROQ query with full artifact projections and getAdminArtifactData export function

## Task Commits

Each task was committed atomically:

1. **Task 1: Create artifact-version API route (upload + set-current)** - `a965c3f` (feat)
2. **Task 2: Create artifact-crud API route (add/remove) and GROQ query** - `ff2b4ac` (feat)

## Files Created/Modified
- `src/pages/api/admin/artifact-version.ts` - POST handler for version upload (Sanity assets), set-current (JSON), and upload-signed (FormData)
- `src/pages/api/admin/artifact-crud.ts` - POST handler for add artifact (with first version) and remove artifact
- `src/sanity/queries.ts` - Added ADMIN_ARTIFACT_QUERY and getAdminArtifactData function

## Decisions Made
- Used Sanity asset pipeline (`sanityWriteClient.assets.upload("file", buffer)`) instead of Vercel Blob because the schema `versions[].file` is Sanity type `file` expecting asset references, not plain URLs
- Add artifact action creates the full artifact object including first version in a single `setIfMissing + append` patch to avoid Pitfall 6 (race condition on separate version upload)
- Content-type header dispatching: FormData for file upload actions, JSON body for set-current and remove actions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing test failure in `src/pages/api/rendering/generate.test.ts` (sanityWriteClient.getDocument mock issue) -- out of scope for this plan, unrelated to artifact routes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- API routes ready for ArtifactManager React island (Plan 03) to consume
- GROQ query ready for artifacts.astro SSR page (Plan 03) to fetch data server-side
- All three actions (upload, set-current, upload-signed) in artifact-version.ts match the version management UI requirements from D-01

## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 28-artifacts-schedule*
*Completed: 2026-04-07*
