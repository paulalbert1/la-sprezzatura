# Phase 27: Procurement Editor - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Liz can add, edit, and update procurement items for a project entirely within the custom admin at `/admin/projects/[projectId]/procurement` — no Studio required. The procurement table shows all items with inline status editing, overdue detection, carrier icon links, and a slide-out panel for full item editing including file uploads.

Requirements carry forward from Phase 23 (D-01 through D-15) adapted for the admin context.

</domain>

<decisions>
## Implementation Decisions

### Inline Status Editing
- **D-01:** Clicking a status badge in the table opens a dropdown showing all 6 procurement stages (Not Yet Ordered through Installed). Selecting a new stage immediately patches Sanity via a server-side API route. No form submission or "Save" button needed for status changes.
- **D-02:** The status badge colors use the portal's established `STATUS_STYLES` map from `ProcurementTable.astro` (stone, amber, terracotta, blue, emerald) — NOT Sanity tones. This keeps the admin visually consistent with the portal.
- **D-03:** The inline dropdown is a React island component. Status change triggers `fetch('/api/admin/update-procurement-status', { projectId, itemKey, status })`.

### Table Layout
- **D-04:** Table layout (not card list). Columns: Item Name, Manufacturer, Status (dropdown badge), Expected Delivery (red if overdue per Phase 23 D-09), Carrier (icon link parsed from trackingUrl domain), Actions (edit/remove). Compact and scannable.
- **D-05:** Overdue definition carried from Phase 23 D-09: `expectedDeliveryDate` is in the past AND `status` is not "delivered" or "installed". Red date text for overdue items.
- **D-06:** Carrier icon link: detect carrier from `trackingUrl` domain (fedex.com → FedEx icon, ups.com → UPS icon, etc.). Icon links to the full tracking URL in a new tab. If no `trackingUrl`, show tracking number as plain gray monospace text. If neither, column is empty. Live tracking status fetch is deferred to Phase 27.1.

### Add/Remove Items
- **D-07:** "Add Item" button above the table opens a slide-out panel from the right with the full procurement form. Same slide-out panel used for editing existing items. Keeps the table visible for context.
- **D-08:** Slide-out panel form fields (in order): name (required), manufacturer, status (dropdown), quantity, retail price, client cost, order date, expected delivery date, install date, tracking number, tracking URL, files (upload section), notes (textarea).
- **D-09:** Remove action via a three-dot overflow menu or delete icon on each table row. Click triggers a small confirmation dialog: "Remove [Item Name]?" with Cancel/Remove buttons. Removal patches Sanity to unset the array item.
- **D-10:** New items are appended to the `procurementItems` array via `sanityWriteClient.patch(projectId).append('procurementItems', [newItem]).commit()`.

### File Uploads
- **D-11:** Files section inside the slide-out panel. Drag-and-drop zone or file picker. Uploads go to Vercel Blob via API route (same pattern as existing blob upload infrastructure). Shows thumbnails for images, filename+size for documents.
- **D-12:** Each file gets a label field (free text, e.g., "COM form — Kravet", "Receipt 04/01") matching the existing schema shape (`files[].label` + `files[].file`).
- **D-13:** File deletion removes the Blob object and updates the Sanity document in a single operation.

### Component Architecture
- **D-14:** The procurement page at `/admin/projects/[projectId]/procurement` is an SSR Astro page. It fetches procurement data via a new GROQ query and passes it to a React island for interactive table + slide-out panel.
- **D-15:** All Sanity mutations go through server-side API routes (`/api/admin/update-procurement-status`, `/api/admin/update-procurement-item`, `/api/admin/upload-procurement-file`). The React island never imports `sanityWriteClient`.
- **D-16:** Breadcrumbs: Projects > [Project Name] > Procurement (per Phase 26 D-07 breadcrumb pattern).

### Claude's Discretion
- Exact slide-out panel animation and width
- Table sorting (by status pipeline order, alphabetical, or no sorting)
- Carrier icon set and detection heuristics
- File upload progress indicator design
- Confirmation dialog styling

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 23 Design (carry-forward)
- `.planning/phases/23-custom-list-ui/23-CONTEXT.md` — Original visual design decisions (D-01 through D-15) for procurement interaction; adapt for admin context
- `.planning/phases/23-custom-list-ui/23-UI-SPEC.md` — Visual spec for procurement list items, badge colors, row layout, overdue styling
- `.planning/phases/23-custom-list-ui/23-DISCUSSION-LOG.md` — Design rationale for status dropdown, tracking links, overflow menu

### Schema & Data
- `src/sanity/schemas/project.ts` lines 402-550 — `procurementItems` array definition with all 14 fields (name through notes)
- `src/lib/procurementStages.ts` — PROCUREMENT_STAGES, PROCUREMENT_STAGE_META, getProcurementTone() — single source of truth for 6-stage pipeline
- `src/lib/procurementStages.test.ts` — Existing stage constant tests

### Portal Reference (read-only table to model from)
- `src/components/portal/ProcurementTable.astro` — Client-facing read-only procurement table with STATUS_STYLES badge color map, status sorting, tracking info display
- `src/lib/trackingUrl.ts` — getTrackingInfo() utility for tracking number display (if exists)

### Admin Infrastructure (Phase 25-26 patterns)
- `src/pages/admin/projects/[projectId]/index.astro` — Overview page pattern; procurement sub-section card links here
- `src/pages/api/admin/update-project.ts` — Admin API route pattern: prerender=false, getSession auth check, sanityWriteClient mutations
- `src/pages/api/admin/update-project.test.ts` — API route test pattern with mocked session and writeClient
- `src/layouts/AdminLayout.astro` — Breadcrumb support via props
- `src/components/admin/ProjectEditForm.tsx` — React island form pattern with save/discard, success/error messages

### v5.0 Strategic Plan
- `.planning/references/v5-custom-admin-plan.md` — Overall admin migration strategy; Phase 27 scope definition

### Requirements
- `.planning/REQUIREMENTS.md` — LIST-01 through LIST-06, EDIT-01, EDIT-02 (from Phase 23, now applied to admin)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/procurementStages.ts` — Stage constants, labels, tones — consume directly for dropdown options and badge colors
- `src/components/portal/ProcurementTable.astro` — STATUS_STYLES badge color map (stone, amber, terracotta, blue, emerald) — reuse these exact classes in admin
- `src/lib/trackingUrl.ts` — Tracking info utility (if exists) — check for carrier detection logic
- `src/pages/api/admin/update-project.ts` — API route pattern with admin auth check — duplicate for procurement endpoints
- `src/components/admin/ProjectEditForm.tsx` — React island form pattern with state management, save/error handling

### Established Patterns
- Admin API routes: `prerender=false`, `getSession()` auth check, `sanityWriteClient.patch().set().commit()` for mutations
- React islands: `client:load` on Astro pages, data passed as serialized props from SSR
- Breadcrumbs: array of `{label, href}` pairs passed to AdminLayout
- Badge colors: inline Tailwind classes per status value (STATUS_STYLES map)
- File uploads: Vercel Blob via API route (existing blob infrastructure in the project)

### Integration Points
- `/admin/projects/[projectId]/procurement` — new Astro page consuming AdminLayout with breadcrumbs
- `/api/admin/update-procurement-status` — new API route for inline status patching
- `/api/admin/update-procurement-item` — new API route for full item CRUD (add/edit/remove)
- `/api/admin/upload-procurement-file` — new API route for Vercel Blob file upload
- New GROQ query in `src/sanity/queries.ts` for full procurement item data per project

</code_context>

<specifics>
## Specific Ideas

- Carrier icon links parsed from `trackingUrl` domain (fedex.com → FedEx icon, ups.com → UPS, etc.) — visual shorthand for which carrier is handling each item
- Live tracking status retrieval deferred to Phase 27.1 as a fast-follow

</specifics>

<deferred>
## Deferred Ideas

- **Phase 27.1: Live Carrier Tracking Status** — Server-side fetch of tracking status from carrier APIs (FedEx, UPS, DHL) on page load. Requires API key setup, carrier detection, caching strategy, and error handling. Surfaces as a status badge or text next to the carrier icon.
- **Carrier API integration** — Originally deferred from Phase 23 discussion; carrier icon links in Phase 27 are the stepping stone.
- **Drag-to-reorder** — Phase 23 D-07 included drag handles. Deferred for admin unless specifically needed; current table layout doesn't require reordering.

</deferred>

---

*Phase: 27-procurement-editor*
*Context gathered: 2026-04-06*
