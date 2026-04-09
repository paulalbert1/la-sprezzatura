---
phase: 31-client-contractor-and-portfolio-management
plan: 04
subsystem: admin-interaction-components
tags: [contact-card, popover, typeahead, quick-assign, hover-interactions]
dependency_graph:
  requires: [admin-search-api, client-crud-api, contractor-crud-api, admin-groq-queries]
  provides: [contact-card-popover, contact-card-wrapper, quick-assign-typeahead, project-team-section]
  affects: [dashboard, project-detail-page]
tech_stack:
  added: []
  patterns: [portal-rendering, hover-popover, debounced-typeahead, viewport-aware-positioning, pre-loaded-contact-data]
key_files:
  created:
    - src/components/admin/ContactCardPopover.tsx
    - src/components/admin/ContactCardWrapper.tsx
    - src/components/admin/QuickAssignTypeahead.tsx
  modified:
    - src/pages/api/admin/clients.ts
    - src/pages/api/admin/contractors.ts
    - src/sanity/queries.ts
    - src/pages/admin/projects/[projectId]/index.astro
    - src/pages/admin/dashboard.astro
decisions: []
metrics:
  duration: 14min
  completed: "2026-04-09T20:22:00Z"
---

## Summary

Contact card popover and quick-assign typeahead -- cross-cutting interaction components for hovering entity names and assigning entities to projects.

## What Was Built

### ContactCardPopover (86 LOC)
Pure presentational component rendering contact details in a positioned popover: name, clickable mailto email, clickable tel phone, preferred contact method, divider, and "View full profile" link. Styled per UI-SPEC Component 3 with opacity fade-in animation.

### ContactCardWrapper (165 LOC)
Wrapper component adding hover-popover behavior to any client/contractor name. Features:
- 300ms hover delay before showing popover
- 150ms grace period for mouse transition to popover
- Viewport-aware positioning (flips above/right-aligned when near edges)
- Portal rendering via createPortal to document.body
- Entity data fetching via search API with per-entity caching
- Optional contactData prop for instant display without fetch

### QuickAssignTypeahead (235 LOC)
Typeahead search for assigning clients/contractors to projects. Features:
- 250ms debounced search via /api/admin/search
- Entity type labels (CLIENT/CONTRACTOR) on each result
- Filters out already-assigned entities
- Contractor trade selection dropdown before assignment
- Confirmation toast showing "{Name} assigned" for 2 seconds
- State machine: idle -> searching -> results -> selectingTrade -> assigning -> assigned

### API Route Extensions
- `clients.ts`: Added `assign-to-project` action -- appends client reference to project's clients[] array
- `contractors.ts`: Added `assign-to-project` action -- appends projectContractor object with trade to project's contractors[] array

### GROQ Query Extensions
- `ADMIN_DASHBOARD_PROJECTS_QUERY`: Added clientId, clientEmail, clientPhone, clientPreferredContact projections
- `ADMIN_PROJECT_DETAIL_QUERY`: Added projectClients (dereferenced) and projectContractors (with contractor details)

### Page Integrations
- **Project detail page**: New "Team" section showing assigned clients and contractors with ContactCardWrapper popovers, plus QuickAssignTypeahead for new assignments
- **Dashboard**: Client names in active projects wrapped with ContactCardWrapper for hover popover with pre-loaded contact data

## Commits

1. `f1a62aa` feat(31-04): create ContactCardPopover and ContactCardWrapper components
2. `469bbe3` feat(31-04): create QuickAssignTypeahead and integrate into project detail page
3. `45e71e2` feat(31-04): integrate ContactCardWrapper into dashboard active projects

## Deviations from Plan

None -- plan executed exactly as written.

## Threat Mitigations Applied

- T-31-16: API routes validate projectId and entityId as strings; setIfMissing prevents null array errors; session + tenant check on all routes
- T-31-17: Contact data only fetched for authenticated admin users via session-checked API routes
- T-31-18: 250ms debounce on client-side; GROQ query limited to 10 results per entity type; requires auth
- T-31-19: Tenant-scoped client prevents cross-tenant project modification; session.role === "admin" check

## Self-Check: PASSED

- [x] All 3 tasks executed
- [x] Each task committed individually
- [x] All 3 new files created
- [x] All 5 existing files modified
- [x] ContactCardPopover has correct styling and content
- [x] ContactCardWrapper has 300ms delay, 150ms grace, viewport positioning, portal rendering
- [x] QuickAssignTypeahead has debounced search, trade selection, confirmation
- [x] API routes have assign-to-project actions with validation
- [x] Dashboard wraps client names with ContactCardWrapper
- [x] Project detail has Team section with popovers and typeahead
