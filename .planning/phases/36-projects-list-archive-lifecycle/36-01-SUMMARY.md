---
phase: 36-projects-list-archive-lifecycle
plan: 01
subsystem: database

tags: [sanity, groq, astro-actions, zod, archive-lifecycle, multi-tenant]

# Dependency graph
requires:
  - phase: 29-admin-platform-foundation
    provides: Tenant-aware middleware populating context.locals.tenantId + sanityUserId for /admin routes
  - phase: 34-settings-and-studio-retirement
    provides: Sole management surface is /admin; no Studio constraint to honor
provides:
  - archivedAt datetime field on project document (optional, readOnly, portal group)
  - ADMIN_PROJECTS_LIST_QUERY projection extended with completedAt + archivedAt
  - archiveProject / unarchiveProject Astro actions (admin-gated, tenant-scoped)
  - archiveProjectSchema zod input schema (shared by both actions)
affects: [36-02-projects-grid-tier-ui, 36-03-auto-archive-cron, projects-list, project-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin-gated Astro action using context.locals.tenantId + sanityUserId (pairs with existing Astro pages)"
    - "Server-side eligibility re-check before write (zero client trust)"
    - "Idempotent unarchive patch pattern (set to null is a no-op when already null)"

key-files:
  created: []
  modified:
    - src/sanity/schemas/project.ts
    - src/sanity/queries.ts
    - src/actions/index.ts
    - src/actions/portalSchemas.ts

key-decisions:
  - "Admin gate: tenantId + sanityUserId (not adminEmail, which the middleware does not populate)"
  - "archivedAt stored as optional datetime; null/absent == not archived (D-01)"
  - "Stamp completedAt alongside archivedAt if missing, to anchor 90-day auto-archive (CONTEXT discretion)"
  - "Shared archiveProjectSchema reused by both archiveProject and unarchiveProject"

patterns-established:
  - "Astro action + tenant-scoped Sanity write: getTenantClient(context.locals.tenantId).patch(...).set(...).commit()"
  - "Server-side eligibility re-fetch via tenant client ensures cross-tenant ID guesses 404 instead of leaking data"

requirements-completed: [PROJ-03]

# Metrics
duration: ~10min
completed: 2026-04-14
---

# Phase 36 Plan 01: Archive Lifecycle Data Model Summary

**Adds archivedAt datetime field to the project schema, extends the admin projects list query to project archive + completion timestamps, and ships two admin-gated Astro actions (archiveProject / unarchiveProject) that power the Phase 36 UI and cron layers.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-14T20:53:26Z
- **Completed:** 2026-04-14
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `archivedAt` datetime field added to `project` Sanity schema (portal group, readOnly, optional) positioned immediately after `completedAt`
- `ADMIN_PROJECTS_LIST_QUERY` projects `completedAt` + `archivedAt` so `ProjectsGrid` (Plan 02) can tier-classify without a second fetch
- Two Astro actions shipped: `archiveProject` (eligibility-gated patch) and `unarchiveProject` (idempotent null-set)
- Shared `archiveProjectSchema` zod schema added to `portalSchemas.ts`
- Full cross-tenant safety: writes route through `getTenantClient(context.locals.tenantId)`, and the server-side eligibility re-fetch runs against the same tenant client so cross-tenant ID guesses 404 instead of leaking data (T-36-05 mitigation)

## Task Commits

1. **Task 1: Add archivedAt field to project schema** - `0e86767` (feat)
2. **Task 2: Extend ADMIN_PROJECTS_LIST_QUERY** - `f31ded3` (feat)
3. **Task 3: Add archiveProject and unarchiveProject Astro actions** - `b155db3` (feat)

## Files Created/Modified
- `src/sanity/schemas/project.ts` — added `archivedAt` defineField (datetime, portal group, readOnly)
- `src/sanity/queries.ts` — extended `ADMIN_PROJECTS_LIST_QUERY` projection with `completedAt` + `archivedAt`; added Phase 36 comment
- `src/actions/portalSchemas.ts` — added `archiveProjectSchema` export
- `src/actions/index.ts` — imported `getTenantClient` and `archiveProjectSchema`; added `archiveProject` and `unarchiveProject` to `server` object between `selectTier` and `requestContractorMagicLink`

## Decisions Made

- **Admin gate uses `tenantId` + `sanityUserId`, not `adminEmail`.** The plan referenced `context.locals.adminEmail` as a possibility, but a direct read of `src/middleware.ts` (lines 121-140) confirmed the admin branch only populates `tenantId`, `role`, and `sanityUserId`. Using `sanityUserId` matches every existing admin-surface page (`src/pages/admin/rendering/new.astro`, `src/layouts/AdminLayout.astro`, etc.) and avoids introducing a new locals key.
- **`portalSchemas.ts` imports `z` from `zod`, not `astro:schema`.** The plan flagged this as a check-first item. The existing `import { z } from "zod";` pattern was preserved verbatim; the new schema added in the same style.
- **Safe-guard: stamp `completedAt` when missing.** Written as a ternary object literal (rather than conditional mutation) so both fields appear together in the patch body. Satisfies the CONTEXT "Claude's Discretion" guidance to anchor the 90-day auto-archive window.
- **Action `accept: "json"`, not `"form"`.** All other admin write actions in the file use `"form"` because they are driven by HTML form posts. The Phase 36 island (Plan 02) will call via `actions.archiveProject({ projectId })`, which is JSON-encoded — matches the plan spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Swapped planned `context.locals.adminEmail` gate for `sanityUserId`**
- **Found during:** Task 3 (Astro actions)
- **Issue:** Plan's hardcoded `context.locals.adminEmail` reference would have failed at runtime — the key is never populated by `src/middleware.ts`. The plan acknowledged this risk and instructed the executor to verify locals shape first and fall back to the established admin pattern.
- **Fix:** Gate reads `tenantId` + `sanityUserId` (same shape used by all admin pages). Documented inline above both actions.
- **Files modified:** `src/actions/index.ts`
- **Verification:** `grep -c 'context.locals.sanityUserId' src/actions/index.ts` returns 2 (one per action); TypeScript compiles clean.
- **Committed in:** `b155db3` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking, resolved by plan's fallback instruction)
**Impact on plan:** No scope creep. The plan anticipated this exact deviation and specified the fallback pattern to use.

## Issues Encountered

- Pre-existing TypeScript error in `src/sanity/queries.ts(92,7)` (unrelated to Phase 36 — confirmed by `git stash` / re-run). Left untouched per SCOPE BOUNDARY rule; logged here only for visibility.

## Auth Gates

None — the actions themselves are a security gate (UNAUTHORIZED response when admin session is absent), not a gate the executor had to pass through.

## Known Stubs

None — this plan delivers data-layer and server-action surface only; no UI is rendered in this plan.

## Next Plan Readiness

- **Plan 02 (ProjectsGrid tier UI)** has everything it needs: each row now carries `archivedAt` + `completedAt`; it can bucket rows client-side into active / completed / archived tiers without a second fetch.
- **Plan 03 (auto-archive cron)** has everything it needs: the `archivedAt` field is queryable with `!defined(archivedAt)` and writable via the same tenant client pattern. The cron endpoint can call `.patch(id).set({ archivedAt: now }).commit()` directly or invoke the same action if it runs within a request context.
- **Schema is live on next build/Studio compile** — file-based schema, no migration step. Existing project docs have `archivedAt === undefined`, which correctly evaluates as "not archived" per D-01.

## Self-Check: PASSED

- `src/sanity/schemas/project.ts` — `archivedAt` field present (line 324)
- `src/sanity/queries.ts` — `archivedAt` + `completedAt` in `ADMIN_PROJECTS_LIST_QUERY` projection
- `src/actions/index.ts` — `archiveProject` (line 555) and `unarchiveProject` (line 595) defined
- `src/actions/portalSchemas.ts` — `archiveProjectSchema` exported
- Task commits present in git log: `0e86767`, `f31ded3`, `b155db3`
- `npx tsc --noEmit` introduces zero new errors in any of the four modified files

---
*Phase: 36-projects-list-archive-lifecycle*
*Plan: 01*
*Completed: 2026-04-14*
