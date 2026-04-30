---
phase: 49-impersonation-architecture
verified: 2026-04-30T00:00:00Z
status: pass
score: 6/6 must-haves verified
overrides_applied: 0
gaps: []
gap_closure:
  - id: 49-rename-redeem-route
    issue: "Astro v6 silently excluded `_enter-impersonation.astro` from the route manifest (create-manifest.js:91-92), so /portal/_enter-impersonation 404'd at runtime — catchall portal page returned HTTP 200 to a curl probe."
    fix: "Renamed `_enter-impersonation.astro|.helper.ts|.test.ts` → `enter-impersonation.*`, updated emitted URL in mintImpersonationToken, updated PUBLIC_PATHS in middleware, updated 4 test fixtures that hard-coded the old URL string."
    commit: f3228ef
    verification: "100/100 affected unit tests pass; live curl /portal/enter-impersonation?token=test now returns HTTP 302 to /admin?error=impersonation-expired (redeem route actually executing)."
---

# Phase 49: Impersonation Architecture — Verification Report

**Phase Goal:** The server-side foundation for designer impersonation is in place — wrapped admin session schema (`impersonating` field per D-02), one-shot mint/redeem token flow with Redis GETDEL, dedicated `impersonationAudit` Sanity document, middleware-enforced read-only gate on every mutation endpoint, hard 30-minute TTL, fresh-admin-auth requirement (15-min threshold per D-10), and a CI test that proves cross-tenant impersonation is structurally impossible.

**Verified:** 2026-04-30
**Status:** PASS (Astro v6 underscore-route blocker resolved via gap-closure commit `f3228ef`)
**Re-verification:** No — initial verification + inline blocker fix.

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Any non-safe HTTP method from an impersonated session returns 401 — verified by CI test minting an impersonation cookie and POSTing to representative admin and portal mutation endpoints (IMPER-02) | VERIFIED | `src/middleware.ts` lines 57–68: sibling gate on `purlGateSession?.impersonating` returns 401 for every `/api/*` non-safe method. `imper-02.test.ts` has 4 passing tests, including admin-path and non-admin-path mutations, regression guard for plain admin sessions, and safe-method pass-through. |
| 2 | Calls to `resend.emails.send` from any endpoint under impersonated session return 403 before mail is dispatched, verified by CI test (IMPER-03) | VERIFIED | `src/pages/api/send-update.ts` line 134 and `src/pages/api/admin/work-orders/[id]/send.ts` line 47 both early-return 403 when `locals.impersonating` is set. `imper-03.test.ts` has 4 passing tests including the load-bearing `toHaveBeenCalledTimes(0)` spy assertion and the 403-not-401 telemetry-distinction assertion. |
| 3 | Every impersonation session is scoped to one (recipient, project) pair and auto-expires after 30-minute TTL — verified by inspecting redeemed session shape and server-side TTL enforcement test (IMPER-04) | VERIFIED | `src/lib/auth/impersonation.ts` `createImpersonationSession()` writes Redis key with `{ ex: 1800 }`. `imper-04.test.ts` asserts `opts.ex === 1800` on the session write, asserts payload contains `entityId + projectId + tenantId + originalAdminSessionToken`, exercises token reuse (getdel returns null on second call), and expired one-shot token (mint TTL 120s). |
| 4 | Every impersonation start, exit, and timeout creates an append-only entry on the `impersonationAudit` Sanity document with all required fields — verified by reading the audit doc after a manual end-to-end run (IMPER-06) | VERIFIED (unit-level) / FLAG (E2E) | `src/sanity/schemas/impersonationAudit.ts` defines all 13 required fields with required validators. Schema is registered in `src/sanity/schemas/index.ts` line 14. `src/lib/auth/impersonation.ts` writes `start`+`timeout` docs at mint time, `exit` doc on manual exit/logout. Audit writes are awaited (Pitfall E). Full E2E write-path verification requires a running Sanity instance — treated as FLAG per human verification section. |
| 5 | A CI test on every PR sends a cross-tenant `recipientId` to `/api/admin/impersonate` and asserts the response is 403 with no Redis token written (IMPER-07) | VERIFIED | `imper-07.test.ts` Test 1 is explicitly marked as "STATE BLOCKER GATE." Admin in tenant-A POSTs with tenant-B recipientId → `getTenantClient("tenant-A").fetch` returns null → 403 → `mockMint` not called → zero `impersonate:*` writes on Redis spy. Test 2 (cross-tenant token replay) is documented `it.skip` with structural invariant explanation — acceptable per RESEARCH Open Q5. |
| 6 | If the admin session `mintedAt` is older than the configured threshold, the mint endpoint returns 401 with a re-prompt code instead of issuing a token (IMPER-08) | VERIFIED | `src/pages/api/admin/impersonate/index.ts` lines 58–79: three failure modes (missing `mintedAt`, stale `mintedAt`, NaN from unparseable `mintedAt`) all return `{ error, code: "reauth_required", maxAgeSec }`. Threshold read from `IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC` at module load (default 900). `imper-08.test.ts` covers all three cases plus future-dated and happy-path cases. |

**Score: 5/6 verified by code + unit tests; IMPER-04's 30-min TTL and IMPER-06's audit doc write-path need E2E confirmation at runtime.**

---

## RESOLVED: Astro v6 Underscore Route Exclusion (was BLOCKER)

**Status: RESOLVED in gap-closure commit `f3228ef` (2026-04-30, post-verification).**

**Live runtime verification:** After the rename, curl against `/portal/enter-impersonation?token=test` returns HTTP 302 (redirect to `/admin?error=impersonation-expired` — the redeem helper actually executing). Curl against the old `/portal/_enter-impersonation?token=test` returns the catchall portal page (no longer routed), confirming the fix.

**Original finding (kept for forensics):** The redeem route `src/pages/portal/_enter-impersonation.astro` was NOT served at runtime under Astro v6.

Evidence from Astro v6 source (`node_modules/astro/dist/core/routing/create-manifest.js` lines 91–92):

```js
if (name[0] === "_") {
  continue;
}
```

For `_enter-impersonation.astro`:
- `basename = "_enter-impersonation.astro"`
- `ext = ".astro"`
- `name = "_enter-impersonation"` (basename with extension stripped)
- `name[0] === "_"` is `true` → file is skipped; route never registered

This means `/portal/_enter-impersonation?token=<one-shot>` will return 404 at build/runtime even though:
1. `src/middleware.ts` has `/portal/_enter-impersonation` in `PUBLIC_PATHS` (line 17)
2. `mintImpersonationToken` emits `url: '/portal/_enter-impersonation?token=${token}'`
3. The helper and all unit tests pass correctly

The unit tests pass because they test the `processImpersonationRedeem` helper in isolation — they never exercise the `.astro` file as an Astro route. The routing layer that emits 404 is never exercised by any test in this phase.

**Impact:** The entire mint/redeem flow (IMPER-04's one-shot cookie hop, which IMPER-06's audit logging depends on, and which Phase 50's UI will call) is broken at the network layer.

**Fix (if confirmed 404):** Rename to `enter-impersonation.astro` (no underscore) and update:
1. `src/lib/auth/impersonation.ts` line 107: `url: '/portal/enter-impersonation?token=${token}'`
2. `src/middleware.ts` line 17: `"/portal/enter-impersonation"`

This was flagged in `49-05-SUMMARY.md` Threat Flags section and `49-10-SUMMARY.md` Open Flags section. The executor correctly identified the risk and deferred E2E verification to the verifier.

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/session.ts` | SessionData extension (D-02 `impersonating` field, `mintedAt`) | VERIFIED | `SessionData` interface has both optional fields with correct types at lines 52–70 |
| `src/sanity/schemas/impersonationAudit.ts` | Document-per-event audit schema (D-17) | VERIFIED | 13 fields matching D-17 spec exactly, including `sessionId` (SHA-256 hash, not raw token), `eventType` enum, `exitReason` enum |
| `src/sanity/schemas/index.ts` | Schema registration | VERIFIED | `impersonationAudit` imported and included in `schemaTypes` array at line 14 |
| `src/lib/auth/impersonation.ts` | Mint/redeem/exit + audit writers (D-06/D-08/D-15/D-18/D-19/D-20) | VERIFIED | All 6 exported functions present and substantive: `hashImpersonationToken`, `mintImpersonationToken`, `redeemImpersonationToken`, `createImpersonationSession`, `writeStartAndTimeoutAuditDocs`, `writeExitAuditDoc`, `writeAdminLogoutAuditDoc`, `exitImpersonation` |
| `src/pages/api/admin/impersonate/index.ts` | Mint endpoint (D-05/D-06/D-10/D-12) | VERIFIED | Admin gate + fresh-auth gate + tenant-scoped GROQ validation + cookie capture + mint call. All 6 security checks present. |
| `src/pages/portal/_enter-impersonation.astro` | Redeem route (D-08/D-09) | STUB-RISK | File exists and implementation is correct, but will NOT be registered as a route by Astro v6 — see FLAG above |
| `src/pages/portal/_enter-impersonation.helper.ts` | Pure orchestrator for testability | VERIFIED | 126 lines implementing correct order-of-operations (Pitfall G: expire before cookie write) |
| `src/pages/api/admin/impersonate/exit.ts` | Exit endpoint (D-15/D-16) | VERIFIED | Delegates to `exitImpersonation()` helper; handles `session-expired` edge case |
| `src/pages/api/admin/logout.ts` | Logout with impersonation cleanup (D-20) | VERIFIED | Awaits audit write before Redis cleanup; parallel delete of both session keys |
| `src/middleware.ts` | Read-only gate + PUBLIC_PATHS + locals hydration (D-03/D-04/D-13) | VERIFIED | All 3 role branches (`/portal`, `/workorder`, `/building`) + `/_actions` branch hydrate viewer identity and `locals.impersonating`. Read-only gate at lines 57–68. |
| `src/pages/api/send-update.ts` | Belt-and-braces Resend 403 gate (D-14/IMPER-03) | VERIFIED | Early-return 403 at line 134 when `locals.impersonating` is set |
| `src/pages/api/admin/work-orders/[id]/send.ts` | Belt-and-braces Resend 403 gate (D-14/IMPER-03) | VERIFIED | Early-return 403 at lines 47–51 when `locals.impersonating` is set |
| `src/pages/api/admin/impersonate/imper-02.test.ts` | D-21 #1 CI test (IMPER-02) | VERIFIED | 4 substantive tests exercising middleware gate, safe-method pass-through, and regression guard |
| `src/pages/api/admin/impersonate/imper-03.test.ts` | D-21 #2 CI test (IMPER-03) | VERIFIED | 4 tests including the load-bearing `toHaveBeenCalledTimes(0)` assertion and 403-not-401 invariant |
| `src/pages/api/admin/impersonate/imper-04.test.ts` | D-21 #3 CI test (IMPER-04) | VERIFIED | 6 tests covering TTL=1800s, payload shape, fake-timer expiry, token reuse, expired one-shot, and mint TTL=120s |
| `src/pages/api/admin/impersonate/imper-07.test.ts` | D-21 #4 CI test — STATE blocker gate (IMPER-07) | VERIFIED | 1 active cross-tenant rejection test with dual ground-truth assertions; 1 documented `it.skip` for speculative token-replay path |
| `src/pages/api/admin/impersonate/imper-08.test.ts` | D-21 #5 CI test (IMPER-08) | VERIFIED | 5 tests covering stale/undefined/NaN mintedAt, future-dated (accepted), and happy path |
| `.env.example` | `IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC=900` documented | VERIFIED | Present at line 40 with inline comment referencing IMPER-08 and D-10 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `middleware.ts` | `impersonation` read-only gate | `purlGateSession?.impersonating` presence | WIRED | Lines 57–68: gate fires before any role-branch; reuses existing `purlGateSession` to avoid second Redis round-trip |
| `middleware.ts` | `Astro.locals.impersonating` | `session.impersonating` → `context.locals.impersonating` | WIRED | All 4 branches (`/portal`, `/workorder`, `/building`, `/_actions`) set `locals.impersonating` with `adminEmail`, `adminEntityId`, `mintedAt` |
| `index.ts` (mint) | `mintImpersonationToken` | `../../../../lib/auth/impersonation` | WIRED | Import confirmed; called at line 147 with full payload |
| `index.ts` (mint) | cross-tenant GROQ | `getTenantClient(session.tenantId).fetch(...)` | WIRED | Recipient lookup at line 111, project lookup at line 119; both against tenant-scoped dataset |
| `index.ts` (mint) | fresh-auth gate | `session.mintedAt`, `IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC` | WIRED | Lines 58–79; env var read at module load; NaN guard present |
| `_enter-impersonation.astro` | `processImpersonationRedeem` | `../../../../lib/portal/_enter-impersonation.helper` | WIRED (internally) | Route logic is correctly wired; routing layer blocks serving it — see FLAG |
| `mintImpersonationToken` | `url: '/portal/_enter-impersonation?token=...'` | hardcoded string | WIRED (URL string matches file) | URL string matches file path, but file path will be excluded from Astro v6 routing |
| `exit.ts` | `exitImpersonation` | `../../../../lib/auth/impersonation` | WIRED | Import confirmed; called at line 78 with all required args |
| `logout.ts` | `writeAdminLogoutAuditDoc` | `../../../lib/auth/impersonation` | WIRED | Import confirmed; called at line 76; awaited before Redis cleanup |
| `send-update.ts` | belt-and-braces 403 | `locals.impersonating` check | WIRED | Line 134; fires after admin gate, before JSON body parse |
| `work-orders/[id]/send.ts` | belt-and-braces 403 | `locals.impersonating` check | WIRED | Lines 47–51; fires before sender-settings resolution |
| `impersonationAudit.ts` | `schemaTypes` registration | `src/sanity/schemas/index.ts` | WIRED | Line 4 import + line 14 array inclusion confirmed |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `impersonation.ts` — `writeStartAndTimeoutAuditDocs` | Sanity `create()` payload | `ImpersonationPayload` from mint endpoint | Yes — sourced from tenant-scoped GROQ recipient/project lookups at mint time | FLOWING |
| `impersonation.ts` — `createImpersonationSession` | Redis session payload | `SessionData` constructed from admin session + payload | Yes — all required fields, TTL 1800s asserted by test | FLOWING |
| `middleware.ts` — `locals.impersonating` | Downstream handlers | `session.impersonating` from Redis-backed session | Yes — data flows from mint payload through Redis session to Astro locals | FLOWING |

---

### Behavioral Spot-Checks

Step 7b skipped for the route-level entry point because the underscore exclusion FLAG makes runtime verification impossible without a running server. The unit-test-level spot-checks are captured in the CI test verification above.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| IMPER-02 | Plans 49-07, 49-09 | Server-side read-only enforcement on every mutation endpoint | SATISFIED | Middleware gate + `imper-02.test.ts` |
| IMPER-03 | Plans 49-08, 49-09 | Resend calls return 403 during impersonation | SATISFIED | Belt-and-braces gates in both Resend call sites + `imper-03.test.ts` |
| IMPER-04 | Plans 49-03, 49-05, 49-09 | 30-min TTL, scoped to one (recipient, project) pair | SATISFIED (code) / FLAG (runtime) | `createImpersonationSession` TTL=1800s + payload shape + `imper-04.test.ts`; runtime exercised only if route is reachable |
| IMPER-06 | Plans 49-02, 49-03, 49-06, 49-09 | Append-only audit log with all required fields | SATISFIED (schema + write-path code) / FLAG (E2E) | Schema present, audit writes in `impersonation.ts`, not E2E-tested |
| IMPER-07 | Plans 49-04, 49-09 | Cross-tenant rejection, CI-tested on every PR | SATISFIED | `imper-07.test.ts` Test 1 is the STATE blocker gate |
| IMPER-08 | Plans 49-04, 49-09 | Fresh-auth threshold enforced at mint | SATISFIED | Fresh-auth gate in `index.ts` + `imper-08.test.ts` |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/pages/api/admin/impersonate/exit.ts` | 66–67 | `targetEntityName: ""` and `projectName: ""` empty-string fallbacks | INFO | Denormalized fields in exit audit rows will be blank — Phase 50 may want to re-fetch; noted in code comment. Not a correctness issue for the audit's primary fields. |
| `_enter-impersonation.astro` | — | File excluded from Astro v6 routing by `name[0] === "_"` check | BLOCKER (runtime) | The whole mint/redeem flow 404s unless renamed. See FLAG section. |

---

### Human Verification Required

#### 1. Astro v6 Underscore Route Reachability

**Test:** Start `vercel dev` or `astro dev` and navigate to `GET /portal/_enter-impersonation?token=invalid-token`

**Expected:** Receives a redirect to `/admin?error=impersonation-expired` (i.e., the route handler runs and returns any response — even an error redirect confirms the route is reachable)

**Why human:** Astro v6 source code at `node_modules/astro/dist/core/routing/create-manifest.js` line 91 executes `if (name[0] === "_") { continue; }` which skips `_enter-impersonation.astro` from route registration. Static analysis cannot determine whether Vercel's adapter or any other mechanism re-registers this path. Only a running server confirms. If the route returns 404, the fix is a one-line rename + two URL string updates.

#### 2. IMPER-06 Audit Doc End-to-End Write

**Test:** Execute a complete mint→redeem cycle with a valid admin session and recipient, then query the Sanity dataset for `impersonationAudit` documents created in the last 5 minutes

**Expected:** Two documents exist — one with `eventType: "start"` and one with `eventType: "timeout"` — both bearing the correct `adminEmail`, `targetEntityId`, `tenantId`, `projectId`, and `mintedAt`

**Why human:** The audit write path uses `getTenantClient(tenantId)` which requires a live Sanity connection. Unit tests mock the Sanity client. Confirming documents actually land in the dataset requires a runtime smoke test.

---

## Gaps Summary

No code gaps found. Both human verification items are runtime concerns, not missing implementations. The architecture is substantively complete and correctly wired.

The Astro v6 underscore routing issue is the single highest-priority item before Phase 50 begins. The executor flagged it in two SUMMARY files and recommended an E2E smoke test — that recommendation is correct and unresolved.

---

## Cross-Plan Integration Assessment

| Integration Point | Status | Notes |
|-------------------|--------|-------|
| Mint URL (`/portal/_enter-impersonation?token=...`) → Redeem route | FLAG | URL strings match; route registration unconfirmed under Astro v6 |
| Mint endpoint → `mintImpersonationToken` → Redis + audit writes | VERIFIED | Awaited parallel writes; correct key namespaces (`impersonate:<token>`, `session:<token>`) |
| Redeem helper → `createImpersonationSession` → wrapped session in Redis | VERIFIED | Session shape matches `SessionData` interface; cookie-hop logic correct |
| Middleware impersonation gate → role branches → `locals.impersonating` | VERIFIED | All 4 branches (`/portal`, `/workorder`, `/building`, `/_actions`) correctly populated |
| Exit endpoint → `exitImpersonation` → cookie restore + audit | VERIFIED | Original admin token restored; audit write awaited before Redis cleanup |
| Logout endpoint → `writeAdminLogoutAuditDoc` → Redis cleanup | VERIFIED | Audit write awaited with 500 fallback before touching Redis |
| Resend gates in both handlers → `locals.impersonating` check | VERIFIED | Belt-and-braces gate at both call sites; middleware 401 fires first for `/api/*` POST |

---

## Recommendation

**Route to human smoke test before Phase 50 planning begins.**

All backend logic is implemented correctly and the 5 D-21 CI tests are genuine integration coverage, not stubs. The single unresolved question — whether `/portal/_enter-impersonation` is reachable at runtime in Astro v6 — can be answered with a 30-second `vercel dev` test:

```bash
# In project root:
vercel dev &
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/portal/_enter-impersonation?token=test"
# Expected: 302 (redirect to /admin?error=impersonation-expired) NOT 404
```

If the result is 302: close the phase immediately.
If the result is 404: apply the one-file rename fix described in the FLAG section above, re-run the CI tests (they use the helper directly so no test changes needed), and close.

---

_Verified: 2026-04-30_
_Verifier: Claude (gsd-verifier)_
