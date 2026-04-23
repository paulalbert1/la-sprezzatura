---
gsd_state_version: 1.0
milestone: v5.2
milestone_name: Trades Directory
status: planning
stopped_at: Phase 43 context gathered
last_updated: "2026-04-23T14:15:09.541Z"
last_activity: 2026-04-23
progress:
  total_phases: 10
  completed_phases: 8
  total_plans: 27
  completed_plans: 27
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work
**Current focus:** Phase --phase — 42

## Current Position

Phase: 43
Plan: Not started
Status: Ready to plan
Last activity: 2026-04-23

Progress: [██████████] 100%

## v5.2 Phase Map

| Phase | Name | Reqs | Plans (est.) | Status |
|-------|------|------|--------------|--------|
| 41 | Client Data Model Refinements (carryover from v5.1) | 4 | 2-3 | Not started |
| 42 | Trades Entity — Routes, Schema, and Display | 5 | 2 | Ready to execute |
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
- Phase 42 Plan 01: Sanity _type stays 'contractor'; relationship field (required, radio) carries the UI-facing meaning per D-01
- Phase 42 Plan 01: PATCH update uses hasOwnProperty on body to distinguish omitted key (leave alone) vs. explicit null (clear to null) vs. string (trim+set)
- Phase 42 Plan 01: relationshipLabel() helper is case-sensitive by design — only canonical 'vendor' slug returns 'Vendor'; null/undefined/other → 'Contractor' per D-04
- Phase 42 Plan 01: siteSettings.contractorChecklistItems[] and vendorChecklistItems[] are schema-only in Phase 42 per D-09 — rendered by Phase 43 checklist UI
- Phase 42 Plan 02: /admin/contractors hard-renamed to /admin/trades (no redirect per D-02); old path now 404s natively.
- Phase 42 Plan 02: Relationship field renders as a 2-card radio group, not a dropdown. Rationale: 2 mutually-exclusive options semantically heavy enough (drives checklist + label) to warrant both being visible.
- Phase 42 Plan 02: EntityListPage primary CTA keeps 'New Contractor / Vendor' collective label per UI-SPEC — the ambiguous label is intentional at the CTA; the form forces the choice via the required radio group.
- Phase 42 Plan 02: projectContractors GROQ projection extended with relationship so chip popovers on the project detail page show the correct Contractor|Vendor label (Rule 2 correctness addition beyond plan scope).

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

Last session: --stopped-at
Stopped at: Phase 43 context gathered
Resume file: --resume-file
Next action: `/gsd-plan-phase 41`
