# Requirements: Linha (La Sprezzatura v5.0)

**Defined:** 2026-04-08
**Core Value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work

## v5.0 Requirements

Requirements for Admin Platform Completion. Each maps to roadmap phases.

### Platform Foundation

- [ ] **PLAT-01**: Tenant model exists with designer name, Sanity dataset ID, domain config, and feature flags
- [ ] **PLAT-02**: Tenant context is resolved on every request and flows through all data queries and API routes
- [ ] **PLAT-03**: Admin auth resolves to a specific tenant — all data access scoped to that tenant's Sanity dataset
- [ ] **PLAT-04**: Site settings, rendering limits, and branding are per-tenant
- [ ] **PLAT-05**: No hardcoded single-tenant assumptions in components, queries, or API routes

### Dashboard

- [ ] **DASH-01**: Admin sees a dashboard on login with active projects showing current stage and days-in-stage
- [ ] **DASH-02**: Dashboard shows upcoming and overdue milestones across all projects with date badges
- [ ] **DASH-03**: Dashboard shows active deliveries with tracking status pills and ETAs
- [ ] **DASH-04**: Dashboard shows overdue alert banner summarizing overdue milestones and tasks across projects
- [ ] **DASH-05**: Dashboard shows recent activity feed with timestamps and actor
- [ ] **DASH-06**: Dashboard shows tasks section with checkboxes, filterable by project

### Task Management

- [ ] **TASK-01**: Admin can create tasks on a project with description and optional due date
- [ ] **TASK-02**: Admin can check off tasks as complete from both dashboard and project detail
- [ ] **TASK-03**: Overdue tasks are highlighted in red on dashboard and project detail

### Procurement Editor

- [ ] **PROC-01**: Admin can add, edit, and remove procurement items on a project
- [ ] **PROC-02**: Each item shows a status dropdown badge with 6-stage pipeline (Pending > Ordered > Warehouse > In Transit > Delivered > Installed)
- [ ] **PROC-03**: Overdue items (past expected delivery, not delivered/installed) highlighted in red
- [ ] **PROC-04**: Tracking numbers link to carrier tracking pages with auto-detected carrier
- [ ] **PROC-05**: Daily cron job auto-checks tracking status via aggregator API and updates Sanity
- [ ] **PROC-06**: Auto-updated statuses visually distinguished from manually-set statuses
- [ ] **PROC-07**: Admin can force-refresh tracking status on demand
- [ ] **PROC-08**: Carrier-provided ETA displayed alongside the anticipated (expected delivery) date
- [ ] **PROC-09**: Net price computed and displayed at render time (never stored)

### Client + Contractor CRUD

- [ ] **CRUD-01**: Admin can view a list of all clients, searchable by name
- [ ] **CRUD-02**: Admin can create and edit client records (name, email, phone, address, preferred contact method)
- [ ] **CRUD-03**: Admin can view a list of all contractors, filterable by trade
- [ ] **CRUD-04**: Admin can create and edit contractor records (name, email, phone, company, trades)
- [ ] **CRUD-05**: Client and contractor detail pages show linked projects
- [ ] **CRUD-06**: Deleting a client or contractor is blocked if they have project references
- [ ] **CRUD-07**: Admin can quick-assign a client or contractor to a project via typeahead
- [ ] **CRUD-08**: Hovering a client or contractor name shows a contact card popover
- [ ] **CRUD-09**: Client records have an internal notes field for private observations

### Portfolio Management

- [ ] **FOLIO-01**: Admin can view all completed projects in a Portfolio section
- [ ] **FOLIO-02**: Admin can toggle which completed projects appear on the public portfolio page
- [ ] **FOLIO-03**: Admin can edit portfolio-specific fields (featured image, description, room tags)
- [ ] **FOLIO-04**: Admin can reorder the display order of portfolio projects

### Rendering Tool Relocation

- [ ] **RNDR-01**: Rendering session list accessible in admin with project filtering
- [ ] **RNDR-02**: New session wizard (Setup, Upload, Classify, Describe) works in admin
- [ ] **RNDR-03**: Chat refinement view for multi-turn iteration works in admin
- [ ] **RNDR-04**: Promote to Design Options workflow works from admin
- [ ] **RNDR-05**: Usage tracking badge shows monthly count and limit
- [ ] **RNDR-06**: Wizard steps are navigable (click completed steps to jump back)
- [ ] **RNDR-07**: Uploaded images show thumbnail previews
- [ ] **RNDR-08**: Long filenames truncated with ellipsis
- [ ] **RNDR-09**: Multiple images can be uploaded at once
- [ ] **RNDR-10**: Style preset and design vision fields clarified/merged
- [ ] **RNDR-11**: AI rendering generation and refinement produce correct results (regression test)

### Settings + Studio Retirement

- [ ] **SETT-01**: Admin can edit site settings (title, tagline, contact info, social links)
- [ ] **SETT-02**: Admin can manage hero slideshow images (add, remove, reorder with alt text)
- [ ] **SETT-03**: Admin can configure rendering settings (monthly limit, image type options)
- [ ] **SETT-04**: Send Update email flow works from admin (compose, send, delivery log)
- [ ] **SETT-05**: Email template preview shows exactly what client will receive before sending
- [ ] **SETT-06**: Settings changes are logged with timestamp
- [ ] **SETT-07**: Sanity Studio shows deprecation banner directing to admin app — **superseded** — see Phase 34 CONTEXT.md § Requirements reinterpretation
- [ ] **SETT-08**: Studio route removed after 30-day deprecation period — **satisfied** by immediate studioBasePath drop per D-01 (see Phase 34 CONTEXT.md § Requirements reinterpretation)

## Future Requirements

Deferred to v6.0+ or later.

### Linha Platform (v6.0)

- **LINHA-01**: Turborepo monorepo with packages/core, packages/portal, packages/rendering, templates/
- **LINHA-02**: La Sprezzatura migrated as reserved template
- **LINHA-03**: 3-5 public designer templates (Aria, Forma, Verra)
- **LINHA-04**: Self-service onboarding wizard (Sanity dataset, Vercel project, domain, billing)
- **LINHA-05**: Central admin dashboard at linha.com for managing all designers

### Deferred Features

- **DEF-01**: Gantt drag-and-drop rescheduling with Sanity field sync
- **DEF-02**: Gantt appointment sub-markers, overlap highlighting, procurement lifecycle bars
- **DEF-03**: DNS cutover and go-live — all 4 domains to Cloudflare
- **DEF-04**: AI rendering quality improvements

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full CRM pipeline (lead scoring, deal stages) | This is project management, not sales software. Use project pipelineStage. |
| Vendor portal / vendor login | No need — Liz communicates with vendors directly |
| Full purchase order generation | QuickBooks handles invoicing and financials |
| Budget rollup / financial reporting | QuickBooks is the financial system |
| Automated carrier tracking polling | Daily cron + force refresh is sufficient; real-time polling adds cost and complexity |
| Client self-service profile editing | Admin-only CRUD; portal is read-only for client data |
| Real-time collaborative rendering | Single designer (Liz); no multi-user need |
| Theme customization | Bespoke design identity; theme pickers belong in v6.0 Linha |
| Plugin/extension system | Purpose-built tool, not a platform yet; extract patterns in v6.0 |
| Multi-user role-based admin | Only Liz and Paul need admin access |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 29 | Pending |
| PLAT-02 | Phase 29 | Pending |
| PLAT-03 | Phase 29 | Pending |
| PLAT-04 | Phase 29 | Pending |
| PLAT-05 | Phase 29 | Pending |
| DASH-01 | Phase 30 | Pending |
| DASH-02 | Phase 30 | Pending |
| DASH-03 | Phase 30 | Pending |
| DASH-04 | Phase 30 | Pending |
| DASH-05 | Phase 30 | Pending |
| DASH-06 | Phase 30 | Pending |
| TASK-01 | Phase 30 | Pending |
| TASK-02 | Phase 30 | Pending |
| TASK-03 | Phase 30 | Pending |
| PROC-01 | Phase 32 | Pending |
| PROC-02 | Phase 32 | Pending |
| PROC-03 | Phase 32 | Pending |
| PROC-04 | Phase 32 | Pending |
| PROC-05 | Phase 32 | Pending |
| PROC-06 | Phase 32 | Pending |
| PROC-07 | Phase 32 | Pending |
| PROC-08 | Phase 32 | Pending |
| PROC-09 | Phase 32 | Pending |
| CRUD-01 | Phase 31 | Pending |
| CRUD-02 | Phase 31 | Pending |
| CRUD-03 | Phase 31 | Pending |
| CRUD-04 | Phase 31 | Pending |
| CRUD-05 | Phase 31 | Pending |
| CRUD-06 | Phase 31 | Pending |
| CRUD-07 | Phase 31 | Pending |
| CRUD-08 | Phase 31 | Pending |
| CRUD-09 | Phase 31 | Pending |
| FOLIO-01 | Phase 31 | Pending |
| FOLIO-02 | Phase 31 | Pending |
| FOLIO-03 | Phase 31 | Pending |
| FOLIO-04 | Phase 31 | Pending |
| RNDR-01 | Phase 33 | Pending |
| RNDR-02 | Phase 33 | Pending |
| RNDR-03 | Phase 33 | Pending |
| RNDR-04 | Phase 33 | Pending |
| RNDR-05 | Phase 33 | Pending |
| RNDR-06 | Phase 33 | Pending |
| RNDR-07 | Phase 33 | Pending |
| RNDR-08 | Phase 33 | Pending |
| RNDR-09 | Phase 33 | Pending |
| RNDR-10 | Phase 33 | Pending |
| RNDR-11 | Phase 33 | Pending |
| SETT-01 | Phase 34 | Pending |
| SETT-02 | Phase 34 | Pending |
| SETT-03 | Phase 34 | Pending |
| SETT-04 | Phase 34 | Pending |
| SETT-05 | Phase 34 | Pending |
| SETT-06 | Phase 34 | Pending |
| SETT-07 | Phase 34 | Superseded (see CONTEXT.md reinterpretation) |
| SETT-08 | Phase 34 | Satisfied via D-01 (immediate removal) |

**Coverage:**
- v5.0 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after v5.0 completion roadmap created*
