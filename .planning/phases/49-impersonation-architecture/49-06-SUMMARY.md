---
phase: 49
plan: 06
subsystem: api-route
tags: [api-route, exit, logout, audit, impersonation, phase-49, plan-49-06]
requirements: [IMPER-04, IMPER-06]
dependency_graph:
  requires:
    - "49-03: exitImpersonation, writeAdminLogoutAuditDoc, hashImpersonationToken (Plan 03)"
    - "49-01: SessionData.impersonating sub-shape (Plan 01)"
  provides:
    - "POST /api/admin/impersonate/exit — manual exit endpoint (D-15, D-16)"
    - "POST /api/admin/logout — D-20 admin-logout-with-impersonation cleanup"
  affects:
    - "Phase 50 UI: 'Exit preview' button POSTs to /api/admin/impersonate/exit and reads { ok: false, reason: 'session-expired' } to redirect"
    - "Phase 50 UI: admin-banner Logout button POSTs to /api/admin/logout"
tech_stack:
  added: []
  patterns:
    - "Thin-controller pattern — both endpoints delegate Redis + Sanity to Plan 03 helpers"
    - "Audit-before-destroy ordering (D-20 + Pitfall E) — try/catch around audit, return 500 on failure BEFORE any Redis mutation"
    - "Per-test mock surface for getSession + clearSession + redis + impersonation lib (consistent with Plans 49-04 and 49-05 test conventions)"
key_files:
  created:
    - "src/pages/api/admin/impersonate/exit.ts (90 lines)"
    - "src/pages/api/admin/impersonate/exit.test.ts (165 lines, 5 tests)"
    - "src/pages/api/admin/logout.ts (101 lines)"
    - "src/pages/api/admin/logout.test.ts (204 lines, 4 tests)"
  modified: []
decisions:
  - "Returned 200 (not redirect) for the D-16 session-expired branch on /api/admin/impersonate/exit — UI redirects client-side based on { ok: false, reason: 'session-expired' }. Plan task explicitly notes redirect is a UI concern."
  - "On the logout endpoint, when session.impersonating is set but the cookie is gone, fall through to plain clearSession rather than 500. The cookie-gone state can't write a Sanity audit row anyway (no sessionIdHash to derive), and clearSession is safe-no-op."
  - "Used clearSession() at the end of the impersonating branch as well as the plain branch. clearSession deletes the cookie and fires a delete on whatever session: key the cookie points at — redundant after the explicit Promise.all dels, but cheap and idempotent."
metrics:
  duration_minutes: 8
  completed_date: 2026-04-30
  tasks_completed: 2
  files_changed: 4
  tests_added: 9
---

# Phase 49 Plan 06: Exit + Admin-Logout Endpoints Summary

**One-liner:** Two thin POST endpoints that close the impersonation lifecycle — `/api/admin/impersonate/exit` calls Plan 03's `exitImpersonation` for the explicit "Exit preview" button (D-15/D-16), and `/api/admin/logout` extends the existing logout pattern with D-20's audit-before-destroy cleanup (audit row written, both Redis keys deleted, cookie cleared) when the admin chose to nuke their session entirely while in an impersonation tab.

## What Shipped

| Item | Where | Notes |
|------|-------|-------|
| `POST /api/admin/impersonate/exit` | `src/pages/api/admin/impersonate/exit.ts:35` | Admin gate (401), impersonating gate (401 'Not impersonating'), cookie + tenant guards, then delegates to Plan 03 `exitImpersonation`. Builds `ImpersonationPayload` from `session.impersonating` + `session.entityId` (D-01). Returns 200 with helper result; D-16 propagates `{ ok: false, reason: 'session-expired' }`. |
| `POST /api/admin/logout` | `src/pages/api/admin/logout.ts:46` | Two paths: non-impersonating (just `clearSession` + 200) and D-20 impersonating (audit doc → del both Redis keys via `Promise.all` → `clearSession` → 200). Audit failure short-circuits to 500 'Logout failed' BEFORE any Redis mutation (Pitfall E). |
| 5 tests for exit endpoint | `src/pages/api/admin/impersonate/exit.test.ts` | Happy path, D-16 session-expired propagation, not-impersonating, no-session, missing-cookie. |
| 4 tests for logout endpoint | `src/pages/api/admin/logout.test.ts` | Non-impersonating, D-20 happy path with explicit ordering check, D-20 audit-rejects-then-no-redis-del (Pitfall E proof), no-session idempotent. |

## Tasks

| # | Task | Commits | Status |
|---|------|---------|--------|
| 1 (RED) | Failing tests for POST /api/admin/impersonate/exit | `60f56ab` | done |
| 1 (GREEN) | Implement exit endpoint as thin controller around Plan 03 helper | `c9442fa` | done |
| 2 (RED) | Failing tests for POST /api/admin/logout (D-20 cleanup + Pitfall E ordering) | `9ebe2f0` | done |
| 2 (GREEN) | Implement logout endpoint with audit-before-destroy ordering | `7e272b0` | done |

## Verification Results

| Gate | Command | Result |
|------|---------|--------|
| All 9 tests pass | `npm run test -- --run src/pages/api/admin/impersonate/exit.test.ts src/pages/api/admin/logout.test.ts` | 9/9 pass |
| `exitImpersonation` referenced in exit.ts | `grep -c 'exitImpersonation' src/pages/api/admin/impersonate/exit.ts` | 3 (header, import, call) — plan said 1 (literal grep mismatch, intent satisfied) |
| `hashImpersonationToken` in exit.ts | `grep -c 'hashImpersonationToken' src/pages/api/admin/impersonate/exit.ts` | 2 (import, call) — plan said 1 (same intent, literal mismatch) |
| No direct Redis access in exit.ts | `grep -cE 'redis\.(set\|get\|del\|expire\|ttl)' src/pages/api/admin/impersonate/exit.ts` | 0 ✓ |
| No direct Sanity access in exit.ts | `grep -cE 'tc\.(create\|delete\|patch)' src/pages/api/admin/impersonate/exit.ts` | 0 ✓ |
| `writeAdminLogoutAuditDoc` in logout.ts | `grep -c 'writeAdminLogoutAuditDoc' src/pages/api/admin/logout.ts` | 2 (import + call) ✓ ≥1 |
| `'admin-logout'` literal string | `grep -c 'admin-logout' src/pages/api/admin/logout.ts` | 1 (header comment; runtime value comes from helper wrapper Plan 03) ✓ ≥1 |
| `redis.del` in logout.ts | `grep -c 'redis.del' src/pages/api/admin/logout.ts` | 2 ✓ ≥1 |
| `Promise.all` in logout.ts | `grep -c 'Promise.all' src/pages/api/admin/logout.ts` | 1 ✓ ≥1 |
| TypeScript (scoped) | `npx tsc --noEmit \| grep src/pages/api/admin/(impersonate/exit\|logout)` | no errors ✓ |

### Note on `exitImpersonation`/`hashImpersonationToken` literal-grep gates

The plan's done-criteria spec said `grep -c 'exitImpersonation'` should return 1 and `grep -c 'hashImpersonationToken'` should return 1. The actual file imports each helper (1 line) and calls it (1 line) plus references in the file header doc-comment (1 line for `exitImpersonation`). The substantive intent — that the endpoint uses these helpers — is satisfied. The literal count of 1 is achievable only by removing the doc-comment reference, which would worsen code quality. Documenting here so the reviewer can see the choice.

## Test Coverage

### `exit.test.ts` — 5 tests

- **Test 1 (happy path):** session.impersonating present + cookie set → 200 `{ ok: true }`. Asserts `exitImpersonation` called with the full `(cookies, currentToken, originalToken, tenantId, sessionIdHash, payload)` argument tuple; payload built from `session.impersonating` + `session.entityId` for `adminEntityId` (D-01).
- **Test 2 (D-16 session-expired):** helper returns `{ ok: false, reason: 'session-expired' }` → endpoint returns 200 with that exact JSON. UI handles redirect (Phase 50).
- **Test 3 (not impersonating):** session present but no `impersonating` field → 401 `{ error: 'Not impersonating' }`; helper NOT called.
- **Test 4 (no session):** `getSession` returns null → 401 `{ error: 'Unauthorized' }`; helper NOT called.
- **Test 5 (cookie missing):** session resolves but `portal_session` cookie absent → 401; helper NOT called.

### `logout.test.ts` — 4 tests

- **Test 1 (non-impersonating logout):** plain admin session (no `impersonating` field) → 200 `{ success: true }`. Asserts `writeAdminLogoutAuditDoc` NOT called, `redis.del` NOT called, `clearSession` called.
- **Test 2 (D-20 happy path):** impersonating session → 200 `{ success: true }`. Order tracked via per-mock side-effect: `audit → del:session:imper-tok-CURRENT, del:session:orig-admin-tok-AAA → clear`. Both Redis keys deleted; audit-doc payload spot-checked against the impersonation sub-shape.
- **Test 3 (Pitfall E proof — load-bearing):** `writeAdminLogoutAuditDoc` rejects → 500 `{ error: 'Logout failed' }`. Asserts `redis.del` and `clearSession` were NEVER called. This is the audit-before-destroy invariant — without it, an admin logout could complete with no audit row, breaking IMPER-06.
- **Test 4 (no session):** null session + no cookie → 200 `{ success: true }`. Idempotent: only `clearSession` (which is safe no-op on missing cookie).

## Decisions Made

1. **Returned 200 (not redirect) for the D-16 session-expired branch.** The plan's interface spec says exit returns `200 OK { ok: false, reason: 'session-expired' }` and the UI handles the redirect to `/admin/login?reason=session-expired`. This keeps the endpoint testable headlessly (no follow-redirect logic in tests) and lets Phase 50's React UI decide between hard navigation, modal prompt, or state update — flexibility the server can't provide.
2. **Cookie-gone fall-through on logout** (when `session.impersonating` is set but `portal_session` cookie is absent): rather than 500, fall through to `clearSession`. There is no `currentToken` to hash for `sessionIdHash`, so the audit doc can't be written; bailing with 500 would leave Redis state intact, but there's nothing to delete since the cookie is gone — `clearSession` is a safe no-op. The "should be impossible" branch is tolerated because the alternative is an unhelpful error.
3. **Redundant `clearSession` after the impersonation Promise.all.** The Promise.all explicitly deletes `session:${currentToken}` (via `redis.del`), and then `clearSession` runs which fires a duplicate delete on the same key plus the cookie clear. The duplicate Redis delete is a no-op (key already gone) and the cookie clear is the only piece `clearSession` does that the explicit dels don't. Cleaner than restructuring `clearSession` for one call site.

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed as written. Both tasks landed cleanly on TDD RED → GREEN cycle.

### No architectural changes

No Rule 4 deviations. Both files stayed within the `files_modified` declaration in plan frontmatter. No new dependencies, no new env vars, no schema changes.

## Threat Surface

The plan's `<threat_model>` enumerated three STRIDE rows; all three are mitigated:

- **T-49-04 (Repudiation) — admin-logout audit:** Test 3 asserts that if `writeAdminLogoutAuditDoc` rejects, `redis.del` is NEVER called and the response is 500. Audit-before-destroy ordering enforced via try/catch + early return (NOT fire-and-forget). RESEARCH Pitfall E closed.
- **T-49-04 (Repudiation) — manual-exit audit:** Plan 03's `exitImpersonation` writes the exit doc + deletes the timeout doc via `Promise.all` (awaited). Test 1 of exit.test.ts asserts the helper is called with the correct args.
- **T-49-03 (Tampering) — cookie-restore using attacker-supplied token:** `originalAdminSessionToken` is read ONLY from `session.impersonating.originalAdminSessionToken` (which was written at mint time by Plan 03 under admin auth). Neither endpoint reads this token from the request body or query string. No request-supplied surface area for token forgery.

## Threat Flags

None. The two new POST endpoints add no new auth paths, no new schema, no new external integrations beyond what Plan 03 already provided. Both endpoints are admin-gated via `getSession` (the read-only impersonation gate in Plan 07's middleware does NOT cover these because exit is itself the way out of impersonation, and logout is the other way out).

## Known Stubs

None. Both endpoints are fully wired to Plan 03 helpers and ready for Phase 50 UI consumption.

The `targetEntityName` and `projectName` fields in the `ImpersonationPayload` are passed as empty strings (matching the manual-exit endpoint's behavior). Plan 06 plan-text explicitly notes: "Phase 50 can add a fresh GROQ here if Liz wants the exit-row names to match the start-row names." This is a documented intentional simplification, not a stub blocking Plan 06's goal.

## TDD Gate Compliance

Both tasks were `tdd="true"` and followed strict RED → GREEN cycles:

- **Task 1 RED** (`60f56ab`): 5 tests added; vitest run confirmed import-resolution failure on `./exit` (the source file did not exist).
- **Task 1 GREEN** (`c9442fa`): full endpoint implementation; 5/5 tests pass.
- **Task 2 RED** (`9ebe2f0`): 4 tests added; vitest run confirmed import-resolution failure on `./logout`.
- **Task 2 GREEN** (`7e272b0`): full endpoint implementation; 4/4 tests pass.

Git log shows the gate sequence in order: `test(49-06)` → `feat(49-06)` → `test(49-06)` → `feat(49-06)`. No REFACTOR commits needed (both implementations were minimal/direct).

## Self-Check: PASSED

All 4 commits exist on `main`:
- `60f56ab` test(49-06): add failing tests for POST /api/admin/impersonate/exit
- `c9442fa` feat(49-06): implement POST /api/admin/impersonate/exit endpoint
- `9ebe2f0` test(49-06): add failing tests for POST /api/admin/logout
- `7e272b0` feat(49-06): implement POST /api/admin/logout with D-20 cleanup

All 4 plan files exist:
- `src/pages/api/admin/impersonate/exit.ts` (90 lines)
- `src/pages/api/admin/impersonate/exit.test.ts` (165 lines, 5 tests)
- `src/pages/api/admin/logout.ts` (101 lines)
- `src/pages/api/admin/logout.test.ts` (204 lines, 4 tests)

Final test run: 9/9 passing. Scoped typecheck: no errors in any of the 4 new files.

## Handoff Notes for Phase 50 (UI)

- **Exit button:** Phase 50's `<ImpersonationBanner/>` "Exit preview" button POSTs to `/api/admin/impersonate/exit` (no body). On `200 { ok: true }`, navigate to wherever Phase 50 wants the admin to land (likely `/admin/clients/:id` for the recipient just exited). On `200 { ok: false, reason: 'session-expired' }`, hard-redirect to `/admin/login?reason=session-expired` per D-16.
- **Logout button:** Phase 50's admin nav Logout (when impersonating) POSTs to `/api/admin/logout` (no body). On `200 { success: true }`, hard-redirect to `/admin/login`. On `500 { error: 'Logout failed' }` (audit write failure), show an error toast and let the admin retry — Redis state was preserved on purpose; do NOT also call `/api/admin/impersonate/exit` as a fallback (that would skip the audit too).
- **Same-origin POST sufficient for v5.3** (CSRF posture matches Plan 04 mint endpoint); Phase 50 should still send these via `fetch(url, { method: 'POST', credentials: 'include' })` so the cookie rides the request.
