# Phase 44: Workflow Engine - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Frappe Gantt chart with a three-layer workflow system. All four layers ship in Phase 44:

1. **Templates** — designer-defined in Settings; card grid list + dedicated full-screen editor at `/admin/settings/workflow-templates/[id]`
2. **Data schema** — `workflowTemplate` and `projectWorkflow` as separate Sanity document types
3. **Engine** — prerequisite checking, gate enforcement, dormancy detection, client approval timeout
4. **Project tracker UI** — replaces `ScheduleEditor.tsx` at `/admin/projects/[id]/schedule`

Plus: Dashboard workflow summary card and a seeding script for 3 starter templates.

Requirements: WF-01 through WF-08 (see ROADMAP.md §Phase 44).

</domain>

<decisions>
## Implementation Decisions

### Phase Scope
- **D-01:** All four layers ship in one phase. The layers are tightly coupled — partial delivery is not usable. Estimated 8–12 plans.

### Data Model
- **D-02:** `workflowTemplate` is a **separate Sanity document type** (not embedded in siteSettings). Template CRUD is fully independent of the siteSettings save flow.
- **D-03:** `projectWorkflow` is a **separate Sanity document type** with a `projectId` reference field — architecturally identical to the workOrder pattern from Phase 39. Project documents do NOT gain a reference back to projectWorkflow.
- **D-04:** Frappe Gantt and `ScheduleEditor.tsx` are **retired immediately**. All frappe-gantt npm dependencies removed.
- **D-05:** The `/admin/projects/[id]/schedule` route is **reused** — schedule.astro is gutted and replaced with a `WorkflowTracker` component. Route path is preserved.

### Template Management in Settings
- **D-06:** Settings page gains a `"Workflow Templates"` CollapsibleSection showing a card grid (template name + workflow type + phase/milestone counts). Clicking a card navigates to `/admin/settings/workflow-templates/[id]`. A `[+ New template]` action creates a new template document and navigates to its editor.
- **D-07:** Full template editor lives at `/admin/settings/workflow-templates/[id]` — a dedicated admin page with phases list, milestone forms, gate pickers, prerequisite selectors, and execution mode toggle.
- **D-08:** Phase and milestone reordering uses **up/down arrow buttons** (no drag library). Consistent with spec §4.4 ("or up/down arrows") and the existing codebase (no drag pattern outside PortfolioArrange's vanilla JS).
- **D-09:** Three starter templates are **seeded by a one-time script** (run at deploy time or via an Astro action): Full-service residential (spec §5), Design consultation (spec §6), and Staging (spec §6). Script is idempotent — skips if templates already exist.

### Instantiation Flow
- **D-10:** Workflow is started **on demand** via a "Start workflow" button on the project's tracker page (the blank state before any workflow exists). Liz selects a template type from a dropdown and the engine instantiates it. Projects can exist without a workflow indefinitely.
- **D-11:** Instantiation logic: engine clones the template at its current `version` number, pre-populates `ContractorInstance[]` entries from `defaultInstances` on all `multiInstance: true` milestones (`fromTemplate: true`, `status: "not_started"`), sets all other milestones to `not_started`. Opens directly in the tracker view.

### Engine & Tracker UI
- **D-12:** Milestone status advancement: clicking a status circle opens a **status picker popover** with available options (not_started → in_progress → awaiting_client → awaiting_payment → complete → skipped). Engine validates gate requirements and hard prereqs before allowing the transition. Blocked milestones show a gray circle that cannot be clicked; tooltip shows which prereq is unmet.
- **D-13:** Dormancy warnings and client approval timeout warnings appear in the **project tracker UI only** (warning bar per spec §7.3). No email notifications in Phase 44 — email is a future phase.
- **D-14:** The `lastActivityAt` field on `ProjectWorkflow` is updated server-side on every milestone status change. Dormancy detection reads this field.
- **D-15:** `ProjectWorkflow.status` transitions to `"dormant"` when `Date.now() - lastActivityAt > dormancyDays * 86400000`. Evaluated on tracker page load (server-side) and updated via API if state has changed. No separate cron for dormancy in Phase 44 — evaluated lazily on load.

### Reporting
- **D-16:** New **"Workflow Status" dashboard card** on the admin dashboard (`/admin`). Shows: count of projects in `awaiting_client` state, count approaching dormancy (e.g., 45+ of 60 dormancy days), count with blocked milestones. Each count is a link to the relevant project's tracker.

### Claude's Discretion
- Exact layout of the template editor page (two-pane vs. single-column)
- Color coding for assignee type dots in the tracker (spec §7.4 says "color-coded dot" — choose appropriate colors matching the admin design system)
- How the status picker popover is dismissed (click away, explicit close button)
- Whether the Dashboard workflow card collapses when there are no active workflows yet

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary Spec
- `/Users/paulalbert/Downloads/workflow-engine-spec.md` — **MUST read in full.** Contains: data model §2 (TypeScript interfaces for all types), engine rules §3 (advancement logic, multi-instance aggregation, dormancy, approval timeout, optional milestones), template management UI §4, Liz's full-service residential template §5 (6 phases, 24+ milestones with gates and multi-instance entries), additional template examples §6 (Design consultation + Staging), project tracker UI spec §7 (header, metrics, warnings, phase list, multi-instance display), instantiation flow §8, contract-derived rule defaults §9.

### UI Reference
- `/Users/paulalbert/Downloads/project_tracker_koenig.html` — HTML/CSS mockup of the project tracker view. Must reference for component layout, status circles, warning bar, metric cards, phase accordion, multi-instance sub-rows, and pill color system.

### Settings Patterns (read before building template management)
- `src/components/admin/settings/SettingsPage.tsx` — where "Workflow Templates" CollapsibleSection is added; owns the settings page layout and save flow
- `src/components/admin/ChecklistConfigSection.tsx` — closest pattern for Settings-integrated list management (add/rename/delete). Template list card in Settings is similar but navigates to sub-route instead of inline editing.
- `src/components/admin/ui/CollapsibleSection.tsx` — wraps each Settings subsection

### Work Order Pattern (D-03 — projectWorkflow mirrors this)
- `src/pages/api/admin/work-orders/` — how separate-document-with-projectId is implemented in APIs
- `src/sanity/schemas/workOrder.ts` — reference for how a separate Sanity document type connects to a project by projectId

### Files Being Replaced / Retired
- `src/components/admin/ScheduleEditor.tsx` — Frappe Gantt wrapper; **replaced** by WorkflowTracker
- `src/pages/admin/projects/[projectId]/schedule.astro` — existing schedule page; **gutted and replaced** (route reused)

### Project Detail Integration
- `src/pages/admin/projects/[projectId]/index.astro` — line 288 has `scheduleUrl` prop; may need updating if WorkflowTracker page has a different data shape
- `src/components/admin/MilestonesList.tsx` — existing project milestones component; may conflict or need coordination with new workflow tracker milestones

### Dashboard Integration
- `src/pages/admin/dashboard.astro` or `/admin/index.astro` — where the new Workflow Status card is added

### Prior Phase Decisions
- `.planning/STATE.md` §Accumulated Context — all prior decisions including Phase 39 Work Order document pattern (separate doc with projectId, separate API routes)
- `src/lib/sanity/schema.ts` (or schema index) — where new document types `workflowTemplate` and `projectWorkflow` must be registered

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CollapsibleSection` (`src/components/admin/ui/CollapsibleSection.tsx`): wraps the new "Workflow Templates" card in Settings
- `AdminModal` (`src/components/admin/ui/AdminModal.tsx`): used for status picker popover / confirmation dialogs in tracker
- `DeleteConfirmDialog` (`src/components/admin/DeleteConfirmDialog.tsx`): reusable for template delete confirmation (guard: no active projects using template)
- `QuickAssignTypeahead` pattern — may be reusable for selecting prerequisite milestones in the template editor (milestone reference picker)
- `ChecklistConfigSection` pattern — up/down reorder with add/delete; adapt for phase and milestone lists in template editor

### Established Patterns
- Separate Sanity document with `projectId`: workOrder.ts → `src/sanity/schemas/workOrder.ts`. `projectWorkflow` follows this exactly.
- Settings save: separate POST actions per data type (`action: "update"`, `action: "updateTrades"`, etc.). Template CRUD uses its own API routes at `src/pages/api/admin/workflow-templates/`.
- Admin page layout: `AdminLayout` wrapper with `breadcrumbs` prop. Template editor at `/admin/settings/workflow-templates/[id]` uses breadcrumbs: [Settings → Workflow Templates → {Template Name}].
- All admin API routes at `src/pages/api/admin/`. Workflow APIs: `/api/admin/workflow-templates/` (CRUD) and `/api/admin/projects/[id]/workflow` (instance management + milestone updates).
- Vercel Cron exists (Phase 36 archive cron, procurement Ship24 check) — dormancy detection does NOT use cron in Phase 44 (lazy evaluation on tracker load per D-15).

### Integration Points
- Dashboard: new Workflow Status card queries all `projectWorkflow` documents and aggregates status counts
- Project detail page: "Schedule" link at line ~288 of `index.astro` navigates to `/admin/projects/[id]/schedule` — no change needed if route is preserved
- Settings page: new CollapsibleSection for template list needs template data fetched in `settings.astro` (server-side, like trades are fetched)
- `src/sanity/schemas/index.ts` (or schema registration file): add `workflowTemplate` and `projectWorkflow` document types
- Sanity schema for `workflowTemplate`: needs deeply nested object arrays (phases[] → milestones[] → gate{}, hardPrereqs[], softPrereqs[], defaultInstances[]). Use Sanity `defineArrayMember` / `defineField` patterns throughout.

</code_context>

<specifics>
## Specific Ideas

- Status circle color system: gray = not_started/blocked, blue = in_progress, amber = awaiting_client/awaiting_payment, green = complete, muted = skipped. Cross-reference `project_tracker_koenig.html` for exact pill colors.
- Template editor breadcrumb: Settings → Workflow Templates → {Template Name} (Back navigation to /admin/settings)
- Seeding script: idempotent — checks if `workflowTemplate` documents with those names already exist before creating. Use as a one-time `astro:build` script or a manually-triggered API action at `/api/admin/workflow-templates/seed`.
- Instantiation button copy: "Start workflow" on the blank tracker page with a sub-label "Select a template to begin tracking this project." Template selector is a simple `<select>` listing all available templates by name.
- Warning bar colors: approval timeout warning uses amber, dormancy warning uses amber, uneven contractor progress uses a lighter variant. Cross-reference `project_tracker_koenig.html`.

</specifics>

<deferred>
## Deferred Ideas

- Email notifications for dormancy threshold and client approval timeout — future phase (email infrastructure for this would use Resend, same as Work Order emails)
- Client portal read-only workflow view — future phase
- Template versioning diff/changelog UI — future phase (spec §10 Q5)
- Time tracking integration per milestone (hourly billing, retainer extension tracking) — future phase (spec §10 Q3)
- Addendum workflow for scope changes (formal new-milestone creation flow) — future phase (spec §10 Q4)
- Full cross-project reporting beyond dashboard summary card — future phase (spec §10 Q6)
- Dormancy cron job for proactive detection when admin hasn't loaded the tracker — future phase
- Design consultation and Staging templates beyond the seeded starters — Liz can create via the UI

</deferred>

---

*Phase: 44-workflow-engine*
*Context gathered: 2026-04-23*
