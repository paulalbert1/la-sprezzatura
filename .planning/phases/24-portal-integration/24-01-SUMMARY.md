---
phase: 24-portal-integration
plan: 01
subsystem: portal
tags: [groq, portal, procurement, astro]

# Dependency graph
requires:
  - phase: 22-procurement-foundation
    provides: "PROCUREMENT_STAGES constants module, procurement schema with manufacturer/quantity fields"
provides:
  - "Portal procurement table with manufacturer/quantity sub-line below item names"
  - "Status labels derived from PROCUREMENT_STAGES (single source of truth)"
  - "Legacy pending normalization to not-yet-ordered"
affects: [portal, procurement-table]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PROCUREMENT_STAGES-driven STATUS_LABELS via Object.fromEntries map"
    - "Legacy pending normalization before sort (same pattern as ProcurementListItem.tsx)"
    - "Sub-line rendering: manufacturer + optional middle-dot Qty separator"

key-files:
  created: []
  modified:
    - src/sanity/queries.ts
    - src/components/portal/ProcurementTable.astro

key-decisions:
  - "STATUS_LABELS derived from PROCUREMENT_STAGES.map() rather than hardcoded — single source of truth"
  - "Sub-line uses text-xs text-stone mt-0.5 for visual hierarchy below item name"
  - "Quantity only shown when both manufacturer and quantity are present (per D-02)"

# Self-Check
## Self-Check: PASSED

### Changes Made
- Task 1: Added `manufacturer` and `quantity` to getProjectDetail GROQ procurementItems projection in queries.ts
- Task 2: Updated ProcurementTable.astro with PROCUREMENT_STAGES import, Props expansion, status alignment (not-yet-ordered replacing pending), legacy normalization, chronological sort order, and manufacturer/quantity sub-line rendering

### Deviations
None — all changes matched plan specifications exactly.

### Issues
None.
---
