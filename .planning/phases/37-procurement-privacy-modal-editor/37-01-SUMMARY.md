---
phase: 37-procurement-privacy-modal-editor
plan: 01
subsystem: testing
tags: [vitest, tdd, red-baseline, sanity-schema, groq, react-testing-library, migration]

requires:
  - phase: 32-procurement-editor
    provides: inline procurementItems schema and editor baseline being partially rolled back

provides:
  - Wave 0 RED test harness for Phase 37 (7 files, 57 it() blocks)
  - Schema field-absence assertions for clientCost/retailPrice/itemImage
  - GROQ + email/export price-projection absence assertions across queries.ts, send-update, close-document
  - Admin editor row-click-to-modal contract test (PROC-10, D-05)
  - Modal view<->edit transition + image gallery CRUD contract (PROC-11, PROC-14, D-09/D-10/D-12)
  - Portal table price-strip assertion (PROC-12, D-15)
  - Closeout-copy price/$ absence test (D-15)
  - Migration script idempotency + destructive price-strip contract (D-08, D-16)

affects: [37-02-PLAN, 37-03-PLAN]

tech-stack:
  added: []
  patterns:
    - "RED-before-GREEN TDD harness for large refactor phases"
    - "String-level absence assertions against production source (read via fs.readFileSync) for surfaces without a runtime mount (Astro templates, GROQ files)"
    - "Dynamic import() + vi.mock('@sanity/client') with chainable patch builder stub for migration script testing"
    - "Traceability tags embedded in describe()/it() names (PROC-xx, D-xx) so downstream plans can grep-map tests to requirement/decision IDs"

key-files:
  created:
    - tests/schema/procurement-price-strip.test.ts
    - tests/queries/procurement-savings-absence.test.ts
    - src/components/admin/ProcurementEditor.test.tsx
    - src/components/admin/ProcurementItemModal.test.tsx
    - src/components/portal/ProcurementTable.test.ts
    - src/pages/portal/project/__tests__/closeout-copy.test.ts
    - scripts/migrations/__tests__/37-migrate-item-image.test.mjs
  modified:
    - vitest.config.ts (widened include globs to discover tests/ and scripts/**/__tests__/)

key-decisions:
  - "vitest include[] widened to cover tests/ + scripts/**/__tests__/ paths -- new test locations needed config support (Rule 3 deviation: blocking issue)"
  - "ProcurementItemModal.test.tsx imports a module that does not yet exist; module-not-found counts as RED baseline per plan"
  - "closeout-copy.test.ts scans ALL 'completed project' anchor windows (there are two in the current template) so the RED signal fires on the real paragraph at offset 3480 rather than the comment at 3140"
  - "Migration test uses vi.mock with chainable patch builder (setIfMissing/append/insert/unset/commit), mirroring @sanity/client's real surface"

patterns-established:
  - "Plan 02/03 verify commands cite these files via `npm run test -- <path>`; glob `npm run test -- .*procurement.*` runs the whole Phase 37 harness"
  - "Traceability: grep -c 'PROC-NN' <test file> produces coverage counts per requirement"

requirements-completed: [PROC-10, PROC-11, PROC-12, PROC-13, PROC-14]

# Metrics
duration: ~10min
completed: 2026-04-15
---

# Phase 37 Plan 01: Wave 0 RED Test Harness Summary

**7 vitest files establish a 57-it-block RED baseline covering schema strip, GROQ/email projection absence, admin row-click-to-modal, view/edit toggle, multi-image gallery CRUD, portal price strip, closeout copy, and migration idempotency. Zero production code changed.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-15T01:17:42Z
- **Completed:** 2026-04-15T01:27:46Z
- **Tasks:** 3
- **Files created:** 7 (test files)
- **Files modified:** 1 (vitest.config.ts)

## Accomplishments

- Full Wave 0 test harness scaffolded in one pass, 57 it() blocks total
- Every PROC-xx requirement (PROC-10..14) covered by at least one tagged test
- Every destructive decision (D-08, D-13, D-14, D-15, D-16) has an absence-assertion test
- RED baseline verified: `npm run test -- tests/ src/components/admin/Procurement src/components/portal/ProcurementTable.test.ts src/pages/portal/project/__tests__/ scripts/migrations/__tests__/` exits with code 1 (39 failing / 18 passing -- passes are the non-destructive invariants like `expectedDeliveryDate` survival and ITEM/TRACK header preservation)

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema + queries absence harness** — `50a332b` (test)
2. **Task 2: Admin editor + modal + portal component test harness** — `59a15b6` (test)
3. **Task 3: Migration idempotency harness** — `07932b4` (test)

## Files Created/Modified

| File | Lines | `it(` blocks | Purpose |
|------|-------|--------------|---------|
| `tests/schema/procurement-price-strip.test.ts` | 148 | 6 | Schema field-absence + images[] presence + expectedDeliveryDate preservation |
| `tests/queries/procurement-savings-absence.test.ts` | 137 | 10 | retailPrice/clientCost/"savings"/totalSavings absence in queries.ts + send-update + close-document; images[] projection presence |
| `src/components/admin/ProcurementEditor.test.tsx` | 185 | 7 | Row-click-to-modal, stopPropagation on badge/track/refresh/delete, EXPECTED INSTALL header, COST/NET removal, + Add Item create-mode dispatch |
| `src/components/admin/ProcurementItemModal.test.tsx` | 374 | 10 | view<->edit toggle, Save/Discard footer, edit-mode field inventory, image gallery primary toggle + auto-promote + delete + drag reorder + multi-file upload; Expected install date label |
| `src/components/portal/ProcurementTable.test.ts` | 109 | 11 | Absence of MSRP/Savings/retailPrice/totalSavings/formatCurrency/tfoot; presence of EXPECTED INSTALL + ITEM + TRACK headers |
| `src/pages/portal/project/__tests__/closeout-copy.test.ts` | 86 | 4 | Multi-anchor 500-char window scan for savings/retail/$ in closeout paragraph |
| `scripts/migrations/__tests__/37-migrate-item-image.test.mjs` | 403 | 9 | itemImage→images[0] correctness; idempotency (pre-populated images, double-run); no-op; dryRun; D-16 clientCost/retailPrice unset; combined image+price migration in single project patch |
| `vitest.config.ts` | +5 | — | Widened `include` to discover `tests/**` and `scripts/**/__tests__/**/*.test.mjs` |

**Total:** 57 it() blocks / 1442 test LOC.

## Requirement Coverage

| Requirement | Tagged tests | Files |
|-------------|--------------|-------|
| PROC-10 | 9 | ProcurementEditor.test.tsx, ProcurementItemModal.test.tsx |
| PROC-11 | 5 | ProcurementItemModal.test.tsx |
| PROC-12 | 14 | schema/queries/editor/modal/table/closeout/migration (7 files) |
| PROC-13 | 13 | schema/editor/modal/table (4 files) |
| PROC-14 | 13 | schema/queries/modal/migration (4 files) |

## Decisions Made

- **vitest.config.ts widened** — Default include globs only covered `src/**/*.test.ts(x)`. Plan explicitly placed schema/queries tests under `tests/` and migration under `scripts/**/__tests__/` so they could sit next to the production surfaces they guard without bloating `src/`. Widening the include list is the minimum-impact fix.
- **Closeout copy test scans all anchor windows** — The current `[projectId].astro` template contains two `"completed project"` substrings (a comment `<!-- ... completed projects only -->` at offset 3140 and the real paragraph `"...completed project including milestones, procurement savings..."` at offset 3480). A single `indexOf` only catches the comment window, which has no "savings" text, so RED would not fire. Replaced with an all-occurrences loop.
- **Module-not-found as valid RED** — Plans 02/03 create `ProcurementItemModal` and the migration script. The plan document explicitly accepts module-not-found as RED per TDD red stage. Tests import from the eventual module path with a top-of-file comment labeling the RED source.
- **Traceability via name tags** — Every it() title includes PROC-xx / D-xx tags. `grep -c "PROC-14"` et al produces per-requirement coverage counts without parsing test files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Widened vitest include globs for new test paths**
- **Found during:** Task 1 (first `npm run test` invocation against `tests/schema/...`)
- **Issue:** `vitest.config.ts` only included `src/**/*.test.ts(x)`. Tests in `tests/` and `scripts/**/__tests__/` would be skipped silently, producing false-GREEN (zero tests executed instead of RED assertions firing).
- **Fix:** Added `tests/**/*.test.ts`, `tests/**/*.test.tsx`, and `scripts/**/__tests__/**/*.test.mjs` to the `include` array.
- **Files modified:** `vitest.config.ts`
- **Verification:** RED baseline run shows all 7 files discovered and executed (39 failing / 18 passing).
- **Committed in:** 50a332b (Task 1 commit)

**2. [Rule 1 - Bug] Closeout-copy anchor window missed the real paragraph**
- **Found during:** Task 2 (writing closeout-copy.test.ts; first draft used `indexOf` returning only offset 3140 -- the comment, not the paragraph at 3480)
- **Issue:** A single `indexOf("completed project")` returned an earlier comment match whose surrounding window had no "savings"/"$" tokens. All four closeout assertions would pass today (false GREEN), defeating the RED baseline.
- **Fix:** Replaced single-window lookup with an all-occurrences loop (`closeoutWindows`) and asserted `offenders.length === 0` across the array.
- **Files modified:** `src/pages/portal/project/__tests__/closeout-copy.test.ts`
- **Verification:** RED baseline now fires: 3 of 4 assertions fail on the real paragraph containing "procurement savings" and "$" (from a nearby `${...}` interpolation within the 250-char halo).
- **Committed in:** 59a15b6 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 1 bug)
**Impact on plan:** Both auto-fixes preserve the correctness of the RED signal. No scope creep.

## Issues Encountered

- None. The migration test file intentionally produces a module-resolution failure; plan documents this as the RED contract.

## RED Baseline Command Output (truncated)

```
$ npm run test -- tests/ src/components/admin/Procurement \
    src/components/portal/ProcurementTable.test.ts \
    src/pages/portal/project/__tests__/ \
    scripts/migrations/__tests__/

 Test Files  7 failed (7)
      Tests  39 failed | 18 passed (57)
   Duration  2.14s
EXIT:1
```

The 18 passes are the non-destructive invariants (e.g., schema still has `expectedDeliveryDate`, portal table still has ITEM + TRACK headers, closeout paragraph still anchored on "completed project", `queries.ts` non-empty, etc.). Every destructive target (price strip, itemImage removal, modal existence, images[] projection, closeout copy rewrite, migration script) is RED as required.

## User Setup Required

None -- this plan creates test files only. No env vars, no Sanity config changes.

## Next Phase Readiness

- Plan 02 (schema/queries/portal strip) can reference the schema + queries + portal + closeout test files in its `<automated>` verify commands; each strip-related change flips a specific subset of RED assertions to GREEN.
- Plan 03 (admin editor refactor + modal + gallery) can reference ProcurementEditor.test.tsx + ProcurementItemModal.test.tsx for incremental feedback; the module-not-found error on the modal test becomes parsing/compile errors, then real assertion failures, then GREEN as Plan 03 lands.
- Plan 02 Task 4 will create `scripts/migrations/37-migrate-item-image-to-images.mjs` -- its shape is constrained by the 8 idempotency/correctness tests in `37-migrate-item-image.test.mjs`.

---
*Phase: 37-procurement-privacy-modal-editor*
*Plan: 01*
*Completed: 2026-04-15*

## Self-Check: PASSED

Verified artifacts:
- FOUND: tests/schema/procurement-price-strip.test.ts
- FOUND: tests/queries/procurement-savings-absence.test.ts
- FOUND: src/components/admin/ProcurementEditor.test.tsx
- FOUND: src/components/admin/ProcurementItemModal.test.tsx
- FOUND: src/components/portal/ProcurementTable.test.ts
- FOUND: src/pages/portal/project/__tests__/closeout-copy.test.ts
- FOUND: scripts/migrations/__tests__/37-migrate-item-image.test.mjs
- FOUND commit: 50a332b (Task 1)
- FOUND commit: 59a15b6 (Task 2)
- FOUND commit: 07932b4 (Task 3)
