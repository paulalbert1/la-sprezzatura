---
phase: 20-portfolio-project-type
plan: 03
subsystem: ui
tags: [sanity, document-action, dialog, image-selection, portfolio, spawn]

# Dependency graph
requires:
  - phase: 20-01
    provides: "portfolioProject schema and buildPortfolioPayload utility"
  - phase: 20-02
    provides: "Studio navigation (sidebar rename, Portfolio list item, navbar tab)"
provides:
  - "SpawnPortfolioAction document action with 3-step multi-step dialog"
  - "Action registered on admin project documents in sanity.config.ts"
affects: [20-portfolio-project-type]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-step dialog pattern in document actions (ask -> select -> creating)"
    - "Image thumbnail grid with imageUrlBuilder for selection UI"
    - "Duplicate prevention via GROQ query in useEffect"
    - "Visibility gating on projectStatus and alreadyExists check"

key-files:
  created:
    - src/sanity/actions/spawnPortfolioProject.tsx
  modified:
    - sanity.config.ts

key-decisions:
  - "Used native <input type='checkbox'> per sendUpdate.tsx pattern instead of @sanity/ui Checkbox"
  - "window.location.href for navigation to new document (matches StudioNavbar pattern)"
  - "Hide action while duplicate check is loading to prevent button flash (Research Pitfall 2)"

patterns-established:
  - "SpawnPortfolioAction: multi-step dialog pattern (ask/select/creating) for complex document actions"
  - "Image selection grid with thumbnails, checkboxes, hero star badge within Sanity Studio"

requirements-completed: [PORT-02, PORT-03]

# Metrics
duration: 3min
completed: 2026-04-06
---

# Phase 20 Plan 03: Spawn Action & Config Registration Summary

**SpawnPortfolioAction document action with 3-step dialog (photography question, image selection grid, creating state) registered on completed admin projects**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-06T01:50:21Z
- **Completed:** 2026-04-06T01:53:36Z
- **Tasks:** 2/3 (Task 3 is a human-verify checkpoint -- pending)
- **Files modified:** 2

## Accomplishments
- SpawnPortfolioAction with 3-step multi-step dialog: photography question -> image selection grid -> creating state with spinner
- Visibility gated on projectStatus === "completed" AND no existing portfolio document (duplicate prevention via GROQ query)
- Image grid with 150x150 thumbnails via imageUrlBuilder, native checkboxes, hero star badge (StarFilledIcon), Select All/Select None
- Portfolio creation via client.create with buildPortfolioPayload, navigation to new document on success
- Action registered in sanity.config.ts on admin project document type (not portfolioProject, per Research Pitfall 6)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build SpawnPortfolioAction with multi-step dialog** - `b3622f1` (feat)
2. **Task 2: Register SpawnPortfolioAction in sanity.config.ts** - `8615a58` (feat)
3. **Task 3: Verify spawn workflow end-to-end in Sanity Studio** - PENDING (checkpoint:human-verify)

## Files Created/Modified
- `src/sanity/actions/spawnPortfolioProject.tsx` - 279-line document action with multi-step dialog, image selection, duplicate prevention, portfolio creation
- `sanity.config.ts` - Added SpawnPortfolioAction import and registration in project schemaType action list

## Decisions Made
- Used native `<input type="checkbox">` instead of `@sanity/ui` Checkbox, following the established sendUpdate.tsx pattern (Research Open Question 2)
- Used `window.location.href` for post-creation navigation, matching the StudioNavbar.tsx pattern (Research Open Question 1)
- Hide action button while duplicate check is loading (`alreadyExists === null` returns null) to prevent flash of button (Research Pitfall 2)
- Error recovery returns user to image selection step ("select") so they can retry without re-answering the photography question

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data sources are wired and functional.

## Issues Encountered

Pre-existing test failures (9 tests in 4 files: milestoneUtils date rounding, blob-serve source assertions, geminiClient stream, portfolioProject schema field count) confirmed present on base commit. Not caused by this plan's changes. Not in scope to fix.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Task 3 (checkpoint:human-verify) must be completed by human in running Sanity Studio
- All code is committed and ready for manual verification of the spawn workflow
- After verification, phase 20 portfolio project type feature is complete

## Self-Check: PASSED

- FOUND: src/sanity/actions/spawnPortfolioProject.tsx (279 lines)
- FOUND: sanity.config.ts (with SpawnPortfolioAction import + registration)
- FOUND: .planning/phases/20-portfolio-project-type/20-03-SUMMARY.md
- FOUND: Commit b3622f1 (Task 1 - SpawnPortfolioAction component)
- FOUND: Commit 8615a58 (Task 2 - sanity.config.ts registration)

---
*Phase: 20-portfolio-project-type*
*Completed: 2026-04-06 (Tasks 1-2; Task 3 pending human verification)*
