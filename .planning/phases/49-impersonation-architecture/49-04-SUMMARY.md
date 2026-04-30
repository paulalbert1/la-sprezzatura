---
phase: 49-impersonation-architecture
plan: 04
subsystem: auth
tags: [api-route, mint, impersonation, fresh-auth, cross-tenant, astro, vitest]

requires:
  - phase: 49-impersonation-architecture
    provides: "Plan 03 (auth library) — mintImpersonationToken, ImpersonationPayload type, audit doc writers"
  - phase: 49-impersonation-architecture
    provides: "Plan 01 (session schema) — SessionData.mintedAt, SessionData.impersonating fields"
provides:
  - "POST /api/admin/impersonate mint endpoint at src/pages/api/admin/impersonate/index.ts"
  - "13 vitest cases covering IMPER-07 cross-tenant rejection, IMPER-08 fresh-auth gate, body validation, happy-path payload assertions"
  - "Pattern reference for downstream Plan 06 exit endpoint (admin gate + tenant gate + body parse + cookies.get + composed lib call)"
affects:
  - "Phase 50 — recipient picker UI calls this endpoint and switches on body.code === 'reauth_required' for the re-auth modal"
  - "Plan 06 (exit) — same skeleton (admin gate + jsonResponse helper + lib delegation)"

tech-stack:
  added: []
  patterns:
    - "Composed-handler convention: route handler is thin (gates + validation + cookie capture); all Redis + Sanity writes flow through src/lib/auth/impersonation.ts"
    - "Closed-enum role validation via Set.has lookup (avoids switch-case in handlers)"
    - "Sentinel-symbol test pattern (NO_COOKIE) to avoid undefined-defaults masking intent"

key-files:
  created:
    - "src/pages/api/admin/impersonate/index.ts"
    - "src/pages/api/admin/impersonate/index.test.ts"
  modified: []

key-decisions:
  - "Nested folder layout (impersonate/index.ts) chosen over flat impersonate.ts for symmetry with future exit.ts sibling (RESEARCH Open Q6)."
  - "Body validation collapses three failure shapes (unparseable JSON, missing field, role outside closed enum) into a single 400 'Invalid body' response — keeps the error surface narrow per defence-in-depth."
  - "Missing portal_session cookie when admin gate already passed = 500 (internal session error), NOT 401 — distinguishes 'admin not signed in' (401) from 'auth state inconsistent' (500) for telemetry."

patterns-established:
  - "Fresh-auth gate (D-10..D-12 + Pitfall D): mintedAt undefined OR Number.isNaN(ageSec) OR ageSec > MAX_AGE_SEC → identical 401 + reauth_required + maxAgeSec shape. Reusable for any future endpoint requiring elevated freshness."
  - "Tenant-scoped GROQ pattern: getTenantClient(session.tenantId).fetch(...) is the only path for cross-tenant safety. Foreign _ids are unreachable from the tenant's dataset, so cross-tenant attempts return null → 403 → no Redis write."
  - "originalAdminSessionToken capture from cookies.get('portal_session') BEFORE any side effects (D-15) — endpoint must NEVER write cookies (D-06)."

requirements-completed: [IMPER-04, IMPER-06, IMPER-07, IMPER-08]

duration: ~5min
completed: 2026-04-30
---

# Phase 49 Plan 04: Impersonation Mint Endpoint Summary

**POST /api/admin/impersonate composes Plan 03 helpers (getSession + getTenantClient + mintImpersonationToken) into the load-bearing security boundary for IMPER-07 cross-tenant rejection and IMPER-08 fresh-auth gate, with 13 vitest cases covering all six error shapes plus the happy-path mint payload.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-04-30T17:03:30Z (approx — RED commit at 13:06:27 PDT)
- **Completed:** 2026-04-30T17:08:28Z
- **Tasks:** 1 (TDD: RED + GREEN, no REFACTOR needed)
- **Files modified:** 2 (both newly created)

## Accomplishments

- Mint endpoint scaffolded against the `src/pages/api/admin/clients.ts` admin-gate pattern (lines 17-25) — admin gate, tenant gate, jsonResponse helper, body try/catch all replicated verbatim.
- Fresh-auth gate per D-10..D-12: reads `IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC` once at module load (default 900), computes `(Date.now() - new Date(mintedAtIso).getTime()) / 1000`, fails closed via `Number.isNaN || ageSec > MAX_AGE_SEC` (Pitfall D). All three stale-shape variants — undefined, > 15 min, unparseable — collapse to the identical 401 response so Phase 50's modal switch on `code === 'reauth_required'` works uniformly.
- Tenant-scoped recipient + project GROQ verbatim per RESEARCH § Pattern 3 — recipient lookup uses `*[_id == $id && _type in ["client", "contractor", "buildingManager"]][0]`; project lookup checks both `references($rid)` (direct ref) and `$rid in clients[].client._ref` (array-of-references shape). Cross-tenant docs are unreachable from `session.tenantId`'s dataset, satisfying IMPER-07 without needing a real second tenant fixture (RESEARCH Open Q5).
- `originalAdminSessionToken` captured from `cookies.get("portal_session")?.value` BEFORE the mint call (D-15). Endpoint never writes cookies (D-06 — admin's tab is unchanged; cookie hop is in redeem at Plan 05). The `cookies` object is read-only in tests; if the handler tried to call `cookies.set` or `cookies.delete`, the test mocks would throw — implicit assertion that D-06 is honoured.

## Task Commits

1. **Task 1 RED: failing tests** — `20cb2df` (test) — 13 cases asserting endpoint module exists and returns the 5 documented response shapes plus happy-path payload structure.
2. **Task 1 GREEN: mint handler implementation** — `a995d88` (feat) — 165-line handler composing the three Plan 03 helpers + module-level MAX_AGE_SEC + closed-enum role validation.

REFACTOR not needed — handler is already a single linear flow (gate → gate → gate → parse → validate → fetch → fetch → capture → mint → respond) with no duplicated branches to consolidate.

## Files Created/Modified

- `src/pages/api/admin/impersonate/index.ts` — POST handler (165 lines incl. comments).
- `src/pages/api/admin/impersonate/index.test.ts` — 13 test cases using `vi.hoisted` + `vi.mock("../../../../lib/...")` for `getSession`, `getTenantClient`, `mintImpersonationToken` (matches `clients.test.ts` convention).

## Done-Criteria Grep Audit

| Criterion | Required | Actual |
|-----------|----------|--------|
| `reauth_required` mentions | ≥1 | 3 |
| `maxAgeSec: ` mentions | ≥1 | 2 |
| `IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC` mentions | ≥1 | 1 |
| `Number.isNaN` mentions | ≥1 | 2 |
| `mintImpersonationToken` mentions | ≥1 | 2 |
| `getTenantClient` mentions | ≥1 | 2 |
| `cookies.set` or `cookies.delete` | 0 | 0 ✓ (D-06 honoured) |

## Test Results

```
Test Files  1 passed (1)
     Tests  13 passed (13)
   Duration  331ms
```

All 13 cases green:
- Test 1 (IMPER-07 cross-tenant)
- Tests 2-4 (IMPER-08 stale / undefined / NaN — Pitfall D)
- Test 5 (D-05 project mismatch)
- Test 6 (admin gate)
- Test 7 (tenant gate)
- Tests 8 / 8b / 8c (body validation: missing field / unparseable JSON / role outside closed enum)
- Test 9 (happy path mint payload — `mockMint` called once with the full denormalised payload)
- Tests 10 / 10b (D-15 cookie capture + missing-cookie 500 fallback)

## Type Check

`npx tsc --noEmit` reports zero errors in `src/pages/api/admin/impersonate/`. Pre-existing TS errors in `src/lib/workflow/engine.ts`, `src/sanity/queries.ts`, `src/sanity/schemas/projectWorkflow.test.ts`, `src/pages/api/close-document.ts`, etc. exist on `main` and are out of scope for this plan (executor scope-boundary rule).

## Decisions Made

- **Closed-enum body validation** — `ALLOWED_ROLES = new Set([...])` hoisted to module scope; `Set.has(role)` is the validation primitive. Cleaner than nested if-else; matches the `EMAIL_REGEX` module-constant pattern in `clients.ts` L8.
- **Missing-cookie fallback = 500, not 401** — when `getSession(cookies)` already resolved a valid admin session but `cookies.get("portal_session")?.value` is somehow `undefined`, that's an internal inconsistency, not an auth failure. 500 is the right shape so monitoring can distinguish "admin not signed in" (401) from "auth state corrupted" (500).
- **Sentinel symbol in tests** — used `Symbol("NO_COOKIE")` rather than `undefined` for the missing-cookie test because the `makeCookies` helper has a default value; passing `undefined` to a defaulted param falls through to the default and silently masks intent. Caught this during initial GREEN run (Test 10b first failed expecting 500 but received 200).

## Deviations from Plan

### Test count: 13 vs 10 specified

The plan called for 10 tests; the implementation has 13. The extras were added during initial test authoring as natural sub-cases of plan-mandated tests:

- **Test 8 split into 8 / 8b / 8c** — plan called for "POST with empty body or missing recipientId; assert 400". Three concrete failure modes (missing field, unparseable JSON, role outside closed enum) all produce the same 400 but via different code paths in the handler. Splitting them gives precise regression signal if one path drifts. No new behaviour; same 400 response.
- **Test 10b** — plan's Test 10 was "originalAdminSessionToken capture". 10b is the negative case: when the cookie is missing despite a valid session, return 500 (the implementation decision documented above). Without 10b, the 500 fallback path is uncovered.

These are not deviations from the plan's *behavioural* contract — every plan-mandated assertion is present. They split assertions across more granular `it` blocks for diagnostic clarity.

**No deviation rules were triggered:**
- Rule 1 (auto-fix bugs): N/A — no bugs found.
- Rule 2 (auto-add missing critical functionality): N/A — plan was complete; the 500-fallback for missing cookie is documented in the plan action step 2f.
- Rule 3 (auto-fix blocking issues): N/A — no blockers.
- Rule 4 (architectural): N/A — composition only, no new structure.

---

**Total deviations:** 0 rule-triggered; test count expanded for diagnostic granularity (no behavioural change).
**Impact on plan:** None. Plan executed as written.

## Issues Encountered

- **First GREEN run had 1/13 failure** — Test 10b expected 500 but received 200 because `mockFetch` had no mocks set, so the recipient lookup returned `undefined` and the handler hit the 403 "Recipient not found" path before reaching the cookie check. Fixed by adding the recipient + project mocks to Test 10b so it reaches the cookie capture step.
- **Sentinel-symbol fix** — second GREEN run still failed because `makeCookies(undefined)` fell through to the default `"admin-session-tok-AAA"`. Replaced with `NO_COOKIE` symbol sentinel so explicit-no-cookie is unambiguous.

Both issues were within the test file (not the handler); handler implementation passed first-try.

## User Setup Required

None. The `IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC` env var documentation lives in Plan 10 (env + docs) per the plan's action step 7. Default of 900s applies if the var is unset.

## Next Phase Readiness

- **Plan 05 (redeem at `/portal/_enter-impersonation`)** — has the URL shape it needs (`/portal/_enter-impersonation?token=<token>`) emitted by this endpoint. Plan 03's `redeemImpersonationToken` is the consumer.
- **Plan 06 (exit endpoint)** — can copy this file's admin-gate / jsonResponse / cookie-capture pattern wholesale.
- **Plan 10 (env + docs)** — must add `IMPERSONATION_FRESH_AUTH_MAX_AGE_SEC` to `.env.example` so deploys can override the 900s default.
- **Phase 50 (UI)** — body shape `{ url, error, code, maxAgeSec }` is locked. Modal switches on `code === 'reauth_required'`; happy-path opens `body.url` in a new tab via `window.open(url, '_blank', 'noopener')`.

## Self-Check: PASSED

- `src/pages/api/admin/impersonate/index.ts` — FOUND
- `src/pages/api/admin/impersonate/index.test.ts` — FOUND
- Commit `20cb2df` (test) — FOUND in `git log`
- Commit `a995d88` (feat) — FOUND in `git log`

---
*Phase: 49-impersonation-architecture*
*Completed: 2026-04-30*
