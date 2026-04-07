# Phase 27: Procurement Editor - Research

**Researched:** 2026-04-06
**Domain:** Astro SSR admin page with React island for interactive procurement CRUD, Sanity Content Lake mutations, Vercel Blob file uploads
**Confidence:** HIGH

## Summary

Phase 27 builds a procurement editor within the custom admin at `/admin/projects/[projectId]/procurement`. This is an SSR Astro page that renders a React island containing an interactive procurement table with inline status editing, a slide-out panel for add/edit, file uploads via Vercel Blob, and item removal with confirmation. All mutations go through server-side API routes that authenticate via `getSession()` and use `sanityWriteClient`.

The project already has every building block needed: the admin layout with breadcrumbs (Phase 25-26), the Sanity schema with all 14 procurement fields, the `PROCUREMENT_STAGES` constants, the `STATUS_STYLES` badge color map from the portal table, the `isOverdue()` function, the `getTrackingInfo()` carrier detection utility, the `formatCurrency()` helper, `@vercel/blob` upload infrastructure, and the exact API route pattern with session auth guards. No new dependencies are required.

**Primary recommendation:** Build three API routes (status patch, item CRUD, file upload) following the `update-project.ts` pattern, then a single React island component (`ProcurementEditor.tsx`) containing the table, inline status dropdown, slide-out panel form, and file upload section. Reuse existing utilities directly -- do not duplicate any logic.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Clicking a status badge in the table opens a dropdown showing all 6 procurement stages (Not Yet Ordered through Installed). Selecting a new stage immediately patches Sanity via a server-side API route. No form submission or "Save" button needed for status changes.
- **D-02:** The status badge colors use the portal's established `STATUS_STYLES` map from `ProcurementTable.astro` (stone, amber, terracotta, blue, emerald) -- NOT Sanity tones. This keeps the admin visually consistent with the portal.
- **D-03:** The inline dropdown is a React island component. Status change triggers `fetch('/api/admin/update-procurement-status', { projectId, itemKey, status })`.
- **D-04:** Table layout (not card list). Columns: Item Name, Manufacturer, Status (dropdown badge), Expected Delivery (red if overdue per Phase 23 D-09), Carrier (icon link parsed from trackingUrl domain), Actions (edit/remove). Compact and scannable.
- **D-05:** Overdue definition carried from Phase 23 D-09: `expectedDeliveryDate` is in the past AND `status` is not "delivered" or "installed". Red date text for overdue items.
- **D-06:** Carrier icon link: detect carrier from `trackingUrl` domain (fedex.com -> FedEx icon, ups.com -> UPS icon, etc.). Icon links to the full tracking URL in a new tab. If no `trackingUrl`, show tracking number as plain gray monospace text. If neither, column is empty. Live tracking status fetch is deferred to Phase 27.1.
- **D-07:** "Add Item" button above the table opens a slide-out panel from the right with the full procurement form. Same slide-out panel used for editing existing items. Keeps the table visible for context.
- **D-08:** Slide-out panel form fields (in order): name (required), manufacturer, status (dropdown), quantity, retail price, client cost, order date, expected delivery date, install date, tracking number, tracking URL, files (upload section), notes (textarea).
- **D-09:** Remove action via a three-dot overflow menu or delete icon on each table row. Click triggers a small confirmation dialog: "Remove [Item Name]?" with Cancel/Remove buttons. Removal patches Sanity to unset the array item.
- **D-10:** New items are appended to the `procurementItems` array via `sanityWriteClient.patch(projectId).append('procurementItems', [newItem]).commit()`.
- **D-11:** Files section inside the slide-out panel. Drag-and-drop zone or file picker. Uploads go to Vercel Blob via API route (same pattern as existing blob upload infrastructure). Shows thumbnails for images, filename+size for documents.
- **D-12:** Each file gets a label field (free text, e.g., "COM form -- Kravet", "Receipt 04/01") matching the existing schema shape (`files[].label` + `files[].file`).
- **D-13:** File deletion removes the Blob object and updates the Sanity document in a single operation.
- **D-14:** The procurement page at `/admin/projects/[projectId]/procurement` is an SSR Astro page. It fetches procurement data via a new GROQ query and passes it to a React island for interactive table + slide-out panel.
- **D-15:** All Sanity mutations go through server-side API routes (`/api/admin/update-procurement-status`, `/api/admin/update-procurement-item`, `/api/admin/upload-procurement-file`). The React island never imports `sanityWriteClient`.
- **D-16:** Breadcrumbs: Projects > [Project Name] > Procurement (per Phase 26 D-07 breadcrumb pattern).

### Claude's Discretion
- Exact slide-out panel animation and width
- Table sorting (by status pipeline order, alphabetical, or no sorting)
- Carrier icon set and detection heuristics
- File upload progress indicator design
- Confirmation dialog styling

### Deferred Ideas (OUT OF SCOPE)
- **Phase 27.1: Live Carrier Tracking Status** -- Server-side fetch of tracking status from carrier APIs (FedEx, UPS, DHL) on page load.
- **Carrier API integration** -- Originally deferred from Phase 23 discussion.
- **Drag-to-reorder** -- Phase 23 D-07 included drag handles. Deferred for admin.
</user_constraints>

## Project Constraints (from CLAUDE.md)

- No new npm dependencies unless explicitly approved (STATE.md [v4.2] -- but this project already has all needed packages)
- Credentials via environment variables only -- never hardcode
- `clientCost` is NEVER included in client-facing projections (but IS included in admin since Liz is the admin)
- Financial values stored as integer cents with `.integer()` validation (PROC-03)
- No AI attribution in commits
- Verify ports against registry; use assigned ports only
- Sanity Content Lake stays; only Studio UI is retired

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| astro | ^6.0.4 (installed) | SSR page at `/admin/projects/[projectId]/procurement` | Project framework [VERIFIED: package.json] |
| react | ^19.2.4 (installed) | Interactive island component for table + slide-out | Project framework [VERIFIED: package.json] |
| @sanity/client | ^7.17.0 (installed) | GROQ queries + write mutations via API routes | Project data layer [VERIFIED: package.json] |
| @vercel/blob | ^2.3.1 (installed) | File upload (put) and deletion (del) for procurement files | Project file storage [VERIFIED: package.json] |
| tailwindcss | ^4.2.1 (installed) | All styling via Tailwind utility classes | Project styling [VERIFIED: package.json] |
| date-fns | ^4.1.0 (installed) | Date formatting for delivery dates | Project utility [VERIFIED: package.json] |
| lucide-react | ^1.7.0 (installed) | Icons for table actions, carrier indicators, panel controls | Project icon library [VERIFIED: package.json] |
| vitest | ^3.2.4 (installed) | API route and utility unit tests | Project test framework [VERIFIED: package.json] |

### Supporting (existing utilities to reuse)
| Library/Module | Path | Purpose | When to Use |
|---------|---------|---------|-------------|
| `procurementStages.ts` | `src/lib/procurementStages.ts` | 6-stage pipeline constants, labels, types | Dropdown options, badge rendering [VERIFIED: codebase] |
| `trackingUrl.ts` | `src/lib/trackingUrl.ts` | Carrier detection from tracking numbers (UPS/FedEx/USPS) | Fallback carrier detection when no `trackingUrl` set [VERIFIED: codebase] |
| `formatCurrency.ts` | `src/lib/formatCurrency.ts` | Integer cents to dollar string formatting | Retail price and client cost display [VERIFIED: codebase] |
| `generateToken.ts` | `src/lib/generateToken.ts` | `generatePortalToken(8)` for Sanity `_key` generation | All new array items need unique `_key` values [VERIFIED: codebase] |
| `session.ts` | `src/lib/session.ts` | `getSession(cookies)` for admin auth | All API routes require session check [VERIFIED: codebase] |
| `writeClient.ts` | `src/sanity/writeClient.ts` | `sanityWriteClient` for Content Lake mutations | All API route mutations [VERIFIED: codebase] |
| `isOverdue()` | `src/sanity/components/ProcurementListItem.tsx:57` | Overdue detection logic (date in past + status not delivered/installed) | Reuse in admin table -- extract to shared location or import directly [VERIFIED: codebase] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom slide-out panel | headless UI library (Radix Dialog) | Adds dependency; simple CSS transform + fixed positioning achieves same result with zero new deps |
| Inline `<select>` for status | Custom dropdown component | Native select is functional but less styled; custom dropdown matches portal badge style better |
| FormData API for file upload | `@vercel/blob/client` `upload()` | `upload()` is used in Studio's BlobFileInput but requires client-side callback URL setup; direct FormData to API route (existing `blob-upload.ts` PUT handler) is simpler for admin context |

**Installation:**
```bash
# No new packages needed -- all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  pages/admin/projects/[projectId]/
    procurement.astro              # NEW: SSR page with GROQ fetch + React island
  pages/api/admin/
    update-procurement-status.ts   # NEW: Inline status PATCH
    update-procurement-item.ts     # NEW: Add/edit/remove item
    upload-procurement-file.ts     # NEW: Vercel Blob file upload + Sanity link
  components/admin/
    ProcurementEditor.tsx          # NEW: React island (table + slide-out + dialogs)
  sanity/queries.ts                # MODIFY: Add ADMIN_PROCUREMENT_QUERY
  lib/
    isOverdue.ts                   # NEW: Extract from ProcurementListItem.tsx for sharing
```

### Pattern 1: SSR Page with React Island (established)
**What:** Astro page fetches data server-side via GROQ, serializes as props to a React `client:load` island.
**When to use:** Any admin page requiring interactivity.
**Example:**
```typescript
// Source: src/pages/admin/projects/[projectId]/index.astro (established pattern)
---
export const prerender = false;
import AdminLayout from "../../../../layouts/AdminLayout.astro";
import { getAdminProcurementData } from "../../../../sanity/queries";

const projectId = Astro.params.projectId;
const data = await getAdminProcurementData(projectId);
const breadcrumbs = [
  { label: "Projects", href: "/admin/projects" },
  { label: data.projectTitle, href: `/admin/projects/${projectId}` },
  { label: "Procurement" },
];
---
<AdminLayout title="Procurement" pageTitle="Procurement" breadcrumbs={breadcrumbs}>
  <ProcurementEditor client:load items={data.procurementItems} projectId={projectId} />
</AdminLayout>
```

### Pattern 2: Admin API Route with Auth Guard (established)
**What:** `prerender = false`, `getSession()` check for admin role, parse JSON body, mutate via `sanityWriteClient`, return JSON response.
**When to use:** Every admin mutation endpoint.
**Example:**
```typescript
// Source: src/pages/api/admin/update-project.ts (exact pattern to follow)
export const prerender = false;
import type { APIRoute } from "astro";
import { getSession } from "../../../lib/session";
import { sanityWriteClient } from "../../../sanity/writeClient";

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }
  // ... parse body, validate, mutate, return
};
```

### Pattern 3: Sanity Array Mutations (established)
**What:** `sanityWriteClient` provides chainable patch operations for array CRUD.
**When to use:** Adding, updating, and removing procurement items.
**Examples from codebase:**
```typescript
// APPEND to array (Source: src/pages/api/rendering/react.ts:86-98)
await sanityWriteClient
  .patch(projectId)
  .setIfMissing({ procurementItems: [] })
  .append("procurementItems", [{
    _key: generatePortalToken(8),
    name, manufacturer, status, /* ... all fields */
  }])
  .commit();

// UPDATE specific array item by _key (set nested field)
await sanityWriteClient
  .patch(projectId)
  .set({ [`procurementItems[_key=="${itemKey}"].status`]: newStatus })
  .commit();

// REMOVE array item by _key (Source: src/pages/api/rendering/react.ts:120-124)
await sanityWriteClient
  .patch(projectId)
  .unset([`procurementItems[_key=="${itemKey}"]`])
  .commit();
```

### Pattern 4: Vercel Blob Upload via API Route (established)
**What:** Client sends FormData with file to API route; route uses `put()` from `@vercel/blob`; returns `{ url, pathname }`.
**When to use:** Procurement file uploads.
**Example:**
```typescript
// Source: src/pages/api/blob-upload.ts (PUT handler, lines 7-49)
import { put } from "@vercel/blob";

const formData = await request.formData();
const file = formData.get("file");
const blob = await put(file.name, file, { access: "public", addRandomSuffix: true });
return Response.json({ url: blob.url, pathname: blob.pathname });
```

### Pattern 5: Vercel Blob Deletion (new but documented)
**What:** `del()` from `@vercel/blob` removes a blob by URL or pathname.
**When to use:** When deleting procurement file attachments (D-13).
**Example:**
```typescript
// [VERIFIED: @vercel/blob exports include del() -- confirmed via node import test]
import { del } from "@vercel/blob";

// Delete blob before removing from Sanity document
await del(blobUrl);
await sanityWriteClient
  .patch(projectId)
  .unset([`procurementItems[_key=="${itemKey}"].files[_key=="${fileKey}"]`])
  .commit();
```

### Pattern 6: Carrier Detection from URL Domain (new)
**What:** Parse `trackingUrl` to extract carrier from domain, use for icon display.
**When to use:** D-06 carrier icon links in the table.
**Example:**
```typescript
// New utility function for domain-based carrier detection
function getCarrierFromUrl(trackingUrl: string): { carrier: string; label: string } | null {
  try {
    const hostname = new URL(trackingUrl).hostname.toLowerCase();
    if (hostname.includes("fedex.com")) return { carrier: "fedex", label: "FedEx" };
    if (hostname.includes("ups.com")) return { carrier: "ups", label: "UPS" };
    if (hostname.includes("usps.com")) return { carrier: "usps", label: "USPS" };
    if (hostname.includes("dhl.com")) return { carrier: "dhl", label: "DHL" };
    return { carrier: "unknown", label: "Track" };
  } catch {
    return null; // Invalid URL
  }
}
```

### Anti-Patterns to Avoid
- **Importing `sanityWriteClient` in React components:** All mutations must go through API routes (D-15). The write token must never be exposed to the browser.
- **Hardcoding status colors:** Use the `STATUS_STYLES` map from `ProcurementTable.astro` as the canonical source (D-02). Copy the exact Tailwind classes.
- **Storing financial values as floats:** All prices are integer cents (PROC-03 convention). Display with `formatCurrency()`.
- **Using `crypto.randomUUID()` for `_key`:** The established pattern is `generatePortalToken(8)` for 8-character alphanumeric keys. The one `crypto.randomUUID()` usage in `update-project.ts` is an inconsistency -- follow the majority pattern.
- **Fetching `clientCost` in portal-facing queries:** The admin IS Liz, so `clientCost` should be visible in admin context (unlike portal GROQ queries that exclude it).
- **Rendering raw HTML from user input:** React auto-escapes JSX content. Never use raw HTML injection for user-provided fields like item names or notes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Status stage constants | Your own status list | `PROCUREMENT_STAGES` from `src/lib/procurementStages.ts` | Single source of truth for 6 stages, labels, and tones [VERIFIED: codebase] |
| Overdue detection | Custom date comparison | `isOverdue()` from `ProcurementListItem.tsx` (extract to shared lib) | Already tested with 7 test cases [VERIFIED: codebase] |
| Currency formatting | `toFixed(2)` or template strings | `formatCurrency()` from `src/lib/formatCurrency.ts` | Handles whole dollars vs cents display correctly [VERIFIED: codebase] |
| Tracking number carrier detection | Regex matching from scratch | `getTrackingInfo()` from `src/lib/trackingUrl.ts` | Already handles UPS, FedEx, USPS patterns with tests [VERIFIED: codebase] |
| Sanity `_key` generation | `Math.random()` or UUID | `generatePortalToken(8)` from `src/lib/generateToken.ts` | Established project pattern for all array item keys [VERIFIED: codebase] |
| Session auth check | Custom cookie parsing | `getSession(cookies)` from `src/lib/session.ts` | Established admin auth pattern [VERIFIED: codebase] |
| Blob upload | Multipart handling from scratch | `put()` from `@vercel/blob` via existing `blob-upload.ts` pattern | Already handles file type validation, random suffix [VERIFIED: codebase] |

**Key insight:** This phase is almost entirely assembly of existing patterns. Every utility, every API route pattern, every GROQ query shape already exists in the codebase. The risk is NOT "can we build this?" -- it is "will we accidentally duplicate or deviate from established patterns?"

## Common Pitfalls

### Pitfall 1: Status Badge Click Opens Edit Dialog
**What goes wrong:** Clicking the status dropdown inside the table row also triggers the row's click handler, opening the edit panel.
**Why it happens:** Event bubbling -- the badge is inside a clickable row.
**How to avoid:** Use `e.stopPropagation()` on the status dropdown container, exactly as done in the Studio's `ProcurementListItem.tsx` (the existing component already solved this with `stopPropagation`).
**Warning signs:** Clicking a status badge opens both the dropdown AND the slide-out panel.

### Pitfall 2: Missing `_key` on New Array Items
**What goes wrong:** Sanity rejects the mutation or items become unaddressable.
**Why it happens:** Sanity inline arrays require `_key` on every object member. Forgetting this on nested `files[]` items is especially common.
**How to avoid:** Always include `_key: generatePortalToken(8)` on every object appended to any array -- both `procurementItems[]` entries AND their nested `files[]` entries.
**Warning signs:** `422 Unprocessable Entity` from Sanity API; "Missing _key" error messages.

### Pitfall 3: Blob Deletion Race Condition
**What goes wrong:** Blob is deleted from Vercel but Sanity still references it (or vice versa).
**Why it happens:** Two separate services (Vercel Blob + Sanity) require atomic updates but have no transaction support.
**How to avoid:** Delete blob first (if it fails, Sanity still references a valid file -- recoverable). Then update Sanity. If Sanity update fails, you have an orphaned blob (acceptable -- orphan cleanup is a future concern, per existing codebase comment in `BlobFileInput.tsx` line 42).
**Warning signs:** Broken file links in the UI; 404 errors when serving files.

### Pitfall 4: Overdue Date Calculation Timezone Mismatch
**What goes wrong:** Items show as overdue when they shouldn't, or vice versa, depending on user timezone.
**Why it happens:** Sanity stores dates as `YYYY-MM-DD` strings. `new Date("2026-04-06")` is interpreted as UTC midnight, which is yesterday in US timezones.
**How to avoid:** The existing `isOverdue()` function uses `new Date(expectedDeliveryDate) < new Date()` which works consistently. Reuse it -- do not rewrite the comparison logic.
**Warning signs:** Items flipping between overdue/not-overdue depending on time of day.

### Pitfall 5: File Upload Without Auth
**What goes wrong:** Unauthenticated users can upload files to Vercel Blob.
**Why it happens:** The existing `blob-upload.ts` does NOT check session (it was designed for Studio, which has its own auth). The new admin upload route MUST add `getSession()` check.
**How to avoid:** Create a new `/api/admin/upload-procurement-file` route that adds the standard admin auth guard before calling `put()`. Do NOT reuse the existing `/api/blob-upload` endpoint directly from the admin -- it lacks session auth.
**Warning signs:** Blob storage costs from unauthorized uploads; security audit failures.

### Pitfall 6: Stale Table Data After Mutation
**What goes wrong:** After changing status or adding an item, the table still shows old data.
**Why it happens:** React state is not updated after the API call. The Astro page SSR'd the initial data, but the React island manages its own state.
**How to avoid:** Maintain procurement items in React state. After a successful API mutation, update local state optimistically or refetch. The `ProjectEditForm.tsx` pattern redirects after save, but for inline edits (status changes), optimistic local state update is better UX.
**Warning signs:** User changes status but badge does not update until page refresh.

### Pitfall 7: Carrier Detection Mismatch Between D-06 Approaches
**What goes wrong:** D-06 says "detect carrier from `trackingUrl` domain" but existing `getTrackingInfo()` detects from tracking NUMBER format.
**Why it happens:** Two different detection strategies exist. The CONTEXT.md is clear: use URL domain when `trackingUrl` is provided.
**How to avoid:** Implement URL-domain detection for the carrier icon (primary). Fall back to `getTrackingInfo(trackingNumber)` only when there is no `trackingUrl` but there IS a `trackingNumber`. If neither exists, show nothing.
**Warning signs:** Items with `trackingUrl` set but showing wrong carrier icon.

## Code Examples

### GROQ Query for Admin Procurement Data
```typescript
// Source: Pattern from ADMIN_PROJECT_DETAIL_QUERY in queries.ts [VERIFIED: codebase]
// Note: Admin context INCLUDES clientCost (Liz needs to see costs)
export const ADMIN_PROCUREMENT_QUERY = `
  *[_type == "project" && _id == $projectId][0] {
    _id,
    title,
    "procurementItems": procurementItems[] {
      _key,
      name,
      manufacturer,
      status,
      quantity,
      retailPrice,
      clientCost,
      orderDate,
      expectedDeliveryDate,
      installDate,
      trackingNumber,
      trackingUrl,
      files[] {
        _key,
        label,
        file
      },
      notes
    }
  }
`;
```

### Status Update API Route
```typescript
// Source: Combines update-project.ts auth pattern + array field set pattern
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session || session.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const { projectId, itemKey, status } = await request.json();
  // Validate status is a valid procurement stage
  if (!PROCUREMENT_STAGES.some(s => s.value === status)) {
    return new Response(JSON.stringify({ error: "Invalid status" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  await sanityWriteClient
    .patch(projectId)
    .set({ [`procurementItems[_key=="${itemKey}"].status`]: status })
    .commit();

  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
};
```

### Slide-Out Panel Pattern
```tsx
// Recommendation: CSS transform + fixed positioning for zero-dependency slide-out
function SlideOutPanel({ open, onClose, children }: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-cream border-l border-stone-light/30 z-50
          transform transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="h-full overflow-y-auto px-6 py-8">
          {children}
        </div>
      </div>
    </>
  );
}
```

### STATUS_STYLES Badge Map (reuse from portal)
```typescript
// Source: src/components/portal/ProcurementTable.astro lines 47-54 [VERIFIED: codebase]
// Copy these exact Tailwind classes into the React island
const STATUS_STYLES: Record<string, string> = {
  "not-yet-ordered": "bg-stone-light/20 text-stone",
  ordered: "bg-amber-50 text-amber-700",
  "in-transit": "bg-terracotta/10 text-terracotta",
  warehouse: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  installed: "bg-emerald-100 text-emerald-800",
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sanity Studio custom components | Custom admin at `/admin/*` | v5.0 (Phase 25) | All new editors built as Astro+React pages, not Studio plugins |
| Sanity tones for badges | Portal `STATUS_STYLES` Tailwind classes | v5.0 D-02 | Admin matches portal aesthetic, not Studio chrome |
| `getTrackingInfo(number)` only | URL-domain detection primary, number fallback | Phase 27 D-06 | More reliable carrier detection when URL is provided |
| Studio's BlobFileInput with `@vercel/blob/client` | Server-side upload via API route with admin auth | Phase 27 D-15 | Admin file uploads go through auth-guarded API routes |

**Deprecated/outdated:**
- `src/sanity/components/ProcurementTableInput.tsx` and `ProcurementListItem.tsx`: These are Studio-specific components. The admin builds its own React table. However, the `isOverdue()` function should be extracted and shared.
- `src/sanity/components/BlobFileInput.tsx`: Studio-specific upload widget. Admin uses direct FormData upload to API route instead.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Slide-out panel width of 480px is appropriate | Architecture Patterns | Minor -- easily adjusted via CSS |
| A2 | DHL should be included in carrier detection alongside UPS/FedEx/USPS | Code Examples | Low -- easy to add/remove carriers |
| A3 | `isOverdue()` should be extracted to `src/lib/isOverdue.ts` rather than imported from the Studio component | Architecture Patterns | Low -- either approach works; extraction is cleaner for long-term Studio retirement |
| A4 | File uploads should use direct FormData PUT to a new admin route rather than `@vercel/blob/client` upload() | Standard Stack | Low -- both work; FormData approach is simpler and avoids callback URL setup |

## Open Questions (RESOLVED)

1. **Should `isOverdue()` be extracted to a shared lib or duplicated?**
   - RESOLVED: Extract to `src/lib/isOverdue.ts` and update the Studio component to import from there. Plan 01 Task 1 implements this extraction with full test migration. This aligns with the Studio retirement trajectory.

2. **Should the admin file upload route reuse `/api/blob-upload` or create a new auth-guarded route?**
   - RESOLVED: Create new `/api/admin/upload-procurement-file` with admin auth guard. Plan 02 Task 2 implements this as a dedicated route. The existing `/api/blob-upload` remains untouched for Studio backward compatibility.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01/D-03 | Status patch API route returns 200 on valid request | unit | `npx vitest run src/pages/api/admin/update-procurement-status.test.ts -x` | Wave 0 |
| D-01/D-03 | Status patch rejects invalid status values | unit | same as above | Wave 0 |
| D-09/D-10 | Item CRUD API route: add appends, remove unsets, edit updates | unit | `npx vitest run src/pages/api/admin/update-procurement-item.test.ts -x` | Wave 0 |
| D-11/D-13 | File upload API route: validates file type, returns pathname | unit | `npx vitest run src/pages/api/admin/upload-procurement-file.test.ts -x` | Wave 0 |
| Auth | All 3 API routes return 401 without admin session | unit | all test files above | Wave 0 |
| D-05 | `isOverdue()` extracted utility works correctly | unit | `npx vitest run src/lib/isOverdue.test.ts -x` | Wave 0 (move from existing ProcurementListItem tests) |
| D-06 | Carrier detection from URL domain works for FedEx/UPS/USPS/DHL | unit | `npx vitest run src/lib/carrierFromUrl.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/pages/api/admin/update-procurement-status.test.ts` -- covers D-01/D-03
- [ ] `src/pages/api/admin/update-procurement-item.test.ts` -- covers D-09/D-10
- [ ] `src/pages/api/admin/upload-procurement-file.test.ts` -- covers D-11/D-13
- [ ] `src/lib/isOverdue.test.ts` -- moved from Studio component tests, covers D-05
- [ ] `src/lib/carrierFromUrl.test.ts` -- covers D-06

### Existing Test Coverage (reusable)
- `src/sanity/components/__tests__/ProcurementListItem.test.tsx` -- 7 `isOverdue` test cases (move to shared lib)
- `src/lib/trackingUrl.test.ts` -- carrier detection from tracking numbers (keep as-is)
- `src/pages/api/admin/update-project.test.ts` -- API route auth guard test pattern to duplicate

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `getSession(cookies)` admin role check on all API routes |
| V3 Session Management | yes | Existing JWT cookie session from Phase 25 |
| V4 Access Control | yes | `session.role !== "admin"` guard; write token server-side only |
| V5 Input Validation | yes | Validate status against `PROCUREMENT_STAGES`; validate file types; validate required fields |
| V6 Cryptography | no | No new crypto operations |

### Known Threat Patterns for Astro + Sanity + Vercel Blob

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized Sanity mutations | Elevation of Privilege | Session auth guard on every API route; write token never exposed to client |
| Malicious file upload | Tampering | Allowlist file types (PDF, JPEG, PNG, WebP); validate on server side |
| Path traversal in blob pathname | Information Disclosure | Use `put()` with `addRandomSuffix: true`; never construct pathnames from user input |
| IDOR on projectId/itemKey | Elevation of Privilege | Admin-only role check (single admin); future multi-tenant would need project-scoped authorization |
| XSS in item names/notes | Spoofing | React auto-escapes JSX content; avoid raw HTML injection patterns |

## Sources

### Primary (HIGH confidence)
- `src/pages/api/admin/update-project.ts` -- API route auth pattern (read directly)
- `src/pages/api/admin/update-project.test.ts` -- Test pattern (read directly)
- `src/sanity/schemas/project.ts` lines 402-559 -- Full procurement schema (read directly)
- `src/lib/procurementStages.ts` -- Stage constants (read directly)
- `src/components/portal/ProcurementTable.astro` -- STATUS_STYLES map (read directly)
- `src/lib/trackingUrl.ts` -- Carrier detection utility (read directly)
- `src/lib/formatCurrency.ts` -- Currency formatter (read directly)
- `src/pages/api/blob-upload.ts` -- Blob upload pattern (read directly)
- `src/pages/api/blob-serve.ts` -- Blob serve + auth pattern (read directly)
- `src/sanity/writeClient.ts` -- Write client setup (read directly)
- `src/sanity/queries.ts` -- All GROQ query patterns (read directly)
- `src/components/admin/ProjectEditForm.tsx` -- React island form pattern (read directly)
- `src/layouts/AdminLayout.astro` -- Admin layout + breadcrumbs (read directly)
- `src/pages/admin/projects/[projectId]/index.astro` -- Project overview page pattern (read directly)
- `package.json` -- All dependency versions (read directly)
- `npm view @vercel/blob version` -- Registry confirms 2.3.3 (verified)
- `@vercel/blob` exports -- `del` function confirmed available (verified via node import test)

### Secondary (MEDIUM confidence)
- `.planning/phases/23-custom-list-ui/23-UI-SPEC.md` -- Phase 23 visual design contract (read directly)
- `.planning/phases/23-custom-list-ui/23-DISCUSSION-LOG.md` -- Design rationale (read directly)
- `.planning/references/v5-custom-admin-plan.md` -- Admin migration strategy (read directly)

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or npm registry.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- every dependency already installed, versions verified against npm registry
- Architecture: HIGH -- every pattern exists in the codebase; this phase assembles existing patterns
- Pitfalls: HIGH -- identified from actual codebase patterns and known React/Sanity interaction issues

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30 days -- stable stack, no fast-moving dependencies)
