---
phase: 41-client-data-model-refinements
reviewed: 2026-04-22T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/lib/format.ts
  - src/lib/format.test.ts
  - src/sanity/schemas/client.ts
  - src/sanity/queries.ts
  - src/pages/api/admin/clients.ts
  - src/sanity/schemas/client.test.ts
  - src/components/admin/EntityListPage.tsx
  - src/components/admin/EntityDetailForm.tsx
  - src/components/admin/ContactCardPopover.tsx
  - src/components/admin/ContactCardWrapper.tsx
  - src/components/admin/ClientChipWithRegenerate.tsx
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

Phase 41 adds `formatPhone`, extends `EntityDetailForm` and `EntityListPage` with phone display, wires up `ContactCardPopover`/`ContactCardWrapper` hover cards, and ships `ClientChipWithRegenerate`. The new `formatPhone` utility and its tests are solid. The `client.ts` schema and its tests are clean. The most important finding is a field-name mismatch in `EntityDetailForm`'s delete payload that will cause every client/contractor delete initiated from the detail form to fail silently with a 400. Two additional warnings cover a structural mismatch in `assign-to-project` and a stale fallback search in `ContactCardWrapper` that can surface a wrong-entity card.

---

## Warnings

### WR-01: Delete payload sends `_id` but API expects `clientId` — delete always returns 400

**File:** `src/components/admin/EntityDetailForm.tsx:654`

**Issue:** `DeleteInlineDialog.handleDelete` builds the request body as `{ action: "delete", _id: entityId }`. The `clients.ts` POST handler's `action === "delete"` branch destructures `clientId` from the body (not `_id`), so `clientId` is always `undefined`, the guard at line 108 fires, and the API returns 400 "Missing clientId". The delete never executes and the user sees an `alert("Could not delete. Please try again.")`. The same pattern is used by `EntityDetailForm` for both `entityType === "client"` and `entityType === "contractor"` — both are broken.

**Fix:** Align the payload field name with what the API reads:

```tsx
// EntityDetailForm.tsx — DeleteInlineDialog.handleDelete (line ~651)
body: JSON.stringify({
  action: "delete",
  clientId: entityId,   // was: _id
}),
```

For contractors, the contractor API presumably has the same contract. If `contractors.ts` also uses `contractorId`, the simplest generic fix is to send a dynamic key:

```tsx
body: JSON.stringify({
  action: "delete",
  [`${entityType}Id`]: entityId,
}),
```

---

### WR-02: `assign-to-project` appends a raw reference instead of the clients-array member shape

**File:** `src/pages/api/admin/clients.ts:144-145`

**Issue:** The `assign-to-project` action appends:

```ts
{ _type: "reference", _ref: clientId, _key: generatePortalToken(8) }
```

The project schema's `clients[]` array expects object members with the shape:

```ts
{ _key: string, client: { _type: "reference", _ref: string }, isPrimary: boolean }
```

Appending the raw reference means the stored item has no `client` sub-field and no `isPrimary`. Downstream GROQ expressions that filter on `clients[client._ref == $clientId]` or `clients[isPrimary == true]` will never match the appended entry, so portal access and primary-client display will silently fail for clients assigned this way.

**Fix:**

```ts
// clients.ts assign-to-project (line ~144)
.append("clients", [
  {
    _key: generatePortalToken(8),
    client: { _type: "reference", _ref: clientId },
    isPrimary: false,
  },
])
```

---

### WR-03: `ContactCardWrapper` fallback fetch matches by name, not by ID — risk of wrong-entity card

**File:** `src/components/admin/ContactCardWrapper.tsx:87-116`

**Issue:** When `contactData` is not pre-supplied and the entity is not cached, the component fetches `/api/admin/search?q={name}` and then picks the first result whose `_id` matches `entityId`. The search API is a substring match on name; if two entities share a name prefix, the search returns both and the ID filter selects correctly — but only if the entity is among the first 10 results (the search endpoint caps at `[0...10]`). A client whose name falls outside the top-10 typeahead window will never match, the popover silently shows nothing, and the `data` state stays `null`. This is a degraded-experience bug rather than a crash, but it can cause the hover card to never appear for legitimate entities without any visible error.

**Fix:** Add a dedicated `/api/admin/entity?id={entityId}&type={entityType}` endpoint that fetches by ID, or pass `contactData` from the Astro page wherever the entity `_id` is already known at render time (which is the case for all current call sites in the project detail page). The `contactData` prop path already exists on `ContactCardWrapper` and is used by `ClientChipWithRegenerate` — extend the same pattern to the project detail page chips.

---

## Info

### IN-01: `formatPhone` fallback returns raw whitespace-only string — minor UX inconsistency

**File:** `src/lib/format.ts:16-21`

**Issue:** The spec comment says "Empty, null, or undefined input returns ''", but a whitespace-only string (e.g. `"   "`) passes the `!raw` falsy check (non-empty string is truthy), produces zero digits, and returns the original whitespace string. The test at `format.test.ts:41` explicitly validates this behaviour as intentional, so this is a spec decision — noting it here because the display result (a blank space rather than `--`) may look like missing data in the UI when `formatPhone(entity.phone) || "--"` is used, because `"   " || "--"` evaluates to `"   "`.

**Fix:** If whitespace-only phone values should render as `--` in the list, trim first:

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

Update the corresponding test if the behaviour is changed.

---

### IN-02: `TRADE_OPTIONS` / `TRADE_LABELS` static fallback in `EntityDetailForm` duplicates catalog data that should come from `tradeCatalog` prop

**File:** `src/components/admin/EntityDetailForm.tsx:19-45`

**Issue:** `TRADE_OPTIONS` and `TRADE_LABELS` are hardcoded constants used as fallback when `tradeCatalog` is not provided. Phase 40's `tradeCatalog` prop exists precisely to drive this from `siteSettings`, but `TRADE_LABELS` is still referenced unconditionally for display (`formatTrade` in the trades pills, line 456). If a trade slug comes from the catalog that has no entry in `TRADE_LABELS`, `formatTrade` will fall back gracefully (assuming it handles unknown slugs), but `TRADE_OPTIONS` acting as the fallback for `availableTrades` means a new install without `tradeCatalog` wired in will show the hardcoded list. This is not a bug today, but the two lists will diverge as the catalog evolves.

**Fix:** No immediate action required if `tradeCatalog` is always supplied by the Astro page. Document the prop as required for contractor forms, or add a `console.warn` in development when `entityType === "contractor" && !tradeCatalog`.

---

_Reviewed: 2026-04-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
