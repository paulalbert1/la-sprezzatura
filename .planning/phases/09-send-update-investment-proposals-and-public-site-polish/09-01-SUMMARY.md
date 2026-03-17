---
phase: 09-send-update-investment-proposals-and-public-site-polish
plan: 01
subsystem: api, ui, database
tags: [sanity, resend, email, groq, zod, react, astro]

# Dependency graph
requires:
  - phase: 08-contractor-portal
    provides: "Sanity project schema with clients[], milestones, procurement, artifacts, contractors"
provides:
  - "SendUpdateAction Sanity Studio document action with dialog UI"
  - "/api/send-update API route with branded HTML email, Resend delivery, updateLog logging"
  - "updateLog[] field on project schema for tracking sent updates"
  - "investmentSummary schema on proposal artifacts (tiers, lineItems, selectedTierKey, eagerness, reservations)"
  - "SEND_UPDATE_PROJECT_QUERY GROQ query with engagement-type-gated procurement"
  - "InvestmentTier, InvestmentLineItem, InvestmentSummary TypeScript types"
  - "selectTierSchema Zod validation for tier selection form"
affects: [09-02-plan, 09-03-plan]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Studio document action with dialog UI and API route fetch pattern (sendUpdate.tsx -> /api/send-update)"
    - "Branded HTML email template with inline table-based layout"
    - "updateLog insert-after pattern for immutable log entries"
    - "Investment summary nested schema pattern (tiers > lineItems)"

key-files:
  created:
    - src/sanity/actions/sendUpdate.tsx
    - src/pages/api/send-update.ts
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/queries.ts
    - src/lib/artifactUtils.ts
    - src/actions/portalSchemas.ts
    - sanity.config.ts
    - src/sanity/schemas/project.test.ts
    - src/lib/artifactUtils.test.ts
    - src/actions/portalActions.test.ts
    - src/sanity/queries.test.ts

key-decisions:
  - "heroSlideshow already existed in getSiteSettings query -- no change needed"
  - "clientCost only appears in GROQ computed savings expression, never in email HTML output"
  - "Wave 0 test scaffolds commented with TODO for imports that reference not-yet-existing exports, then uncommented after Task 1"

patterns-established:
  - "SendUpdateAction pattern: Studio dialog -> API route -> email + log entry"
  - "Investment summary nested schema: tiers[] with lineItems[] and client-facing readOnly fields"

requirements-completed: [SEND-01, SEND-02, SEND-03, ARTF-05]

# Metrics
duration: 8min
completed: 2026-03-17
---

# Phase 9 Plan 01: Send Update Email Pipeline and Investment Proposal Schema Summary

**SendUpdateAction Studio dialog with branded HTML email delivery via Resend, updateLog tracking, and investmentSummary schema with tiered line items for proposal artifacts**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-17T17:13:50Z
- **Completed:** 2026-03-17T17:22:28Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- SendUpdateAction in Sanity Studio with personal note, section toggles (milestones/procurement/pending reviews), live preview, frequency warning, and branded email delivery
- /api/send-update API route that fetches project snapshot via GROQ, builds table-based HTML email with milestone checkmarks, procurement status colors, pending review list, and terracotta CTA, sends to all project clients via Resend, and logs the update on the project document
- investmentSummary schema on proposal artifacts with dynamic tiers, line items (price in cents), selectedTierKey, eagerness rating, and reservations -- ready for Plan 02 portal UI
- 30 new tests (Wave 0 scaffolds) covering all Phase 9 extension points -- 225 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 0: Wave 0 test scaffolds** - `fce38e6` (test)
2. **Task 1: Schema extensions** - `dcd88ac` (feat)
3. **Task 2: SendUpdateAction + API route** - `c161e83` (feat)

## Files Created/Modified
- `src/sanity/actions/sendUpdate.tsx` - Studio document action with dialog UI for Send Update
- `src/pages/api/send-update.ts` - API route: GROQ fetch, branded HTML email, Resend send, updateLog insert
- `src/sanity/schemas/project.ts` - Added updateLog[] field and investmentSummary on artifacts
- `src/sanity/queries.ts` - Added SEND_UPDATE_PROJECT_QUERY with engagement-type-gated procurement
- `src/lib/artifactUtils.ts` - Added InvestmentTier, InvestmentLineItem, InvestmentSummary types, tier-selected action
- `src/actions/portalSchemas.ts` - Added selectTierSchema Zod validation
- `sanity.config.ts` - Registered SendUpdateAction in project document actions
- `src/sanity/schemas/project.test.ts` - Phase 9 schema tests (updateLog, investmentSummary)
- `src/lib/artifactUtils.test.ts` - Investment Summary type tests
- `src/actions/portalActions.test.ts` - selectTier schema validation tests
- `src/sanity/queries.test.ts` - SEND_UPDATE_PROJECT_QUERY string assertion tests

## Decisions Made
- heroSlideshow was already in getSiteSettings query (no change needed)
- clientCost is only used in GROQ computed savings, never in email HTML output
- Pre-existing astro check errors (18 in Header.astro, MobileMenu.astro, etc.) are not caused by this plan's changes -- logged as out-of-scope

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Investment proposal tier cards UI (Plan 02) can use the investmentSummary schema, InvestmentTier types, and selectTierSchema
- Hero animation and Cal.com cleanup (Plan 03) is independent

## Self-Check: PASSED

All 7 key files verified present. All 3 task commits verified in git log.

---
*Phase: 09-send-update-investment-proposals-and-public-site-polish*
*Completed: 2026-03-17*
