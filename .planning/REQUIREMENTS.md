# Requirements: La Sprezzatura — v5.2 Trades Directory

**Defined:** 2026-04-22
**Core Value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work — extended in v5.2 to make the Trades entity a first-class, relationship-aware record with configurable document checklists.

## v5.2 Requirements

### Client Refinements (CLNT — carryover from v5.1 Phase 41)

- [x] **CLNT-10
**: Phone numbers render in a single consistent format across the client list, contractor list, popovers, and detail views
- [x] **CLNT-11
**: Client record includes physical address fields (street, city, state, zip)
- [x] **CLNT-12
**: Clients list columns are: name, address, email, phone (replaces current columns)
- [x] **CLNT-13
**: "Preferred contact" field is removed from both the client schema and the UI

### Trades Entity & Routing (TRAD)

- [ ] **TRAD-01**: `/admin/trades` route replaces `/admin/contractors`; all URLs, nav links, and breadcrumbs are updated throughout the admin app and portal
- [ ] **TRAD-02**: Each Trades record has a `relationship` field with two values: `contractor` or `vendor`
- [ ] **TRAD-03**: The entity display name renders as "Contractor" or "Vendor" (not "Contractor / Vendor") based on the record's relationship field — applied consistently in list view, detail view, popovers, nav, and work order context
- [ ] **TRAD-04**: Trades list view shows a completeness indicator (e.g., amber dot) on any record where required fields or required documents are missing
- [ ] **TRAD-05**: Trades detail page shows a meta line directly below the name: primary trade · relationship type · city, state

### Document Checklists (TRAD)

- [ ] **TRAD-06**: Trades detail page shows a document checklist scoped to the record's relationship type — contractor checklist: W-9, certificate of insurance, trade license, 1099; vendor checklist: vendor agreement, tax form
- [ ] **TRAD-07**: The existing 1099 document slot from Phase 40 is unified into the contractor document checklist as a checklist item; no standalone 1099 section remains on the detail page
- [ ] **TRAD-08**: Checklist item types are configurable from Settings per relationship type (add, rename); a checklist item type cannot be removed while any Trades records have a document uploaded for that type

## Future Requirements (Deferred)

### Schedule Rebuild (SCHED-NG — previously v5.2, now displaced)

- **SCHED-NG-01**: Retire Frappe Gantt from the admin Schedule view
- **SCHED-NG-02**: Replace with a configurable designer workflow template reflecting Liz's structured phase sequence
- **SCHED-NG-03**: Template is editable / overridable per project

*These require a dedicated brainstorming session before scoping to phases.*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Work Order routing by relationship type | Work orders currently serve all trade contacts; scoping to contractor-only is a separate UX change with portal implications — defer to v5.3 or as needed |
| Checklist items imported from existing 1099 docs retroactively | Migration complexity without clear user value; Liz can re-upload if needed |
| Multi-tenant checklist templates | Single-tenant deployment; extraction deferred to v6.0 Linha |
| Phase 16-17 Gantt enhancements | Superseded; Schedule Rebuild deferred past v5.2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLNT-10 | Phase 41 | Pending |
| CLNT-11 | Phase 41 | Pending |
| CLNT-12 | Phase 41 | Pending |
| CLNT-13 | Phase 41 | Pending |
| TRAD-01 | Phase 42 | Pending |
| TRAD-02 | Phase 42 | Pending |
| TRAD-03 | Phase 42 | Pending |
| TRAD-05 | Phase 42 | Pending |
| TRAD-07 | Phase 42 | Pending |
| TRAD-04 | Phase 43 | Pending |
| TRAD-06 | Phase 43 | Pending |
| TRAD-08 | Phase 43 | Pending |

**Coverage:**
- v5.2 requirements: 12 total
- Phase 41: 4 (CLNT-10..13)
- Phase 42: 5 (TRAD-01, TRAD-02, TRAD-03, TRAD-05, TRAD-07)
- Phase 43: 3 (TRAD-04, TRAD-06, TRAD-08)
- Unmapped: 0

---
*Requirements defined: 2026-04-22*
*Last updated: 2026-04-22 — Traceability filled; all 12 requirements mapped to phases 41-43*
