---
phase: 42-trades-entity-routes-schema-and-display
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - src/lib/relationshipLabel.ts
  - src/lib/relationshipLabel.test.ts
  - src/sanity/schemas/contractor.ts
  - src/sanity/schemas/contractor.test.ts
  - src/sanity/schemas/siteSettings.ts
  - src/sanity/schemas/siteSettings.test.ts
  - src/sanity/queries.ts
  - src/pages/api/admin/contractors.ts
  - src/pages/api/admin/contractors.test.ts
  - src/pages/admin/trades/index.astro
  - src/pages/admin/trades/[contractorId]/index.astro
  - src/components/admin/AdminNav.tsx
  - src/components/admin/EntityDetailForm.tsx
  - src/components/admin/EntityListPage.tsx
  - src/components/admin/ContactCardPopover.tsx
  - src/components/admin/ContactCardWrapper.tsx
  - src/pages/admin/dashboard.astro
  - src/pages/admin/projects/[projectId]/index.astro
  - src/components/admin/WorkOrderComposeModal.tsx
  - src/components/admin/ContractorChipSendAction.tsx
findings:
  critical: 0
  warning: 4
  info: 5
  total: 9
status: issues_found
---

# Phase 42: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Phase 42 introduces the `relationship` field (contractor|vendor) on the Sanity contractor schema, a `relationshipLabel()` helper, route rename from `/admin/contractors` to `/admin/trades`, and threads the new field through every display surface. The implementation is generally solid — the helper is well-tested, the null/undefined fallback is intentional and documented (D-04), the API correctly uses the key-presence guard (`hasRelationshipKey`) for partial-update semantics, and tenant auth checks are consistently applied.

Four warnings require fixes before ship: two are the same key-name mismatch bug (`_id` vs `contractorId`) in two different handlers in `EntityDetailForm` that will silently prevent entity deletion and document deletion; one is a missing server-side validation gap for `relationship` on create; and one is a `SITE_SETTINGS_QUERY` that does not project the new checklist fields added in this phase, which will cause a silent data miss in Phase 43.

Five informational items cover a nav `isActive` prefix-match edge case, test coverage gaps, a hardcoded trade fallback list, and query projection inconsistencies.

---

## Warnings

### WR-01: `action=delete` payload sends `_id` but API handler reads `contractorId` — entity deletion always fails

**File:** `src/components/admin/EntityDetailForm.tsx:729`

**Issue:** `DeleteInlineDialog.handleDelete()` posts `{ action: "delete", _id: entityId }`. The API handler at `src/pages/api/admin/contractors.ts:202` destructures `{ contractorId }` from the request body. The key names differ, so `contractorId` is always `undefined`, the guard at line 204 fires, and every delete attempt returns `400 Missing contractorId` without removing the document. The test suite exercises the API directly using the correct key, so the bug is masked.

**Fix:**
```typescript
// EntityDetailForm.tsx line ~729 inside DeleteInlineDialog.handleDelete()
body: JSON.stringify({ action: "delete", contractorId: entityId }),
//                                       ^--- was: _id: entityId
```

---

### WR-02: `action=delete-doc` payload sends `_id` but API handler reads `contractorId` — document deletion always fails

**File:** `src/components/admin/EntityDetailForm.tsx:263-269`

**Issue:** `handleDeleteDoc` sends `{ action: "delete-doc", _id: entity?._id, docKey }`. The handler at `src/pages/api/admin/contractors.ts:261` destructures `{ contractorId, docKey }`. The key mismatch means `contractorId` is always `undefined`, triggering the `400 Missing contractorId` guard. Document uploads work (they read `contractorId` from FormData correctly), but deletions silently fail.

**Fix:**
```typescript
// EntityDetailForm.tsx lines 263-269 inside handleDeleteDoc()
body: JSON.stringify({
  action: "delete-doc",
  contractorId: entity?._id,   // was: _id: entity?._id
  docKey,
}),
```

---

### WR-03: `relationship` field required client-side but not validated server-side on `create` — records with missing relationship can be written via direct API calls

**File:** `src/pages/api/admin/contractors.ts:104-143`

**Issue:** The `create` action accepts `relationship` as optional (`relationship?: string`) and conditionally spreads it only when truthy. A direct API call without `relationship` creates a contractor document with the field absent, bypassing the Sanity schema's `required()` rule (Sanity schema validation only fires through Studio, not through the write client). Records silently fall back to "Contractor" display via the D-04 null fallback, which may be acceptable, but creates inconsistency with the stated Phase 42 requirement that `relationship` is required for all new records. The `create` action validates name, email, and trades on the server but not relationship.

**Fix:**
```typescript
// contractors.ts create action — add after trades validation, before client.create()
if (!relationship || !["contractor", "vendor"].includes(relationship.trim())) {
  return jsonResponse(
    { error: "relationship must be 'contractor' or 'vendor'" },
    400,
  );
}
```
If the null-fallback for legacy/migrated records is intentionally permitted at the API layer, document this explicitly in the handler comment so it is not accidentally tightened or removed.

---

### WR-04: `SITE_SETTINGS_QUERY` does not project `contractorChecklistItems` or `vendorChecklistItems`

**File:** `src/sanity/queries.ts:518-555`

**Issue:** The two new checklist-item fields added to `siteSettings` in this phase are absent from `SITE_SETTINGS_QUERY`. The detail page at `[contractorId]/index.astro` (line 27) fetches settings via this query but currently uses only `trades`. Phase 43's checklist UI will read these fields from the same query result. If `SITE_SETTINGS_QUERY` is still used as the fetch mechanism at that point, both fields will be `undefined` regardless of what is stored in Sanity. Adding them now is a one-line change.

**Fix:**
```typescript
// SITE_SETTINGS_QUERY — add to the projection block after `trades`:
trades,
contractorChecklistItems,
vendorChecklistItems,
```

---

## Info

### IN-01: `isActive` in `AdminNav` uses bare `startsWith` without a path-segment boundary

**File:** `src/components/admin/AdminNav.tsx:31-37`

**Issue:** The current implementation uses `currentPath.startsWith(href)` for all non-dashboard routes. This works correctly for existing routes, but if a future route `/admin/tradesperson/...` is added, the "Trades" nav item (href `/admin/trades`) would also highlight because `"/admin/tradesperson".startsWith("/admin/trades")` is `true`. The fix is to anchor the prefix check to a path separator.

**Fix:**
```typescript
return (
  currentPath === href ||
  currentPath.startsWith(href + "/") ||
  currentPath.startsWith(href + "?")
);
```

---

### IN-02: `contractor.test.ts` field-list test omits `relationship` from the "has fields" assertion

**File:** `src/sanity/schemas/contractor.test.ts:10-19`

**Issue:** The "has fields" test asserts presence of `name, email, phone, company, trades, address, documents` but not `relationship`. The field is tested in a separate block (line 95), but the omission from the field list check means that deleting the field would not fail the omnibus test. Minor coverage gap for the primary Phase 42 schema addition.

**Fix:** Add `expect(fieldNames).toContain("relationship");` to the test at line 18.

---

### IN-03: `getAllContractors()` and `ADMIN_DASHBOARD_CONTRACTORS_QUERY` omit `relationship` from projection

**File:** `src/sanity/queries.ts:1061-1066` and `src/sanity/queries.ts:812-815`

**Issue:** `getAllContractors()` (used by the Gantt/schedule page) and `ADMIN_DASHBOARD_CONTRACTORS_QUERY` (used by the dashboard Contractor card) project `_id, name, company, trades` without `relationship`. The dashboard card does not currently render relationship, so there is no visible regression. However, `getAdminContractors()` at line 1093 correctly includes `relationship`, making these two queries inconsistent with the canonical list query. If either is extended to show Contractor vs. Vendor, the field will silently be `undefined`.

**Fix:** Add `relationship` to both projections:
```groq
*[_type == "contractor"] | order(_createdAt desc) [0...6] {
  _id, name, company, trades, relationship
}
```

---

### IN-04: Hardcoded `TRADE_OPTIONS` fallback in `EntityDetailForm` is stale and shadows the siteSettings catalog

**File:** `src/components/admin/EntityDetailForm.tsx:21-33, 290`

**Issue:** `TRADE_OPTIONS` is a hardcoded 11-item array that is used as a fallback when `tradeCatalog` is empty (`catalogOptions = tradeCatalog?.length > 0 ? tradeCatalog : TRADE_OPTIONS`). Since the trades catalog is now the authoritative source in siteSettings, an empty catalog should show no options (or a prompt to configure), not a stale hardcoded list that may diverge from the admin's actual trade list. If the fallback is intentional as a "starter set," it should be documented as such.

---

### IN-05: `handleDeleteDoc` does not clear `serverError` at entry — stale error banner persists across operations

**File:** `src/components/admin/EntityDetailForm.tsx:257`

**Issue:** `handleDeleteDoc` does not call `setServerError(null)` at the start of the function. If a previous delete attempt set a server error, it remains visible even after a subsequent successful operation. `handleSave` already does `setServerError(null)` at line 143 — the same pattern should apply here.

**Fix:**
```typescript
async function handleDeleteDoc(docKey: string) {
  setDeletingDocKey(docKey);
  setServerError(null);  // add this line
  // ...
```

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
