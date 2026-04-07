---
phase: 27-procurement-editor
plan: 03
subsystem: ui
tags: [react, astro, procurement, admin, tailwind, lucide-react, date-fns]

# Dependency graph
requires:
  - phase: 27-procurement-editor
    plan: 01
    provides: isOverdue utility, getCarrierFromUrl utility, getAdminProcurementData GROQ query
  - phase: 27-procurement-editor
    plan: 02
    provides: update-procurement-status, update-procurement-item, upload-procurement-file API routes
  - phase: 26-project-list-overview
    provides: AdminLayout, ProjectEditForm patterns, admin page conventions
provides:
  - "SSR Astro page at /admin/projects/[projectId]/procurement with GROQ data fetch and breadcrumbs"
  - "ProcurementEditor React island with table view, inline status dropdown, slide-out panel, file upload, overflow menu, and confirmation dialog"
affects: [27-procurement-editor]

# Tech tracking
tech-stack:
  added: []
  patterns: [admin-react-island-pattern, optimistic-status-update, slide-out-panel-form, inline-dropdown-with-stopPropagation]

key-files:
  created:
    - src/pages/admin/projects/[projectId]/procurement.astro
    - src/components/admin/ProcurementEditor.tsx
  modified: []

key-decisions:
  - "ProcurementEditor is a single large component (~600 lines) rather than decomposed into sub-components -- appropriate for a React island with no shared subcomponents"
  - "Dollar-to-cents conversion uses a toCents helper that splits parseFloat and Math.round across lines for readability"
  - "File upload zone only shown in edit mode since new items need a _key from Sanity before files can be attached"

patterns-established:
  - "Slide-out panel pattern: 480px fixed panel with backdrop, translate-x animation, header/body/footer sections"
  - "Inline dropdown pattern: stopPropagation on container, absolute positioning, document click to close, Escape key handler"
  - "Optimistic update pattern: save previous state, update immediately, revert on API error"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-04-07
---

# Phase 27 Plan 03: Procurement Editor SSR Page & React Island Summary

**Full procurement editor at /admin/projects/[projectId]/procurement with table view, inline status dropdown, 13-field slide-out panel, drag-and-drop file upload, and confirmation dialog for item removal**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-07T13:29:58Z
- **Completed:** 2026-04-07T13:35:37Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- SSR Astro page fetches procurement data via getAdminProcurementData() GROQ query and renders ProcurementEditor React island with breadcrumbs (Projects > Project Name > Procurement)
- ProcurementEditor renders sortable table with 5 columns (item name + manufacturer, status badge, delivery date, carrier icon, actions overflow menu)
- Inline status dropdown with optimistic updates calls /api/admin/update-procurement-status; reverts on error
- Slide-out panel (480px) with all 13 form fields including dollar-to-cents conversion for prices, native date inputs, font-mono tracking number, and file upload zone with drag-and-drop
- Carrier cell shows colored Package icons linked to tracking URLs via getCarrierFromUrl() and getTrackingInfo() fallback
- Overdue dates display in red via imported isOverdue() utility
- Confirmation dialog for item removal with "Keep Item" / "Remove" actions
- Empty state with "No procurement items yet" message and centered "Add Item" CTA

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SSR Astro page for procurement** - `cd16fe7` (feat)
2. **Task 2: Create ProcurementEditor React island** - `11b2c6a` (feat)

## Files Created/Modified
- `src/pages/admin/projects/[projectId]/procurement.astro` - SSR page with GROQ fetch, breadcrumbs, and ProcurementEditor client:load mount
- `src/components/admin/ProcurementEditor.tsx` - Full procurement editor React island (table, inline dropdown, slide-out panel, file upload, overflow menu, confirmation dialog)

## Decisions Made
- ProcurementEditor kept as a single component (~600 lines) since it's a self-contained React island with no reusable sub-components; decomposition would add complexity without benefit
- Dollar-to-cents conversion split into a `toCents` helper function for readability rather than inlining the conversion
- File upload zone conditionally rendered only in edit mode (existing items with _key) -- new items show "Save the item first to upload files" since file upload requires an item _key for the Sanity path

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|------------|
| T-27-10 | All item names, notes, and labels rendered as React JSX text nodes (auto-escaped, no raw HTML injection patterns) |
| T-27-11 | sanityWriteClient not imported in ProcurementEditor.tsx -- verified by grep (0 matches). All mutations use fetch() to API routes. |
| T-27-12 | trackingUrl passed through getCarrierFromUrl() which uses new URL() constructor for validation; invalid URLs return null and no link renders |

## Next Phase Readiness
- Procurement editor is fully functional and ready for visual verification (Plan 04)
- All API integrations wired: status update, item CRUD, file upload/delete
- Pre-existing test failures (formatCurrency, geminiClient, blob-serve) are unrelated to this plan

## Self-Check: PASSED

---
*Phase: 27-procurement-editor*
*Completed: 2026-04-07*
