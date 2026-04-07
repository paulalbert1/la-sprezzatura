# Phase 28: Artifacts + Schedule - Research

**Researched:** 2026-04-07
**Domain:** Artifact version management (CRUD + file uploads) and Gantt schedule editing (drag + click-to-edit popovers) in Astro SSR admin pages with React islands
**Confidence:** HIGH

## Summary

Phase 28 builds two new admin pages -- Artifacts and Schedule -- that follow the established SSR Astro page + React island pattern from Phase 27 (Procurement). The Artifacts page is a card grid with expand/collapse for version management, file uploads via the Sanity asset pipeline, and a read-only decision log timeline. The Schedule page relocates the existing Frappe Gantt chart from Sanity Studio to the admin, extending it with interactive editing: drag-and-drop date changes, click-to-edit popovers, and custom event CRUD.

The critical architectural work is the Gantt code relocation: extracting pure transform functions, types, colors, and the Frappe Gantt wrapper from `src/sanity/components/gantt/` to a shared `src/lib/gantt/` directory, then updating both Studio and admin imports. The admin Gantt wrapper must extend the existing read-only component with `on_click`, `on_date_change`, and `on_date_click` callbacks from Frappe Gantt 1.2.2. The artifact manager is simpler -- it reuses the existing `artifactUtils.ts` types and patterns, and uploads files via the Sanity asset pipeline (because `versions[].file` is Sanity type `file` expecting asset references).

No new npm dependencies are needed. The existing stack (Astro 6, React 19, Frappe Gantt 1.2.2, date-fns 4.1.0, lucide-react 1.7.0) covers all requirements.

**Primary recommendation:** Structure execution as: (1) relocate shared Gantt code to `src/lib/gantt/`, (2) build Artifacts page with GROQ + React island + API routes, (3) build Schedule page with extended Gantt wrapper + popover editing + API routes, (4) verify both pages end-to-end.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full version manager: upload new versions (file + optional note), set any version as current, view version history with timestamps, upload signed file for contracts, view decision log (approval/rejection history). No "Notify Client" button -- that moves with Send Update in Phase 31.
- **D-02:** File uploads use the existing Vercel Blob infrastructure via admin API route (same pattern as procurement file uploads in Phase 27).
- **D-03:** Add/remove artifacts from the project: "Add Artifact" button for creating new artifacts (type dropdown, first file upload). Remove via confirmation dialog on the card.
- **D-04:** Card grid layout, responsive (2-col on desktop, 1-col on mobile). Each card shows: type badge (color-coded per `getArtifactBadgeStyle`), current version filename/thumbnail, version count, last updated date. Proposals get full-width cards.
- **D-05:** Click a card to expand it in-place showing: upload form at top, version list below (newest first) with filename, date, note, and "Set as Current" button. Current version highlighted with accent border. Collapse by clicking the card header again or a close button.
- **D-06:** Read-only decision log timeline displayed below the version list in the expanded card.
- **D-07:** Both drag-and-drop on the Gantt chart AND click-to-edit popover for precise date entry.
- **D-08:** Editable items: custom events (name, dates, category, notes), contractor dates (startDate, endDate), milestone dates and completion status. Procurement dates are read-only on the schedule.
- **D-09:** Click a bar/marker on the Gantt to open a small popover with date pickers and relevant fields for that item type. Save button in the popover writes to Sanity via API route.
- **D-10:** Drag-and-drop saves immediately to Sanity via API route. No undo toast, no confirmation.
- **D-11:** Extract reusable Gantt layers to `src/lib/gantt/`: transform functions, types, color assignment, Frappe Gantt wrapper, CSS files.
- **D-12:** Studio `GanttScheduleView.tsx` stays in `src/sanity/components/gantt/` but imports shared code from `src/lib/gantt/`.
- **D-13:** Admin schedule page uses SSR GROQ -- Astro page fetches all schedule data server-side.
- **D-14:** Create new events by clicking empty space on the Gantt timeline.
- **D-15:** Edit existing events by clicking their marker/bar. Delete button in the popover triggers confirmation dialog.
- **D-16:** All custom event mutations go through server-side API routes: `/api/admin/schedule-event`.
- **D-17:** Artifacts page at `/admin/projects/[projectId]/artifacts` is an SSR Astro page with `ArtifactManager` React island.
- **D-18:** Schedule page at `/admin/projects/[projectId]/schedule` is an SSR Astro page with `ScheduleEditor` React island.
- **D-19:** All Sanity mutations go through server-side API routes. React islands never import `sanityWriteClient`.
- **D-20:** Breadcrumbs follow Phase 26 D-07 pattern.

### Claude's Discretion
- Exact popover positioning and sizing for Gantt click-to-edit
- How to handle Frappe Gantt's `on_click` and `on_date_change` callbacks for the dual edit model
- Artifact card expand/collapse animation
- Decision log timeline styling (icons per action type, compact vs expanded entries)
- Whether to add drag handles to Gantt events or use Frappe's default drag behavior
- How to detect "click on empty space" vs "click on existing item" for event creation
- File upload progress indicator in artifact cards
- Empty state designs for both artifacts and schedule pages

### Deferred Ideas (OUT OF SCOPE)
- Notify Client button on artifacts (Phase 31)
- Undo toast for drag-and-drop
- Batch date editing
- Procurement lifecycle bars on Gantt (Phase 17)
- Contractor appointment sub-markers (Phase 17)
- Overlap highlighting (Phase 17)
- Drag-to-resize (future)
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Astro | 6.0.4 | SSR page framework for admin pages | Already installed, all admin pages use this pattern [VERIFIED: npm ls] |
| React | 19.2.4 | React islands (`client:load`) for interactive components | Already installed [VERIFIED: npm ls] |
| frappe-gantt | 1.2.2 | Gantt chart rendering with drag-and-drop | Already installed; v1.2.2 has `on_click`, `on_date_change`, `on_date_click` callbacks [VERIFIED: npm ls + source inspection] |
| date-fns | 4.1.0 | Date formatting in UI | Already installed [VERIFIED: npm ls] |
| lucide-react | 1.7.0 | Icons (Upload, FileText, Trash2, X, Plus, Calendar, Check, etc.) | Already installed, used by ProcurementEditor [VERIFIED: npm ls] |
| @sanity/client | (via sanityWriteClient) | Content Lake mutations and asset uploads via API routes | Already configured [VERIFIED: src/sanity/writeClient.ts] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| src/lib/artifactUtils.ts | N/A (local) | Artifact types, labels, badge styles, getCurrentVersion | All artifact display and type logic [VERIFIED: codebase] |
| src/lib/generateToken.ts | N/A (local) | Generate `_key` values for new Sanity array items | When creating new artifacts, versions, or custom events [VERIFIED: codebase] |
| src/lib/session.ts | N/A (local) | `getSession()` for admin auth in API routes | Every API route [VERIFIED: codebase] |
| src/sanity/components/gantt/lib/ganttDates.ts | N/A (local) | `parseSanityDate`, `serializeSanityDate` | Date conversion between Sanity format and JS Date [VERIFIED: codebase] |

### Alternatives Considered
None -- all decisions are locked. No new dependencies needed.

## Architecture Patterns

### Recommended Project Structure (New Files)

```
src/
├── lib/
│   └── gantt/                          # NEW: shared Gantt code (relocated from sanity/components/gantt/)
│       ├── GanttChart.tsx              # MOVED: Frappe Gantt vanilla JS wrapper (read-only base)
│       ├── ganttTransforms.ts          # MOVED: Pure transform functions
│       ├── ganttTypes.ts               # MOVED: GanttTask, GanttLink, etc.
│       ├── ganttColors.ts              # MOVED: Contractor palette, category colors
│       ├── ganttDates.ts               # MOVED: parseSanityDate, serializeSanityDate
│       ├── gantt.css                   # MOVED: Custom theme CSS
│       ├── frappe-gantt.css            # MOVED: Frappe base CSS
│       ├── ganttTransforms.test.ts     # MOVED: Transform tests
│       ├── ganttColors.test.ts         # MOVED: Color tests
│       └── ganttDates.test.ts          # MOVED: Date parsing tests
├── components/
│   └── admin/
│       ├── ArtifactManager.tsx         # NEW: React island for artifact card grid + version management
│       └── ScheduleEditor.tsx          # NEW: React island wrapping GanttChart + popover editing
├── pages/
│   ├── admin/
│   │   └── projects/
│   │       └── [projectId]/
│   │           ├── artifacts.astro     # NEW: SSR page for artifacts
│   │           └── schedule.astro      # NEW: SSR page for schedule
│   └── api/
│       └── admin/
│           ├── artifact-version.ts     # NEW: Upload new version, set current version
│           ├── artifact-crud.ts        # NEW: Add/remove artifacts
│           ├── schedule-event.ts       # NEW: Custom event create/update/delete
│           └── schedule-date.ts        # NEW: Drag/click date updates
├── sanity/
│   ├── components/
│   │   └── gantt/
│   │       ├── GanttScheduleView.tsx   # UPDATED: imports from src/lib/gantt/ instead of local
│   │       ├── hooks/useGanttData.ts   # STAYS: Studio-specific GROQ hook
│   │       ├── GanttLegend.tsx         # STAYS: Studio-specific @sanity/ui component
│   │       ├── ScaleToggle.tsx         # STAYS: Studio-specific
│   │       └── GanttEmptyState.tsx     # STAYS: Studio-specific
│   └── queries.ts                      # UPDATED: add ADMIN_ARTIFACT_QUERY, ADMIN_SCHEDULE_QUERY
```

### Pattern 1: SSR Astro Page + React Island (Established)

**What:** Astro page fetches data server-side via GROQ, passes serialized props to a React `client:load` island for interactivity.
**When to use:** Every admin sub-page.
**Source:** `src/pages/admin/projects/[projectId]/procurement.astro` [VERIFIED: codebase]

```typescript
// artifacts.astro
---
export const prerender = false;
import AdminLayout from "../../../../layouts/AdminLayout.astro";
import ArtifactManager from "../../../../components/admin/ArtifactManager.tsx";
import { getAdminArtifactData } from "../../../../sanity/queries";

const projectId = Astro.params.projectId;
if (!projectId) return Astro.redirect("/admin/projects");

const data = await getAdminArtifactData(projectId);
if (!data) return Astro.redirect("/admin/projects");

const breadcrumbs = [
  { label: "Projects", href: "/admin/projects" },
  { label: data.title, href: `/admin/projects/${projectId}` },
  { label: "Artifacts" },
];
---
<AdminLayout title={data.title + " — Artifacts"} pageTitle="Artifacts" breadcrumbs={breadcrumbs}>
  <ArtifactManager
    client:load
    artifacts={data.artifacts || []}
    projectId={projectId}
    projectTitle={data.title}
  />
</AdminLayout>
```

### Pattern 2: Admin API Route with Auth + Sanity Patch (Established)

**What:** API route with `prerender=false`, `getSession()` auth check, `sanityWriteClient.patch()` for mutations.
**When to use:** Every write operation from React islands.
**Source:** `src/pages/api/admin/update-procurement-item.ts` [VERIFIED: codebase]

```typescript
// API route pattern
export const prerender = false;
import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  // ... parse body, validate, patch Sanity
};
```

### Pattern 3: Sanity Asset Pipeline File Upload

**What:** FormData with file -> API route -> `sanityWriteClient.assets.upload('file', buffer)` -> get Sanity asset reference -> patch Sanity document with asset reference.
**When to use:** Artifact version uploads, signed file uploads. Required because the schema `versions[].file` is Sanity type `file` which expects Sanity asset references (not plain URLs).
**Source:** Sanity JS client documentation + schema inspection [VERIFIED: codebase schema]

```typescript
const buffer = Buffer.from(await file.arrayBuffer());
const asset = await sanityWriteClient.assets.upload("file", buffer, {
  filename: file.name,
  contentType: file.type,
});
// asset._id is the Sanity asset reference ID
// Use: { _type: "file", asset: { _type: "reference", _ref: asset._id } }
```

**Note:** This differs from the procurement file upload pattern (which uses Vercel Blob and stores URLs as plain strings). Artifact versions use Sanity's native `file` type, so the Sanity asset pipeline is required for compatibility with `file.asset->url` GROQ dereferencing on the portal.

### Pattern 4: Frappe Gantt Event Callbacks (New, Verified from Source)

**What:** Frappe Gantt 1.2.2 fires callbacks via `trigger_event()` which maps to `options['on_' + event]`. The relevant events are:
- `on_click(task)` -- fired when a bar is clicked (single click)
- `on_date_change(task, new_start, new_end)` -- fired after drag completes and dates change
- `on_date_click(dateString)` -- fired when clicking empty grid space (returns "YYYY-MM-DD" string)
- `on_double_click(task)` -- fired on double-click (suppressed for 1s after drag)

**When to use:** The admin ScheduleEditor needs all four:
- `on_click` -> open edit popover for the clicked task
- `on_date_change` -> save new dates to Sanity immediately (drag-and-drop)
- `on_date_click` -> open "create new event" popover with pre-filled date
- `on_double_click` -> not needed (single click suffices)

**Source:** `node_modules/frappe-gantt/src/bar.js` lines 386-511, `node_modules/frappe-gantt/src/index.js` lines 1130-1131, 1562-1565 [VERIFIED: source inspection]

```typescript
// Admin GanttChart wrapper (extended from base)
ganttRef.current = new Gantt(containerRef.current, frappeTasks, {
  view_mode: "Day",
  readonly: false,           // Enable drag-and-drop
  readonly_progress: true,   // Progress bar not needed
  popup_on: "click",         // Use click-based popups (or disable and use custom)
  on_click: (task) => {
    // Open edit popover for this task
    onTaskClick?.(task);
  },
  on_date_change: (task, newStart, newEnd) => {
    // Immediately save new dates to Sanity via API
    onDateChange?.(task, newStart, newEnd);
  },
  on_date_click: (dateStr) => {
    // Open "create event" popover with this date pre-filled
    onEmptyClick?.(dateStr);
  },
});
```

**Critical detail:** The `readonly` option must be set to `false` to enable drag. The current Studio GanttChart sets `readonly: true`. The admin wrapper must override this. The `on_click` callback fires task objects with `id`, `name`, `_start` (Date), `_end` (Date), and `custom_class` properties. The task `id` uses the format `"category:_key"` (e.g., `"contractor:c1"`, `"milestone:m1"`, `"event:e1"`), which can be parsed to determine the item type and key for the API route.

### Pattern 5: Click vs Drag Disambiguation

**What:** Frappe Gantt tracks `bar_being_dragged` internally. The `on_click` callback fires after mouseup on a bar. After a drag (where the mouse moved >10px), Frappe sets `action_completed = true` on the bar for 1 second, which suppresses `on_double_click`. However, `on_click` still fires after a drag completes. The admin must distinguish between a simple click (open popover) and a drag (already saved dates via `on_date_change`).

**How to handle:**
1. Track a `lastDragTaskId` in React state
2. In `on_date_change`, set `lastDragTaskId` to the task ID
3. In `on_click`, check if `task.id === lastDragTaskId` -- if yes, skip popover (drag just completed). Reset after a short delay.

**Source:** `node_modules/frappe-gantt/src/bar.js` lines 386-400, `node_modules/frappe-gantt/src/index.js` lines 1122-1128 [VERIFIED: source inspection]

### Anti-Patterns to Avoid
- **Importing sanityWriteClient in React islands:** All mutations must go through API routes. The write client uses a server-only token. [VERIFIED: D-19]
- **Using Vercel Blob for artifact file uploads:** The schema `versions[].file` is Sanity type `file` expecting Sanity asset references. Vercel Blob URLs stored as plain strings are incompatible with `file.asset->url` GROQ dereferencing on the portal. Use the Sanity asset pipeline (`sanityWriteClient.assets.upload`) instead. [VERIFIED: schema inspection, D-02 amended]
- **Re-creating Frappe Gantt instance on every state change:** Mount once, update tasks array via `gantt.refresh(tasks)` for data changes. Full re-mount only when task count changes significantly. [VERIFIED: Frappe Gantt source - has `refresh()` method]
- **Hardcoding popover positions:** Use the clicked bar's SVG position from the DOM, not fixed coordinates. Frappe Gantt bar wrappers have `data-id` attributes that can be queried.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload storage for artifacts | Vercel Blob (incompatible with Sanity `file` type) | `sanityWriteClient.assets.upload('file', buffer)` | Schema expects Sanity asset references; portal uses `file.asset->url` GROQ dereferencing [VERIFIED: codebase schema] |
| Unique key generation | `Math.random()` or UUID | `generatePortalToken(8)` from `src/lib/generateToken.ts` | Cryptographically random, already used for all Sanity `_key` values [VERIFIED: codebase] |
| Date parsing from Sanity | Manual `new Date()` | `parseSanityDate()` from `ganttDates.ts` | Handles timezone-safe parsing (T12:00:00 trick) [VERIFIED: codebase] |
| Date serialization to Sanity | Manual string formatting | `serializeSanityDate()` from `ganttDates.ts` | Consistent YYYY-MM-DD format [VERIFIED: codebase] |
| Artifact type labels/badges | Inline string mapping | `getArtifactLabel()`, `getArtifactBadgeStyle()` from `artifactUtils.ts` | Already covers all 6 types + custom [VERIFIED: codebase] |
| Gantt task transformation | Manual data reshaping | `transformProjectToGanttTasks()` from `ganttTransforms.ts` | Pure function, tested, handles all 4 categories [VERIFIED: codebase] |
| Gantt bar colors | Inline color definitions | `CONTRACTOR_PALETTE`, `CATEGORY_COLORS` from `ganttColors.ts` | Consistent with Studio, 10-color palette [VERIFIED: codebase] |
| Auth check in API routes | Custom middleware | `getSession(cookies)` + `session.role !== "admin"` | Established pattern in all admin API routes [VERIFIED: codebase] |
| Confirmation dialog | Browser `confirm()` | Inline React state with backdrop overlay | Phase 27 ProcurementEditor pattern [VERIFIED: codebase] |

**Key insight:** The artifact management page is largely a rearrangement of existing utility functions and patterns. The schedule page's complexity lies in Frappe Gantt interaction callbacks, not in custom rendering.

## Common Pitfalls

### Pitfall 1: Sanity File Type Requires Sanity Asset Pipeline
**What goes wrong:** The artifact `versions[].file` field in the Sanity schema is defined as type `"file"`, which expects a Sanity asset reference (`{_type: "file", asset: {_ref: "file-xxx"}}`). Storing a Vercel Blob URL string instead silently fails or creates a corrupt reference.
**Why it happens:** The procurement file upload pattern stores blob URLs as plain strings in a custom `files[]` array with a `file` string field. But artifact versions use Sanity's native `file` type, which has different storage expectations.
**How to avoid:** Upload the raw file buffer to Sanity's asset API (`sanityWriteClient.assets.upload('file', buffer, {filename})`) to get a proper Sanity asset reference. This is required because the portal renders artifact files via `file.asset->url` GROQ dereferencing.
**Warning signs:** Artifact versions show in Sanity Studio but files are not downloadable. File URLs return 404. `getCurrentVersion()` returns a version with `file.asset.url` as `undefined`.

### Pitfall 2: Draft vs Published Document ID for Admin Mutations
**What goes wrong:** Admin API routes patch the project document using the `projectId` from the URL. But Sanity documents can exist as drafts (`drafts.projectId`) and/or published (`projectId`). Patching the wrong ID creates a silent second copy or fails to update the visible document.
**Why it happens:** The GROQ query `*[_type == "project" && _id == $projectId][0]` matches the published document. But if the document has unpublished changes, a draft exists too. The procurement API routes patch `projectId` directly (published doc), which works because the admin always operates on published data. However, if someone has the project open in Studio with unsaved changes, the patch goes to the published version while Studio shows the draft.
**How to avoid:** Follow the same pattern as procurement API routes -- patch `projectId` directly (targeting the published document). This is consistent and correct for the admin. The Studio draft will merge or be overwritten on next publish. Document this as an accepted behavior. [VERIFIED: existing procurement routes use bare projectId]
**Warning signs:** Changes made in admin don't appear in Studio (Studio is showing draft). Changes in Studio overwrite admin changes on publish.

### Pitfall 3: Frappe Gantt on_click Fires After Drag
**What goes wrong:** User drags a contractor bar to new dates. `on_date_change` fires (correct), saving new dates. Then `on_click` also fires on mouseup, opening an edit popover for the task that was just dragged. The popover shows stale pre-drag dates because the API hasn't returned yet.
**Why it happens:** Frappe Gantt's click handler on `.bar-wrapper` fires on every mouseup, regardless of whether a drag occurred. The `action_completed` flag only suppresses `on_double_click`, not `on_click`.
**How to avoid:** Track drag state in React: set a `dragInProgress` ref to `true` in `on_date_change`, then in `on_click` check this ref and skip popover if true. Reset with `requestAnimationFrame` or a short timeout. [VERIFIED: Frappe source -- bar.js line 387 fires `on_click` unconditionally]
**Warning signs:** Popover opens after every drag. Popover shows old dates.

### Pitfall 4: Nested Array Mutation Paths in Sanity
**What goes wrong:** Patching a nested array item in Sanity requires precise path syntax. For example, setting a contractor's `startDate` requires `sanityWriteClient.patch(projectId).set({"contractors[_key==\"c1\"].startDate": "2026-06-01"}).commit()`. Getting the path wrong (e.g., using array index instead of `_key`, or forgetting quotes around the key value) silently fails or patches the wrong item.
**Why it happens:** Sanity's mutation API uses a string-based path syntax with `[_key=="value"]` selectors for array items. The procurement API routes already demonstrate this pattern correctly with `procurementItems[_key=="${itemKey}"]`. But custom events are nested under `customEvents`, milestones under `milestones`, and contractors under `contractors` -- each with different parent array names.
**How to avoid:** Parse the Gantt task `id` (format `"category:_key"`) to determine the correct Sanity array name and item key. Map category to array path: `contractor` -> `contractors`, `milestone` -> `milestones`, `event` -> `customEvents`. Use the same `[_key=="..."]` selector pattern as procurement. [VERIFIED: existing API routes demonstrate this]
**Warning signs:** API returns 200 but dates don't change. Wrong item's dates change. Sanity Content Lake shows no mutation.

### Pitfall 5: Popover Positioning on SVG Elements
**What goes wrong:** The edit popover needs to appear near the clicked bar on the Gantt chart. But Gantt bars are SVG `<rect>` elements inside an `<svg>` that is inside a scrollable container. Using the bar's `getBoundingClientRect()` gives coordinates relative to the viewport, but the popover is positioned relative to the React component's container. If the Gantt is scrolled, the popover appears in the wrong position.
**Why it happens:** SVG elements report viewport-relative bounding boxes, not container-relative. The Gantt container has `overflow: auto` for horizontal scrolling.
**How to avoid:** Calculate popover position by: (1) get bar's `getBoundingClientRect()`, (2) get the container div's `getBoundingClientRect()`, (3) subtract container's top/left from bar's top/left to get container-relative position. Also account for container scroll (`container.scrollLeft`, `container.scrollTop`). Use `position: absolute` on the popover within a `position: relative` container.
**Warning signs:** Popover appears at top-left of page instead of near bar. Popover position is wrong after horizontal scroll. Popover position is wrong on window resize.

### Pitfall 6: Artifact Upload to Wrong Sanity Array Path
**What goes wrong:** Adding a new version to an artifact requires appending to `artifacts[_key=="${artifactKey}"].versions`. But the Sanity `setIfMissing` + `append` pattern needs the exact path. If the artifact doesn't exist yet (it was just created), the path fails because the parent array item doesn't exist.
**Why it happens:** The "add artifact" and "upload version" operations are separate API calls. If the user creates a new artifact and immediately uploads a file, the artifact might not be committed yet, or the race condition means the version append targets a non-existent artifact key.
**How to avoid:** Make the "add artifact" API return the new artifact's `_key`. The "upload version" API then uses this key. For the first version (uploaded during artifact creation), include the version in the initial artifact object appended to the `artifacts[]` array -- don't do a separate append. [VERIFIED: procurement add pattern creates full item object in one patch]
**Warning signs:** "Upload version" returns 200 but version doesn't appear. Version appears on wrong artifact. Sanity error about path not found.

## Code Examples

### GROQ Query: Admin Artifact Data
```typescript
// Source: modeled after ADMIN_PROCUREMENT_QUERY in src/sanity/queries.ts [VERIFIED: codebase]
const ADMIN_ARTIFACT_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    _id,
    title,
    "artifacts": artifacts[] {
      _key,
      artifactType,
      customTypeName,
      currentVersionKey,
      "signedFile": signedFile {
        "asset": asset-> { url, originalFilename }
      },
      "versions": versions[] {
        _key,
        "file": file {
          "asset": asset-> { url, originalFilename, mimeType, size }
        },
        uploadedAt,
        note
      },
      "decisionLog": decisionLog[] {
        _key, action, versionKey, clientId, clientName, feedback, timestamp
      },
      "investmentSummary": investmentSummary {
        tiers[] { _key, name, description, lineItems[] { _key, name, price } },
        selectedTierKey,
        eagerness,
        reservations
      }
    }
  }
`;
```

### GROQ Query: Admin Schedule Data
```typescript
// Source: modeled after GANTT_QUERY in src/sanity/components/gantt/hooks/useGanttData.ts [VERIFIED: codebase]
const ADMIN_SCHEDULE_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    _id,
    title,
    engagementType,
    isCommercial,
    contractors[]{ ..., contractor->{_id, name, company, trades} },
    milestones,
    procurementItems[] { _key, name, status, installDate, orderDate, expectedDeliveryDate },
    customEvents,
    scheduleDependencies
  }
`;
```

### Sanity Patch: Update Contractor Dates (after drag)
```typescript
// Source: modeled after update-procurement-item.ts set pattern [VERIFIED: codebase]
const { projectId, taskId, startDate, endDate } = body;
// taskId = "contractor:c1" -> parse to get category and _key
const [category, _key] = taskId.split(":");

const fieldMap: Record<string, { array: string; startField: string; endField: string }> = {
  contractor: { array: "contractors", startField: "startDate", endField: "endDate" },
  milestone:  { array: "milestones", startField: "date", endField: "date" },
  event:      { array: "customEvents", startField: "date", endField: "endDate" },
};

const mapping = fieldMap[category];
const setObj: Record<string, string | null> = {};
setObj[`${mapping.array}[_key=="${_key}"].${mapping.startField}`] = startDate;
if (mapping.endField !== mapping.startField) {
  setObj[`${mapping.array}[_key=="${_key}"].${mapping.endField}`] = endDate;
}

await sanityWriteClient.patch(projectId).set(setObj).commit();
```

### Sanity Patch: Add Artifact with First Version
```typescript
// Source: modeled after update-procurement-item.ts add pattern [VERIFIED: codebase]
const artifactKey = generatePortalToken(8);
const versionKey = generatePortalToken(8);

const artifact = {
  _key: artifactKey,
  _type: "artifact",
  artifactType: fields.type,
  customTypeName: fields.customTypeName || undefined,
  currentVersionKey: versionKey,
  versions: [{
    _key: versionKey,
    _type: "artifactVersion",
    file: { _type: "file", asset: { _type: "reference", _ref: assetId } },
    uploadedAt: new Date().toISOString(),
    note: fields.note || "",
  }],
  decisionLog: [{
    _key: generatePortalToken(8),
    _type: "decisionEntry",
    action: "version-uploaded",
    timestamp: new Date().toISOString(),
  }],
  notes: [],
};

await sanityWriteClient
  .patch(projectId)
  .setIfMissing({ artifacts: [] })
  .append("artifacts", [artifact])
  .commit();
```

### Extended GanttChart Component (Admin Version)
```typescript
// Source: extended from src/sanity/components/gantt/GanttChart.tsx [VERIFIED: codebase]
interface AdminGanttChartProps {
  tasks: GanttTask[];
  links: GanttLink[];
  onTaskClick?: (task: FrappeTask) => void;
  onDateChange?: (task: FrappeTask, newStart: Date, newEnd: Date) => void;
  onEmptyClick?: (dateStr: string) => void;
}

export function AdminGanttChart({ tasks, links, onTaskClick, onDateChange, onEmptyClick }: AdminGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<InstanceType<typeof Gantt> | null>(null);
  const lastDragRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;
    const frappeTasks = toFrappeTasks(tasks, links);
    // ... clear container ...

    ganttRef.current = new Gantt(containerRef.current, frappeTasks, {
      view_mode: "Day",
      readonly: false,
      readonly_progress: true,
      bar_height: 28,
      bar_corner_radius: 4,
      padding: 16,
      column_width: 45,
      popup_on: "hover",  // Keep hover for tooltip, use on_click for edit popover
      on_click: (task) => {
        // Skip if this was a drag, not a click
        if (lastDragRef.current === task.id) {
          lastDragRef.current = null;
          return;
        }
        onTaskClick?.(task);
      },
      on_date_change: (task, newStart, newEnd) => {
        lastDragRef.current = task.id;
        onDateChange?.(task, newStart, newEnd);
      },
      on_date_click: (dateStr) => {
        onEmptyClick?.(dateStr);
      },
    });
    // ... height fix ...
  }, [tasks, links]);

  return <div className="gantt-container" ref={containerRef} />;
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (via vitest.config.ts) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-11 | Gantt code relocation -- shared imports work | unit | `npx vitest run src/lib/gantt/ -x` | Wave 0 (relocated from sanity/components/gantt/lib/) |
| D-11 | Studio imports updated to shared location | unit | `npx vitest run src/sanity/components/gantt/ -x` | Existing tests, path updates needed |
| ART-CRUD | Artifact add/remove via API | smoke | Manual: POST to /api/admin/artifact-crud | Wave 0 |
| ART-VER | Version upload and set-current | smoke | Manual: POST to /api/admin/artifact-version | Wave 0 |
| SCHED-DRAG | Drag-and-drop date save via API | smoke | Manual: drag bar in browser | Manual-only (requires browser interaction) |
| SCHED-CLICK | Click-to-edit popover fields correct | smoke | Manual: click bar in browser | Manual-only (requires browser interaction) |
| EVT-CRUD | Custom event create/update/delete | smoke | Manual: POST to /api/admin/schedule-event | Wave 0 |
| TRANSFORMS | Transform functions remain correct after relocation | unit | `npx vitest run src/lib/gantt/ganttTransforms.test.ts -x` | Existing (relocated) |
| COLORS | Color functions remain correct | unit | `npx vitest run src/lib/gantt/ganttColors.test.ts -x` | Existing (relocated) |
| DATES | Date utils remain correct | unit | `npx vitest run src/lib/gantt/ganttDates.test.ts -x` | Existing (relocated) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/gantt/ -x` (quick unit check)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before verification

### Wave 0 Gaps
- None for existing tests -- they move with the code. Import paths in tests need updating to new locations.
- No new unit test files needed for API routes (tested via browser smoke tests per established Phase 27 pattern).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | `getSession(cookies)` admin check on every API route [VERIFIED: codebase] |
| V3 Session Management | Yes | Redis-backed sessions with 30-day TTL [VERIFIED: src/lib/session.ts] |
| V4 Access Control | Yes | `session.role !== "admin"` check before any mutation [VERIFIED: codebase] |
| V5 Input Validation | Yes | Validate artifactType against ARTIFACT_TYPES enum; validate date format; validate file type |
| V6 Cryptography | No | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized artifact upload | Elevation of Privilege | `getSession()` + admin role check on API routes |
| Unauthorized schedule modification | Elevation of Privilege | `getSession()` + admin role check on API routes |
| File type bypass | Tampering | Validate MIME type server-side in API route (ALLOWED_FILE_TYPES pattern from procurement) |
| Oversize file upload | Denial of Service | Add file size limit validation in API route (e.g., 25MB max) |
| Path traversal in file names | Tampering | Sanity asset pipeline handles filename sanitization -- no direct filesystem writes |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Studio-only Gantt (read-only) | Admin Gantt with editing (drag + click) | Phase 28 | Liz can edit schedule without Studio |
| Studio-only artifact management | Admin artifact management | Phase 28 | Liz can manage artifacts without Studio |
| Vercel Blob for artifact uploads (original D-02) | Sanity asset pipeline for artifact uploads (D-02 amended) | Phase 28 planning | Schema `versions[].file` is Sanity type `file` -- requires Sanity asset references for portal `file.asset->url` GROQ dereferencing |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Frappe Gantt `on_click` fires after drag completes (not suppressed like `on_double_click`) | Pitfall 3 | Edit popover opens after every drag; needs browser testing to confirm |
| A2 | Frappe Gantt `on_date_click` returns YYYY-MM-DD string from `getDateFromClick` | Pattern 4 | Click-on-empty-space feature may not work; verified from source but needs runtime test |
| A3 | `sanityWriteClient.assets.upload('file', buffer)` works from Astro API routes with server-side Sanity client | State of the Art note | If not, artifact version upload needs an alternative approach (upload to Sanity CDN via HTTP, or restructure schema to use Vercel Blob URLs) |

**A1 and A2 are verified from source code inspection** but have not been tested at runtime in this specific project. A3 is based on Sanity client documentation for server-side asset uploads.

## Open Questions (RESOLVED)

1. **Sanity file asset upload from API route** -- RESOLVED
   - What we know: The schema expects Sanity `file` type references. The portal renders via `file.asset->url` GROQ dereferencing.
   - Resolution: `sanityWriteClient` is a standard Node.js HTTP client. Astro API routes execute in Node.js. No platform restriction prevents `sanityWriteClient.assets.upload()` from working in this environment. The write client has a configured token and project ID. This is functionally identical to calling the Sanity Assets API from any Node.js server.

2. **Popover z-index and stacking context** -- RESOLVED
   - What we know: The Gantt container has `isolation: isolate` in CSS, creating a new stacking context. Frappe Gantt's own popup has `z-index: 1000`.
   - Resolution: Popover portaled to `document.body` via `ReactDOM.createPortal` escapes the Gantt's `isolation: isolate` stacking context entirely. The popover renders as a direct child of `<body>`, outside the Gantt DOM tree, so the stacking context does not apply. Use `position: fixed` with coordinates from `getBoundingClientRect()`.

## Sources

### Primary (HIGH confidence)
- `src/sanity/components/gantt/GanttChart.tsx` -- existing Frappe Gantt wrapper [codebase]
- `src/sanity/components/gantt/lib/ganttTransforms.ts` -- transform pipeline [codebase]
- `src/sanity/components/gantt/lib/ganttTypes.ts` -- type definitions [codebase]
- `src/sanity/components/gantt/lib/ganttColors.ts` -- color palette [codebase]
- `src/sanity/components/gantt/lib/ganttDates.ts` -- date parsing [codebase]
- `src/sanity/components/gantt/hooks/useGanttData.ts` -- GROQ query pattern [codebase]
- `src/lib/artifactUtils.ts` -- artifact types, labels, badges [codebase]
- `src/pages/api/admin/upload-procurement-file.ts` -- Vercel Blob upload pattern [codebase]
- `src/pages/api/admin/update-procurement-item.ts` -- CRUD API route pattern [codebase]
- `src/pages/admin/projects/[projectId]/procurement.astro` -- SSR page + island pattern [codebase]
- `src/components/admin/ProcurementEditor.tsx` -- React island pattern [codebase]
- `src/components/portal/ArtifactCard.astro` -- artifact display patterns [codebase]
- `node_modules/frappe-gantt/src/index.js` -- Frappe Gantt API, event system [source inspection]
- `node_modules/frappe-gantt/src/bar.js` -- bar click/drag/date_change callbacks [source inspection]
- `node_modules/frappe-gantt/src/defaults.js` -- default options including readonly, popup_on [source inspection]
- `src/sanity/schemas/project.ts` lines 838-1030 -- artifact schema [codebase]
- `src/sanity/schemas/project.ts` lines 1145-1230 -- customEvents schema [codebase]

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` -- procurement pitfalls, CSS conflicts [codebase research]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use, versions verified via npm ls
- Architecture: HIGH -- follows established patterns from Phase 27, all reference files inspected
- Pitfalls: HIGH -- Frappe Gantt source inspected directly, Sanity mutation patterns verified against existing code
- Gantt callbacks: HIGH for existence (verified from source), MEDIUM for runtime behavior (A1/A2 need browser testing)

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (stable stack, no fast-moving dependencies)
