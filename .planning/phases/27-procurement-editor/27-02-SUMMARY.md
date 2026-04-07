---
phase: 27-procurement-editor
plan: 02
subsystem: admin-api
tags: [api, procurement, sanity, vercel-blob, auth]
dependency_graph:
  requires: [procurementStages, generateToken, session, writeClient]
  provides: [update-procurement-status, update-procurement-item, upload-procurement-file]
  affects: [27-03, 27-04]
tech_stack:
  added: []
  patterns: [admin-api-route, tdd, formdata-upload, blob-lifecycle]
key_files:
  created:
    - src/pages/api/admin/update-procurement-status.ts
    - src/pages/api/admin/update-procurement-status.test.ts
    - src/pages/api/admin/update-procurement-item.ts
    - src/pages/api/admin/update-procurement-item.test.ts
    - src/pages/api/admin/upload-procurement-file.ts
    - src/pages/api/admin/upload-procurement-file.test.ts
  modified: []
decisions: []
metrics:
  duration: 4min
  completed: "2026-04-07T12:48:42Z"
---

# Phase 27 Plan 02: Procurement API Routes Summary

Three admin API routes for procurement mutations: inline status update, item CRUD (add/edit/remove), and file upload/delete with Vercel Blob storage and Sanity Content Lake linking.

## What Was Built

### update-procurement-status (POST)
- Admin auth guard via `getSession(cookies)` with role check
- JSON body parsing with error handling
- Status validation against `PROCUREMENT_STAGES.some(s => s.value === status)`
- Sanity patch using `procurementItems[_key=="${itemKey}"].status` path expression
- 8 tests: auth (null session, wrong role), JSON parse, missing fields, invalid status, success path

### update-procurement-item (POST)
- Admin auth guard (same pattern)
- Three action modes: `add`, `edit`, `remove`
- Add: validates name required, generates `_key` via `generatePortalToken(8)`, builds full item object with defaults, uses `setIfMissing({ procurementItems: [] }).append()` pattern
- Edit: builds dynamic `set()` object with `procurementItems[_key=="${itemKey}"].${field}` paths
- Remove: uses `unset([procurementItems[_key=="${itemKey}"]])` pattern
- `Number.isInteger()` validation on `retailPrice` and `clientCost` for both add and edit actions (PROC-03 integer cents enforcement)
- 14 tests: auth, missing fields, add without name, add/edit with non-integer cents, add success with _key return, edit success, remove without itemKey, remove success, invalid action

### upload-procurement-file (POST + DELETE)
- POST: FormData parsing, file type allowlist (PDF, JPEG, PNG, WebP), Vercel Blob upload with `addRandomSuffix: true`, Sanity file reference linking via `setIfMissing().append()` on item's `files` array
- DELETE: blob deletion via `del(blobUrl)` **before** Sanity `unset()` (per D-13 / Pitfall 3 -- blob delete first is recoverable)
- Admin auth guard on both handlers
- 7 tests: auth on both methods, missing file, bad file type, valid PDF upload with Sanity verification, valid image upload, delete with blob-before-Sanity order verification

## Verification Results

- 29/29 tests pass across all 3 test files
- Full suite: 459 pass, 6 fail (pre-existing in unrelated files: formatCurrency, geminiClient, blob-serve)
- All acceptance criteria verified via grep checks

## Deviations from Plan

None -- plan executed exactly as written.

## Threat Mitigations Applied

| Threat ID | Mitigation |
|-----------|------------|
| T-27-03 | Auth guard with `getSession(cookies)` + `role !== "admin"` check on all 4 handlers (POST x3, DELETE x1) |
| T-27-04 | Status validated against `PROCUREMENT_STAGES.some()` before Sanity mutation |
| T-27-05 | File type allowlist (`application/pdf`, `image/jpeg`, `image/png`, `image/webp`), `addRandomSuffix: true` prevents path traversal |
| T-27-07 | `sanityWriteClient` imported only in server-side API route files, never exposed to client |
| T-27-08 | `itemKey` used in parameterized Sanity path expressions, not GROQ string concatenation |
| T-27-13 | `Number.isInteger()` validation on `retailPrice` and `clientCost` in both add and edit actions |

## Commits

| Hash | Message |
|------|---------|
| 7d5637e | test(27-02): add failing tests for status update and item CRUD API routes |
| 3c800fd | feat(27-02): implement status update and item CRUD API routes |
| a3c5bfe | test(27-02): add failing tests for file upload API route |
| a73f72b | feat(27-02): implement file upload API route with Vercel Blob |

## Self-Check: PASSED

- [x] 6/6 created files exist on disk
- [x] 4/4 commits exist in git log (7d5637e, 3c800fd, a3c5bfe, a73f72b)
- [x] 29/29 tests pass
