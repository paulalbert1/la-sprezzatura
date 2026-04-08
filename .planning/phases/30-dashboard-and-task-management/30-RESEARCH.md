# Phase 30: Dashboard and Task Management - Research

**Researched:** 2026-04-08
**Domain:** Astro SSR + React islands + Sanity GROQ queries + admin API routes
**Confidence:** HIGH

## Summary

Phase 30 builds the admin dashboard (the landing page after login) and a task management feature on the existing Astro + Sanity + React island architecture established in Phases 28-29. The dashboard is a read-heavy page with 5 card sections (overdue banner, projects, milestones, deliveries, tasks, activity feed) powered by GROQ queries against the tenant-scoped Sanity dataset. Task management adds a new inline array (`tasks[]`) and activity log (`activityLog[]`) to the project schema, with API routes for task CRUD and completion toggle.

The implementation follows well-established patterns already in the codebase: Astro SSR pages using `AdminLayout`, React components mounted via `client:load`, API routes under `src/pages/api/admin/` with session checks and `getTenantClient()`, and Sanity schema extensions using `defineArrayMember`. The "days in stage" feature requires a new `pipelineStageChangedAt` datetime field on the project schema, since Sanity's `_updatedAt` changes on any mutation and cannot be used for this purpose.

**Primary recommendation:** Build the dashboard as a single Astro page (`/admin/dashboard`) that fetches all dashboard data server-side via GROQ, then renders React island components for interactive elements (task checkbox toggle, quick-add form, project filter dropdown). Keep the architecture simple -- no client-side data fetching library needed since the interactive mutations are small and targeted.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 2-column card grid layout -- overdue alert banner spans full width at top, then paired cards (Projects + Milestones, Deliveries + Tasks), activity feed full width at bottom
- **D-02:** Responsive -- stacks to single column on narrow screens
- **D-03:** Each card shows 5-8 items with a "View all" link when more exist
- **D-04:** Overdue alert banner is always visible when overdue items exist -- not dismissible; resolving the items clears it
- **D-05:** Each project row shows: project name, current pipeline stage badge, and days-in-stage counter
- **D-06:** No client name on the project row -- keep it compact
- **D-07:** Tasks stored as an inline array (`tasks[]`) on the project document -- same pattern as `milestones[]` and `procurementItems[]`
- **D-08:** Task fields: description (string, required), dueDate (date, optional), completed (boolean), completedAt (datetime), createdAt (datetime)
- **D-09:** Tasks use Sanity auto-generated `_key` for stable references -- no custom ID field needed
- **D-10:** Dedicated activity log -- `activityLog[]` inline array on the project document
- **D-11:** Activity entry fields: action (string enum), description (string), actor (string), timestamp (datetime)
- **D-12:** Activity entries written by admin API routes alongside each mutation (task created, milestone completed, procurement status changed, etc.)
- **D-13:** Dashboard activity feed depth -- Claude's discretion (likely 10-15 most recent across all projects)
- **D-14:** Click navigation: project row -> `/admin/projects/[id]`, milestone -> project page `#milestones`, delivery -> project page `#procurement`, task text -> project page `#tasks`, activity entry -> project page
- **D-15:** Task checkboxes toggle completion inline on the dashboard (no navigation) via API call
- **D-16:** Inline quick-add for tasks at the bottom of the Tasks card -- text input + project dropdown + optional due date, press Enter to create
- **D-17:** Tasks card has a project dropdown filter at the top (default: All Projects); overdue tasks highlighted in red per TASK-03

### Claude's Discretion
- Activity feed item count and time-based cutoff logic
- Exact card sizing, spacing, and responsive breakpoints
- How "days in stage" is computed (from pipelineStage change date or project _updatedAt)
- Loading states and skeleton patterns for dashboard cards
- Activity log entry cap per project (e.g., trim oldest when exceeding 100 entries)
- Whether to add a "Tasks" group to the project schema alongside existing groups

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DASH-01 | Admin sees dashboard on login with active projects showing current stage and days-in-stage | GROQ query for active projects with pipelineStage; new `pipelineStageChangedAt` field for days computation; `STAGE_META` reuse for labels/colors |
| DASH-02 | Dashboard shows upcoming and overdue milestones across all projects with date badges | GROQ subquery flattening milestones from all active projects, date comparison with `now()` and `dateTime()` conversion |
| DASH-03 | Dashboard shows active deliveries with tracking status pills and ETAs | GROQ subquery for procurementItems with `status` in transit states, existing status badge patterns |
| DASH-04 | Dashboard shows overdue alert banner summarizing overdue milestones and tasks | Server-side computation from same data used for DASH-02/DASH-06, conditional rendering |
| DASH-05 | Dashboard shows recent activity feed with timestamps and actor | New `activityLog[]` schema field, GROQ query to gather and sort across projects |
| DASH-06 | Dashboard shows tasks section with checkboxes, filterable by project | New `tasks[]` schema field, React island for interactive checkbox + filter |
| TASK-01 | Admin can create tasks on a project with description and optional due date | New API route `POST /api/admin/tasks` following existing artifact-crud pattern |
| TASK-02 | Admin can check off tasks from both dashboard and project detail | API route for task completion toggle; React component used on both pages |
| TASK-03 | Overdue tasks highlighted in red on dashboard and project detail | Client-side date comparison for red highlighting (date-fns `isPast` or `isBefore`) |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^6.0.4 | SSR pages + API routes | Project framework [VERIFIED: package.json] |
| react | ^19.2.4 | Interactive islands (dashboard cards) | Project UI library [VERIFIED: package.json] |
| @sanity/client | ^7.17.0 | GROQ queries + mutations | CMS data layer [VERIFIED: package.json] |
| date-fns | ^4.1.0 | Date formatting, overdue checks | Already used in ArtifactManager, ScheduleEditor [VERIFIED: package.json] |
| tailwindcss | ^4.2.1 | Styling | Project design system [VERIFIED: package.json] |

### Supporting (already in project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | **needs install** | Icons for dashboard cards | AdminNav, ArtifactManager, ScheduleEditor all use it but it is NOT in package.json [VERIFIED: npm ls shows empty] |

### Missing Dependency Alert
**lucide-react** is imported in 3 admin components (`AdminNav.tsx`, `ArtifactManager.tsx`, `ScheduleEditor.tsx`) but is NOT listed in `package.json` and NOT found in `node_modules`. It may be resolved through a hoisted dependency or build-time magic, but this should be verified. If builds work without it, the import resolution path should be documented. If not, it needs `npm install lucide-react`. [VERIFIED: grep + npm ls]

### No New Dependencies Needed
This phase requires no new npm packages. All patterns use existing stack: Astro SSR, React, Sanity client, date-fns, Tailwind.

## Architecture Patterns

### Recommended Project Structure
```
src/
  sanity/schemas/project.ts          # Add tasks[] and activityLog[] arrays
  sanity/queries.ts                  # Add dashboard GROQ queries
  pages/admin/dashboard.astro        # NEW - dashboard SSR page
  pages/admin/projects/[projectId]/
    index.astro                      # NEW - project detail page (tasks tab)
  pages/api/admin/
    tasks.ts                         # NEW - task CRUD + completion toggle
  components/admin/
    Dashboard.tsx                    # NEW - main dashboard React island
    DashboardTasksCard.tsx           # NEW - tasks card with filter + checkbox
    DashboardQuickAdd.tsx            # NEW - inline task creation form
    ProjectTasks.tsx                 # NEW - tasks section for project detail
  lib/
    portalStages.ts                  # Existing - reuse STAGE_META for badges
    dashboardUtils.ts                # NEW - shared overdue/days-in-stage logic
```

### Pattern 1: Astro SSR Page + React Island (established pattern)
**What:** Astro page handles auth, tenant resolution, and data fetching server-side. React component receives data as props via `client:load`.
**When to use:** Every admin page in this project.
**Example:**
```typescript
// Source: src/pages/admin/projects/[projectId]/artifacts.astro [VERIFIED: codebase]
---
export const prerender = false;
import AdminLayout from "../../../../layouts/AdminLayout.astro";
import ArtifactManager from "../../../../components/admin/ArtifactManager.tsx";
import { getTenantClient } from "../../../../lib/tenantClient";

const tenantId = Astro.locals.tenantId;
if (!tenantId) return Astro.redirect("/admin/login");
const client = getTenantClient(tenantId);

const data = await getAdminArtifactData(client, projectId);
---
<AdminLayout title="..." pageTitle="..." breadcrumbs={breadcrumbs}>
  <ArtifactManager client:load artifacts={data.artifacts} projectId={projectId} />
</AdminLayout>
```

### Pattern 2: Admin API Route with Session + Tenant Scoping (established pattern)
**What:** API route checks admin session, extracts tenantId, uses `getTenantClient()` for mutations.
**When to use:** All write operations (task create, toggle completion).
**Example:**
```typescript
// Source: src/pages/api/admin/artifact-crud.ts [VERIFIED: codebase]
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  if (!session.tenantId) {
    return new Response(JSON.stringify({ error: "No tenant context" }), { status: 403 });
  }
  const client = getTenantClient(session.tenantId);
  // ... validate input, perform mutation ...
};
```

### Pattern 3: Sanity Inline Array Operations (established pattern)
**What:** Using `setIfMissing` + `append` for adding items, `.set()` with path for updating items, `.unset()` for removing items.
**When to use:** Task CRUD on the project document's `tasks[]` array.
**Example:**
```typescript
// Source: src/pages/api/admin/artifact-crud.ts [VERIFIED: codebase]
// Adding to inline array:
await client.patch(projectId)
  .setIfMissing({ tasks: [] })
  .append("tasks", [taskObject])
  .commit();

// Updating inline array item by _key:
await client.patch(projectId)
  .set({ [`tasks[_key=="${taskKey}"].completed`]: true })
  .commit();

// Removing from inline array:
await client.patch(projectId)
  .unset([`tasks[_key=="${taskKey}"]`])
  .commit();
```

### Pattern 4: Schema Extension with defineArrayMember (established pattern)
**What:** Adding inline array fields to the project schema using the existing `defineField` + `defineArrayMember` pattern.
**When to use:** Adding `tasks[]` and `activityLog[]` fields.
**Example:**
```typescript
// Source: src/sanity/schemas/project.ts - milestones pattern [VERIFIED: codebase]
defineField({
  name: "tasks",
  title: "Tasks",
  type: "array",
  group: "tasks",  // new group
  of: [
    defineArrayMember({
      type: "object",
      name: "task",
      fields: [
        defineField({ name: "description", title: "Description", type: "string",
                       validation: (r) => r.required() }),
        defineField({ name: "dueDate", title: "Due Date", type: "date" }),
        defineField({ name: "completed", title: "Completed", type: "boolean",
                       initialValue: false }),
        defineField({ name: "completedAt", title: "Completed At", type: "datetime" }),
        defineField({ name: "createdAt", title: "Created At", type: "datetime" }),
      ],
    }),
  ],
})
```

### Anti-Patterns to Avoid
- **Fetching dashboard data client-side:** The dashboard data should be fetched server-side in the Astro page, not via `useEffect` in React. This gives instant rendering and avoids loading spinners on page load.
- **Using `_updatedAt` for "days in stage":** Sanity's `_updatedAt` changes on ANY document mutation (adding a task, updating a milestone, etc.). Use a dedicated `pipelineStageChangedAt` field instead. [VERIFIED: Sanity docs confirm `_updatedAt` updates on every mutation]
- **Single GROQ query for all dashboard data:** Multiple focused queries are easier to understand and maintain than one massive query. Use 3-4 targeted queries (projects, milestones+overdue, deliveries, activity).
- **Creating a separate "task" document type:** Decision D-07 locks tasks as inline arrays on the project document, matching the existing milestones/procurementItems pattern.
- **Missing `_key` on inline array items:** Sanity requires `_key` on every array item. Use `generatePortalToken(8)` for consistent key generation (established pattern from artifact-crud.ts).
- **Comparing `date` type with `now()` directly in GROQ:** Sanity `date` fields are strings like `"2026-04-08"`, not datetime objects. Must use `dateTime(date + "T00:00:00Z")` for proper comparison with `now()` in GROQ. [VERIFIED: Sanity docs + community answers]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date string manipulation | `date-fns` `format()`, `formatDistanceToNow()` | Already in project, handles locales and edge cases [VERIFIED: used in ArtifactManager] |
| Overdue detection | Manual date string comparison | `date-fns` `isPast()`, `isBefore()`, `differenceInDays()` | Handles timezone edge cases correctly |
| Pipeline stage labels/colors | Hardcoded strings in dashboard | `STAGE_META` from `portalStages.ts` | Single source of truth, already maps stage keys to display titles [VERIFIED: codebase] |
| Random keys for array items | `Math.random()` or `crypto.randomUUID()` | `generatePortalToken(8)` | Established pattern, consistent with all other inline array items [VERIFIED: artifact-crud.ts] |
| Auth/session checks in API routes | Custom auth middleware | `getSession(cookies)` + role check | Established pattern in every admin API route [VERIFIED: codebase] |
| Tenant client creation | Direct `createClient()` calls | `getTenantClient(tenantId)` | Cached, scoped, handles env var resolution [VERIFIED: tenantClient.ts] |

## Common Pitfalls

### Pitfall 1: GROQ Date Type vs DateTime Type Mismatch
**What goes wrong:** Filtering milestones/tasks by `date < now()` returns no results because `date` fields are plain date strings (`"2026-04-08"`) and `now()` returns a datetime string (`"2026-04-08T14:30:00Z"`).
**Why it happens:** Sanity `date` type and `datetime` type are different. GROQ cannot compare them directly.
**How to avoid:** Convert date fields: `dateTime(milestone.date + "T00:00:00Z") < now()` or `dateTime(task.dueDate + "T23:59:59Z") < now()` for end-of-day semantics.
**Warning signs:** Overdue items not appearing in the dashboard banner.

### Pitfall 2: Missing `_type` on Inline Array Items
**What goes wrong:** Sanity mutation fails with validation error when appending to an array.
**Why it happens:** Sanity requires `_type` on named array members (matching the `name` in `defineArrayMember`).
**How to avoid:** Always include `_type: "task"` (matching schema name) alongside `_key` when creating items.
**Warning signs:** 400/422 errors from Sanity API on task creation.

### Pitfall 3: `setIfMissing` Before `append` for New Arrays
**What goes wrong:** `append` fails if the array field doesn't exist yet on the document.
**Why it happens:** Existing projects created before `tasks[]` was added to the schema won't have the field.
**How to avoid:** Always chain `.setIfMissing({ tasks: [] }).append("tasks", [...])`. This is the established pattern from artifact-crud.ts.
**Warning signs:** First task creation on a project fails; subsequent ones work.

### Pitfall 4: Stale Dashboard Data After Task Toggle
**What goes wrong:** User toggles a task checkbox but the dashboard still shows old state until page refresh.
**Why it happens:** Dashboard data is server-rendered; React island has local state that needs optimistic update.
**How to avoid:** Implement optimistic UI in the React component -- update local state immediately, then fire API call. If API fails, revert state and show error.
**Warning signs:** Checkbox appears to "bounce back" or requires page reload.

### Pitfall 5: Activity Log Unbounded Growth
**What goes wrong:** Projects with heavy activity accumulate hundreds of activity log entries, slowing queries.
**Why it happens:** Every task create, milestone toggle, procurement update adds an entry.
**How to avoid:** Cap activity log at 100 entries per project. When writing a new entry, check length and trim oldest if needed. The GROQ query for the dashboard should also limit to most recent 15 entries across all projects.
**Warning signs:** Dashboard load time increasing over months.

### Pitfall 6: `pipelineStageChangedAt` Not Set on Existing Projects
**What goes wrong:** "Days in stage" shows NaN or incorrect value for existing projects.
**Why it happens:** Projects created before this field was added won't have `pipelineStageChangedAt`.
**How to avoid:** In the dashboard query, fall back to `_createdAt` when `pipelineStageChangedAt` is null: `"stageDate": coalesce(pipelineStageChangedAt, _createdAt)`. Also consider a migration script to backfill.
**Warning signs:** "NaN days" or blank days-in-stage counter.

## Code Examples

### Dashboard GROQ Query: Active Projects with Stage Info
```groq
// Source: pattern derived from existing queries.ts + GROQ docs
// [VERIFIED: Sanity GROQ cheat sheet]
*[_type == "project" && projectStatus == "active"] | order(title asc) {
  _id,
  title,
  pipelineStage,
  "stageChangedAt": coalesce(pipelineStageChangedAt, _createdAt),
  projectStatus
}
```

### Dashboard GROQ Query: Overdue Milestones Across All Projects
```groq
// Source: GROQ dateTime conversion pattern
// [VERIFIED: Sanity community + docs]
*[_type == "project" && projectStatus == "active"] {
  _id,
  title,
  "overdueMilestones": milestones[
    completed != true &&
    date != null &&
    dateTime(date + "T23:59:59Z") < now()
  ] {
    _key,
    name,
    date
  }
}[count(overdueMilestones) > 0]
```

### Dashboard GROQ Query: Active Deliveries (In Transit)
```groq
// Source: existing procurementItems schema
// [VERIFIED: project.ts schema]
*[_type == "project" && projectStatus == "active"
  && engagementType == "full-interior-design"] {
  _id,
  title,
  "activeDeliveries": procurementItems[
    status in ["ordered", "warehouse", "in-transit"]
  ] {
    _key,
    name,
    status,
    expectedDeliveryDate,
    trackingNumber
  }
}[count(activeDeliveries) > 0]
```

### Task Completion Toggle API Pattern
```typescript
// Source: pattern from artifact-crud.ts + schedule-event.ts
// [VERIFIED: codebase]
// PATCH /api/admin/tasks with action: "toggle"
const now = new Date().toISOString();
if (completed) {
  // Mark as complete
  await client.patch(projectId)
    .set({
      [`tasks[_key=="${taskKey}"].completed`]: true,
      [`tasks[_key=="${taskKey}"].completedAt`]: now,
    })
    .commit();
} else {
  // Mark as incomplete
  await client.patch(projectId)
    .set({
      [`tasks[_key=="${taskKey}"].completed`]: false,
      [`tasks[_key=="${taskKey}"].completedAt`]: null,
    })
    .commit();
}
```

### Activity Log Write Pattern
```typescript
// Source: pattern from artifact-crud.ts
// [VERIFIED: codebase]
// Write activity entry alongside mutation
const activityEntry = {
  _key: generatePortalToken(8),
  _type: "activityEntry",
  action: "task-created",
  description: `Task "${description}" added`,
  actor: session.entityId, // admin email or name
  timestamp: new Date().toISOString(),
};

await client.patch(projectId)
  .setIfMissing({ activityLog: [] })
  .append("activityLog", [activityEntry])
  .commit();
```

### Days In Stage Computation (client-side)
```typescript
// Source: date-fns API [ASSUMED - standard date-fns usage]
import { differenceInDays } from "date-fns";

function getDaysInStage(stageChangedAt: string | null): number {
  if (!stageChangedAt) return 0;
  return differenceInDays(new Date(), new Date(stageChangedAt));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sanity Studio for all content | Custom admin at /admin/* | Phase 29 (v5.0) | Dashboard is part of the custom admin, not Studio |
| Global sanityWriteClient | getTenantClient(tenantId) | Phase 29 | All admin data access must use tenant-scoped client |
| No admin dashboard | AdminNav already links to /admin/dashboard | Phase 29 | URL reserved, just needs the page |

**Deprecated/outdated:**
- `sanityWriteClient` direct import: replaced by `getTenantClient(tenantId)` in all admin code [VERIFIED: Phase 29 context]
- Sanity Studio for project management: being retired in favor of custom admin [VERIFIED: STATE.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Activity log should be capped at ~100 entries per project to prevent unbounded growth | Pitfalls | LOW -- can adjust cap easily; no data loss since older entries simply not written |
| A2 | Dashboard activity feed should show 15 most recent entries across all projects | Architecture | LOW -- easy to adjust; D-13 says Claude's discretion |
| A3 | `pipelineStageChangedAt` should be a new datetime field on the project schema for "days in stage" | Architecture | MEDIUM -- alternative is computing from `_updatedAt` which updates on any change and would be inaccurate |
| A4 | Tasks group should be added to the Sanity schema groups (alongside milestones, procurement, etc.) | Architecture | LOW -- improves Sanity Studio UX for the transition period; D-discretion area |
| A5 | `lucide-react` may need explicit installation -- currently used but not in package.json | Standard Stack | LOW -- if builds work without it, it is a phantom dep; if not, simple `npm install` |
| A6 | Activity action enum values: task-created, task-completed, task-reopened, milestone-completed, procurement-status-changed, etc. | Code Examples | LOW -- exact values are implementation detail, easy to adjust |

## Open Questions (RESOLVED)

1. **Admin project detail page scope**
   - What we know: TASK-02 requires tasks checkable from "project detail page", and D-14 defines navigation targets like `#tasks`
   - What's unclear: Does Phase 30 need to create a full project detail page (`/admin/projects/[projectId]`), or just add a tasks section to it? Currently no `index.astro` exists for the project detail -- only `artifacts.astro` and `schedule.astro` exist as sub-pages.
   - Recommendation: Create a minimal project detail page with a tasks section. The page can be expanded in later phases. This is the minimum needed to satisfy TASK-02.
   - RESOLVED: Plan 30-04 creates a minimal project detail page at /admin/projects/[projectId]/index.astro with a Tasks section (ProjectTasks React island), satisfying TASK-02 and providing D-14 navigation targets (#milestones, #procurement, #tasks).

2. **Admin projects list page**
   - What we know: D-14 says project rows link to `/admin/projects/[id]`, and AdminNav has a "Projects" link to `/admin/projects`
   - What's unclear: Whether `/admin/projects` (the list page) needs to be created in Phase 30 or if the dashboard project card satisfies DASH-01 on its own
   - Recommendation: The dashboard project card satisfies DASH-01. A projects list page is not required by any Phase 30 requirement, but may be needed as a navigation target. Consider creating a minimal stub or redirect.
   - RESOLVED: The dashboard Active Projects card (Plan 30-03) satisfies DASH-01. The "View all" link on the projects card already links to /admin/projects. A standalone projects list page is deferred to a future phase.

3. **Activity log backfill for existing mutations**
   - What we know: D-12 says activity entries are written "alongside each mutation"
   - What's unclear: Whether existing API routes (artifact-crud, schedule-event, etc.) should be updated to also write activity log entries in this phase
   - Recommendation: Only add activity logging to the new task API routes in Phase 30. Retrofitting existing routes can happen in a later phase since those mutations are not yet tracked and adding them is additive.
   - RESOLVED: Plan 30-02 adds activity logging only to the new task API route (task-created, task-completed, task-reopened actions). Retrofitting existing routes (artifact-crud, schedule-event) is deferred to a future phase.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DASH-01 | Active projects query returns stage + days-in-stage | unit | `npx vitest run src/sanity/queries.test.ts -t "dashboard"` | Needs Wave 0 |
| DASH-02 | Overdue milestones query filters correctly | unit | `npx vitest run src/lib/dashboardUtils.test.ts` | Needs Wave 0 |
| DASH-03 | Active deliveries query returns in-transit items | unit | `npx vitest run src/sanity/queries.test.ts -t "deliveries"` | Needs Wave 0 |
| DASH-04 | Overdue banner computation aggregates milestones + tasks | unit | `npx vitest run src/lib/dashboardUtils.test.ts -t "overdue"` | Needs Wave 0 |
| DASH-05 | Activity feed query sorts by timestamp desc, limits count | unit | `npx vitest run src/sanity/queries.test.ts -t "activity"` | Needs Wave 0 |
| DASH-06 | Tasks query returns tasks with completed/overdue state | unit | `npx vitest run src/sanity/queries.test.ts -t "tasks"` | Needs Wave 0 |
| TASK-01 | Task creation API validates input, writes to Sanity | unit | `npx vitest run src/pages/api/admin/tasks.test.ts -t "create"` | Needs Wave 0 |
| TASK-02 | Task toggle API sets completed/completedAt correctly | unit | `npx vitest run src/pages/api/admin/tasks.test.ts -t "toggle"` | Needs Wave 0 |
| TASK-03 | Overdue detection logic identifies past-due uncompleted tasks | unit | `npx vitest run src/lib/dashboardUtils.test.ts -t "overdue task"` | Needs Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/dashboardUtils.test.ts` -- covers DASH-02, DASH-04, TASK-03 (overdue logic, days-in-stage)
- [ ] `src/pages/api/admin/tasks.test.ts` -- covers TASK-01, TASK-02 (task CRUD API)
- [ ] Add dashboard-related test cases to existing `src/sanity/queries.test.ts` -- covers DASH-01, DASH-03, DASH-05, DASH-06

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (existing) | Admin session via middleware -- already implemented in Phase 29 [VERIFIED: middleware.ts] |
| V3 Session Management | yes (existing) | Redis-backed sessions with 30-day TTL, httpOnly cookies [VERIFIED: session.ts] |
| V4 Access Control | yes | Every API route checks `session.role === "admin"` and `session.tenantId` before processing [VERIFIED: artifact-crud.ts pattern] |
| V5 Input Validation | yes | Task description length limit, date format validation, projectId format check |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns for Astro + Sanity Admin

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Missing auth check on new API route | Elevation of Privilege | Copy established session+role check pattern from artifact-crud.ts |
| Cross-tenant data access | Information Disclosure | Always use `getTenantClient(session.tenantId)` -- never accept tenantId from request body |
| Unbounded array input | Denial of Service | Validate task description length (max 500 chars), activity log cap (100 entries) |
| XSS in task description display | Tampering | React auto-escapes rendered text by default; avoid raw HTML injection |

## Sources

### Primary (HIGH confidence)
- Codebase: `src/sanity/schemas/project.ts` -- existing schema with milestones[], procurementItems[] inline arrays
- Codebase: `src/pages/api/admin/artifact-crud.ts` -- established API route pattern with session check + Sanity mutations
- Codebase: `src/pages/admin/projects/[projectId]/artifacts.astro` -- established Astro SSR page + React island pattern
- Codebase: `src/lib/tenantClient.ts` -- tenant-scoped Sanity client factory
- Codebase: `src/middleware.ts` -- admin auth guard with tenantId injection
- Codebase: `src/lib/portalStages.ts` -- STAGE_META for pipeline stage labels

### Secondary (MEDIUM confidence)
- [Sanity GROQ Query Cheat Sheet](https://www.sanity.io/docs/content-lake/query-cheat-sheet) -- GROQ aggregation, count(), date filtering
- [Sanity GROQ Functions Reference](https://www.sanity.io/docs/specifications/groq-functions) -- `now()`, `dateTime()`, `coalesce()` functions
- [Sanity Documents](https://www.sanity.io/docs/content-lake/documents) -- `_updatedAt`, `_createdAt` system fields behavior

### Tertiary (LOW confidence)
- [Sanity Discussion #4692](https://github.com/sanity-io/sanity/discussions/4692) -- confirms `_updatedAt` changes on any edit, not suitable for "last stage change"

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already in project, patterns well-established
- Architecture: HIGH -- follows existing patterns (Astro SSR + React islands + Sanity inline arrays)
- Pitfalls: HIGH -- verified GROQ date comparison gotcha against Sanity docs; array mutation patterns verified in codebase
- Schema design: HIGH -- matches locked decisions D-07 through D-12 exactly, follows established milestones[] pattern

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- Astro 6, Sanity v7, React 19 are mature)
