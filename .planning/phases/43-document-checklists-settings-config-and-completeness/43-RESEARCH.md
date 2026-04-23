# Phase 43: Document Checklists, Settings Config, and Completeness — Research

**Researched:** 2026-04-23
**Domain:** React component architecture, Sanity GROQ projection, Astro SSR prop-passing, settings save pipeline
**Confidence:** HIGH — all findings verified against live codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** The existing flat "Documents" section in `EntityDetailForm` is **replaced** by a structured checklist. Each row represents one required checklist item for the record's relationship type.

**D-02:** Each checklist row shows: item label, status (uploaded / missing), filename if uploaded, View link if uploaded, delete (✕) button if uploaded, Upload button if missing.

**D-03:** One document per checklist item. If multiple docs are uploaded for the same type, only the most recent (or first) is shown in the checklist row — extras go to "Other documents."

**D-04:** Any uploaded document whose `docType` does not match any current checklist item label renders in an **"Other documents"** section below the checklist. This handles legacy docs and ad-hoc uploads.

**D-05:** The document type dropdown (previously a hardcoded select) is removed from the upload flow. Upload is initiated from a specific checklist row, which implicitly sets the `docType`.

**D-06:** When uploading from a specific checklist row, the document's `docType` is set to the checklist item's **label string** (e.g., `"Trade license"`, `"W-9"`). No slug or key system needed.

**D-07:** Existing documents with old hardcoded `docType` values (`"1099"`, `"insurance"`, `"contract"`, `"other"`) are **not migrated**. They appear in "Other documents." Consistent with D-18 (no Sanity data migration policy).

**D-08:** Matching is by exact string equality between `document.docType` and the checklist item label. Case-sensitivity follows the stored label exactly.

**D-09:** Amber indicator definition: any Trades record where **at least one checklist item** for its relationship type has no uploaded document (i.e., no document in `record.documents[]` has a matching `docType`).

**D-10:** Required fields (name, email, relationship) are already schema-enforced and always present post-creation. The completeness indicator is **documents only** — phone, trades, address, and other optional fields do not contribute.

**D-11:** Indicator appearance: amber dot inline in the Trades list. Exact placement is Claude's discretion (e.g., left of the name or in its own column).

**D-12:** Records with no relationship set (edge case) are treated as incomplete by default.

**D-13:** Two separate `CollapsibleSection` entries in `SettingsPage`: **"Contractor Checklist"** and **"Vendor Checklist"**. Each follows the same add/rename/delete pattern as `TradesCatalogSection` (Phase 40).

**D-14:** Each section manages its own array: `contractorChecklistItems[]` and `vendorChecklistItems[]` on `siteSettings`.

**D-15:** Delete guard: if any Trades record has a document with `docType` matching the item label, the delete button for that item is **disabled** with a tooltip: `"This type has documents — remove documents from all trades first."` The guard is enforced client-side.

**D-16:** Reordering is not required for checklist items in this phase.

**D-17:** Save flow follows the existing pattern: a dedicated API action (`updateContractorChecklistItems`, `updateVendorChecklistItems`) separate from the general settings save, consistent with how `updateTrades` works.

### Claude's Discretion

- Exact placement of the amber indicator in the EntityListPage row (column vs. inline dot next to name)
- How "Other documents" upload works — whether the "Upload" button in that section sets docType to empty string or prompts for a freeform label
- Whether the delete guard check is done on Settings page load (API fetch of in-use types) or lazily (API check when user attempts delete)
- Animation/transition for the checklist rows if any

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRAD-04 | Trades list view shows a completeness indicator (amber dot) on any record where required documents are missing | Indicator computed from `record.documents[]{docType}` vs. checklist arrays; rendered in EntityListPage; checklist arrays must be passed as props from the Astro list page |
| TRAD-06 | Trades detail page shows a relationship-scoped document checklist; contractor checklist: W-9, cert of insurance, trade license, 1099; vendor checklist: vendor agreement, tax form | New `TradeChecklist` component replaces the Documents section in `EntityDetailForm`; receives checklist items and documents as props; upload triggers `upload-doc` with `docType` set to item label |
| TRAD-08 | Checklist item types configurable from Settings per relationship type (add, rename); cannot remove type while docs uploaded | Two new `ChecklistConfigSection` components in SettingsPage; two new API actions in `site-settings.ts`; delete guard queries in-use types |
</phase_requirements>

---

## Summary

Phase 43 renders the `contractorChecklistItems[]` and `vendorChecklistItems[]` arrays that Phase 42 added to the `siteSettings` schema. All three work areas — the checklist UI on the detail page, the Settings config sections, and the amber completeness indicator on the list page — are pure UI additions over existing schema and API surface. No Sanity schema changes are needed.

The most architecturally significant piece is the checklist UI (TRAD-06): the existing flat documents section in `EntityDetailForm` (lines 563–660) is replaced by a new `TradeChecklist` component. This component needs to receive both the record's `documents[]` array and the relationship-appropriate checklist item labels, so it can partition docs into "matched" vs. "Other." Upload from a checklist row calls the existing `upload-doc` action on `/api/admin/contractors` with the item label pre-filled as `docType` — no API changes needed for upload itself.

The Settings config (TRAD-08) follows the exact same pattern as the Phase 40 `TradesCatalogSection`. The two new sections each need their own state slice in `SettingsPage`, and the save flow needs two new action branches in `/api/admin/site-settings.ts` (`updateContractorChecklistItems`, `updateVendorChecklistItems`). The delete guard is the only novel behavior — it requires knowing which `docType` values are currently in use across all contractor records, which is a single GROQ count query.

The completeness indicator (TRAD-04) requires the Trades list page (`/admin/trades/index.astro`) to pass checklist arrays down to `EntityListPage` as new props, because completeness can only be computed if both the record's documents and the checklist items for its relationship type are available together. The component renders an amber dot per decision D-11.

**Primary recommendation:** Build in three parallel tracks — (A) TradeChecklist component + EntityDetailForm integration, (B) ChecklistConfigSection + SettingsPage wiring + API actions, (C) completeness logic + EntityListPage indicator.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Checklist rendering on detail page | Browser / Client (React) | Frontend Server (Astro SSR) | Interactive upload/delete actions; SSR passes initial data as props |
| Settings config sections (add/rename/delete) | Browser / Client (React) | — | Controlled component state, consistent with TradesCatalogSection |
| Completeness computation | Frontend Server (Astro SSR) | Browser / Client (React) | Best computed server-side during list page load; props passed to EntityListPage |
| Checklist save API | API / Backend | — | `site-settings.ts` already owns all settings mutations |
| Delete guard query | Browser / Client (React) | API / Backend | Client-side on Settings page load: single GROQ fetch to count in-use types |
| Upload (existing pattern) | Browser / Client (React) | API / Backend | `upload-doc` action on existing `/api/admin/contractors` endpoint |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (project-wide) | TradeChecklist and ChecklistConfigSection components | All admin UI components are React islands on Astro pages [VERIFIED: package.json] |
| Astro SSR | 5.x (project-wide) | List and detail `.astro` pages that pass props to React islands | All admin pages follow this Astro+React hybrid pattern [VERIFIED: codebase] |
| Lucide React | project-wide | Icons: `Upload`, `Check`, `X`, `Trash2`, `AlertCircle` | Consistent with all other admin components [VERIFIED: EntityDetailForm, TradesCatalogSection] |
| Tailwind CSS | project-wide | Styling | All components use Tailwind utility classes + design tokens [VERIFIED: codebase] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@sanity/client` (via `getTenantClient`) | project-wide | GROQ queries for checklist arrays and delete guard | Used for all Sanity reads in admin API routes [VERIFIED: contractors.ts, site-settings.ts] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline upload per checklist row (hidden input per row) | Single shared file input + active-row state | Single input is simpler; active-row state (`uploadingForLabel`) already sufficient |
| Separate API endpoint for checklist save | Extend existing `site-settings.ts` | Existing endpoint already has action-router pattern — add two branches, no new file needed |

**Installation:** No new packages required. All dependencies are already in the project.

---

## Architecture Patterns

### System Architecture Diagram

```
[/admin/trades/index.astro]
  ├── getAdminContractors()          → documents[]{docType} now projected (needs GROQ update)
  ├── SITE_SETTINGS_QUERY (extended) → contractorChecklistItems[], vendorChecklistItems[]
  └── <EntityListPage
        entityType="contractor"
        entities={contractors}        ← now includes documents[]{docType}
        contractorChecklistItems      ← NEW PROP
        vendorChecklistItems          ← NEW PROP
      />
        └── computeIsIncomplete(entity, checklistItems)
              → amber dot in Name cell (or own column)

[/admin/trades/[contractorId]/index.astro]
  ├── getAdminContractorDetail()     → documents[]{_key,fileName,docType,url,uploadedAt}
  ├── SITE_SETTINGS_QUERY (extended) → contractorChecklistItems[], vendorChecklistItems[]
  └── <EntityDetailForm
        entityType="contractor"
        entity={contractorData}
        tradeCatalog={tradeCatalog}
        checklistItems               ← NEW PROP (relationship-scoped)
      />
        └── <TradeChecklist>         ← NEW COMPONENT (replaces flat docs section)
              ├── checklist rows (matched docs)
              │     [x] W-9   w9.pdf   View  ✕
              │     [ ] Trade license  ——     Upload
              └── OTHER DOCUMENTS section
                    old-insurance.pdf  View  ✕

[/admin/settings  →  SettingsPage.tsx]
  ├── state: contractorChecklistItems[]
  ├── state: vendorChecklistItems[]
  ├── <CollapsibleSection title="Contractor Checklist">
  │     <ChecklistConfigSection items={...} inUseTypes={...} onChange={...} />
  └── <CollapsibleSection title="Vendor Checklist">
        <ChecklistConfigSection items={...} inUseTypes={...} onChange={...} />
  └── handleSave()
        → POST /api/admin/site-settings { action: "updateContractorChecklistItems" }
        → POST /api/admin/site-settings { action: "updateVendorChecklistItems" }

[/api/admin/site-settings.ts]
  └── action: "updateContractorChecklistItems" → patch siteSettings.contractorChecklistItems
  └── action: "updateVendorChecklistItems"     → patch siteSettings.vendorChecklistItems

[/api/admin/contractors.ts]   ← NO CHANGES NEEDED
  └── action: "upload-doc"   → docType now set to checklist item label (from client)
  └── action: "delete-doc"   → unchanged
```

### Recommended Project Structure

```
src/components/admin/
├── TradeChecklist.tsx          (NEW — replaces Documents section in EntityDetailForm)
├── ChecklistConfigSection.tsx  (NEW — add/rename/delete for checklist items in Settings)
├── EntityDetailForm.tsx        (MODIFIED — inject TradeChecklist, accept checklistItems prop)
├── EntityListPage.tsx          (MODIFIED — accept checklist props, render amber dot)
├── settings/
│   └── SettingsPage.tsx        (MODIFIED — add two new CollapsibleSection + state slices)
src/pages/
├── admin/trades/index.astro    (MODIFIED — extend GROQ projection, pass checklist props)
├── admin/trades/[contractorId]/index.astro  (MODIFIED — pass checklistItems prop)
src/pages/api/admin/
└── site-settings.ts            (MODIFIED — add two new action branches)
src/sanity/queries.ts           (MODIFIED — extend SITE_SETTINGS_QUERY + getAdminContractors)
```

### Pattern 1: TradeChecklist Component Structure

**What:** Stateful React component that partitions `documents[]` against `checklistItems[]` and renders rows for each, plus an "Other documents" section.

**When to use:** Replace the Documents section inside `EntityDetailForm` when `entityType === "contractor"` and not in create mode.

**Key logic:**
```typescript
// Source: Derived from existing EntityDetailForm upload pattern [VERIFIED: EntityDetailForm.tsx]

// Partition documents into matched and unmatched
const matched = new Map<string, DocEntry>(); // label → first matching doc
const others: DocEntry[] = [];

for (const doc of documents) {
  const label = checklistItems.find(
    (item) => item === doc.docType  // D-08: exact string equality
  );
  if (label && !matched.has(label)) {
    matched.set(label, doc);
  } else {
    others.push(doc);
  }
}

// D-03: if multiple docs match the same label, first wins; extras → others
```

**Props shape:**
```typescript
interface TradeChecklistProps {
  contractorId: string;
  checklistItems: string[];           // from siteSettings (relationship-scoped)
  initialDocuments: DocEntry[];       // from contractor.documents[]
  onDocumentsChange?: (docs: DocEntry[]) => void;
}
```

**Upload trigger per row:**
```typescript
// D-05 / D-06: row-initiated upload sets docType to item label
async function uploadForItem(itemLabel: string, file: File) {
  const formData = new FormData();
  formData.append("action", "upload-doc");
  formData.append("_id", contractorId);
  formData.append("file", file);
  formData.append("docType", itemLabel);  // label string, not a slug
  await fetch("/api/admin/contractors", { method: "POST", body: formData });
}
```

### Pattern 2: ChecklistConfigSection (Settings)

**What:** Controlled component for add/rename/delete of a string array. Mirrors `TradesCatalogSection` with one addition: the delete button is disabled when the item label is in `inUseTypes`.

**When to use:** Inside `SettingsPage` for both contractor and vendor checklist config.

**Delete guard:**
```typescript
// D-15: disabled delete button with tooltip when type is in use
const isInUse = (label: string) => inUseTypes.includes(label);

<button
  disabled={isInUse(item)}
  title={isInUse(item)
    ? "This type has documents — remove documents from all trades first."
    : undefined}
>
  <Trash2 />
</button>
```

**In-use type detection (on Settings page load):**
```typescript
// Load from a dedicated API endpoint or inline GROQ via existing admin client
// GROQ: array of distinct docType values currently stored on any contractor record
const IN_USE_TYPES_QUERY = `
  *[_type == "contractor" && defined(documents) && count(documents) > 0] {
    "types": documents[].docType
  }
`;
// Flatten and dedupe: new Set(results.flatMap(r => r.types).filter(Boolean))
```

### Pattern 3: Completeness Indicator in EntityListPage

**What:** Amber dot rendered in the row for contractor records where at least one checklist item for the record's relationship type has no matching document.

**How completeness is computed:**
```typescript
// Passed as props from Astro list page — computed per record
function isIncomplete(
  entity: { relationship?: string; documents?: Array<{ docType?: string }> },
  contractorChecklistItems: string[],
  vendorChecklistItems: string[],
): boolean {
  const items = entity.relationship === "vendor"
    ? vendorChecklistItems
    : contractorChecklistItems;  // D-12: null/other → contractor items
  const uploadedTypes = new Set(
    (entity.documents ?? []).map((d) => d.docType).filter(Boolean)
  );
  return items.some((label) => !uploadedTypes.has(label));
}
```

**Amber dot render (inline with name, Claude's discretion):**
```typescript
// Amber dot left of name or as tooltip; using design token color
<td className="px-5 py-3 font-medium text-charcoal">
  <span className="inline-flex items-center gap-2">
    {isIncomplete(entity, ...) && (
      <span
        title="Missing required documents"
        style={{ width: 8, height: 8, borderRadius: "50%",
                 backgroundColor: "#D97706", flexShrink: 0 }}
      />
    )}
    {entity.name || "--"}
  </span>
</td>
```

### Pattern 4: SettingsPage State Extension

**What:** Two new state slices + save calls in the existing `handleSave` chain.

**Required SettingsPage changes:**

```typescript
// Extend SiteSettingsPayload (VERIFIED: SettingsPage.tsx SiteSettingsPayload interface)
contractorChecklistItems: string[];
vendorChecklistItems: string[];

// New state slices alongside existing `trades` state
const [contractorChecklistItems, setContractorChecklistItems] =
  useState<string[]>(initialSettings.contractorChecklistItems ?? []);
const [vendorChecklistItems, setVendorChecklistItems] =
  useState<string[]>(initialSettings.vendorChecklistItems ?? []);

// Extend handleSave (after updateTrades call)
const contractorChecklist = await fetch("/api/admin/site-settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "updateContractorChecklistItems",
    contractorChecklistItems,
  }),
});
// (and same for vendor)
```

### Pattern 5: GROQ Projection Extensions

**Two queries need updating:**

1. `SITE_SETTINGS_QUERY` in `queries.ts` — add `contractorChecklistItems` and `vendorChecklistItems` to the projection. Currently missing despite being in the schema. [VERIFIED: queries.ts lines 518-555]

2. `getAdminContractors()` — add `documents[]{docType}` to the projection. Currently returns `_id, name, email, phone, company, trades, relationship`. The list page needs `docType` values to compute completeness. [VERIFIED: queries.ts line 1092-1097]

3. (Already correct) `getAdminContractorDetail()` — already projects `documents[] { _key, fileName, fileType, url, uploadedAt, docType }`. [VERIFIED: queries.ts line 1103]

### Anti-Patterns to Avoid

- **Putting checklist computation inside EntityListPage:** The component doesn't know the checklist arrays unless they're passed as props; keeping computation in Astro page keeps the React component simple.
- **Adding a new API route for the checklist upload:** The existing `upload-doc` action already accepts any `docType` string — just pass the item label from the client.
- **Migrating old docType values:** D-07 explicitly forbids this. Old values (`"1099"`, `"insurance"`, etc.) fall through to "Other documents" naturally.
- **Using a slug/key system for docType:** D-06 uses the label string directly. No translation table needed.
- **Doing delete-guard check lazily (on click):** Claude's discretion allows either approach, but loading in-use types on Settings page load gives a better UX (buttons are visually disabled before interaction).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload file to Sanity + store document entry | Custom multipart handler | Existing `upload-doc` action in `/api/admin/contractors` | Already validates file size, type, generates `_key`, patches Sanity array — tested |
| Collapsible settings section | Custom accordion | `CollapsibleSection` from `src/components/admin/ui/CollapsibleSection.tsx` | Consistent header style, keyboard a11y, `defaultOpen` prop — used by all existing settings sections |
| Add/rename/delete string list UI | Custom list editor | `TradesCatalogSection` as direct template | Same visual pattern Liz already uses for Trades; copy the pattern for `ChecklistConfigSection` |
| Sanity patch for settings array | Custom PATCH logic | `sanityWriteClient.patch().set({ field: array }).commit()` | Same pattern used by `updateTrades` action — one-liner |
| In-use type detection | Count documents in React | GROQ `count(documents[docType == $type])` query via existing admin client | Efficient server-side; avoids shipping all document data to client |

**Key insight:** This phase is 100% composition of existing patterns. The only genuinely new code is `TradeChecklist.tsx` and `ChecklistConfigSection.tsx`; everything else modifies existing files to pass new props or add new state/action branches.

---

## Common Pitfalls

### Pitfall 1: SITE_SETTINGS_QUERY missing checklist fields

**What goes wrong:** The list and detail pages fetch siteSettings but `contractorChecklistItems` / `vendorChecklistItems` are not in `SITE_SETTINGS_QUERY`'s GROQ projection, so they come back `undefined` even though they exist in the schema.

**Why it happens:** The fields were added to the schema in Phase 42 but the query projection was not updated (confirmed by reading `queries.ts` lines 518–555 — neither field appears). [VERIFIED: queries.ts]

**How to avoid:** Plan Wave 0 must update `SITE_SETTINGS_QUERY` before any component work starts.

**Warning signs:** `initialSettings.contractorChecklistItems` is `undefined` even after saving; checklist sections render empty.

### Pitfall 2: getAdminContractors missing documents projection

**What goes wrong:** The Trades list page calls `getAdminContractors()`, which currently projects only `_id, name, email, phone, company, trades, relationship` — no `documents`. Completeness computation needs `documents[]{docType}`. [VERIFIED: queries.ts line 1092]

**Why it happens:** Documents were not needed for the list view until this phase.

**How to avoid:** Update `getAdminContractors()` to include `"documents": documents[]{docType}` in its projection.

**Warning signs:** `entity.documents` is `undefined` in EntityListPage; all records show no amber dot.

### Pitfall 3: SettingsPage SiteSettingsPayload type mismatch

**What goes wrong:** `SettingsPage` has a `SiteSettingsPayload` interface and a `cloneInitial()` function. If `contractorChecklistItems` / `vendorChecklistItems` are not added to both, TypeScript errors occur and the Cancel button does not reset the new state correctly.

**Why it happens:** The payload type and clone function are manually maintained. [VERIFIED: SettingsPage.tsx lines 31-62]

**How to avoid:** Add both fields to `SiteSettingsPayload`, `cloneInitial()`, the `useState` initializers, and `handleCancel`.

### Pitfall 4: Amber dot requires checklist arrays as props in EntityListPage

**What goes wrong:** `EntityListPage` currently receives only `entityType` and `entities`. Adding completeness computation requires passing `contractorChecklistItems[]` and `vendorChecklistItems[]`. If the Astro page doesn't pass these, the component can't distinguish incomplete records.

**Why it happens:** The list page currently fetches only contractor data, not siteSettings.

**How to avoid:** Update `/admin/trades/index.astro` to fetch siteSettings (using the extended `SITE_SETTINGS_QUERY`) and pass the two arrays as props to `EntityListPage`. Also update `EntityListPageProps` interface.

### Pitfall 5: Delete guard tooltip on disabled button

**What goes wrong:** A native `title` attribute on a `disabled` button does not show a tooltip in all browsers (Firefox in particular suppresses tooltips on disabled elements).

**Why it happens:** Browser inconsistency in disabled element interactivity.

**How to avoid:** Wrap the disabled button in a `<span>` and attach the `title` to the wrapper, or use a CSS-only tooltip approach. Alternatively a simple `aria-label` + visible text indicator is sufficient for this admin UI.

### Pitfall 6: EntityDetailForm needs new prop without breaking client renders

**What goes wrong:** `EntityDetailForm` is rendered with `client:load` in Astro. Adding a required `checklistItems` prop without providing a default will break existing client renders (e.g., the New Trade page where no checklist is relevant in create mode).

**Why it happens:** The component serves both create and edit modes.

**How to avoid:** Make `checklistItems` optional (`checklistItems?: string[]`). The TradeChecklist section only renders when `!isCreateMode`, so an undefined value in create mode is safe.

---

## Code Examples

### GROQ: Extend SITE_SETTINGS_QUERY

```typescript
// Source: src/sanity/queries.ts lines 518-555 [VERIFIED]
// Add these two fields to the existing SITE_SETTINGS_QUERY projection:
    trades,
    contractorChecklistItems,   // ADD THIS
    vendorChecklistItems,       // ADD THIS
    updateLog[] | order(savedAt desc)[0...5] { ... }
```

### GROQ: Extend getAdminContractors for completeness

```typescript
// Source: src/sanity/queries.ts line 1092 [VERIFIED]
// Current:
*[_type == "contractor"] | order(name asc) {
  _id, name, email, phone, company, trades, relationship
}
// Updated:
*[_type == "contractor"] | order(name asc) {
  _id, name, email, phone, company, trades, relationship,
  "documents": documents[]{ docType }   // ADD THIS — only docType needed for completeness
}
```

### API: New site-settings action branches

```typescript
// Source: Pattern from existing updateTrades action, lines 445-466 [VERIFIED: site-settings.ts]
if (action === "updateContractorChecklistItems") {
  const { contractorChecklistItems } = body as { contractorChecklistItems?: unknown };
  if (!Array.isArray(contractorChecklistItems)) {
    return errorResponse("contractorChecklistItems must be an array", 400);
  }
  for (const t of contractorChecklistItems) {
    if (typeof t !== "string" || t.trim().length === 0) {
      return errorResponse("contractorChecklistItems entries must be non-empty strings", 400);
    }
  }
  const logEntry = buildUpdateLogEntry(action, session.entityId);
  await sanityWriteClient
    .patch(SETTINGS_DOC_ID)
    .setIfMissing({ _type: "siteSettings", contractorChecklistItems: [], updateLog: [] })
    .set({ contractorChecklistItems: (contractorChecklistItems as string[]).map((t) => t.trim()) })
    .append("updateLog", [logEntry])
    .commit();
  return jsonResponse({ success: true });
}
// (mirror for updateVendorChecklistItems)
```

### GROQ: In-use types query (for delete guard)

```typescript
// Fetch via a new lightweight API endpoint or directly in SettingsPage mount effect
const IN_USE_DOC_TYPES_QUERY = `
  array::unique(
    *[_type == "contractor" && defined(documents)].documents[].docType
  )
`;
// Returns: string[] of all distinct docType values currently in use
// Use: Set<string> for O(1) lookup in ChecklistConfigSection
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat document list with hardcoded docType dropdown | Relationship-scoped checklist with row-initiated upload | Phase 43 (this phase) | Structured per-type status replaces unstructured list |
| 4 hardcoded docType values (1099, insurance, contract, other) | Configurable label strings from siteSettings | Phase 43 (this phase) | Liz can rename/extend checklist without code deploy |
| No completeness signal on list page | Amber dot on incomplete records | Phase 43 (this phase) | At-a-glance doc completeness for the Trades directory |

**Deprecated/outdated in this phase:**
- The `DOC_TYPE_LABELS` and `DOC_TYPE_PILL_CLASSES` maps in `EntityDetailForm` (lines 49-61): these map old hardcoded slugs to display strings. They are not needed in the new checklist view since labels are stored directly. Keep them in scope only if they're also referenced elsewhere — a grep will confirm.
- The `docType` state variable and the hardcoded `<select>` for doc type (lines 105, 616-631 in EntityDetailForm): removed when the Documents section is replaced by `TradeChecklist`.

---

## Open Questions

1. **"Other documents" upload behavior**
   - What we know: D-04 says unmatched docs go to "Other documents" section
   - What's unclear: Should the Upload button in "Other documents" store `docType = ""` or allow a freeform label? Claude's discretion area.
   - Recommendation: Store `docType = ""` (empty string). Simplest. The item will remain in "Other documents" regardless, and Liz can re-upload with correct type if needed.

2. **In-use types API surface**
   - What we know: The delete guard needs to know which docType values are in use across all contractor records
   - What's unclear: Should this be a dedicated GET endpoint or fetched via an inline query on Settings page load?
   - Recommendation: Add a `GET /api/admin/site-settings?action=inUseDocTypes` or perform the GROQ query in a `useEffect` on SettingsPage mount. The second approach requires no new API route and is consistent with how SettingsPage loads initial data.

3. **TypeScript ActionName union in site-settings.ts**
   - What we know: The `ActionName` type (line 36) is a union of all valid action strings
   - What's unclear: N/A — straightforward extension
   - Recommendation: Add `"updateContractorChecklistItems" | "updateVendorChecklistItems"` to the union.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — phase is entirely code/config changes within the existing stack).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + React Testing Library |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/components/admin/TradeChecklist.test.tsx` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TRAD-06 | Checklist rows rendered for each item; matched doc shows filename+View+delete; missing shows Upload | unit | `npx vitest run src/components/admin/TradeChecklist.test.tsx` | Wave 0 |
| TRAD-06 | Upload from checklist row sends correct docType (item label) in formData | unit | `npx vitest run src/components/admin/TradeChecklist.test.tsx` | Wave 0 |
| TRAD-06 | Docs with non-matching docType appear in "Other documents" | unit | `npx vitest run src/components/admin/TradeChecklist.test.tsx` | Wave 0 |
| TRAD-08 | ChecklistConfigSection: add/rename/delete items; delete disabled when in-use | unit | `npx vitest run src/components/admin/ChecklistConfigSection.test.tsx` | Wave 0 |
| TRAD-08 | SettingsPage renders "Contractor Checklist" and "Vendor Checklist" sections | unit | `npx vitest run src/components/admin/settings/SettingsPage.test.tsx` | Exists (update) |
| TRAD-04 | isIncomplete() returns true when any checklist item has no matching doc | unit | `npx vitest run src/components/admin/EntityListPage.test.tsx` | Wave 0 |
| TRAD-04 | Amber dot rendered for incomplete records; not rendered for complete | unit | `npx vitest run src/components/admin/EntityListPage.test.tsx` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/admin/TradeChecklist.test.tsx`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/components/admin/TradeChecklist.test.tsx` — covers TRAD-06 (component partition logic, upload trigger, Other documents)
- [ ] `src/components/admin/ChecklistConfigSection.test.tsx` — covers TRAD-08 (add/rename/delete, in-use guard)
- [ ] `src/components/admin/EntityListPage.test.tsx` — covers TRAD-04 (completeness computation, amber dot)
- [ ] Update `src/components/admin/settings/SettingsPage.test.tsx` — add assertions for two new CollapsibleSections and new state slices

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | Existing `session.role === "admin"` gate on all `/api/admin/*` routes [VERIFIED: site-settings.ts, contractors.ts] |
| V5 Input Validation | yes | New API actions validate array contents (non-empty strings); mirrors existing `updateTrades` validation pattern |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Non-admin saves checklist config | Elevation of Privilege | `session.role === "admin"` gate at top of POST handler — already in place [VERIFIED: site-settings.ts line 283] |
| Arbitrary string injection into docType (XSS) | Tampering | `docType` is rendered as text content, not HTML; React escapes by default; stored as plain Sanity string |
| Large array DoS in updateContractorChecklistItems | DoS | Add array length cap (e.g. max 50 items) consistent with other string array validations |

---

## Sources

### Primary (HIGH confidence)

- `src/sanity/schemas/siteSettings.ts` — `contractorChecklistItems[]` and `vendorChecklistItems[]` confirmed present with initialValues [VERIFIED: codebase]
- `src/sanity/schemas/contractor.ts` — `documents[]` array with `docType: string` field confirmed [VERIFIED: codebase]
- `src/components/admin/TradesCatalogSection.tsx` — direct template for ChecklistConfigSection [VERIFIED: codebase]
- `src/components/admin/settings/SettingsPage.tsx` — `SiteSettingsPayload`, `cloneInitial()`, save flow confirmed [VERIFIED: codebase]
- `src/components/admin/EntityDetailForm.tsx` — Documents section (lines 563-660) confirmed as target for replacement; upload handler pattern confirmed [VERIFIED: codebase]
- `src/components/admin/EntityListPage.tsx` — CONTRACTOR_COLUMNS and row render structure confirmed [VERIFIED: codebase]
- `src/pages/api/admin/site-settings.ts` — `updateTrades` action as template for new actions; `ActionName` union confirmed [VERIFIED: codebase]
- `src/pages/api/admin/contractors.ts` — `upload-doc` accepts `docType` string param; `delete-doc` confirmed [VERIFIED: codebase]
- `src/sanity/queries.ts` — `SITE_SETTINGS_QUERY` missing checklist fields; `getAdminContractors` missing documents projection [VERIFIED: codebase]
- `src/pages/admin/trades/index.astro` — currently fetches contractors only, not siteSettings [VERIFIED: codebase]
- `src/pages/admin/trades/[contractorId]/index.astro` — already fetches `SITE_SETTINGS_QUERY`; passes `tradeCatalog` prop; needs to also pass `checklistItems` [VERIFIED: codebase]

### Secondary (MEDIUM confidence)

- None required for this phase — all claims verified against live codebase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GROQ `array::unique()` function is available in the project's Sanity GROQ version | Code Examples (in-use types query) | Would need `*[...].documents[].docType` and dedupe in JS instead — trivially substituted |

**All other claims were verified directly against the codebase.**

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json and existing source files
- Architecture: HIGH — all integration points verified by reading the actual source files
- Pitfalls: HIGH — confirmed by inspecting the exact queries and component interfaces that will be modified

**Research date:** 2026-04-23
**Valid until:** 2026-05-23 (stable admin app; no external library changes anticipated)
