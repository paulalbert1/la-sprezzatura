# Requirements: La Sprezzatura

**Defined:** 2026-04-05
**Core Value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work

## v4.2 Requirements

Requirements for Procurement Management milestone. Each maps to roadmap phases.

### Schema

- [ ] **PROC-01**: Procurement item has manufacturer, quantity, and notes fields alongside existing fields
- [ ] **PROC-02**: Net price is computed at render time from retailPrice and clientCost (not stored)
- [ ] **PROC-03**: Procurement item supports multiple named file attachments via BlobFileInput

### Studio List UI

- [ ] **LIST-01**: Procurement items display as a custom list with status badge, dates, and tracking link
- [ ] **LIST-02**: Status badge is a colored dropdown with 5-stage pipeline (Ordered → In-transit → Warehouse → Delivered → Installed)
- [ ] **LIST-03**: Overdue items show expected delivery date in red when past due
- [ ] **LIST-04**: Tracking links render as gray monospace metadata with hover darken
- [ ] **LIST-05**: Items are drag-reorderable with visible drag handles
- [ ] **LIST-06**: Three-dot overflow menu on each item

### Edit Pane

- [ ] **EDIT-01**: Full edit dialog with all procurement fields (name, manufacturer, qty, prices, dates, status, tracking, files, notes)
- [ ] **EDIT-02**: Gray background overlay CSS fix for edit pane dialog

### Portal Integration

- [ ] **PORT-01**: Client portal procurement table reflects updated schema fields
- [ ] **PORT-02**: Send Update email includes procurement summary section

## Previous Milestones

### v4.1 — Studio UI Polish (Completed)

- ✓ **THEME-01–05**: Studio theme consistency — Phase 18
- ✓ **GANTT-01–04**: Gantt chart polish — Phase 19
- ✓ **LAYOUT-01–02**: Layout reliability — Phase 18–19
- ✓ **PORT-01–05**: Portfolio project type — Phase 20

## Future Requirements

### Gantt Enhancements (deferred from v4.0)

- **GANTT-D01**: Drag-and-drop rescheduling with Sanity field sync
- **GANTT-D02**: Hover tooltips showing task dates and dependency details
- **GANTT-D03**: Sticky date header when scrolling vertically

## Out of Scope

| Feature | Reason |
|---------|--------|
| Purchase order generation | Accounting territory — QuickBooks handles PO/invoice workflows |
| Vendor payment tracking | QuickBooks integration, not project management |
| Product catalog / library | Over-engineering for Liz's volume; items are per-project |
| Room/location grouping in list | Flat list sufficient for v4.2; defer grouped UI unless requested |
| Inventory management | Not relevant — procurement is project-scoped, not warehouse-scoped |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROC-01 | TBD | Pending |
| PROC-02 | TBD | Pending |
| PROC-03 | TBD | Pending |
| LIST-01 | TBD | Pending |
| LIST-02 | TBD | Pending |
| LIST-03 | TBD | Pending |
| LIST-04 | TBD | Pending |
| LIST-05 | TBD | Pending |
| LIST-06 | TBD | Pending |
| EDIT-01 | TBD | Pending |
| EDIT-02 | TBD | Pending |
| PORT-01 | TBD | Pending |
| PORT-02 | TBD | Pending |

**Coverage:**
- v4.2 requirements: 13 total
- Mapped to phases: 0
- Unmapped: 13 ⚠️

---
*Requirements defined: 2026-04-05*
*Last updated: 2026-04-05 after milestone v4.2 initialization*
