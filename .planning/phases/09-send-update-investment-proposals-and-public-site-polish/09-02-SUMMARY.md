---
phase: 09-send-update-investment-proposals-and-public-site-polish
plan: 02
subsystem: ui, api
tags: [astro, react, sanity, groq, tailwind, portal]

# Dependency graph
requires:
  - phase: 09-send-update-investment-proposals-and-public-site-polish
    plan: 01
    provides: "investmentSummary schema, InvestmentTier/InvestmentLineItem/InvestmentSummary types, selectTierSchema, tier-selected action type"
provides:
  - "InvestmentSummary.astro tier card grid with responsive columns, formatted prices, selected/muted states"
  - "TierSelectionForm.tsx interactive tier selection with eagerness scale (1-5) and readiness check"
  - "selectTier Astro Action that writes selectedTierKey, eagerness, reservations to Sanity with decision log entry"
  - "investmentSummary GROQ projection in PROJECT_DETAIL_QUERY"
  - "ArtifactCard.astro extended with InvestmentSummary rendering for proposal artifacts"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server-rendered Astro tier cards with React interactive form via client:load hydration"
    - "Eagerness rating with role=radiogroup accessibility pattern"
    - "Tier selection as final action with page reload on success (matches approval pattern)"

key-files:
  created:
    - src/components/portal/InvestmentSummary.astro
    - src/components/portal/TierSelectionForm.tsx
  modified:
    - src/components/portal/ArtifactCard.astro
    - src/actions/index.ts
    - src/sanity/queries.ts

key-decisions:
  - "TierSelectionForm renders select buttons in idle state outside tier cards (as standalone grid) rather than inside each server-rendered card -- avoids multiple React islands"
  - "Eagerness circles use 44px min tap targets via inline style for WCAG 2.2 compliance"

patterns-established:
  - "Server-rendered tier card grid with React form hydration via client:load"

requirements-completed: [ARTF-05, ARTF-06, ARTF-07]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 9 Plan 02: Investment Proposal Tier Cards and Client Selection Summary

**InvestmentSummary tier card grid with formatted prices and totals, TierSelectionForm with eagerness scale and readiness check, selectTier Astro Action for Sanity write-back, and ArtifactCard integration for proposal artifacts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T17:25:45Z
- **Completed:** 2026-03-17T17:29:16Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- InvestmentSummary.astro renders responsive tier card grid with line item prices (formatCurrency), tier totals, selected tier border highlight, non-selected tier muting, and empty state messaging
- TierSelectionForm.tsx provides full interactive flow: idle with select buttons, selecting state with eagerness 1-5 circle scale (role=radiogroup), reservations textarea, confirmation checkbox, submitting/success/error states
- selectTier Astro Action fetches tier name from Sanity, writes selectedTierKey/eagerness/reservations, and inserts tier-selected decision log entry
- PROJECT_DETAIL_QUERY extended with investmentSummary projection (tiers, lineItems, selectedTierKey, eagerness, reservations)
- ArtifactCard.astro conditionally renders InvestmentSummary for proposal artifacts with tiers, and displays tier-selected entries in decision log

## Task Commits

Each task was committed atomically:

1. **Task 1: InvestmentSummary.astro, TierSelectionForm.tsx, and selectTier action** - `5b4aba6` (feat)
2. **Task 2: Wire InvestmentSummary into ArtifactCard** - `e003a50` (feat)

## Files Created/Modified
- `src/components/portal/InvestmentSummary.astro` - Server-rendered tier card grid with responsive columns, formatted prices, selected/muted states, empty state
- `src/components/portal/TierSelectionForm.tsx` - React interactive form: tier select buttons, eagerness scale, reservations, confirmation, submit via Astro Action
- `src/components/portal/ArtifactCard.astro` - Extended to render InvestmentSummary for proposal artifacts, tier-selected in decision log
- `src/actions/index.ts` - Added selectTier action with Sanity patch for investmentSummary fields and decision log insert
- `src/sanity/queries.ts` - Added investmentSummary projection to PROJECT_DETAIL_QUERY artifacts[]

## Decisions Made
- TierSelectionForm renders select buttons in a standalone grid (idle state) rather than inside each server-rendered Astro card, avoiding multiple React islands
- Eagerness circles use 44px minimum tap targets via inline style for WCAG 2.2 Target Size compliance
- Page reloads after 2 seconds on successful selection (matches existing approval pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Investment proposal tier cards fully functional in the portal
- All existing 225 tests continue to pass
- Plan 03 (hero slideshow) is independent and can proceed

## Self-Check: PASSED

All 5 key files verified present. All 2 task commits verified in git log.

---
*Phase: 09-send-update-investment-proposals-and-public-site-polish*
*Completed: 2026-03-17*
