# Phase 43: Document Checklists, Settings Config, and Completeness — Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/admin/TradeChecklist.tsx` | component | request-response (upload/delete) | `src/components/admin/EntityDetailForm.tsx` lines 563–660 | role-match (document upload pattern) |
| `src/components/admin/ChecklistConfigSection.tsx` | component | CRUD | `src/components/admin/TradesCatalogSection.tsx` | exact |
| `src/components/admin/EntityDetailForm.tsx` | component | request-response | self (existing file, targeted modification) | exact |
| `src/components/admin/EntityListPage.tsx` | component | transform (completeness compute) | self (existing file, targeted modification) | exact |
| `src/components/admin/settings/SettingsPage.tsx` | component | CRUD | self (existing file, targeted modification) | exact |
| `src/pages/api/admin/site-settings.ts` | API route | request-response | self (`updateTrades` action branch, lines 445–466) | exact |
| `src/sanity/queries.ts` | utility (GROQ) | CRUD | self (existing `SITE_SETTINGS_QUERY` + `getAdminContractors`, lines 518–1097) | exact |
| `src/pages/admin/trades/index.astro` | page (SSR) | request-response | `src/pages/admin/trades/[contractorId]/index.astro` | role-match |
| `src/pages/admin/trades/[contractorId]/index.astro` | page (SSR) | request-response | self (existing file, targeted modification) | exact |

---

## Pattern Assignments

### `src/components/admin/TradeChecklist.tsx` (NEW — component, request-response)

**Analog:** `src/components/admin/EntityDetailForm.tsx` (document section, lines 563–660; upload handler, lines 207–260)

**Imports pattern** — copy from EntityDetailForm lines 1–4:
```typescript
import { useState, useRef } from "react";
import { Trash2, Upload, Loader2, Check } from "lucide-react";
```

**Props shape** (derived from RESEARCH.md Pattern 1):
```typescript
interface TradeChecklistProps {
  contractorId: string;
  checklistItems: string[];         // relationship-scoped, from siteSettings
  initialDocuments: Array<{
    _key: string;
    fileName: string;
    fileType: string;
    url: string;
    uploadedAt: string;
    docType?: string;
  }>;
}
```

**Document partition logic** (RESEARCH.md Pattern 1 — no existing analog; implement fresh):
```typescript
// D-08: exact string equality match between doc.docType and checklist item label
const matched = new Map<string, DocEntry>();
const others: DocEntry[] = [];
for (const doc of documents) {
  const label = checklistItems.find((item) => item === doc.docType);
  if (label && !matched.has(label)) {
    matched.set(label, doc);
  } else {
    others.push(doc);
  }
}
// D-03: first matching doc wins; extras → others
```

**Upload handler pattern** — copy from EntityDetailForm lines 207–260:
```typescript
// EntityDetailForm.tsx lines 207–260
async function handleUploadDoc(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowedTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
    setUploadError("File must be PDF, JPEG, or PNG under 10MB");
    setTimeout(() => setUploadError(null), 4000);
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }
  setUploading(true);
  setUploadError(null);
  const formData = new FormData();
  formData.append("action", "upload-doc");
  formData.append("_id", entity?._id || "");
  formData.append("file", file);
  formData.append("docType", docType);  // ← replace with itemLabel for TradeChecklist
  try {
    const res = await fetch(`/api/admin/contractors`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("File upload failed. Check file size and try again.");
    const result = await res.json();
    if (result.document) setDocuments((prev) => [...prev, result.document]);
  } catch {
    setUploadError("File upload failed. Check file size and try again.");
  } finally {
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
}
```
**Key delta for TradeChecklist:** `docType` is passed as the checklist item's label string (D-06). Use per-row state `uploadingForLabel: string | null` instead of the shared `uploading` boolean, and a single hidden `<input type="file">` with an `activeItemLabel` ref.

**Delete handler pattern** — copy from EntityDetailForm (search for `handleDeleteDoc`):
```typescript
// EntityDetailForm.tsx — handleDeleteDoc pattern
async function handleDeleteDoc(key: string) {
  setDeletingDocKey(key);
  try {
    const res = await fetch(`/api/admin/contractors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-doc", _id: entity?._id, docKey: key }),
    });
    if (!res.ok) throw new Error("Delete failed");
    setDocuments((prev) => prev.filter((d) => d._key !== key));
  } catch {
    // surface error if needed
  } finally {
    setDeletingDocKey(null);
  }
}
```

**Document row render pattern** — copy from EntityDetailForm lines 570–606:
```typescript
// EntityDetailForm.tsx lines 570–606
<div
  key={doc._key}
  className="flex items-center gap-3 px-4 py-3 bg-cream/50 rounded-lg mb-2"
>
  <span className="text-sm font-body text-charcoal truncate flex-1">
    {doc.fileName}
  </span>
  <a
    href={doc.url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-terracotta hover:underline font-body"
  >
    View
  </a>
  <button
    type="button"
    onClick={() => handleDeleteDoc(doc._key)}
    disabled={deletingDocKey === doc._key}
    className="text-stone-light hover:text-red-500 transition-colors"
  >
    {deletingDocKey === doc._key ? (
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : (
      <Trash2 className="w-3.5 h-3.5" />
    )}
  </button>
</div>
```

**Upload button pattern** — copy from EntityDetailForm lines 634–660:
```typescript
// EntityDetailForm.tsx lines 634–660
<input
  ref={fileInputRef}
  type="file"
  accept=".pdf,.jpeg,.jpg,.png"
  onChange={handleUploadDoc}
  className="hidden"
/>
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  disabled={uploading}
  className="text-sm text-terracotta border border-terracotta/30 rounded-lg px-3 py-1.5 hover:bg-terracotta/5 transition-colors inline-flex items-center gap-1.5 font-body"
>
  {uploading ? (
    <Loader2 className="w-3.5 h-3.5 animate-spin" />
  ) : (
    <Upload className="w-3.5 h-3.5" />
  )}
  Upload
</button>
```

---

### `src/components/admin/ChecklistConfigSection.tsx` (NEW — component, CRUD)

**Analog:** `src/components/admin/TradesCatalogSection.tsx` (entire file — 217 lines, direct template)

**Imports pattern** — copy from TradesCatalogSection lines 1–2:
```typescript
import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
```

**Props shape** — extend TradesCatalogSection's interface with `inUseTypes`:
```typescript
// TradesCatalogSection.tsx lines 7–10
export interface TradesCatalogSectionProps {
  trades: string[];
  onChange: (next: string[]) => void;
}

// ChecklistConfigSection: same shape + inUseTypes for D-15 delete guard
export interface ChecklistConfigSectionProps {
  items: string[];
  inUseTypes: Set<string>;           // loaded on Settings page mount
  onChange: (next: string[]) => void;
}
```

**Add / duplicate-check pattern** — copy from TradesCatalogSection lines 35–48:
```typescript
// TradesCatalogSection.tsx lines 35–48
function handleAdd() {
  const trimmed = newTrade.trim();
  if (!trimmed) return;
  const isDuplicate = trades.some((t) => t.toLowerCase() === trimmed.toLowerCase());
  if (isDuplicate) {
    setAddError("A trade with that name already exists.");
    return;
  }
  onChange([...trades, trimmed]);
  setNewTrade("");
  setAddError(null);
}
```

**Rename pattern** — copy from TradesCatalogSection lines 50–62:
```typescript
// TradesCatalogSection.tsx lines 50–62
function handleRenameStart(idx: number) {
  setRenamingIdx(idx);
  setRenameValue(trades[idx]);
}
function handleRenameSave(idx: number) {
  const trimmed = renameValue.trim();
  if (!trimmed) return;
  const next = [...trades];
  next[idx] = trimmed;
  onChange(next);
  setRenamingIdx(null);
}
```

**Delete guard pattern** — new behavior; add `inUseTypes` check before the delete button:
```typescript
// D-15: disabled button with tooltip wrapper (Pitfall 5: use span wrapper for tooltip on disabled button)
const isInUse = inUseTypes.has(item);
<span
  title={isInUse ? "This type has documents — remove documents from all trades first." : undefined}
  style={{ display: "inline-flex" }}
>
  <button
    type="button"
    onClick={() => !isInUse && setConfirmDeleteIdx(idx)}
    disabled={isInUse}
    aria-label="Delete checklist item"
    className={`transition-colors ${isInUse ? "text-stone-light/40 cursor-not-allowed" : "text-stone-light hover:text-destructive"}`}
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
</span>
```

**Delete confirmation modal** — copy from TradesCatalogSection lines 178–213 verbatim (swap label text for "checklist item").

**Item list row** — copy from TradesCatalogSection lines 87–149 verbatim (swap `trade` → `item` variable name).

**Add-item input row** — copy from TradesCatalogSection lines 153–174 verbatim (swap placeholder text).

---

### `src/components/admin/EntityDetailForm.tsx` (MODIFIED)

**Analog:** self — targeted replacement of lines 563–660 (Documents section).

**New prop** — add to interface (lines 6–11) and destructure in function signature (lines 63–68):
```typescript
// EntityDetailForm.tsx lines 6–11 — add optional prop (Pitfall 6: optional to support create mode)
interface EntityDetailFormProps {
  entityType: "client" | "contractor";
  entity: Record<string, any> | null;
  isNew?: boolean;
  tradeCatalog?: string[];
  checklistItems?: string[];    // ADD — relationship-scoped checklist labels
}
```

**Replacement of Documents section** (lines 563–662) — replace with `<TradeChecklist>` island:
```typescript
// Replace the entire block at lines 563–662 with:
{!isCreateMode && entityType === "contractor" && (
  <TradeChecklist
    contractorId={entity!._id}
    checklistItems={checklistItems ?? []}
    initialDocuments={entity?.documents ?? []}
  />
)}
```

**Remove obsolete state** — remove `docType` state (line 105), `fileInputRef` (line 108), `uploading` (line 104), `uploadError` (line 106), `deletingDocKey` (line 107) IF they are only used in the Documents section. Verify with grep before removing.

**Remove obsolete constants** — `DOC_TYPE_LABELS` (lines 49–54) and `DOC_TYPE_PILL_CLASSES` (lines 56–61) are no longer referenced after the Documents section is replaced. Remove after confirming no other usage:
```bash
# Verify before removing:
# grep -n "DOC_TYPE" src/components/admin/EntityDetailForm.tsx
```

---

### `src/components/admin/EntityListPage.tsx` (MODIFIED)

**Analog:** self — add new props and amber dot render to existing table rows.

**Props interface** — extend at lines 7–10:
```typescript
// EntityListPage.tsx lines 7–10 — current
interface EntityListPageProps {
  entityType: "client" | "contractor";
  entities: Array<Record<string, any>>;
}

// Updated — add checklist arrays (Pitfall 4)
interface EntityListPageProps {
  entityType: "client" | "contractor";
  entities: Array<Record<string, any>>;
  contractorChecklistItems?: string[];
  vendorChecklistItems?: string[];
}
```

**Completeness helper** — add above the component (RESEARCH.md Pattern 3):
```typescript
function isIncomplete(
  entity: { relationship?: string; documents?: Array<{ docType?: string }> },
  contractorChecklistItems: string[],
  vendorChecklistItems: string[],
): boolean {
  // D-12: null/undefined relationship → treat as contractor
  const items = entity.relationship === "vendor"
    ? vendorChecklistItems
    : contractorChecklistItems;
  if (items.length === 0) return false;
  const uploadedTypes = new Set(
    (entity.documents ?? []).map((d) => d.docType).filter(Boolean)
  );
  return items.some((label) => !uploadedTypes.has(label));
}
```

**Amber dot in Name cell** — replace EntityListPage line 194 (`<td className="px-5 py-3 font-medium text-charcoal">`):
```typescript
// EntityListPage.tsx line 194 — current
<td className="px-5 py-3 font-medium text-charcoal">
  {entity.name || "--"}
</td>

// Updated — inline amber dot left of name (D-11)
<td className="px-5 py-3 font-medium text-charcoal">
  <span className="inline-flex items-center gap-2">
    {entityType === "contractor" &&
     isIncomplete(entity as any, contractorChecklistItems ?? [], vendorChecklistItems ?? []) && (
      <span
        aria-label="Missing required documents"
        title="Missing required documents"
        style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#D97706", flexShrink: 0 }}
      />
    )}
    {entity.name || "--"}
  </span>
</td>
```

---

### `src/components/admin/settings/SettingsPage.tsx` (MODIFIED)

**Analog:** self — add two new state slices and two new CollapsibleSection entries.

**SiteSettingsPayload interface** — extend at lines 31–47 (Pitfall 3):
```typescript
// SettingsPage.tsx lines 31–47 — add two fields
export interface SiteSettingsPayload {
  // ... existing fields ...
  trades: string[];
  contractorChecklistItems: string[];    // ADD
  vendorChecklistItems: string[];        // ADD
}
```

**cloneInitial** — extend at lines 53–62 (Pitfall 3):
```typescript
// SettingsPage.tsx lines 53–62
function cloneInitial(s: SiteSettingsPayload): SiteSettingsPayload {
  return {
    ...s,
    socialLinks: { ...s.socialLinks },
    heroSlideshow: s.heroSlideshow.map((slide) => ({ ...slide })),
    renderingImageTypes: [...s.renderingImageTypes],
    renderingExcludedUsers: [...s.renderingExcludedUsers],
    trades: [...(s.trades ?? [])],
    contractorChecklistItems: [...(s.contractorChecklistItems ?? [])],  // ADD
    vendorChecklistItems: [...(s.vendorChecklistItems ?? [])],           // ADD
  };
}
```

**State slices** — add after line 84 (`const [trades, setTrades] = ...`):
```typescript
// Copy pattern from SettingsPage.tsx line 84
const [trades, setTrades] = useState<string[]>(initialSettings.trades ?? []);
// ADD:
const [contractorChecklistItems, setContractorChecklistItems] =
  useState<string[]>(initialSettings.contractorChecklistItems ?? []);
const [vendorChecklistItems, setVendorChecklistItems] =
  useState<string[]>(initialSettings.vendorChecklistItems ?? []);
const [inUseDocTypes, setInUseDocTypes] = useState<Set<string>>(new Set());
```

**In-use types fetch on mount** — add `useEffect` after state declarations:
```typescript
// Load in-use doc types for ChecklistConfigSection delete guard (D-15, RESEARCH Pattern 2)
useEffect(() => {
  const query = `array::unique(
    *[_type == "contractor" && defined(documents)].documents[].docType
  )`;
  fetch(`/api/admin/site-settings?action=inUseDocTypes`)
    .then((r) => r.json())
    .then((types: string[]) => setInUseDocTypes(new Set(types)))
    .catch(() => {/* non-blocking */});
}, []);
```
*(Alternatively, add a `GET` branch to `site-settings.ts` that runs this GROQ and returns the array — see API section below.)*

**handleCancel** — extend reset at line 153 (copy `setTrades` pattern at line 153):
```typescript
// SettingsPage.tsx line 153
setTrades([...(reset.trades ?? [])]);
// ADD:
setContractorChecklistItems([...(reset.contractorChecklistItems ?? [])]);
setVendorChecklistItems([...(reset.vendorChecklistItems ?? [])]);
```

**handleSave** — extend after `tradesResponse` block (lines 181–188), mirroring its pattern:
```typescript
// SettingsPage.tsx lines 181–188 — updateTrades call (direct template)
const tradesResponse = await fetch("/api/admin/site-settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "updateTrades", trades }),
});
if (!tradesResponse.ok) throw new Error("Could not save. Check your connection and try again.");

// ADD two calls after (D-17):
const contractorChecklistResponse = await fetch("/api/admin/site-settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "updateContractorChecklistItems", contractorChecklistItems }),
});
if (!contractorChecklistResponse.ok) throw new Error("Could not save. Check your connection and try again.");

const vendorChecklistResponse = await fetch("/api/admin/site-settings", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "updateVendorChecklistItems", vendorChecklistItems }),
});
if (!vendorChecklistResponse.ok) throw new Error("Could not save. Check your connection and try again.");
```

**JSX — new CollapsibleSections** — add after the `<CollapsibleSection title="Trades">` block (line 241–243):
```typescript
// SettingsPage.tsx lines 241–243 — Trades section (direct template)
<CollapsibleSection title="Trades">
  <TradesCatalogSection trades={trades} onChange={handleTradesChange} />
</CollapsibleSection>

// ADD (D-13):
<CollapsibleSection title="Contractor Checklist">
  <ChecklistConfigSection
    items={contractorChecklistItems}
    inUseTypes={inUseDocTypes}
    onChange={(next) => { setContractorChecklistItems(next); markDirty(); }}
  />
</CollapsibleSection>

<CollapsibleSection title="Vendor Checklist">
  <ChecklistConfigSection
    items={vendorChecklistItems}
    inUseTypes={inUseDocTypes}
    onChange={(next) => { setVendorChecklistItems(next); markDirty(); }}
  />
</CollapsibleSection>
```

**Import** — add at top of file:
```typescript
import ChecklistConfigSection from "../ChecklistConfigSection";
```

---

### `src/pages/api/admin/site-settings.ts` (MODIFIED)

**Analog:** self — `updateTrades` action branch (lines 445–466), direct template.

**ActionName union** — extend at lines 35–41:
```typescript
// site-settings.ts lines 35–41
type ActionName =
  | "update"
  | "appendHeroSlide"
  | "updateHeroSlide"
  | "reorderHeroSlideshow"
  | "removeHeroSlide"
  | "updateTrades"
  | "updateContractorChecklistItems"    // ADD
  | "updateVendorChecklistItems";       // ADD
```

**New action branches** — add after the `updateTrades` block (lines 445–466), before `return errorResponse(...)` at line 468:
```typescript
// site-settings.ts lines 445–466 — updateTrades (direct template to copy)
if (action === "updateTrades") {
  const { trades } = body as { trades?: unknown };
  if (!Array.isArray(trades)) return errorResponse("trades must be an array", 400);
  for (const t of trades) {
    if (typeof t !== "string" || t.trim().length === 0)
      return errorResponse("trades entries must be non-empty strings", 400);
  }
  const logEntry = buildUpdateLogEntry(action, session.entityId);
  await sanityWriteClient
    .patch(SETTINGS_DOC_ID)
    .setIfMissing({ _type: "siteSettings", trades: [], updateLog: [] })
    .set({ trades: (trades as string[]).map((t) => t.trim()) })
    .append("updateLog", [logEntry])
    .commit();
  return jsonResponse({ success: true });
}

// ADD — mirror pattern for contractorChecklistItems:
if (action === "updateContractorChecklistItems") {
  const { contractorChecklistItems } = body as { contractorChecklistItems?: unknown };
  if (!Array.isArray(contractorChecklistItems))
    return errorResponse("contractorChecklistItems must be an array", 400);
  if (contractorChecklistItems.length > 50)
    return errorResponse("contractorChecklistItems may not exceed 50 items", 400);
  for (const t of contractorChecklistItems) {
    if (typeof t !== "string" || t.trim().length === 0)
      return errorResponse("contractorChecklistItems entries must be non-empty strings", 400);
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

// ADD — mirror for vendorChecklistItems:
if (action === "updateVendorChecklistItems") {
  // identical structure, swap field name
}
```

**GET branch for inUseDocTypes** — add a `GET` export before the `POST` export (or branch on `request.method` inside the existing handler):
```typescript
// Pattern: add GET handler (mirrors site-settings.ts POST export pattern)
export const GET: APIRoute = async ({ request, locals }) => {
  const session = await getSession(locals);
  if (!session || session.role !== "admin") return errorResponse("Unauthorized", 401);
  const url = new URL(request.url);
  if (url.searchParams.get("action") === "inUseDocTypes") {
    const client = getTenantClient(locals.tenantId);
    const types = await client.fetch(
      `array::unique(*[_type == "contractor" && defined(documents)].documents[].docType)`
    );
    return jsonResponse({ types: types ?? [] });
  }
  return errorResponse("Unknown action", 400);
};
```

---

### `src/sanity/queries.ts` (MODIFIED)

**Analog:** self — `SITE_SETTINGS_QUERY` (lines 518–555) and `getAdminContractors` (lines 1092–1098).

**SITE_SETTINGS_QUERY** — add two fields after `trades` at line 547 (Pitfall 1):
```typescript
// queries.ts lines 518–555 — SITE_SETTINGS_QUERY
// Current line 547:
    trades,
// ADD immediately after:
    contractorChecklistItems,
    vendorChecklistItems,
```

**getAdminContractors** — add documents projection to GROQ at lines 1092–1098 (Pitfall 2):
```typescript
// queries.ts lines 1092–1098 — current
export async function getAdminContractors(client: SanityClient) {
  return client.fetch(`
    *[_type == "contractor"] | order(name asc) {
      _id, name, email, phone, company, trades, relationship
    }
  `);
}

// Updated — add documents[]{docType} for completeness computation:
export async function getAdminContractors(client: SanityClient) {
  return client.fetch(`
    *[_type == "contractor"] | order(name asc) {
      _id, name, email, phone, company, trades, relationship,
      "documents": documents[]{ docType }
    }
  `);
}
```

---

### `src/pages/admin/trades/index.astro` (MODIFIED)

**Analog:** `src/pages/admin/trades/[contractorId]/index.astro` (lines 1–29 — shows how to fetch siteSettings and pass props)

**Imports** — add `SITE_SETTINGS_QUERY` to import line 7:
```astro
// Current (index.astro line 7):
import { getAdminContractors } from "../../../sanity/queries";

// Updated:
import { getAdminContractors, SITE_SETTINGS_QUERY } from "../../../sanity/queries";
```

**Data fetch** — add siteSettings fetch after `getAdminContractors` call (mirror detail page lines 27–28):
```astro
// [contractorId]/index.astro lines 27–28 — template
const siteSettingsRaw = await sanityClient.fetch(SITE_SETTINGS_QUERY);
const tradeCatalog: string[] = (siteSettingsRaw as any)?.trades ?? [];

// index.astro — add:
const siteSettingsRaw = await client.fetch(SITE_SETTINGS_QUERY);
const contractorChecklistItems: string[] =
  (siteSettingsRaw as any)?.contractorChecklistItems ?? [];
const vendorChecklistItems: string[] =
  (siteSettingsRaw as any)?.vendorChecklistItems ?? [];
```

**EntityListPage props** — extend component usage (current lines 23–27):
```astro
// Current:
<EntityListPage
  client:load
  entityType="contractor"
  entities={contractors}
/>

// Updated:
<EntityListPage
  client:load
  entityType="contractor"
  entities={contractors}
  contractorChecklistItems={contractorChecklistItems}
  vendorChecklistItems={vendorChecklistItems}
/>
```

---

### `src/pages/admin/trades/[contractorId]/index.astro` (MODIFIED)

**Analog:** self — add `checklistItems` extraction and prop pass.

**checklistItems extraction** — add after `tradeCatalog` at line 28:
```astro
// [contractorId]/index.astro line 28
const tradeCatalog: string[] = (siteSettingsRaw as any)?.trades ?? [];

// ADD (relationship-scoped):
const relationship = !isNew ? (contractorData as any)?.relationship : null;
const checklistItems: string[] = relationship === "vendor"
  ? (siteSettingsRaw as any)?.vendorChecklistItems ?? []
  : (siteSettingsRaw as any)?.contractorChecklistItems ?? [];
```

**EntityDetailForm prop** — add `checklistItems` to the component at lines 81–87:
```astro
// Current lines 81–87:
<EntityDetailForm
  client:load
  entityType="contractor"
  entity={contractorData}
  isNew={isNew}
  tradeCatalog={tradeCatalog}
/>

// Updated:
<EntityDetailForm
  client:load
  entityType="contractor"
  entity={contractorData}
  isNew={isNew}
  tradeCatalog={tradeCatalog}
  checklistItems={checklistItems}
/>
```

---

## Shared Patterns

### CollapsibleSection wrapper
**Source:** `src/components/admin/ui/CollapsibleSection.tsx` (entire file, 110 lines)
**Apply to:** `ChecklistConfigSection` is slotted inside `CollapsibleSection` in `SettingsPage`; do not re-implement accordion behavior.
```typescript
// CollapsibleSection.tsx lines 19–24 — props interface
export interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  unsavedChanges?: boolean;
  children: ReactNode;
}
```
Usage with `defaultOpen`:
```typescript
<CollapsibleSection title="Contractor Checklist" defaultOpen>
  <ChecklistConfigSection ... />
</CollapsibleSection>
```

### Sanity patch pattern
**Source:** `src/pages/api/admin/site-settings.ts` lines 458–463
**Apply to:** Both new `updateContractorChecklistItems` and `updateVendorChecklistItems` action branches
```typescript
await sanityWriteClient
  .patch(SETTINGS_DOC_ID)
  .setIfMissing({ _type: "siteSettings", contractorChecklistItems: [], updateLog: [] })
  .set({ contractorChecklistItems: items })
  .append("updateLog", [logEntry])
  .commit();
```

### Auth gate (admin-only)
**Source:** `src/pages/api/admin/site-settings.ts` lines 283 (session check)
**Apply to:** Any new GET handler added to `site-settings.ts` for `inUseDocTypes`
```typescript
const session = await getSession(locals);
if (!session || session.role !== "admin") {
  return errorResponse("Unauthorized", 401);
}
```

### Form input styling
**Source:** `src/components/admin/TradesCatalogSection.tsx` lines 93–105 (rename input), 155–165 (add input)
**Apply to:** `ChecklistConfigSection` — copy Tailwind classes verbatim for inputs:
```typescript
className="text-sm font-body text-charcoal bg-white border border-stone-light/40 rounded-lg px-3 py-2 w-full focus:ring-1 focus:ring-terracotta focus:border-terracotta outline-none"
```

### FieldLabel sub-component
**Source:** `src/components/admin/TradesCatalogSection.tsx` lines 12–26
**Apply to:** `ChecklistConfigSection` if a section label is needed — copy `FieldLabel` verbatim:
```typescript
function FieldLabel({ children }: { children: string }) {
  return (
    <label
      className="block mb-1 uppercase"
      style={{ fontSize: "11.5px", letterSpacing: "0.04em", fontWeight: 600, color: "#6B5E52" }}
    >
      {children}
    </label>
  );
}
```

---

## No Analog Found

All files have close analogs. No items in this table.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | — |

---

## Pitfall Reminders (from RESEARCH.md)

| # | Pitfall | Mitigation |
|---|---------|------------|
| P1 | `SITE_SETTINGS_QUERY` missing checklist fields | Wave 0 must add `contractorChecklistItems` and `vendorChecklistItems` to the GROQ projection before any component work |
| P2 | `getAdminContractors` missing `documents` projection | Update GROQ to add `"documents": documents[]{ docType }` |
| P3 | `SiteSettingsPayload` type mismatch | Add both fields to interface, `cloneInitial()`, `useState` initializers, and `handleCancel` |
| P4 | Amber dot needs checklist arrays as props | Update `EntityListPage` interface; Astro list page must fetch siteSettings and pass arrays |
| P5 | Tooltip on disabled button (Firefox) | Wrap `<button disabled>` in `<span title="...">` |
| P6 | `checklistItems` prop breaks create mode | Make prop optional (`checklistItems?: string[]`); TradeChecklist only renders when `!isCreateMode` |

---

## Metadata

**Analog search scope:** `src/components/admin/`, `src/pages/admin/trades/`, `src/pages/api/admin/`, `src/sanity/queries.ts`
**Files read:** 10 source files
**Pattern extraction date:** 2026-04-23
