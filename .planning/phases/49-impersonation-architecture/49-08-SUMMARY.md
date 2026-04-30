---
phase: 49
plan: 08
subsystem: impersonation / email-dispatch
tags: [resend, belt-and-braces, 403, impersonation, IMPER-03, defense-in-depth]
requires:
  - 49-07 (middleware 401 read-only gate — primary block; this plan is depth-of-defense)
  - SessionData.impersonating + Astro.locals.impersonating hydration (49-01..49-04)
provides:
  - 403 belt-and-braces gate at /api/send-update Resend call site
  - 403 belt-and-braces gate at /api/admin/work-orders/[id]/send Resend call site
  - Unit-level IMPER-03 ground truth (resend.emails.send is unreachable from impersonated session)
affects:
  - src/pages/api/send-update.ts
  - src/pages/api/admin/work-orders/[id]/send.ts
tech-stack:
  added: []
  patterns:
    - "Early-return 403 belt-and-braces gate inserted after the existing auth/tenant gates and BEFORE body parse / Sanity fetch / Resend init"
    - "Status-code-as-telemetry-channel: 403 (not 401) so future telemetry filters can distinguish 'impersonation tried to email' from generic mutation blocks (D-14)"
key-files:
  created: []
  modified:
    - src/pages/api/send-update.ts
    - src/pages/api/send-update.test.ts
    - src/pages/api/admin/work-orders/[id]/send.ts
    - src/pages/api/admin/work-orders/[id]/send.test.ts
decisions:
  - "Honor D-14 status-code choice: return 403, never 401, at every Resend call site — middleware uses 401 for the broader read-only gate, so 403 is the discriminator for 'impersonation reached email path'."
  - "Place the gate AFTER the existing tenant gate in the work-orders send endpoint (rather than before) so a session without tenantId still receives 'No tenant context' first. Test 4 in Task 2 is the placement-order regression guard."
  - "Gate placed BEFORE body parse / Sanity fetch / Resend init in /api/send-update so an impersonated session never reaches any side-effect path. Tested via mockFetch.not.toHaveBeenCalled()."
metrics:
  duration_minutes: 7
  completed: 2026-04-30
  task_count: 2
  commit_count: 4
  new_tests: 8
  new_test_pass_rate: "8/8 (100%)"
requirements_satisfied: [IMPER-03]
---

# Phase 49 Plan 08: Resend Belt-and-Braces 403 Gates Summary

Two-line edit to each of the two Resend call sites — destructure `locals` and add an early-return 403 — fulfilling D-14's belt-and-braces defense-in-depth requirement. Eight new tests assert the gate fires correctly, the 403 status discriminates from the middleware's 401, and `resend.emails.send` is never reached from an impersonated session.

## Commits

| # | Hash      | Type     | Message                                                                  |
| - | --------- | -------- | ------------------------------------------------------------------------ |
| 1 | b78a3db   | test     | test(49-08): add failing tests for IMPER-03 403 gate in /api/send-update |
| 2 | 0431b13   | feat     | feat(49-08): add 403 belt-and-braces gate at /api/send-update for IMPER-03 |
| 3 | af3b6be   | test     | test(49-08): add failing tests for IMPER-03 403 gate in admin work-orders send |
| 4 | 4674fdd   | feat     | feat(49-08): add 403 belt-and-braces gate at admin work-orders send for IMPER-03 |

Standard TDD RED→GREEN cycle per task. No REFACTOR commits — both edits were minimal (signature destructure + 8-line block) and required no cleanup.

## Tasks Completed

### Task 1: 403 belt-and-braces gate in /api/send-update

**RED (b78a3db):** Added `describe("Phase 49 IMPER-03 belt-and-braces", ...)` block with 4 tests:
1. Returns 403 + correct body shape
2. `resend.emails.send` never called + `mockFetch` never called (gate fires before body parse)
3. No regression: happy path doesn't 403
4. Status code is 403, NOT 401 (D-14 telemetry-separation invariant)

Updated `callPost` test helper to default `locals: {}` so existing tests pass without modification while new tests can pass impersonating context. Confirmed RED: 3 tests fail (test 3 passed coincidentally — happy-path response was simply not 403).

**GREEN (0431b13):** Two-line modification to `src/pages/api/send-update.ts` POST handler:
1. Destructured `locals` in the handler signature
2. Inserted 8-line early-return 403 block immediately after the admin gate, BEFORE the body parse

All 4 IMPER-03 tests now pass.

### Task 2: 403 belt-and-braces gate in /api/admin/work-orders/[id]/send

**RED (af3b6be):** Added equivalent describe block with 4 tests, including the placement-order regression guard (Test 4: admin without tenantId + impersonating set → must receive "No tenant context" first, not "Cannot send email during impersonation"). Confirmed RED: 2 tests fail (the other 2 pass coincidentally — happy path and placement-order both produce non-impersonation outcomes by accident).

**GREEN (4674fdd):** Two-line modification to `src/pages/api/admin/work-orders/[id]/send.ts` POST handler:
1. Destructured `locals` in the handler signature
2. Inserted the 8-line 403 block BETWEEN the tenant gate and the workOrderId guard (placement order matters per Test 4)

All 4 IMPER-03 tests now pass.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| All 8 new IMPER-03 tests pass | `npx vitest run src/pages/api/send-update.test.ts 'src/pages/api/admin/work-orders/[id]/send.test.ts' -t "IMPER-03"` | 8/8 pass |
| `Cannot send email during impersonation` appears once per file | `grep -c 'Cannot send email during impersonation' src/pages/api/send-update.ts src/pages/api/admin/work-orders/[id]/send.ts` | 1 per file (2 total) |
| Both POST handlers destructure `locals` | `grep -cE 'POST: APIRoute = async \(\{[^}]*locals[^}]*\}\)' src/pages/api/send-update.ts src/pages/api/admin/work-orders/[id]/send.ts` | 1 per file |
| Modified files have zero typecheck errors | `npx tsc --noEmit \| grep "send-update\|work-orders.*send"` | empty (no errors) |

## Deferred Issues

The repository carries pre-existing test failures and typecheck errors UNRELATED to this plan's scope. They were present on `main` at HEAD `297de2a` before any change in Plan 08 was applied, and they remain unchanged afterwards.

### Pre-existing failures in `src/pages/api/send-update.test.ts` (3 failures)

Tests in the original `describe("POST /api/send-update (Phase 34 Plan 04)", ...)` block reference `/portal/client/<token>` URLs in the rendered email HTML. These tests were already failing on `main` before Plan 08 (verified via `git stash`). They are unrelated to IMPER-03 and out of scope per the SCOPE BOUNDARY rule. Recommend a follow-up to investigate the rendered-HTML drift.

### Pre-existing failures in `src/pages/api/admin/work-orders/[id]/send.test.ts` (7 failures)

Tests covering `defaultFromEmail`, `defaultCcEmail`, sendLog appending, and `RESEND_API_KEY`-unset paths fail on `main` HEAD before Plan 08 (verified via `git stash`). Unrelated to IMPER-03; out of scope.

### Pre-existing typecheck errors

`npx tsc --noEmit` reports errors in:
- `src/pages/api/close-document.ts` (Buffer type mismatch)
- `src/sanity/image.ts` (missing module declaration)
- `src/sanity/queries.ts` (overload mismatch)
- `src/sanity/schemas/projectWorkflow.test.ts` (FieldDefinition cast)

None of these files were modified by Plan 08; the errors are baseline. Modified files (`send-update.ts`, `send-update.test.ts`, `work-orders/[id]/send.ts`, `work-orders/[id]/send.test.ts`) have zero typecheck errors.

## Deviations from Plan

None — plan executed exactly as written. The "two changes only" instruction in <action> for both tasks was respected (signature destructure + 403 block insertion; no downstream-logic touched).

## TDD Gate Compliance

Both tasks followed the RED→GREEN cycle:
- Task 1: `test(49-08)` commit b78a3db precedes `feat(49-08)` commit 0431b13
- Task 2: `test(49-08)` commit af3b6be precedes `feat(49-08)` commit 4674fdd

No REFACTOR commits — neither edit required cleanup.

## Threat Model Coverage

| Threat ID | Component | Disposition | Status | Evidence |
|-----------|-----------|-------------|--------|----------|
| T-49-02 | Email send through impersonated session reaching real recipient | mitigate | ✓ mitigated | Test 2 in each task asserts `mockResendSend.not.toHaveBeenCalled()` AND `mockFetch.not.toHaveBeenCalled()` (gate fires before any side-effect path). The middleware 401 is the primary gate; this 403 is depth-of-defense. |
| T-49-04 | "Was the email blocked?" telemetry signal ambiguity | mitigate | ✓ mitigated | Test 4 in each task asserts `res.status === 403 && res.status !== 401`. The status-code split is the discriminator the future telemetry filter will key on. |

No new threat surface introduced — the change adds a defensive early-return at an existing trust boundary; no new endpoints, schema fields, or external dependencies.

## Self-Check: PASSED

Files claimed exist:
- ✓ src/pages/api/send-update.ts (modified)
- ✓ src/pages/api/send-update.test.ts (modified)
- ✓ src/pages/api/admin/work-orders/[id]/send.ts (modified)
- ✓ src/pages/api/admin/work-orders/[id]/send.test.ts (modified)

Commits claimed exist:
- ✓ b78a3db: test(49-08) add failing tests for /api/send-update
- ✓ 0431b13: feat(49-08) add 403 gate to /api/send-update
- ✓ af3b6be: test(49-08) add failing tests for admin work-orders send
- ✓ 4674fdd: feat(49-08) add 403 gate to admin work-orders send
