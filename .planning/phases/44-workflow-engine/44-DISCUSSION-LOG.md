# Phase 44: Workflow Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-23
**Phase:** 44-workflow-engine
**Areas discussed:** Phase scope, Sanity schema design, Template editor location, Open spec questions

---

## Phase Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full engine (all 4 layers) | Templates, schema, engine, and tracker UI all ship in Phase 44 | ✓ |
| Foundation first, tracker second | Phase 44 = Templates + schema + instantiation; Phase 45 = engine + tracker | |
| Tracker-first | Phase 44 = manual status tracker; Phase 45 = engine rules + templates | |

**User's choice:** Full engine (all 4 layers)
**Notes:** Layers are tightly coupled — partial delivery isn't usable.

---

## Sanity Schema Design

### Template storage location

| Option | Description | Selected |
|--------|-------------|----------|
| Separate Sanity document type | workflowTemplate as its own document type | ✓ |
| Embedded in siteSettings | workflowTemplates[] inside siteSettings singleton | |
| JSON blob in siteSettings | Raw JSON string stored in siteSettings | |

**User's choice:** Separate Sanity document type

### Project workflow instance connection

| Option | Description | Selected |
|--------|-------------|----------|
| Separate document, projectId field | projectWorkflow doc with projectId reference | ✓ |
| Embedded reference on project | project document gains a workflowInstance reference | |
| Inline array on project | All workflow state embedded in project document | |

**User's choice:** Separate document, projectId field
**Notes:** Same pattern as workOrder from Phase 39.

### Frappe Gantt fate

| Option | Description | Selected |
|--------|-------------|----------|
| Retire immediately | schedule.astro replaced, Frappe dependencies removed | ✓ |
| Keep alongside, add new route | New /workflow route, old /schedule stays | |
| Redirect old route to new | Old route redirects to new tracker | |

**User's choice:** Retire immediately

---

## Template Editor Location

### Editor location

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated admin route | Template list in Settings → full editor at /admin/settings/workflow-templates/[id] | ✓ |
| Full-screen modal from Settings | Template list in Settings → full-screen modal editor | |
| Inline in Settings page | Deeply nested editing within Settings CollapsibleSection | |

**User's choice:** Dedicated admin route

### Reorder mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Up/down arrows | Consistent with existing codebase patterns | ✓ |
| Drag and drop | Requires drag library; no existing pattern except PortfolioArrange | |

**User's choice:** Up/down arrows

### Template seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Seed via one-time script | Full-service residential, Design consultation, Staging seeded at deploy | ✓ |
| Manual — Liz builds it | Empty UI on launch | |
| Seed as initialValues in schema | Sanity schema initialValues (only pre-fills new docs) | |

**User's choice:** Seed all 3 templates via one-time script

---

## Open Spec Questions

### Notifications

| Option | Description | Selected |
|--------|-------------|----------|
| UI warnings only in Phase 44 | Warning bar in tracker; no email notifications | ✓ |
| In-app + email both now | Resend email for dormancy/approval timeout in Phase 44 | |
| Background cron only | Vercel cron sends email; no UI warnings | |

**User's choice:** UI warnings only in Phase 44

### Client portal

| Option | Description | Selected |
|--------|-------------|----------|
| No — defer to later phase | Admin-only in Phase 44 | ✓ |
| Yes — read-only tracker in portal | /portal/client/[token]/workflow in Phase 44 | |

**User's choice:** Deferred

### Spec §10 items in scope

| Option | Description | Selected |
|--------|-------------|----------|
| None — defer all others | Time tracking, addendum, versioning, reporting all deferred | |
| Template versioning diff view | Changelog between template versions | |
| Reporting view | Cross-project workflow summary | ✓ |

**User's choice:** Reporting view (as dashboard card summary)

### Reporting format

| Option | Description | Selected |
|--------|-------------|----------|
| Dashboard card summary | New card on /admin dashboard with workflow status counts | ✓ |
| Dedicated /admin/workflow page | Separate admin route with sortable project list | |
| Inline in project list | Workflow status columns added to existing /admin/projects | |

**User's choice:** Dashboard card summary

### Instantiation trigger

| Option | Description | Selected |
|--------|-------------|----------|
| "Start workflow" button on project detail | On-demand; projects can exist without a workflow | ✓ |
| Required during project creation | Every project must have a workflow type from creation | |
| Auto-assign from engagement type | Template assigned based on engagementType field | |

**User's choice:** "Start workflow" button on project detail

### Tracker placement

| Option | Description | Selected |
|--------|-------------|----------|
| Replaces Schedule tab | Same /admin/projects/[id]/schedule route, Gantt retired | ✓ |
| New Workflow tab alongside Schedule | Two tabs during transition | |

**User's choice:** Replaces Schedule tab

### Seed scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full-service residential only | Primary template only | |
| All 3 templates | Full-service residential + Design consultation + Staging | ✓ |

**User's choice:** All 3 templates

### Status advancement

| Option | Description | Selected |
|--------|-------------|----------|
| Click to open status picker popover | All status options shown; engine validates before allowing | ✓ |
| Click to step forward | Linear progression only | |
| Right-click context menu | Non-obvious UX | |

**User's choice:** Click to open status picker popover

---

## Claude's Discretion

- Template editor page layout (two-pane vs. single-column)
- Assignee dot color system in tracker
- Status picker popover dismiss behavior
- Dashboard workflow card empty state (no active workflows yet)

## Deferred Ideas

- Email notifications for dormancy and approval timeout
- Client portal workflow view
- Template versioning diff/changelog
- Time tracking per milestone (hourly billing)
- Addendum workflow for scope changes
- Full cross-project reporting beyond dashboard card
- Dormancy cron job for proactive detection
