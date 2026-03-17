---
phase: 10-ai-rendering-engine
plan: 01
subsystem: database
tags: [sanity, schema, groq, vercel, gemini, vitest]

# Dependency graph
requires:
  - phase: 07-schema-extensions
    provides: siteSettings singleton, project schema, Vercel Blob infrastructure
  - phase: 09-send-update-investment-proposals-and-public-site-polish
    provides: schema test patterns, GROQ query patterns, inline array patterns
provides:
  - renderingSession document type with 4 field groups and ~20 fields
  - designOption document type with project ref, provenance, and reactions
  - renderingUsage document type for per-designer per-month usage tracking
  - siteSettings extended with Rendering group (allocation, imageTypes, excludedUsers)
  - 6 GROQ queries for rendering data access
  - Schema registry with 8 total types
  - @google/genai and @vercel/functions npm dependencies
  - Vercel adapter configured with 60s timeout for Pro plan
affects: [10-02-prompt-builder-gemini-client, 10-03-core-api-routes, 10-04-supplementary-api-routes, 11-studio-tool]

# Tech tracking
tech-stack:
  added: [@google/genai, @vercel/functions]
  patterns: [rendering-session-schema, design-option-provenance, usage-tracking-per-month, site-settings-field-groups]

key-files:
  created:
    - src/sanity/schemas/renderingSession.ts
    - src/sanity/schemas/designOption.ts
    - src/sanity/schemas/renderingUsage.ts
    - src/sanity/schemas/renderingSession.test.ts
    - src/sanity/schemas/designOption.test.ts
    - src/sanity/schemas/renderingUsage.test.ts
  modified:
    - src/sanity/schemas/siteSettings.ts
    - src/sanity/schemas/index.ts
    - src/sanity/queries.ts
    - package.json
    - astro.config.mjs

key-decisions:
  - "Schema field groups (setup/inputs/renderings/metadata) organize renderingSession for Studio UX"
  - "Rendering image types stored as plain string list in options (not referencing siteSettings at schema level -- API handles dynamic lookup)"
  - "costEstimate validated as integer cents consistent with existing procurement pattern"

patterns-established:
  - "Rendering schemas use defineArrayMember with named object types (renderingImage, renderingOutput, conversationEntry, reaction)"
  - "siteSettings field groups pattern: existing fields remain ungrouped, new feature groups added alongside"
  - "GROQ queries exported as const strings without async wrappers (API routes use sanityWriteClient.fetch directly)"

requirements-completed: [RNDR-01, RNDR-06, RNDR-07]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 10 Plan 01: Schemas, Queries, and Dependencies Summary

**3 Sanity schemas (renderingSession, designOption, renderingUsage), 6 GROQ queries, siteSettings Rendering group, @google/genai + @vercel/functions installed, Vercel Pro 60s timeout configured**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T22:31:14Z
- **Completed:** 2026-03-17T22:35:53Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Created renderingSession schema with 4 groups (setup, inputs, renderings, metadata) and all fields from UI-SPEC including nested arrays for images, renderings, and conversation
- Created designOption schema with full provenance tracking (sourceSession ref, sourceRenderingIndex) and client reactions array
- Created renderingUsage schema for per-designer per-month generation tracking with integer validation
- Extended siteSettings with Rendering field group: renderingAllocation (default 50), renderingImageTypes (7 defaults), renderingExcludedUsers
- Added 6 GROQ queries covering session lookup, project filtering, creator filtering, design options, usage, and settings
- All 31 new schema tests passing alongside 42 existing schema tests (73 total)

## Task Commits

Each task was committed atomically:

1. **Task 1a: Install deps, configure Vercel timeout, create renderingSession schema** - `7eaa58e` (feat)
2. **Task 1b: Create designOption + renderingUsage schemas, extend siteSettings, update registry** - `152044a` (feat)
3. **Task 2: Add GROQ rendering queries and write all schema validation tests** - `2304fea` (feat)

## Files Created/Modified
- `src/sanity/schemas/renderingSession.ts` - Rendering session document type with 4 groups and ~20 fields including nested arrays
- `src/sanity/schemas/designOption.ts` - Promoted design option with project ref, provenance, and reactions
- `src/sanity/schemas/renderingUsage.ts` - Per-designer per-month usage tracking
- `src/sanity/schemas/renderingSession.test.ts` - 15 schema validation tests
- `src/sanity/schemas/designOption.test.ts` - 11 schema validation tests
- `src/sanity/schemas/renderingUsage.test.ts` - 5 schema validation tests
- `src/sanity/schemas/siteSettings.ts` - Added Rendering group with renderingAllocation, renderingImageTypes, renderingExcludedUsers
- `src/sanity/schemas/index.ts` - Registered 3 new types (8 total)
- `src/sanity/queries.ts` - Added 6 rendering GROQ queries
- `package.json` - Added @google/genai and @vercel/functions
- `astro.config.mjs` - Configured Vercel adapter with maxDuration: 60

## Decisions Made
- Schema field groups (setup/inputs/renderings/metadata) organize renderingSession for Studio UX clarity
- Rendering image types stored as plain string list in schema options rather than dynamically referencing siteSettings at schema level -- the API routes will handle dynamic lookup from siteSettings at runtime
- costEstimate field uses integer cents with `.integer().min(0)` validation, consistent with existing procurement pattern
- GROQ queries exported as const strings without async wrapper functions -- API routes in Plans 03/04 use sanityWriteClient.fetch() directly since they need the write client

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures observed in `src/lib/renderingAuth.test.ts` and `src/lib/promptBuilder.test.ts` -- these test files reference modules not yet created (planned for 10-02 and later). They are out of scope for this plan and do not affect any Plan 01 deliverables.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 schemas are stable and tested -- Plan 02 (promptBuilder + geminiClient) and Plans 03/04 (API routes) can reference them with confidence
- GROQ queries ready for Plan 03/04 API routes to use directly
- @google/genai installed and ready for Plan 02 geminiClient wrapper
- Vercel Pro timeout configured for waitUntil pattern in Plan 03

## Self-Check: PASSED

All 6 created files exist. All 3 task commits verified (7eaa58e, 152044a, 2304fea).

---
*Phase: 10-ai-rendering-engine*
*Completed: 2026-03-17*
