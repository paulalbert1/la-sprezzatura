---
phase: 49
plan: 01
subsystem: session-foundation
tags: [session, schema, impersonation, foundations, phase-49, plan-49-01]
requirements: [IMPER-04, IMPER-08]
dependency_graph:
  requires: []
  provides:
    - "SessionData.impersonating field (D-02 verbatim, 7 sub-fields)"
    - "SessionData.mintedAt field (ISO8601, set on every session write)"
    - "App.Locals.impersonating field (D-04 viewer/admin attribution)"
  affects:
    - "All Phase 49 plans 02-08 — depend on this schema surface"
    - "All Phase 50 plans (banner, re-auth modal) — read App.Locals.impersonating"
tech_stack:
  added: []
  patterns:
    - "vi.mock(\"./redis\", ...) runtime mock pattern in src/lib/session.test.ts (new for this file)"
key_files:
  created: []
  modified:
    - "src/lib/session.ts (SessionData interface + mintedAt writes)"
    - "src/lib/session.test.ts (7 new runtime tests)"
    - "src/env.d.ts (App.Locals.impersonating augmentation)"
decisions:
  - "Adopted vi.mock + cookie-stub runtime test pattern (plan said \"already established\" but it wasn't); pre-existing source-grep tests retained for backward compatibility"
  - "mintedAt added to BOTH createSession and createPurlSession per RESEARCH Open Q1 (single source of truth)"
metrics:
  duration_minutes: 5
  completed_date: 2026-04-30
  tasks_completed: 3
  files_modified: 3
  tests_added: 7
---

# Phase 49 Plan 01: Session Foundation Summary

Extend `SessionData` with `mintedAt` (ISO8601) and `impersonating` (D-02 verbatim 7-field shape), wire `mintedAt` into every `createSession` + `createPurlSession` write, and augment `App.Locals` with the `impersonating` viewer/admin-attribution field. Foundation for every downstream Phase 49 plan (mint endpoint, redeem, middleware gate, Resend gate, audit writers).

## What Shipped

| Item | Where | Notes |
|------|-------|-------|
| `SessionData.mintedAt?: string` | `src/lib/session.ts:54` | Optional — backward-compat with sessions written before this deploy |
| `SessionData.impersonating?: { ... }` | `src/lib/session.ts:62` | D-02 verbatim — role / entityId / projectId / tenantId / adminEmail / mintedAt / originalAdminSessionToken |
| `mintedAt` set in `createSession` | `src/lib/session.ts:73` | `new Date().toISOString()` on every write |
| `mintedAt` set in `createPurlSession` | `src/lib/session.ts:115` | Same — single source of truth (RESEARCH Open Q1) |
| `App.Locals.impersonating?: { adminEmail, adminEntityId, mintedAt }` | `src/env.d.ts:20` | D-04 viewer-vs-admin attribution surface |
| 7 new runtime tests | `src/lib/session.test.ts` | All passing alongside the 17 pre-existing source-grep tests (24 total) |

## Tasks

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Extend SessionData with mintedAt + impersonating (D-02) | `913f149` | done |
| 2 | Set mintedAt on every createSession + createPurlSession write | `a3d04f9` | done |
| 3 | Augment App.Locals with impersonating field (D-04) | `48bdc7f` | done |

## Verification

| Gate | Result |
|------|--------|
| `npm run test -- --run src/lib/session.test.ts` | 24/24 passing |
| `grep -c 'impersonating?:' src/lib/session.ts` | 1 (≥1 ✓) |
| `grep -c 'mintedAt: new Date().toISOString()' src/lib/session.ts` | 2 (=2 ✓) |
| `grep -c 'impersonating?:' src/env.d.ts` | 1 (=1 ✓) |
| `npx astro check` (whole repo) | 36 errors — all pre-existing in unrelated files; the test file actually fixed 18 prior errors (54 → 36); zero new errors introduced by this plan |

## Test Coverage

Task 1 (4 tests):
- SessionData type accepts impersonating field with all 7 D-02 sub-fields
- SessionData type accepts optional mintedAt string field
- getSession round-trips impersonating payload through Redis JSON serialization (mocked Upstash auto-parse path)
- getSession parses legacy session strings without `mintedAt` and returns `mintedAt=undefined` (Pitfall D guardrail)

Task 2 (3 tests):
- createSession writes `mintedAt` as ISO8601 string parseable by `new Date()` (round-trip identical)
- createPurlSession writes `mintedAt` as ISO8601 string AND preserves all existing PURL fields (entityId, role, source='purl', portalTokenHash)
- mintedAt value is bounded by `before <= mintedAtMs <= after` of the call AND within 5 seconds of `Date.now()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Test file lacked the `vi.mock("./redis", ...)` infrastructure the plan claimed was "already established"**
- **Found during:** Task 1 setup
- **Issue:** Plan said "Use the codebase's existing mock-based pattern (`vi.mock(\"./redis\", ...)` already established in this file)" — but `src/lib/session.test.ts` was a pure source-grep test file with zero `vi.mock` usage.
- **Fix:** Added a `vi.mock("./redis", () => ({ redis: { get, set, del } }))` block plus a `makeCookieStub()` helper at the top of the test file (just below the existing source-grep imports). Pre-existing source-grep tests retained unchanged. The new pattern is consistent with `src/lib/renderingAuth.test.ts` style.
- **Files modified:** `src/lib/session.test.ts`
- **Commit:** `913f149`

### No other deviations
Plan executed exactly as written for the type/source changes. No architectural changes (Rule 4) were needed; no out-of-scope work was attempted.

## Threat Surface

Plan's `<threat_model>` identified two STRIDE rows:

- **T-49-06 (EoP):** mintedAt set on every write (Tasks 1+2), legacy sessions return mintedAt=undefined (Test 4) — both confirmed. The downstream mint endpoint (Plan 04) is the enforcement point per D-11.
- **T-49-03 (Tampering):** `SessionData.impersonating` schema defined per D-02. Enforcement of `projectId/entityId/tenantId` scope validation lives in dependent plans (Plans 04, 05, 07) per the plan's own disposition note.

No new threat-flag-worthy surface introduced by this plan (no endpoints, no auth paths, no schema changes at trust boundaries — only type-level and same-process additions).

## Notes for Downstream Plans

- The new `vi.mock + cookie-stub` pattern is now available for any future test in `src/lib/session.test.ts`.
- `getSession`'s existing object-pass-through branch (`src/lib/session.ts:177`) already returns the full payload without filtering, so an `impersonating` field round-trips through Upstash auto-parse for free — no changes needed to `getSession` in this plan.
- Plan 49-03's `createImpersonationSession` helper should mirror `createPurlSession` (per PATTERNS.md L46-77) and must also set `mintedAt: new Date().toISOString()` on its Redis payload — but per this plan's Task 2 action note, that helper is NOT created here.

## Self-Check: PASSED

All 3 commits exist on `main`:
- `913f149` feat(49-01): extend SessionData with mintedAt + impersonating
- `a3d04f9` feat(49-01): set mintedAt on every createSession + createPurlSession write
- `48bdc7f` feat(49-01): augment App.Locals with impersonating field

All 3 modified files contain the expected changes:
- `src/lib/session.ts` — SessionData extended, mintedAt written 2x
- `src/lib/session.test.ts` — 7 new tests, 24/24 passing
- `src/env.d.ts` — App.Locals.impersonating present with 3 sub-fields
