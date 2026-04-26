---
plan: 41-03
phase: 41-client-data-model-refinements
status: complete
completed: 2026-04-22
requirements: [CLNT-12]
gap_closure: true

key-files:
  modified:
    - src/sanity/queries.ts

self-check: PASSED
---

## Summary

Added `address { street, city, state, zip }` to the `getAdminClients` GROQ projection in `src/sanity/queries.ts` (line 1074). This was the single data gap blocking CLNT-12: the projection previously returned only `_id, name, email, phone`, so every row in the `/admin/clients` list showed em-dash fallbacks in the Address column, address sort was a no-op on empty strings, and city/state search never matched.

## What Was Built

**Task 1: Add address projection to getAdminClients GROQ query — ✓ Complete**

Changed `src/sanity/queries.ts` line 1074 from:
```
_id, name, email, phone
```
to:
```
_id, name, email, phone, address { street, city, state, zip }
```

`getAdminClientDetail` was left unchanged — it already projected `address` correctly.

## Verification

All four acceptance criteria passed:
1. `grep -n 'address { street, city, state, zip }' src/sanity/queries.ts` → match at line 1074 ✓
2. `grep -A 4 'getAdminClients' src/sanity/queries.ts | grep address` → match ✓
3. `grep -A 6 'getAdminClientDetail' src/sanity/queries.ts` → unchanged (`_id, name, email, phone, address, notes`) ✓
4. `npx tsc --noEmit 2>&1 | grep queries.ts` → pre-existing error on line 92 only (unrelated, present before this change) ✓

## Deviations

None. Single-line change exactly as specified in the plan.

## Impact

CLNT-12 unblocked: EntityListPage address cell, address sort, and city/state search in the Clients list now receive real Sanity data at list time.
