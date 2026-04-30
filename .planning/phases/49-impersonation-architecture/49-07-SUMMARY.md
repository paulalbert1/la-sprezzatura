---
phase: 49
plan: 07
subsystem: middleware
tags: [middleware, read-only-gate, locals, public-paths, impersonation, phase-49, plan-49-07]
requirements: [IMPER-02]
dependency_graph:
  requires:
    - "49-01: SessionData.impersonating shape (Plan 01)"
  provides:
    - "src/middleware.ts: PUBLIC_PATHS entry for /portal/_enter-impersonation"
    - "src/middleware.ts: sibling impersonation read-only gate on /api/* non-safe methods (D-13, IMPER-02)"
    - "src/middleware.ts: viewer-identity locals hydration in 4 branches — /portal, /workorder, /building, /_actions (D-04 + RESEARCH Pitfall F)"
    - "Astro.locals.impersonating populated when session.impersonating set (consumed by Plan 50 banner + Plan 49-08 belt-and-braces gates)"
  affects:
    - "Plan 49-04 (mint endpoint): redeem route at /portal/_enter-impersonation now reachable per PUBLIC_PATHS"
    - "Plan 49-05 (redeem route): public-path entry lets the route handler mint the impersonated session before any role-gate runs"
    - "Plan 49-08 (belt-and-braces 403 in send-update + work-orders/[id]/send): middleware 401 fires first; Plan 08 adds the per-handler 403 for telemetry separation per D-14"
    - "Plan 50 (impersonation banner UI): consumes Astro.locals.impersonating.adminEmail / adminEntityId / mintedAt"
tech_stack:
  added: []
  patterns:
    - "Sibling middleware branch (NOT generalization) per CONTEXT D-03"
    - "Single-fetch reuse of gateSession across PURL + impersonation gates (RESEARCH Pattern 1 — no double Redis round-trip)"
    - "Viewer-derived role gate: viewerRole = session.impersonating?.role ?? session.role (replaces direct session.role check; preserves backward compat)"
key_files:
  created: []
  modified:
    - "src/middleware.ts (168 → 234 lines)"
    - "src/middleware.test.ts (+292 lines, +12 tests, 3 source-scan assertions updated for viewerRole pattern)"
decisions:
  - "Refactored role-branch session-existence guard from `if (!session || session.role !== X)` to a two-step pattern: `if (!session) redirect; const viewerRole = ...; if (viewerRole !== X) redirect`. This drops the optional chain on session inside the viewer derivation (so the literal grep `session.impersonating?.entityId ?? session.entityId` matches the done criteria exactly), keeps redirect semantics identical, and is structurally consistent across all 3 role branches"
  - "Updated 3 pre-existing source-scan assertions (`session\\.role !== 'client'` etc.) to the new `viewerRole !== 'client'` pattern. The role check is semantically unchanged — just expressed via a derived var. Updated as a Rule 1 deviation (test asserting outdated literal pattern after a deliberate refactor)"
  - "/_actions/* branch keeps its existing four-way role switch (admin / client / contractor / building_manager) and overlays the impersonation behavior on top: `viewerRole` drives the switch, and a final `if (session.impersonating)` block sets `locals.impersonating` and re-asserts `locals.tenantId = session.tenantId` (D-01 invariant). This minimizes diff while satisfying Pitfall F"
  - "tenantId is hydrated from `session.tenantId` in BOTH impersonation and non-impersonation paths in role branches. Previously the role branches didn't set locals.tenantId at all (only the admin branch did). This is a Rule 2 auto-add (missing critical functionality): the tenantId from the impersonation session must flow to locals so downstream Sanity reads in /portal/* etc. scope to the correct tenant. D-01 invariant guarantees `payload.tenantId === session.tenantId` per Plan 49-04 mint validation"
metrics:
  duration_minutes: 18
  completed_date: 2026-04-30
  tasks_completed: 2
  files_changed: 2
  tests_added: 12
---

# Phase 49 Plan 07: Middleware Read-Only Gate + Locals Hydration Summary

**One-liner:** Extends `src/middleware.ts` with the load-bearing IMPER-02 boundary — `/portal/_enter-impersonation` becomes a public path, a sibling read-only gate immediately after the existing PURL gate returns 401 on non-safe `/api/*` methods when `session.impersonating` is set, and the 3 role branches plus the `/_actions/*` branch (Pitfall F) now hydrate `Astro.locals` from the VIEWER identity while attaching admin attribution via `locals.impersonating`.

## What Shipped

| Change | Where | Notes |
|--------|-------|-------|
| `/portal/_enter-impersonation` added to PUBLIC_PATHS | `src/middleware.ts:13-17` | RESEARCH Open Q2 — redeem route must be reachable WITHOUT an existing role-matched session so the route handler itself can mint the impersonated session |
| Sibling impersonation read-only gate | `src/middleware.ts:60-68` | Returns 401 `{ error: 'Impersonation sessions are read-only' }` on non-safe `/api/*` methods when `purlGateSession?.impersonating` is set. Reuses the same `purlGateSession` already fetched by the PURL branch — RESEARCH Pattern 1, no double Redis fetch |
| /portal/* role branch viewer hydration | `src/middleware.ts:75-129` | viewerEntity/viewerRole derived from `session.impersonating?.* ?? session.*`; gate is now `viewerRole !== 'client'`; locals.clientId reflects viewer; locals.impersonating set when session.impersonating present |
| /workorder/* role branch viewer hydration | `src/middleware.ts:132-153` | Same pattern; gate on `viewerRole !== 'contractor'`; locals.contractorId reflects viewer |
| /building/* role branch viewer hydration | `src/middleware.ts:156-177` | Same pattern; gate on `viewerRole !== 'building_manager'`; locals.buildingManagerEmail reflects viewer |
| /_actions/* branch (Pitfall F regression guard) | `src/middleware.ts:204-235` | viewerRole drives the existing role switch; `locals.impersonating` overlay set when session.impersonating present. Without this, Astro Actions invoked during impersonation would record `createdBy: <admin@email>` instead of viewer attribution |

## D-04 / D-01 Invariants Preserved

| Invariant | Where enforced | Test coverage |
|-----------|----------------|---------------|
| `session.role` stays `'admin'` during impersonation (D-01) | Plan 49-03 createImpersonationSession (unchanged here) | Test 6 of Task 2 — `locals.impersonating.adminEntityId === session.entityId` (admin's email) |
| `locals.role` reflects VIEWER (D-04) | All 4 branches use `viewerRole = session.impersonating?.role ?? session.role` | Tests 1-4 of Task 2 — locals.role is `client` / `contractor` / `building_manager` matching impersonating.role |
| `locals.tenantId` carries from session (D-01) | All 4 branches do `locals.tenantId = session.tenantId` | Test 1 of Task 2 — `locals.tenantId === ADMIN_TENANT` |
| `locals.impersonating.adminEntityId === session.entityId` (admin stays admin) | All 4 `if (session.impersonating)` blocks | Test 6 of Task 2 — explicit D-01 assertion |
| Backward compat: non-impersonation sessions hydrate from `session.entityId` | viewerEntity defaults via `??` | Test 5 of Task 2 — plain client session: `clientId === session.entityId`, `impersonating === undefined` |

## Threat Mitigations Realized

| Threat ID | Mitigation | Test guard |
|-----------|-----------|-----------|
| T-49-01 (Tampering — mutation through impersonated session) | Sibling read-only branch returns 401 before any handler runs (D-13) | Task 1 Test 3 (POST returns 401 + body.error === 'Impersonation sessions are read-only'), Test 6 (single Redis fetch) |
| T-49-02 (Email send through impersonated session — middleware leg) | The 401 fires for /api/send-update and /api/admin/work-orders/[id]/send (both POST) before reaching the handler | Task 1 Test 3 covers any /api/* POST; Plan 08 adds the belt-and-braces 403 for telemetry separation (D-14) |
| T-49-04 (Repudiation — Astro Actions recording admin attribution / Pitfall F) | /_actions/* branch hydrates locals from viewer not admin; locals.impersonating carries admin attribution separately | Task 2 Test 4 — explicit Pitfall F regression guard: `locals.clientId === viewer NOT ADMIN_EMAIL` |
| T-49-05 (Cross-tenant leak via locals.tenantId) | locals.tenantId carries from session.tenantId; mint enforced `payload.tenantId === session.tenantId` invariant per Plan 04 | Task 2 Test 1 — `locals.tenantId === ADMIN_TENANT` after impersonation |

## Verification Snapshot

```text
$ npm run test -- --run src/middleware.test.ts
 ✓ src/middleware.test.ts (61 tests) 26ms
 Test Files  1 passed (1)
      Tests  61 passed (61)

$ grep -c '/portal/_enter-impersonation' src/middleware.ts        # → 1
$ grep -c 'Impersonation sessions are read-only' src/middleware.ts # → 1
$ grep -c 'PURL sessions are read-only' src/middleware.ts          # → 1 (PURL branch byte-identical)
$ grep -c 'session.impersonating?.entityId ?? session.entityId' src/middleware.ts  # → 4
$ grep -c 'session.impersonating?.role ?? session.role' src/middleware.ts          # → 4
$ grep -c 'context.locals.impersonating = {' src/middleware.ts                     # → 4
$ grep -c 'adminEntityId: session.entityId' src/middleware.ts                      # → 4 (D-01 invariant)
$ grep -c 'getSession(context.cookies)' src/middleware.ts                          # → 6 (no new call added; sibling reuses purlGateSession)

$ npx tsc --noEmit 2>&1 | grep -i middleware                       # → (empty — no middleware type errors)
```

## Tests Added

12 new tests across 2 describe blocks:

**`Phase 49 impersonation gate` (Task 1, 6 tests):**
1. GET /portal/_enter-impersonation passes without session (PUBLIC_PATHS)
2. PURL gate string is present exactly once (byte-identical, D-03)
3. POST /api/admin/clients with session.impersonating returns 401 read-only
4. GET /api/admin/clients with session.impersonating does NOT return read-only 401 at the gate (safe-method passthrough)
5. impersonation gate is a sibling `if`, NOT a `||` extension of the PURL branch (source-scan)
6. non-safe API request with impersonating session calls getSession exactly once (Pattern 1: reuse purlGateSession)

**`Phase 49 locals hydration (D-04 + Pitfall F)` (Task 2, 6 tests):**
1. /portal/* with impersonating session: locals.clientId reflects viewer
2. /workorder/* with impersonating session: locals.contractorId reflects viewer
3. /building/* with impersonating session: locals.buildingManagerEmail reflects viewer
4. **Pitfall F: locals.clientId reflects viewer NOT admin in /_actions/* branch** (load-bearing regression guard)
5. /portal/* with plain client session (no impersonating): backward compat
6. D-01 invariant: locals.impersonating.adminEntityId === session.entityId (admin's entityId)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing source-scan tests asserting `session.role !== '<X>'` literal**
- **Found during:** Task 2 GREEN
- **Issue:** 3 tests at lines 106-114, 138-142 of the original test file asserted the regex `/session\.role\s*!==\s*["']client["']/` (and similar for contractor / building_manager). After refactoring the role gate to use a derived `viewerRole` variable per D-04, those assertions failed even though the role check is semantically unchanged.
- **Fix:** Updated the 3 assertions to assert `/viewerRole\s*!==\s*["']client["']/` (etc.) — the test still encodes "the role gate exists for this branch", just via the new variable.
- **Files modified:** src/middleware.test.ts
- **Commit:** a2808a6 (bundled with Task 2 GREEN since the tests live alongside the new test block)

**2. [Rule 2 - Auto-add] locals.tenantId hydration in role branches**
- **Found during:** Task 2 implementation (writing /portal/* viewer-hydration)
- **Issue:** The pre-plan role branches did NOT set `locals.tenantId` (only the admin branch did). For an impersonation session targeting /portal/*, locals.tenantId would be undefined unless we explicitly hydrated it. Downstream tenant-scoped Sanity reads in portal pages would either fall back to a default tenant or fail.
- **Fix:** Added `context.locals.tenantId = session.tenantId` in all 3 role branches (and confirmed the `/_actions/*` branch does the same when `session.impersonating` is set). Per D-01, `session.tenantId` is guaranteed correct because Plan 49-04's mint endpoint validates `payload.tenantId === session.tenantId` before issuing the ticket.
- **Files modified:** src/middleware.ts
- **Commit:** a2808a6
- **Test coverage:** Task 2 Test 1 explicitly asserts `locals.tenantId === ADMIN_TENANT` after impersonation through /portal/*.

### Architectural changes
None.

### Auth gates
None — plan was fully autonomous.

## Self-Check: PASSED

- src/middleware.ts modified — FOUND
- src/middleware.test.ts modified — FOUND
- Commit fc5bd6e (test RED Task 1) — FOUND
- Commit 6b5bc62 (feat GREEN Task 1) — FOUND
- Commit a94a033 (test RED Task 2) — FOUND
- Commit a2808a6 (feat GREEN Task 2) — FOUND
- All 61 middleware tests pass (49 pre-existing + 12 new)
- npx tsc --noEmit → no middleware type errors (pre-existing errors in close-document.ts / sanity/* are out-of-scope per scope_boundary)

## TDD Gate Compliance

Each task followed RED → GREEN cycle with separate commits:

| Task | RED commit | GREEN commit |
|------|-----------|--------------|
| 1 | fc5bd6e (test) | 6b5bc62 (feat) |
| 2 | a94a033 (test) | a2808a6 (feat) |

No REFACTOR commits needed — the GREEN implementations were already structurally clean.
