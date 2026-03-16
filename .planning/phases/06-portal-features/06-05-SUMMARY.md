---
phase: 06-portal-features
plan: 05
subsystem: ui, api, pdf
tags: [pdfkit, react, astro-actions, sanity-cdn, file-upload, warranty]

# Dependency graph
requires:
  - phase: 06-01
    provides: formatCurrency, artifactUtils, projectVisibility helpers
  - phase: 06-02
    provides: project detail page, engagement type gating, showProcurement/showCloseDocument
  - phase: 06-03
    provides: artifact approval form pattern, portal schemas, Astro Actions pattern
provides:
  - Close document PDF generator (generateClosePdf) with branded layout
  - Close document API route (/api/close-document) with auth and PDF streaming
  - Warranty claim schema (warrantyClaimSchema) with optional photo
  - submitWarrantyClaim Astro Action with Sanity CDN photo upload
  - WarrantyClaimForm React component with photo upload
  - Fully wired project detail page with all post-project features
affects: [06-portal-features]

# Tech tracking
tech-stack:
  added: [pdfkit, "@types/pdfkit"]
  patterns: [server-side PDF generation with in-memory buffers, Sanity CDN image upload from Astro Action, conditional section rendering by project status]

key-files:
  created:
    - src/lib/generateClosePdf.ts
    - src/lib/generateClosePdf.test.ts
    - src/pages/api/close-document.ts
    - src/components/portal/WarrantyClaimForm.tsx
  modified:
    - src/actions/index.ts
    - src/actions/portalSchemas.ts
    - src/actions/portalActions.test.ts
    - src/pages/portal/project/[projectId].astro

key-decisions:
  - "PDFKit with in-memory buffer pattern for serverless-compatible PDF generation"
  - "warrantyClaimSchema extracted to portalSchemas.ts following established pattern from 06-03"
  - "Photo upload to Sanity CDN via sanityWriteClient.assets.upload in Action handler"

patterns-established:
  - "API route PDF generation: auth check -> GROQ fetch -> generateClosePdf -> Response with application/pdf"
  - "File upload in Astro Action: z.instanceof(File).optional() schema + Buffer.from(file.arrayBuffer()) + Sanity assets.upload"
  - "Conditional page sections: isCompleted/isReopened/showCloseDocument flags control section rendering"

requirements-completed: [POST-01, POST-03, POST-04, ARTF-01]

# Metrics
duration: 5min
completed: 2026-03-16
---

# Phase 06 Plan 05: Post-Project Features Summary

**PDFKit close document generator with branded layout, warranty claim form with optional photo upload to Sanity CDN, and full project page wiring**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-16T19:59:49Z
- **Completed:** 2026-03-16T20:05:32Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Close document PDF generates with branded layout including header, milestones, procurement savings, approved artifacts, and optional personal note
- Warranty claim form with freeform text and optional photo upload, creating warranty artifact on project
- Close document download conditionally appears on completed Full Interior Design projects
- Warranty claim form conditionally appears only on reopened projects
- All 115 tests pass including 3 new PDF generation tests and 3 new warranty schema tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Close document PDF generator + warranty claim action (TDD RED)** - `ab54de3` (test)
2. **Task 1: Close document PDF generator + warranty claim action (TDD GREEN)** - `df65eb5` (feat)
3. **Task 2: Warranty claim form + wire post-project features** - `0b27715` (feat)

_TDD task produced 2 commits (RED + GREEN). No refactor needed._

## Files Created/Modified
- `src/lib/generateClosePdf.ts` - PDFKit-based close document generator with branded layout
- `src/lib/generateClosePdf.test.ts` - Tests for PDF buffer output, magic bytes, optional fields
- `src/pages/api/close-document.ts` - API route: auth, GROQ fetch, engagement type gate, PDF streaming
- `src/components/portal/WarrantyClaimForm.tsx` - React form with textarea, file input, success/error states
- `src/actions/index.ts` - Added submitWarrantyClaim action with photo upload to Sanity CDN
- `src/actions/portalSchemas.ts` - Added warrantyClaimSchema (description min 10 + optional File)
- `src/actions/portalActions.test.ts` - Added 3 warranty claim schema tests
- `src/pages/portal/project/[projectId].astro` - Wired close document download + warranty claim form

## Decisions Made
- PDFKit with in-memory buffer pattern (no filesystem dependency) for serverless compatibility
- warrantyClaimSchema extracted to portalSchemas.ts following pattern established in 06-03 for testability
- Photo uploaded to Sanity CDN via sanityWriteClient.assets.upload, then referenced in warranty artifact

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing Redis URL configuration issue causes build prerender error for static routes (double-quoted URL in env var). Not caused by our changes, does not affect compilation or SSR routes. Out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 5 plans in Phase 06 complete (pending 06-04 status)
- Full project lifecycle implemented: active work -> completion (close document) -> post-completion support (warranty claims)
- Build compiles successfully, all 115 tests pass

## Self-Check: PASSED

All created files verified present. All commit hashes verified in git log.

---
*Phase: 06-portal-features*
*Completed: 2026-03-16*
