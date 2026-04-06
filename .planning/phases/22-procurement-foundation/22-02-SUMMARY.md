---
phase: 22-procurement-foundation
plan: 02
subsystem: sanity-schema
tags: [sanity, procurement, schema, netprice, blob, thumbnails, typescript, react]

# Dependency graph
requires:
  - phase: 22-procurement-foundation
    plan: 01
    provides: Shared procurement constants module (procurementStages.ts) with getProcurementOptionsList
provides:
  - Extended procurement schema with 13 fields in UI-SPEC order
  - NetPriceDisplay component for computed net price display
  - BlobFileInput with image thumbnail previews
affects: [23-procurement-list-ui, sanity-studio-procurement-tab]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-function-extraction-for-testability, useFormValue-sibling-field-access]

key-files:
  created:
    - src/sanity/components/NetPriceDisplay.tsx
    - src/sanity/components/NetPriceDisplay.test.ts
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/schemas/project.test.ts
    - src/sanity/components/BlobFileInput.tsx

key-decisions:
  - "NetPriceDisplay uses pure formatNetPrice function exported for direct unit testing without React/Sanity mocking"
  - "BlobFileInput constructs blob-serve URL inline rather than importing getImageServeUrl to avoid coupling to rendering module"

patterns-established:
  - "Pure function extraction: export formatting logic as pure function for testability, use it in React component"
  - "Sibling field access: use props.path.slice(0, -1) + useFormValue for reading sibling fields in array member custom inputs"

requirements-completed: [PROC-01, PROC-02, PROC-03]

# Metrics
duration: 4min
completed: 2026-04-06
---

# Phase 22 Plan 02: Procurement Schema Extensions, NetPriceDisplay, and BlobFileInput Thumbnails Summary

**13-field procurement schema with manufacturer/quantity/notes/files/netPrice, computed net price component with pure formatting function, and BlobFileInput image thumbnail previews**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-06T12:34:02Z
- **Completed:** 2026-04-06T12:38:21Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Extended procurement item schema from 8 to 13 fields in UI-SPEC order: name, manufacturer, status, quantity, retailPrice, clientCost, netPrice, orderDate, expectedDeliveryDate, installDate, trackingNumber, files, notes
- Replaced hardcoded 6-option status list with `getProcurementOptionsList()` from shared constants module; initialValue changed from "pending" to "not-yet-ordered"
- Created NetPriceDisplay component with exported `formatNetPrice` pure function for testability; displays "Net: $X.XX" computed from retailPrice minus clientCost via `useFormValue` sibling field access
- Added 6 unit tests for formatNetPrice covering positive, negative, zero, empty state, and partial input cases
- Enhanced BlobFileInput with 48px image thumbnails for JPEG/PNG/WebP and DocumentIcon for PDFs/other files, both clickable to open in new tab
- Added files array field with label + BlobFileInput sub-fields for labeled file attachments
- Added 9 Phase 22 schema tests covering all new fields, status options, initialValue, and field ordering contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema extensions and tests** - `bed0451` (feat)
2. **Task 2: NetPriceDisplay tests** - `0a8d744` (test)
3. **Task 3: BlobFileInput thumbnails** - `5db1ae4` (feat)

## Files Created/Modified

- `src/sanity/schemas/project.ts` - Extended procurementItem from 8 to 13 fields; imports getProcurementOptionsList and NetPriceDisplay; files array with label + BlobFileInput
- `src/sanity/schemas/project.test.ts` - Added 9 Phase 22 tests: manufacturer, quantity, notes, netPrice, files, files sub-fields, status options, initialValue, field ordering
- `src/sanity/components/NetPriceDisplay.tsx` - New component with formatNetPrice pure function and NetPriceDisplay React component using useFormValue
- `src/sanity/components/NetPriceDisplay.test.ts` - 6 test cases for formatNetPrice: positive, negative, zero, empty, partial inputs
- `src/sanity/components/BlobFileInput.tsx` - Added isImageFile helper, getServeUrl helper, 48px image thumbnails, DocumentIcon for non-images, click-to-open links

## Decisions Made

- NetPriceDisplay exports formatNetPrice as a pure function so all formatting logic can be tested without React rendering or Sanity hook mocking
- BlobFileInput constructs the blob-serve URL inline using the same `(import.meta as any).env?.SANITY_STUDIO_API_SECRET` pattern rather than importing from rendering/types.ts, keeping the component self-contained

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without blockers.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all fields are wired to real data sources and components.

## Next Phase Readiness

- Procurement schema fully extended with all PROC-01/02/03 fields ready for Phase 23 list UI
- NetPriceDisplay wired as custom input component on netPrice field; will display computed values in Sanity Studio
- BlobFileInput thumbnails ready for use in procurement files array and other blob file fields
- All 62 plan-related tests passing (46 schema + 6 NetPriceDisplay + 10 procurementStages)

## Self-Check: PASSED

All 5 created/modified files confirmed present on disk. All 3 task commit hashes (bed0451, 0a8d744, 5db1ae4) confirmed in git log.

---
*Phase: 22-procurement-foundation*
*Completed: 2026-04-06*
