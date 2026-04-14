# Phase 36: Projects List & Archive Lifecycle - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the projects list visual hierarchy for completed projects, and add a full archive lifecycle: manual archive action, auto-archive after 90 days of completion, and an in-page toggle to view archived projects. Restoring archives is supported to prevent data loss.

Scope anchor: **PROJ-01..05** from `.planning/REQUIREMENTS.md`.

Out of scope: any change to the project detail page beyond the new archive action menu, schema migration of existing completed-but-unflagged projects (handled implicitly by auto-archive once cron runs), or changes to portal-side project visibility.
</domain>

<decisions>
## Implementation Decisions

### Archive data model
- **D-01:** Add an optional `archivedAt: datetime` field to the `project` Sanity schema. Presence of this field marks a project as archived; the timestamp is also used for sort and future "archived N days ago" displays. No new boolean; no new enum value.
- **D-02:** `completedAt` and `archivedAt` are independent. A project becomes eligible for archive when `pipelineStage === "completed"` and (`archivedAt === null`). Manual archive stamps `archivedAt = now`. Auto-archive stamps `archivedAt = now` for any project with `completedAt <= now - 90 days` and `archivedAt === null`.

### Archive action UI (project detail)
- **D-03:** Add an overflow menu (⋯ / three-dot button) in the project detail header, adjacent to the existing stage pill. Menu items: "Archive project" (visible only when `pipelineStage === "completed" && !archivedAt`) and "Unarchive project" (visible only when `archivedAt` is set). Overflow menu uses the same visual language as the dashboard card overflow patterns from Phase 35.
- **D-04:** The overflow menu is a React island mounted next to the project header. Click fires an Astro action (`archiveProject` / `unarchiveProject`) that patches the Sanity doc with `archivedAt: <ISO>` or `archivedAt: null` respectively, then refreshes the page. Toast confirms action.

### Auto-archive
- **D-05:** Add a Vercel Cron entry in `vercel.ts` (per v5.1 Vercel guidance — `vercel.ts` is canonical config) scheduled daily at `"0 3 * * *"` (03:00 UTC), hitting `/api/admin/auto-archive`. The endpoint is a secure POST that requires a shared-secret header (`x-cron-secret`) matching `CRON_SECRET` env var. Endpoint queries all tenants' projects where `pipelineStage == "completed" && !defined(archivedAt) && completedAt <= dateTime(now()) - 7776000` and patches `archivedAt` in a single transaction. Returns a JSON summary of count archived per tenant.
- **D-06:** The endpoint is multi-tenant aware: it iterates tenants from the tenant registry and runs the query per tenant client. Matches Linha platform architecture (single dataset, `tenantId` filter in GROQ).

### Archived projects view
- **D-07:** On the main `/admin/projects` page, add a toggle "Include archived" in the existing top-bar filter row (next to the stage filter dropdown). Default: off. When on, archived projects render at the very bottom of the list (below completed-but-not-archived) with a second `<hr>` divider and deeper visual dulling (see D-09).
- **D-08:** Toggle state is NOT persisted (matches Phase 35 DASH-21/22 pattern — reload resets to default hidden).

### Visual treatment (PROJ-01 + PROJ-02)
- **D-09:** A subtle `<hr>` (1px, `#E8DDD0`) sits above the first row with `pipelineStage === "completed"` in `ProjectsGrid`. A second `<hr>` (same style) sits above the first archived row when the "Include archived" toggle is on.
- **D-10:** Completed (non-archived) rows render at **70% opacity** of the active-project row styling. Archived rows render at **50% opacity** plus a muted italic "Archived {MMM d}" subtitle where date comes from `archivedAt`. Row itself remains clickable; the anchor still routes to the project detail.

### Unarchive
- **D-11:** "Unarchive project" action available from:
  - Project detail header overflow menu (if `archivedAt` is set).
  - An `Unarchive` link in the archived row's right-side action slot on `/admin/projects` (only visible when "Include archived" is on).

### Cron security
- **D-12:** `CRON_SECRET` env var added to `.env.example` and Vercel project env. Endpoint rejects requests missing or mismatching the header with 401. Local dev: endpoint may be hit manually by setting the header.

### Claude's Discretion
- Exact overflow-menu component implementation (use existing Radix Popover / Menu if present, else a small inline implementation).
- Icon choice for the ⋯ button.
- Copy on the toast messages ("Project archived." / "Project restored.").
- Whether to add a `completedAt` fallback (stamp it on archive if missing) — leave as a safe-guard.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §PROJ (PROJ-01..05) — acceptance criteria for this phase.

### Schema
- `src/sanity/schemas/project.ts` — current project schema; `pipelineStage` enum and `completedAt` field live here.

### Projects list + grid
- `src/pages/admin/projects/index.astro` — route entry point; renders `ProjectsGrid`.
- `src/components/admin/ProjectsGrid.tsx` — existing grid with stageFilter dropdown, `STAGE_META`, `STAGE_COLORS`. Extend, don't replace.
- `src/components/admin/ActiveProjectsCard.tsx` (Phase 35) — CardFilterInput + React island pattern to mirror.
- `src/lib/portalStages.ts` — `STAGE_COLORS` source of truth (DASH-35 Plan 03 added this export).

### Project detail
- `src/pages/admin/projects/[projectId]/index.astro` — host page for the overflow menu island.

### Platform config
- `vercel.ts` — Vercel canonical config (not `vercel.json`); crons declared here. If file does not exist, create it.
- `src/lib/tenantClient.ts` — tenant client factory used by multi-tenant queries.

### Prior phase context
- `.planning/phases/35-dashboard-polish-global-ux-cleanup/35-CONTEXT.md` — sentence-case dates, opacity/hr styling patterns, React-island-in-Astro pattern.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProjectsGrid.tsx`: has `stageFilter` state, `STAGE_META`, `STAGE_COLORS`, and a stable row shape. Extend to group by stage then append completed + archived sections.
- `CardFilterInput` (from Plan 35-02) — could be pulled into the top bar if Liz later asks for free-text filter on /admin/projects; not in scope here but noted.
- Existing Astro actions pattern (`src/actions/index.ts`) — use for `archiveProject` / `unarchiveProject` mutations.

### Established Patterns
- Astro pages read tenant via `Astro.locals.tenantId`; use `getTenantClient(tenantId)` for Sanity client.
- React islands are hydrated with `client:load` from Astro pages.
- Toasts: `sonner` is already wired in the admin shell (used by Plan 35-04 QuickAssignTypeahead).

### Integration Points
- Add overflow menu island to project detail header component (or inline in `[projectId]/index.astro`).
- Add archive toggle to `ProjectsGrid.tsx` top bar.
- Add `/api/admin/auto-archive.ts` as an Astro API route with POST handler.
- Add `archivedAt` field to `src/sanity/schemas/project.ts`.
- Add cron entry to `vercel.ts` (create if absent).
</code_context>

<specifics>
## Specific Ideas

- Opacity values (70% completed, 50% archived) chosen to clearly differentiate three tiers: active → completed → archived, while keeping all rows readable and clickable.
- 90-day threshold measured from `completedAt`, not from last-modified — aligns with the spoken intent that 90 days of "no-touch after completion" triggers archive.
- Unarchive restores the project to the completed section of the main list (since `archivedAt` cleared) — no state is lost.
</specifics>

<deferred>
## Deferred Ideas

- Auto-archive notification / banner surfacing "N projects will be auto-archived this week" on the dashboard. Out of scope for Phase 36 — revisit in a future polish pass if Liz asks.
- Free-text filter on `/admin/projects` list (DASH-16 parity). Not in PROJ-01..05; capture as potential DASH-30 or future polish.
- Bulk-archive tool / bulk-unarchive. Manual per-row + auto-cron covers the stated requirements.
- Email report of auto-archive runs. Out of scope.
</deferred>

---

*Phase: 36-projects-list-archive-lifecycle*
*Context gathered: 2026-04-14*
