---
gsd_state_version: 1.0
milestone: v5.2
milestone_name: Trades Directory
status: ready_to_plan
stopped_at: "Completed Phase 41 Plan 02: UI sweep — client list reshape, formatPhone wiring, preferredContact purge"
last_updated: "2026-04-22T19:33:40.424Z"
last_activity: 2026-04-22 -- Phase --phase execution started
progress:
  total_phases: 10
  completed_phases: 7
  total_plans: 24
  completed_plans: 23
  percent: 70
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work
**Current focus:** Phase --phase — 41

## Current Position

Phase: 42
Plan: Not started
Status: Ready to plan
Last activity: 2026-04-23

Progress: [██████████] 100%

## v5.2 Phase Map

| Phase | Name | Reqs | Plans (est.) | Status |
|-------|------|------|--------------|--------|
| 41 | Client Data Model Refinements (carryover from v5.1) | 4 | 2-3 | Not started |
| 42 | Trades Entity — Routes, Schema, and Display | 5 | 2-3 | Not started |
| 43 | Document Checklists, Settings Config, and Completeness | 3 | 2-3 | Not started |

**Total:** 12 requirements, ~9 plans estimated

## Accumulated Context

### Decisions

Carried from v5.1 boundary. Full history:

- `.planning/MILESTONES.md` (v5.0 section)
- `.planning/PROJECT.md` (Key Decisions table)

**v5.1 carryover decisions (still relevant):**

- Phase 36: Per-island ToastContainer provider pattern (React context does not cross Astro island boundaries)
- Phase 36: vercel.ts as canonical Vercel config via @vercel/config@0.1.1
- Phase 37: Inline modal render (not createPortal) so jsdom container queries reach inputs
- Phase 38: Send Update pipeline reads siteSettings.defaultFromEmail / defaultCcEmail at send time
- Phase 39: Work Order is a separate Sanity document (not inline on project)
- Phase 39: projectDocuments[] is separate from artifacts[] array
- Phase 40: trades string[] on siteSettings; TradesCatalogSection fully controlled component
- Phase 40: Address block shared between clients and contractors via EntityDetailForm
- Phase 40: Trade pill labels use formatTrade() from lib/trades.ts

**v5.2 starting decisions:**

- v5.2 replaces the previously planned "Schedule Rebuild" (Frappe Gantt retirement); that scope is displaced to a future milestone
- Phase 41 (CLNT-10..13 — client data model) carries forward from v5.1 as the first phase of v5.2
- Phase 42 scope: TRAD-01 (route rename) is a prerequisite for TRAD-03/04/05 and must land before any UI consuming the new entity label or meta line
- Phase 42 scope: TRAD-02 (relationship field) and TRAD-07 (1099 unification) grouped together — both touch contractor schema and should be a single migration
- Phase 43 scope: TRAD-08 (Settings config) and TRAD-06 (checklist UI) land together — checklist UI is only renderable once types are configurable; TRAD-04 (completeness indicator) lands in the same phase since it reads required-document state
- Checklist item types for TRAD-08 extend siteSettings with contractorChecklistItems[] and vendorChecklistItems[]
- Work Order routing by relationship type deferred to v5.3 (out of scope per REQUIREMENTS.md)
- formatPhone extracts all digits via /\D/g; returns (NNN) NNN-NNNN for exactly 10 digits; raw input unchanged otherwise (safe fallback for non-US numbers)
- Phone stored raw in Sanity — no normalization on save; display format is render-time only via formatPhone() from src/lib/format.ts
- No Sanity data migration for orphaned preferredContact values — removed from schema/queries/API; existing documents retain inert orphaned data per D-18
- Address cell renders [city, state].filter(Boolean).join(', ') with em-dash fallback — handles city-only, state-only, and both-present cases
- Sort for nested address.city uses conditional accessor in comparator (sortColumn === 'address'); generic path handles all flat fields
- tel: href in ContactCardPopover uses raw data.phone; only visible link text uses formatPhone() — raw digits required by native dialer

### Pending Todos

Carried from v5.1:

- DNS record audit needed for all 4 domains before cutover (v3.0 Phase 12)
- Pre-existing test failures (14 tests) need cleanup
- Phase 34 APIs (site-settings, upload-sanity-image, send-update) should migrate to getTenantClient (v6.0)
- Phase 39 work-orders/[id]/send.ts also uses sanityWriteClient — same v6.0 migration target
- tenantAudit allowlist extension needed for Phase-38 + Phase-39 plan-mandated lasprezz.com defaults (separate maintenance PR)

### Blockers/Concerns

- Resend sandbox only delivers to account owner until domain verified — affects Work Order email send (WORK-05)

## Session Continuity

Last session: 2026-04-22T17:13:27.619Z
Stopped at: Completed Phase 41 Plan 02: UI sweep — client list reshape, formatPhone wiring, preferredContact purge
Resume file: None
Next action: `/gsd-plan-phase 41`
