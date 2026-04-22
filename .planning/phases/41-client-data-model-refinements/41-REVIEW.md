---
phase: 41-client-data-model-refinements
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/components/admin/ClientChipWithRegenerate.tsx
  - src/components/admin/ContactCardPopover.tsx
  - src/components/admin/ContactCardWrapper.tsx
  - src/components/admin/EntityDetailForm.tsx
  - src/components/admin/EntityListPage.tsx
  - src/lib/format.test.ts
  - src/lib/format.ts
  - src/pages/api/admin/clients.ts
  - src/sanity/queries.ts
  - src/sanity/schemas/client.test.ts
  - src/sanity/schemas/client.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-04-22
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Phase 41 adds `formatPhone`, extends `EntityDetailForm` and `EntityListPage` with phone display, wires up `ContactCardPopover`/`ContactCardWrapper` hover cards, and ships `ClientChipWithRegenerate`. The new `formatPhone` utility and its tests are solid. The `client.ts` schema and its tests are clean. The most significant finding is a field-name mismatch in `EntityDetailForm`'s delete payload that causes every client/contractor delete initiated from the detail form to return a 400 and never execute. Two additional warnings cover a structural mismatch in `assign-to-project` that breaks downstream GROQ queries, and a fallback search in `ContactCardWrapper` that can fail to surface a card for entities outside the top-10 typeahead window.

---

## Warnings

### WR-01: Delete payload sends `_id` but API expects `clientId` — delete always returns 400

**File:** `src/components/admin/EntityDetailForm.tsx:654`

**Issue:** `DeleteInlineDialog.handleDelete` builds the request body as `{ action: "delete", _id: entityId }`. The `clients.ts` POST handler's `action === "delete"` branch destructures `clientId` from the body (line 106), not `_id`. `clientId` is always `undefined`, the guard at line 108 fires, and the API returns 400 "Missing clientId". The delete never executes and the user sees `alert("Could not delete. Please try again.")`. The same payload shape is used for both `entityType === "client"` and `entityType === "contractor"`, so both are broken.

**Fix:** Align the payload field name with what the API reads. The simplest generic fix that works for both entity types:

```tsx
// EntityDetailForm.tsx — DeleteInlineDialog.handleDelete (~line 654)
body: JSON.stringify({
  action: "delete",
  [`${entityType}Id`]: entityId,   // was: _id: entityId
}),
```

---

### WR-02: `assign-to-project` appends a raw reference instead of the clients-array member shape

**File:** `src/pages/api/admin/clients.ts:144-146`

**Issue:** The `assign-to-project` action appends:

```ts
{ _type: "reference", _ref: clientId, _key: generatePortalToken(8) }
```

The project schema's `clients[]` array expects members shaped as:

```ts
{ _key: string, client: { _type: "reference", _ref: string }, isPrimary: boolean }
```

Appending the flat reference means the stored item has no `client` sub-field and no `isPrimary`. All downstream GROQ expressions that filter on `clients[client._ref == $clientId]` (used in `PROJECTS_BY_CLIENT_QUERY`, `PROJECT_DETAIL_QUERY`, `WORK_ORDER_DETAIL_QUERY`) or `clients[isPrimary == true]` will never match the appended entry. Portal access and primary-client display silently fail for any client assigned through this action.

**Fix:**

```ts
// clients.ts assign-to-project (lines 144-146)
.append("clients", [
  {
    _key: generatePortalToken(8),
    client: { _type: "reference", _ref: clientId },
    isPrimary: false,
  },
])
```

---

### WR-03: `ContactCardWrapper` fallback fetch matches by name, not by ID — may produce no card for valid entities

**File:** `src/components/admin/ContactCardWrapper.tsx:87-116`

**Issue:** When `contactData` is not pre-supplied and the entity is not cached, the component fetches `/api/admin/search?q={name}` and then picks the first result whose `_id === entityId`. The search endpoint caps results at `[0...10]` (see `searchEntities` in `queries.ts` line 1149). An entity whose name suffix matches many other records may not appear in the top-10 window; the `find()` returns `undefined`, `data` stays `null`, and the hover card never appears — with no error visible to the user.

**Fix:** Pass `contactData` from the Astro page at every call site where the entity `_id` is already known at render time. This is already done in `ClientChipWithRegenerate` and is the preferred path. Alternatively, add a dedicated lookup endpoint (`/api/admin/entity?id=&type=`) that fetches by ID directly.

---

## Info

### IN-01: `formatPhone` fallback returns raw whitespace-only string — minor display inconsistency

**File:** `src/lib/format.ts:16`

**Issue:** A whitespace-only string like `"   "` is truthy, passes the `!raw` guard, produces zero digits after `.replace(/\D/g, "")`, and returns the original whitespace string. The test at `format.test.ts:41` documents this as intentional. However, `formatPhone(entity.phone) || "--"` in `EntityListPage` evaluates `"   " || "--"` to `"   "`, so a whitespace phone value renders as a blank cell rather than `--`.

**Fix:** Trim before the truthy check if whitespace-only values should render as empty:

```ts
export function formatPhone(raw: string | undefined | null): string {
  if (!raw?.trim()) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}
```

Update the corresponding test if the behavior is intentionally changed.

---

### IN-02: Hardcoded `TRADE_OPTIONS` fallback in `EntityDetailForm` will diverge from `tradeCatalog` over time

**File:** `src/components/admin/EntityDetailForm.tsx:19-31`

**Issue:** `TRADE_OPTIONS` and `TRADE_LABELS` are hardcoded constants that act as the fallback when `tradeCatalog` is not provided (line 278). Phase 40's `tradeCatalog` prop exists to drive the trade list from `siteSettings`, but the fallback hardcoded list will become stale as the catalog evolves. No immediate bug — the `tradeCatalog` prop is supplied by all current Astro pages — but the divergence is a maintenance hazard.

**Fix:** No immediate action required if `tradeCatalog` is always supplied. Consider adding a development-mode warning:

```ts
if (entityType === "contractor" && !tradeCatalog && process.env.NODE_ENV !== "production") {
  console.warn("EntityDetailForm: tradeCatalog not supplied; falling back to hardcoded TRADE_OPTIONS");
}
```

---

_Reviewed: 2026-04-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
