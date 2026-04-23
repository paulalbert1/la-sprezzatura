---
phase: 42-trades-entity-routes-schema-and-display
plan: "01"
subsystem: database
tags: [sanity-schema, groq, api, backend-foundation, typescript, vitest]

requires:
  - phase: 40-contractor-vendor-rename-trades-crud-1099-support
    provides: contractor schema with trades[] catalog, docType on contractorDocument, address object, siteSettings.trades catalog
provides:
  - Sanity `contractor` schema `relationship` field (contractor | vendor, required, radio)
  - UI-facing entity-name comment on contractor.ts documenting D-01 (_type stays "contractor")
  - `siteSettings.contractorChecklistItems[]` and `siteSettings.vendorChecklistItems[]` arrays with initial values
  - `relationship` in GROQ projections of getAdminContractors, getAdminContractorDetail, searchEntities
  - API round-trip of `relationship` on POST (create) and POST action=update (including null-clear semantics)
  - `src/lib/relationshipLabel.ts` helper encoding the D-04 null-fallback contract
affects:
  - phase 42 plan 02 (route rename + UI sweep — will consume `relationship`, `relationshipLabel`, and the meta-line input)
  - phase 43 (document checklists, settings config, and completeness — renders against contractorChecklistItems[] / vendorChecklistItems[])

tech-stack:
  added: []
  patterns:
    - Sanity radio list with exact error message as schema validation
    - Inline `...(key && { key })` conditional payload pattern for Sanity create
    - `Object.prototype.hasOwnProperty.call(body, 'relationship')` gate for PATCH semantics distinguishing undefined vs. null
    - Single-function lib module with JSDoc and colocated Vitest file

key-files:
  created:
    - src/lib/relationshipLabel.ts
    - src/lib/relationshipLabel.test.ts
  modified:
    - src/sanity/schemas/contractor.ts
    - src/sanity/schemas/contractor.test.ts
    - src/sanity/schemas/siteSettings.ts
    - src/sanity/schemas/siteSettings.test.ts
    - src/sanity/queries.ts
    - src/pages/api/admin/contractors.ts
    - src/pages/api/admin/contractors.test.ts

key-decisions:
  - "Sanity `_type` stays `contractor` — only UI-facing entity label changes (D-01). A file-top comment documents this for future readers."
  - "relationship field uses radio layout with required validation and the exact copy 'Relationship is required. Choose Contractor or Vendor.' (UI-SPEC)."
  - "API PATCH update semantics: `undefined` = leave alone (key absent from patch .set), `null`/empty string = clear to null, string = trim and set. Implemented via hasOwnProperty gate on the request body to distinguish JSON `null` from omitted keys."
  - "siteSettings.contractorChecklistItems[] initial value is [W-9, Certificate of insurance, Trade license, 1099]; vendorChecklistItems[] initial value is [Vendor agreement, Tax form] — schema-only in Phase 42 per D-09, rendered by Phase 43."
  - "relationshipLabel helper is case-sensitive by design: 'VENDOR' returns 'Contractor'. Only the canonical lowercase slug 'vendor' is a vendor."

patterns-established:
  - "GROQ flat-field extension: append a comma-separated field name (e.g., `, relationship`) to the projection field list — no sub-object needed for flat strings"
  - "PATCH body key presence vs. value: use hasOwnProperty to distinguish 'caller omitted key' from 'caller passed null'; spread conditional into .set only when present"
  - "Single-file pure-function utility with colocated test: preferred location for tiny formatters/label mappers (formatPhone, formatTrade, relationshipLabel)"

requirements-completed: [TRAD-02, TRAD-07]

duration: 16min
completed: 2026-04-23
---

# Phase 42 Plan 01: Trades Entity — Backend Foundation Summary

**Relationship field (contractor | vendor) added to contractor schema, threaded through three GROQ projections and the admin API, plus siteSettings checklist arrays and a colocated `relationshipLabel()` helper — end-to-end data plumbing ready for Plan 02's UI sweep.**

## Performance

- **Duration:** 16 min
- **Started:** 2026-04-23T03:28:01Z
- **Completed:** 2026-04-23T03:44:17Z
- **Tasks:** 2
- **Files modified:** 5 modified + 2 created = 7

## Accomplishments

- `contractor` Sanity schema now has a required `relationship` field with `contractor | vendor` values, radio layout, and the exact UI-SPEC error copy
- `siteSettings` now has `contractorChecklistItems[]` and `vendorChecklistItems[]` with initial values — schema foundation Phase 43 will render against (per D-09)
- Three GROQ contractor projections (list, detail, search typeahead) project `relationship` so downstream UI can read it without additional fetches
- `/api/admin/contractors` round-trips `relationship` on create and update with well-defined null-clear semantics (undefined = leave alone, null/empty = clear, string = trim+set)
- `src/lib/relationshipLabel.ts` is the single source of truth for the D-04 null-fallback (null/undefined/non-vendor → "Contractor"; "vendor" → "Vendor")
- 38 tests pass (18 schema + 6 helper + 14 API) — all four verification tests added in this plan as RED-then-GREEN pairs

## Task Commits

Each task was committed atomically following TDD (RED → GREEN):

1. **Task 1: relationship field + checklist arrays (TDD)**
   - RED: `6196d88` (test) — failing tests for relationship field + checklist arrays
   - GREEN: `7e26a97` (feat) — schema implementation
2. **Task 2: GROQ + API + relationshipLabel helper (TDD)**
   - RED: `ae85f91` (test) — failing tests for helper + API round-trip
   - GREEN: `2b0cce3` (feat) — implementation + GROQ extensions + lib helper

## Files Created/Modified

- `src/sanity/schemas/contractor.ts` — Added UI-facing comment (line 1); added `relationship` defineField between `company` and `address` with radio layout and required validation
- `src/sanity/schemas/contractor.test.ts` — Added 2 tests covering field shape and position
- `src/sanity/schemas/siteSettings.ts` — Added `contractorChecklistItems[]` and `vendorChecklistItems[]` after `trades`, with initial values
- `src/sanity/schemas/siteSettings.test.ts` — Added 2 tests asserting array-of-strings shape for both new fields
- `src/sanity/queries.ts` — Extended 3 contractor projections (`getAdminContractors`, `getAdminContractorDetail`, `searchEntities`) to include `relationship`
- `src/pages/api/admin/contractors.ts` — Create action persists `relationship` when provided; update action round-trips with hasOwnProperty-gated null-clear semantics
- `src/pages/api/admin/contractors.test.ts` — Added 5 tests covering the relationship round-trip matrix (create persist, create omit, update set, update clear null, update leave-alone)
- `src/lib/relationshipLabel.ts` (NEW) — Single-function pure helper with JSDoc
- `src/lib/relationshipLabel.test.ts` (NEW) — 6 test cases covering the D-04 null-fallback contract

## Decisions Made

- **PATCH `null` vs. omitted key disambiguation:** The plan's one-line `...(relationship !== undefined && ...)` pattern won't distinguish a client that posts `{ relationship: null }` from a client that posts `{}` once the JSON body is destructured — both resolve `relationship` to `undefined` only when the spread result is examined. Used `Object.prototype.hasOwnProperty.call(body, "relationship")` before destructure to gate the conditional; this is the only reliable way to implement the three-way undefined/null/string contract the plan specifies. Implementation fully satisfies all five API test cases.
- **Schema field ordering:** Plan required `relationship` to land between `company` and `address` (indices: `companyIdx + 1`, `addressIdx = relIdx + 1`). The existing Phase 40 test "address field appears between company and trades" remains green because `address` is still after `company` — just one slot later. No test collision.
- **`relationship` is case-sensitive:** `relationshipLabel("VENDOR")` returns `"Contractor"`. Only the canonical schema slug `"vendor"` is vendor. This was explicitly tested as a design assertion (not a bug) to lock the contract.

## Deviations from Plan

None — plan executed exactly as written. The only implementation refinement (hasOwnProperty gate vs. the plan's spread shorthand) is a semantic-preserving clarification of the documented contract, not a scope or behavior change. All acceptance criteria grep checks pass; all verification tests pass.

## Issues Encountered

None.

## Deferred Issues

`npx astro check` reports 39 pre-existing errors in files NOT modified by this plan (ScheduleEditor, Header, MobileMenu, ArtifactApprovalForm, ContractorNoteForm, geminiClient, sanity/image.ts, queries.ts line 92 portal-query unrelated to contractor projections, workorder/verify.astro). Per SCOPE BOUNDARY rule, these are out of scope and logged in `.planning/phases/42-trades-entity-routes-schema-and-display/deferred-items.md`.

Files modified in this plan contribute zero new astro-check errors.

## User Setup Required

None — no external service configuration required. All changes are internal schema, query, API, and helper additions.

## Next Phase Readiness

Plan 02 (route rename + UI sweep) is now unblocked:

- `contractor.relationship` is readable via `getAdminContractors` and `getAdminContractorDetail` — EntityListPage and the detail page can consume it directly
- `searchEntities` projects `relationship` — the ContactCardPopover and nav search can show the correct label
- `relationshipLabel()` is importable from `src/lib/relationshipLabel` — all UI surfaces can centralize on it per the D-05/D-06 label-consistency rule
- `/api/admin/contractors` accepts `relationship` on create and update — EntityDetailForm can add the relationship select and have it persist round-trip
- `siteSettings.contractorChecklistItems[]` / `vendorChecklistItems[]` are schema-ready for Phase 43's checklist UI

No blockers or concerns.

## Self-Check: PASSED

- FOUND: src/lib/relationshipLabel.ts
- FOUND: src/lib/relationshipLabel.test.ts
- FOUND: commit 6196d88 (test Task 1)
- FOUND: commit 7e26a97 (feat Task 1)
- FOUND: commit ae85f91 (test Task 2)
- FOUND: commit 2b0cce3 (feat Task 2)
- FOUND: contractor.ts `relationship` field with radio layout and required validation
- FOUND: siteSettings.ts `contractorChecklistItems` and `vendorChecklistItems` arrays
- FOUND: queries.ts `relationship` in 3 projections (lines 1095, 1104, 1153)
- FOUND: contractors.ts API round-trip (lines 105, 111, 132, 147-185)
- All 38 Vitest tests pass

---
*Phase: 42-trades-entity-routes-schema-and-display*
*Completed: 2026-04-23*
