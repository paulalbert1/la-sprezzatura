---
phase: 42-trades-entity-routes-schema-and-display
reviewed: 2026-04-23T00:00:00Z
depth: standard
files_reviewed: 18
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
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 42: Code Review Report

**Reviewed:** 2026-04-23
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Phase 42 introduces the Trades entity renaming (contractor/vendor unification), the `relationship` field on the `contractor` schema, related display label helpers, and the `/admin/trades` routes. The core implementation is solid: `relationshipLabel` is a clean single-source-of-truth helper, the API handler's `hasRelationshipKey` guard correctly distinguishes null-clear from omit, and authentication/tenant checks are applied consistently across all routes.

Three warnings and three info items were found. None are blockers, but two warnings — the mismatched field name in the delete payload and the missing field in the `delete-doc` payload — cause silent failures for those specific actions on the contractor entity.

---

## Warnings

### WR-01: `action=delete` payload sends `_id` but API handler reads `contractorId`

**File:** `src/components/admin/EntityDetailForm.tsx:729`

**Issue:** `DeleteInlineDialog.handleDelete()` posts `{ action: "delete", _id: entityId }`. The API handler at `src/pages/api/admin/contractors.ts:202` destructures `{ contractorId }` from the body. Because the key names differ, `contractorId` is always `undefined`, the guard at line 204 fires, and every delete attempt returns `400 Missing contractorId` without removing the record.

**Fix:**
```typescript
// EntityDetailForm.tsx line 729 — align key name with what the API expects
body: JSON.stringify({ action: "delete", contractorId: entityId }),
```

---

### WR-02: `action=delete-doc` payload sends `_id` but API handler reads `contractorId`

**File:** `src/components/admin/EntityDetailForm.tsx:264-267`

**Issue:** `handleDeleteDoc` sends `{ action: "delete-doc", _id: entity?._id, docKey }`. The handler at `src/pages/api/admin/contractors.ts:258` destructures `{ contractorId, docKey }`. Again the key mismatch means `contractorId` is `undefined` and every document delete call returns `400 Missing contractorId`.

**Fix:**
```typescript
// EntityDetailForm.tsx lines 264-267 — use contractorId key
body: JSON.stringify({
  action: "delete-doc",
  contractorId: entity?._id,
  docKey,
}),
```

---

### WR-03: `isActive` prefix-match activates "Trades" nav for all `/admin/trades/...` sub-paths, but also falsely activates sibling nav items sharing a common prefix

**File:** `src/components/admin/AdminNav.tsx:31-37`

**Issue:** `isActive` uses `currentPath.startsWith(href)` for every non-dashboard item. This correctly highlights "Trades" on `/admin/trades/new` and `/admin/trades/{id}`. However, it will also highlight "Projects" (`/admin/projects`) when visiting `/admin/projects/abc/schedule`, which is the existing intended behavior. The real risk is that if a future route like `/admin/tradesperson/...` is added, the `/admin/trades` entry would also light up because `"/admin/tradesperson".startsWith("/admin/trades")` is `true`. The function has no path-segment boundary guard.

**Fix:**
```typescript
function isActive(currentPath: string, href: string): boolean {
  if (href === "/admin/dashboard") {
    return (
      currentPath === "/admin/dashboard" ||
      currentPath === "/admin" ||
      currentPath === "/admin/"
    );
  }
  // Guard against prefix false-positives (e.g. /admin/trades vs /admin/tradesperson)
  return (
    currentPath === href ||
    currentPath.startsWith(href + "/") ||
    currentPath.startsWith(href + "?")
  );
}
```

---

## Info

### IN-01: `contractor.test.ts` field-list test does not assert `relationship`

**File:** `src/sanity/schemas/contractor.test.ts:10-19`

**Issue:** The omnibus "has fields" test lists seven fields but omits `relationship`, which was the primary schema addition for this phase. This means the assertion for existence of the field is only tested in the dedicated Phase 42 test block (line 95). The omission is not a bug but leaves an inconsistency between the field list test and the actual schema.

**Fix:** Add `expect(fieldNames).toContain("relationship");` to the existing "has fields" test at line 18.

---

### IN-02: `getAllContractors` and `ADMIN_DASHBOARD_CONTRACTORS_QUERY` omit `relationship` from projection

**File:** `src/sanity/queries.ts:1063` and `src/sanity/queries.ts:813`

**Issue:** `getAllContractors` (used by the schedule page) and `ADMIN_DASHBOARD_CONTRACTORS_QUERY` (used by the dashboard Contractor card) both project `_id, name, company, trades` without `relationship`. The dashboard card does not currently render the relationship label, so there is no visible regression. However, if either consumer is extended to show Contractor vs. Vendor differentiation, the field will silently be `undefined`. The `getAdminContractors` function (used by `/admin/trades`) correctly includes `relationship`.

**Fix:** Add `relationship` to both projections for consistency:
```groq
*[_type == "contractor"] | order(name asc) {
  _id, name, company, trades, relationship
}
```

---

### IN-03: `ContactCardWrapper` search fallback matches by name, not by ID

**File:** `src/components/admin/ContactCardWrapper.tsx:87-106`

**Issue:** When `contactData` is not pre-supplied, the component fetches `/api/admin/search?q={name}` and then finds the entity by `_id` within the results. If two entities share the same name, the search could return the wrong one first and the ID filter on line 104 might not find the correct match. This is a pre-existing pattern, not introduced in Phase 42, but worth noting since Phase 42 adds new surfaces that render ContactCardWrapper for contractors. The pre-populated `contactData` path (used in `projects/[projectId]/index.astro`) avoids this issue entirely, so the fallback path is only reached in unusual circumstances.

**Fix:** Where possible, always supply `contactData` to `ContactCardWrapper` to bypass the search fallback. No code change required for Phase 42 surfaces since `projects/[projectId]/index.astro` already passes pre-fetched `contactData`.

---

_Reviewed: 2026-04-23_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
