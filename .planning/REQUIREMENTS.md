# Requirements: La Sprezzatura — v5.1 Admin UX Polish & Workflow Additions

**Defined:** 2026-04-14
**Core Value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work — extended in v5.1 to make the admin app feel as polished as the public site.

## v5.1 Requirements

### Dashboard Polish (DASH)

- [ ] **DASH-10**: Remove relative-time status badges ("8d", "1w", etc.) from admin UI where they add noise without actionable signal
- [ ] **DASH-11**: Rename the Dashboard "Deliveries" card to "Upcoming Deliveries"
- [ ] **DASH-12**: Upcoming Deliveries card shows only undelivered items by default, with a link to expand delivered history
- [ ] **DASH-13**: Upcoming Deliveries row renders client name, item, and project in that order of visual prominence
- [ ] **DASH-14**: Carrier ETA is shown only when Ship24 returns a tracked carrier (FedEx / UPS / USPS); hidden otherwise
- [ ] **DASH-15**: Upcoming Deliveries card top band has a free-text filter input that filters the visible rows
- [ ] **DASH-16**: Projects card top band has a free-text filter input that filters the visible projects
- [ ] **DASH-17**: "Add new contractor" button on the Dashboard Contractor card opens the create-contractor flow and successfully creates a contractor
- [ ] **DASH-18**: Contractor quick-assign skips the trade prompt when the selected contractor has only one trade
- [ ] **DASH-19**: All user-facing trade labels render in sentence case human-friendly form (no slug / all-caps identifiers)
- [ ] **DASH-20**: Tasks card on dashboard and project detail has a visible "Add task" button
- [ ] **DASH-21**: Tasks card hides completed tasks by default, exposes a link to reveal them, and resets to hidden on page reload
- [ ] **DASH-22**: Client Tasks card hides completed tasks by default, exposes a link to reveal them, and resets to hidden on page reload

### Projects List & Archive (PROJ)

- [x] **PROJ-01**: Projects list shows a subtle horizontal divider above the completed-projects section
- [x] **PROJ-02**: Completed projects render with a dulled / muted visual treatment distinct from active projects
- [x] **PROJ-03**: User can manually archive a completed project from its detail page
- [x] **PROJ-04**: Completed projects auto-archive 90 days after their completion date
- [x] **PROJ-05**: "View archived projects" link opens a view that lists archived projects in read-only form

### Procurement Privacy & Modal (PROC)

- [x] **PROC-10**: Clicking a procurement row opens a modal that displays every field of that item in read mode
- [x] **PROC-11**: Procurement modal has an explicit Edit action that transitions the modal into editable mode
- [x] **PROC-12**: All price, cost, and profit fields are removed from the procurement UI (unit cost, retail, net, profit, markup)
- [x] **PROC-13**: "Delivery" column and field label are renamed to "Expected install date" throughout the procurement editor
- [x] **PROC-14**: User can upload multiple images to a single procurement item

### Work Order Panel (WORK)

- [x] **WORK-01**: Project detail page has a "Work Order" panel alongside existing panels
- [x] **WORK-02**: "Create work order" action lets the user select N procurement items from the project to include on the work order
- [x] **WORK-03**: Work order supports adding custom fields beyond the linked procurement items
- [x] **WORK-04**: Work order supports a free-text "special instructions" section
- [x] **WORK-05**: Work order can be sent as an email from office@lasprezz.com with liz@lasprezz.com on cc

### Documents Panel (DOCS)

- [x] **DOCS-01**: Project detail page has a "Documents" panel alongside existing panels
- [x] **DOCS-02**: User can upload contracts, addenda, and other documents (PDF and image) to a project
- [x] **DOCS-03**: User can list, preview, and delete uploaded project documents

### Send Update Sender Config (SETT)

- [x] **SETT-10**: Settings stores the default "from" address for Send Update (default: office@lasprezz.com)
- [x] **SETT-11**: Settings stores the default "cc" address for Send Update (default: liz@lasprezz.com)
- [x] **SETT-12**: Send Update composes and sends emails using the sender values configured in Settings

### Contractors / Vendors (VEND)

- [ ] **VEND-01**: "Contractor" is renamed to "Contractor / Vendor" across admin UI labels, headers, and nav
- [ ] **VEND-02**: Trade column renders as distinct pill(s) in sentence case on the contractor list
- [ ] **VEND-03**: Admin can create, rename, and delete trade names from a trades manager UI
- [ ] **VEND-04**: Contractor / Vendor record includes physical address fields (street, city, state, zip)
- [ ] **VEND-05**: Contractor / Vendor record supports uploading a 1099 document with a clearly-designated 1099 badge

### Clients (CLNT)

- [ ] **CLNT-10**: Phone numbers render in a single consistent format across clients, contractors, and popovers
- [ ] **CLNT-11**: Client record includes physical address fields (street, city, state, zip)
- [ ] **CLNT-12**: Clients list columns are: name, address, email, phone (replaces current columns)
- [ ] **CLNT-13**: "Preferred contact" field is removed from client schema and UI

## v5.2 Requirements (Deferred — Needs Brainstorming)

### Schedule Rebuild (SCHED-NG)

- **SCHED-NG-01**: Retire Frappe Gantt from the admin Schedule view
- **SCHED-NG-02**: Replace with a configurable designer workflow template that reflects Liz's structured phase sequence
- **SCHED-NG-03**: Template is editable / overridable per project

*These require a brainstorming session before scoping to phases.*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Price / profit tracking in admin | Handled in QuickBooks; client-shoulder privacy risk |
| Preferred contact field on clients | Liz contacts clients as she pleases; field adds noise |
| Relative-time age badges ("8d", "1w") | Low signal, high visual noise per Liz's feedback |
| Multi-tenant API migration for Phase 34 endpoints | Tech debt; deferred to v6.0 Linha extraction |
| Phase 16-17 Gantt enhancements | Superseded by v5.2 Schedule Rebuild |
| Frappe Gantt drag-and-drop write-back | Superseded by v5.2 template approach |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-10 | Phase 35 | Pending |
| DASH-11 | Phase 35 | Pending |
| DASH-12 | Phase 35 | Pending |
| DASH-13 | Phase 35 | Pending |
| DASH-14 | Phase 35 | Pending |
| DASH-15 | Phase 35 | Pending |
| DASH-16 | Phase 35 | Pending |
| DASH-17 | Phase 35 | Pending |
| DASH-18 | Phase 35 | Pending |
| DASH-19 | Phase 35 | Pending |
| DASH-20 | Phase 35 | Pending |
| DASH-21 | Phase 35 | Pending |
| DASH-22 | Phase 35 | Pending |
| PROJ-01 | Phase 36 | Complete |
| PROJ-02 | Phase 36 | Complete |
| PROJ-03 | Phase 36 | Complete |
| PROJ-04 | Phase 36 | Complete |
| PROJ-05 | Phase 36 | Complete |
| PROC-10 | Phase 37 | Complete |
| PROC-11 | Phase 37 | Complete |
| PROC-12 | Phase 37 | Complete |
| PROC-13 | Phase 37 | Complete |
| PROC-14 | Phase 37 | Complete |
| SETT-10 | Phase 38 | Complete |
| SETT-11 | Phase 38 | Complete |
| SETT-12 | Phase 38 | Complete |
| WORK-01 | Phase 39 | Complete |
| WORK-02 | Phase 39 | Complete |
| WORK-03 | Phase 39 | Complete |
| WORK-04 | Phase 39 | Complete |
| WORK-05 | Phase 39 | Complete |
| DOCS-01 | Phase 39 | Complete |
| DOCS-02 | Phase 39 | Complete |
| DOCS-03 | Phase 39 | Complete |
| VEND-01 | Phase 40 | Pending |
| VEND-02 | Phase 40 | Pending |
| VEND-03 | Phase 40 | Pending |
| VEND-04 | Phase 40 | Pending |
| VEND-05 | Phase 40 | Pending |
| CLNT-10 | Phase 41 | Pending |
| CLNT-11 | Phase 41 | Pending |
| CLNT-12 | Phase 41 | Pending |
| CLNT-13 | Phase 41 | Pending |

**Coverage:**
- v5.1 requirements: 43 total
- Mapped to phases: 43 ✓
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 — v5.1 phase mappings written (Phases 35-41)*
