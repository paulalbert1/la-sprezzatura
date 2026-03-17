---
phase: 08-contractor-portal-building-manager-and-client-visibility
plan: 03
subsystem: ui
tags: [astro, react, portal, magic-link, coi, building-manager, role-selection]

# Dependency graph
requires:
  - phase: 08-01
    provides: GROQ queries (getBuildingManagerProject, getProjectsByBuildingManagerEmail, getSiteContactInfo), coiUtils, middleware building_manager guards, requestBuildingManagerMagicLink action
provides:
  - Building manager auth flow (login, verify, dashboard, logout)
  - Building manager project detail page with COI badges, legal docs, client contact
  - ExpirationBadge component for COI status display
  - ContractorSection component for client-facing contractor visibility (CVIS-01)
  - Triple-role selection support (client + contractor + building_manager)
affects: [phase-09, phase-10]

# Tech tracking
tech-stack:
  added: []
  patterns: [building-manager-auth-flow, coi-expiration-badges, information-boundary-enforcement, triple-role-selection]

key-files:
  created:
    - src/components/portal/BuildingManagerLoginForm.tsx
    - src/components/portal/ExpirationBadge.astro
    - src/components/portal/ContractorSection.astro
    - src/pages/building/login.astro
    - src/pages/building/verify.astro
    - src/pages/building/dashboard.astro
    - src/pages/building/logout.ts
    - src/pages/building/project/[projectId].astro
  modified:
    - src/components/portal/RoleSelectionForm.tsx
    - src/pages/portal/role-select.astro
    - src/pages/portal/project/[projectId].astro

key-decisions:
  - "Building manager dashboard cards are links (not static divs) for clickable navigation to project detail"
  - "ContractorSection hidden entirely when no contractors assigned (no empty state, per CVIS-01 spec)"
  - "RoleSelectionForm conditionally renders each role button based on prop presence (not hardcoded 2-button layout)"
  - "Role-select redirect guard changed from requiring both clientId AND contractorId to requiring at least one param"

patterns-established:
  - "COI badge pattern: ExpirationBadge component using getExpirationStatus utility with emerald/amber/red semantic colors"
  - "Information boundary pattern: building manager sees client contact + COIs + legal docs but NOT scope/estimate; client sees contractor names + appointments but NOT notes"
  - "Triple-role auth flow: verify pages include buildingManagerEmail param for role-select redirect"

requirements-completed: [BLDG-02, BLDG-03, BLDG-04, BLDG-05, BLDG-06, CVIS-01]

# Metrics
duration: 4min
completed: 2026-03-17
---

# Phase 8 Plan 3: Building Manager Portal and Client Contractor Visibility Summary

**Building manager portal with COI expiration badges, legal document downloads, client contact info, and client-facing ContractorSection with appointment visibility (CVIS-01)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-17T12:02:27Z
- **Completed:** 2026-03-17T12:06:29Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Complete building manager auth flow at /building/* (login, verify, dashboard, logout) cloned from contractor portal patterns
- Building manager project detail page with Client Contact, Certificates of Insurance (with ExpirationBadge), Legal Documents, and Contractors sections
- ExpirationBadge component with emerald/amber/red status for valid/expiring/expired COIs
- ContractorSection for client portal showing contractor names, trades, and appointment dates/labels (no notes -- CVIS-01 information boundary)
- Role selection extended to support triple-role users (client + contractor + building_manager)

## Task Commits

Each task was committed atomically:

1. **Task 1: Building manager auth flow** - `fce950f` (feat)
2. **Task 2: Project detail, ExpirationBadge, ContractorSection, role selection** - `2a3bad8` (feat)

## Files Created/Modified
- `src/components/portal/BuildingManagerLoginForm.tsx` - Magic link login form for building managers
- `src/components/portal/ExpirationBadge.astro` - COI expiration status badge (valid/expiring/expired)
- `src/components/portal/ContractorSection.astro` - Client-facing contractor visibility with appointments
- `src/pages/building/login.astro` - Building manager login page
- `src/pages/building/verify.astro` - Magic link verification with multi-role support
- `src/pages/building/dashboard.astro` - Building manager dashboard with auto-redirect
- `src/pages/building/logout.ts` - Session clear and redirect
- `src/pages/building/project/[projectId].astro` - Building manager project detail with COIs, legal docs, client contact
- `src/components/portal/RoleSelectionForm.tsx` - Extended for optional third Building Portal button
- `src/pages/portal/role-select.astro` - Extended POST handler and GET params for building_manager role
- `src/pages/portal/project/[projectId].astro` - Added ContractorSection for Full Interior Design projects

## Decisions Made
- Building manager dashboard cards rendered as `<a>` links (contractor dashboard uses `<div>` cards without links -- building manager needs clickable navigation since no status badge or date range)
- ContractorSection hidden entirely when no contractors (no empty state section) per CVIS-01 spec
- RoleSelectionForm made fully conditional -- each button renders only when its prop is present, supporting any combination of 1-3 roles
- Role-select redirect guard relaxed from requiring both clientId AND contractorId to requiring at least one of the three params

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three portal experiences complete: client portal, contractor work order portal, building manager portal
- All Phase 8 plans (01, 02, 03) executed -- phase complete
- Information boundaries enforced at both GROQ query and component rendering layers
- Ready for v3.0 milestone planning (Phase 9+ deferred features)

## Self-Check: PASSED

All 8 created files verified present. Both task commits (fce950f, 2a3bad8) verified in git log.

---
*Phase: 08-contractor-portal-building-manager-and-client-visibility*
*Completed: 2026-03-17*
