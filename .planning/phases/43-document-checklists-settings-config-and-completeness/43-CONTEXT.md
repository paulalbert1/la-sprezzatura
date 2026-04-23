# Phase 43: Document Checklists, Settings Config, and Completeness - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Trades detail page gains a relationship-scoped document checklist (replacing the existing flat document list). Checklist item types per relationship become configurable from Settings. Trades list view gains an amber completeness indicator on records with missing required documents.

Requirements: TRAD-04 (completeness indicator), TRAD-06 (checklist UI), TRAD-08 (Settings config).

</domain>

<decisions>
## Implementation Decisions

### Checklist UI on Detail Page (TRAD-06)

- **D-01:** The existing flat "Documents" section in `EntityDetailForm` is **replaced** by a structured checklist. Each row represents one required checklist item for the record's relationship type.
- **D-02:** Each checklist row shows: item label, status (uploaded / missing), filename if uploaded, View link if uploaded, delete (✕) button if uploaded, Upload button if missing.
- **D-03:** One document per checklist item. If multiple docs are uploaded for the same type, only the most recent (or first) is shown in the checklist row — extras go to "Other documents."
- **D-04:** Any uploaded document whose `docType` does not match any current checklist item label renders in an **"Other documents"** section below the checklist. This handles legacy docs and ad-hoc uploads.
- **D-05:** The document type dropdown (previously a hardcoded select) is removed from the upload flow. Upload is initiated from a specific checklist row, which implicitly sets the `docType`.

### Document Type Association (TRAD-06 + TRAD-08)

- **D-06:** When uploading from a specific checklist row, the document's `docType` is set to the checklist item's **label string** (e.g., `"Trade license"`, `"W-9"`). No slug or key system needed.
- **D-07:** Existing documents with old hardcoded `docType` values (`"1099"`, `"insurance"`, `"contract"`, `"other"`) are **not migrated**. They appear in "Other documents." Liz can re-upload if she wants them linked to a checklist item. Consistent with D-18 (no Sanity data migration policy).
- **D-08:** Matching is by exact string equality between `document.docType` and the checklist item label. Case-sensitivity follows the stored label exactly.

### Completeness Indicator (TRAD-04)

- **D-09:** Amber indicator definition: any Trades record where **at least one checklist item** for its relationship type has no uploaded document (i.e., no document in `record.documents[]` has a matching `docType`).
- **D-10:** Required fields (name, email, relationship) are already schema-enforced and always present post-creation. The completeness indicator is **documents only** — phone, trades, address, and other optional fields do not contribute.
- **D-11:** Indicator appearance: amber dot inline in the Trades list, as specified in REQUIREMENTS.md ("e.g., amber dot"). Exact placement is Claude's discretion (e.g., left of the name or in its own column).
- **D-12:** Records with no relationship set (edge case — schema requires it) are treated as incomplete by default.

### Settings Config (TRAD-08)

- **D-13:** Two separate `CollapsibleSection` entries in `SettingsPage`: **"Contractor Checklist"** and **"Vendor Checklist"**. Each follows the same add/rename/delete pattern as `TradesCatalogSection` (Phase 40).
- **D-14:** Each section manages its own array: `contractorChecklistItems[]` and `vendorChecklistItems[]` on `siteSettings`.
- **D-15:** Delete guard: if any Trades record has a document with `docType` matching the item label, the delete button for that item is **disabled** with a tooltip: `"This type has documents — remove documents from all trades first."` The guard is enforced client-side (Settings page loads in-use types from a dedicated API check or by fetching all contractor documents).
- **D-16:** Reordering is not required for checklist items in this phase (parity with Phase 40 TradesCatalogSection which does not support drag-to-reorder).
- **D-17:** Save flow follows the existing pattern: a dedicated API action (e.g., `updateContractorChecklistItems`, `updateVendorChecklistItems`) separate from the general settings save, consistent with how `updateTrades` works.

### Claude's Discretion

- Exact placement of the amber indicator in the EntityListPage row (column vs. inline dot next to name)
- How "Other documents" upload works — whether the "Upload" button in that section sets docType to empty string or prompts for a freeform label
- Whether the delete guard check is done on Settings page load (API fetch of in-use types) or lazily (API check when user attempts delete)
- Animation/transition for the checklist rows if any

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §TRAD-04, §TRAD-06, §TRAD-08 — authoritative requirement text and acceptance criteria

### Schema
- `src/sanity/schemas/siteSettings.ts` — `contractorChecklistItems[]` and `vendorChecklistItems[]` already defined with initialValues; Phase 43 renders them
- `src/sanity/schemas/contractor.ts` — `documents[]` array with `docType` field; this is what the checklist reads against

### UI Patterns (must read before building)
- `src/components/admin/TradesCatalogSection.tsx` — direct analog for the checklist config section in Settings (add/rename/delete pattern)
- `src/components/admin/settings/SettingsPage.tsx` — where new CollapsibleSections must be added; owns the save flow
- `src/components/admin/EntityListPage.tsx` — where the completeness indicator column/cell must be added
- `src/components/admin/EntityDetailForm.tsx` — the Documents section (lines ~563–660) is what this phase replaces with the checklist component

### Prior Phase Decisions
- `src/lib/relationshipLabel.ts` — `relationshipLabel()` helper; checklist scoping uses this to determine contractor vs. vendor
- `.planning/STATE.md` §Accumulated Context — D-01 through D-17 from prior phases, especially Phase 42 decisions on siteSettings checklist schema

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TradesCatalogSection` (`src/components/admin/TradesCatalogSection.tsx`): add/rename/delete pattern for string arrays. Both contractor and vendor checklist sections can closely follow this pattern.
- `CollapsibleSection` (`src/components/admin/ui/CollapsibleSection.tsx`): wraps each Settings subsection. Used for the two new checklist config sections.
- `relationshipLabel()` (`src/lib/relationshipLabel.ts`): maps `"vendor"` → `"Vendor"`, anything else → `"Contractor"`. Used to scope the checklist to the right items array.
- `EntityDetailForm` (`src/components/admin/EntityDetailForm.tsx`): existing Documents section (lines ~563–660) is replaced by a new `TradeChecklist` or similar component.
- `EntityListPage` (`src/components/admin/EntityListPage.tsx`): `CONTRACTOR_COLUMNS` defines list columns. Completeness indicator logic must be added here.

### Established Patterns
- `docType` is stored as a plain string on each document in `contractor.documents[docType]`.
- Settings save uses separate POST actions per data type (`action: "update"`, `action: "updateTrades"`). New actions `updateContractorChecklistItems` and `updateVendorChecklistItems` follow this.
- All admin API routes live at `src/pages/api/admin/`. Site settings at `src/pages/api/admin/site-settings.ts`.
- Blob upload for documents uses `src/pages/api/admin/contractors/[id]/index.ts` with `action: "upload-doc"`.

### Integration Points
- `SITE_SETTINGS_QUERY` in `src/sanity/queries.ts` must be extended to return `contractorChecklistItems` and `vendorChecklistItems`.
- Trades detail page (`src/pages/admin/trades/[contractorId]/index.astro`) must pass checklist items down to the new checklist component.
- Trades list page must fetch `documents[]{docType}` per record plus siteSettings checklist arrays to compute completeness server-side (or pass both as props to `EntityListPage`).

</code_context>

<specifics>
## Specific Ideas

- Checklist row mockup confirmed by user:
  ```
  ├─ [x] W-9                  w9.pdf        View  ✕
  ├─ [x] Certificate of ins.  policy.pdf    View  ✕
  ├─ [ ] Trade license        — missing      Upload
  └─ [ ] 1099                 — missing      Upload

  OTHER DOCUMENTS
    old-insurance.pdf    View  ✕
  ```
- Completeness amber dot mockup confirmed:
  ```
  CONTRACTOR record (amber):
    W-9: ✔  Insurance cert: ✔  Trade license: ✔  1099: missing ⬤
  ```
- Settings collapsible structure confirmed:
  ```
  ┓ Trades               [open]
  ┓ Contractor Checklist [open]
    W-9, Certificate of insurance...
    [+ Add item]
  ┓ Vendor Checklist     [closed]
  ```

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 43-document-checklists-settings-config-and-completeness*
*Context gathered: 2026-04-23*
