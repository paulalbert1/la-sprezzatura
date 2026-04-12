---
phase: 34-settings-and-studio-retirement
plan: 06
slug: client-dashboard
subsystem: auth
tags: [astro, sanity, purl, session, middleware, sha-256, redis, portal]

requires:
  - phase: 34-02
    provides: ENGAGEMENT_LABELS shared constant
  - phase: 34-04
    provides: send-update personal link path; usePersonalLinks API flag
  - phase: 34-05
    provides: client.portalToken field + regenerate-portal-token action

provides:
  - "Public /portal/client/[token] dashboard route (SETT-04)"
  - "createPurlSession with 7-day TTL (604800s) and portalTokenHash at creation"
  - "Middleware PURL session hash re-validation on every /portal/* request (T-34-07)"
  - "Middleware read-only gate rejecting non-safe /api/* from source='purl' (T-34-08)"
  - "hashPortalToken + timingSafeEqualHash helper (SHA-256 base64, constant-time compare)"
  - "Pure resolver module src/lib/portal/clientDashboard.ts for token→dashboard payload"
  - "CLIENT_BY_PORTAL_TOKEN_QUERY exported from src/sanity/queries.ts"

affects:
  - "Any future Phase 35+ work that touches portal auth, PURL session revocation, or /api/* endpoints"
  - "Phase 34-07 (studio removal) — runs after this on the same working tree; no overlap in touched files"

tech-stack:
  added: []
  patterns:
    - "PURL session model: distinct session 'source' flag enforces read-only + hash re-validation"
    - "Constant-time hash comparison for portalToken rotation detection"
    - "Pure resolver module separated from Astro frontmatter for Vitest unit coverage"

key-files:
  created:
    - src/lib/portal/portalTokenHash.ts
    - src/lib/portal/clientDashboard.ts
    - src/pages/portal/client/[token].astro
  modified:
    - src/lib/session.ts
    - src/middleware.ts
    - src/sanity/queries.ts
    - src/lib/portal/clientDashboard.test.ts
    - src/middleware.test.ts

key-decisions:
  - "GROQ param renamed from $token to $purl to sidestep a @sanity/client TS overload-inference quirk (TS2769). Preserves the external API — callers still pass a token — and documents the workaround inline alongside the existing pre-existing failure at getProjectByPortalToken."
  - "createPurlSession is called on every /portal/client/[token] visit (not only when no session exists). Each click refreshes the 7-day TTL, which matches the UX expectation that clicking the email link feels like a login."
  - "Middleware SAFE_METHODS gate checks session.source === 'purl' once per request before the branch routing, so future non-admin mutation surfaces inherit the T-34-08 protection without an opt-in."
  - "clientDashboard.ts keeps a LOCAL CLIENT_BY_PORTAL_TOKEN_QUERY const (plus an exported twin in queries.ts) so Vitest only has to stub sanityClient.fetch once per test."

patterns-established:
  - "PURL session source flag: any session-consumer can distinguish email-verified (no source) from PURL (source='purl') and apply policy per source."
  - "Hash re-validation on every request: portalToken is the source of truth, not the cookie. Regeneration kills every active session without any explicit invalidation."
  - "Astro ternary-body pattern for token-invalid fallback: single frontmatter + conditional PortalLayout body, no Astro.redirect required."

requirements-completed: [SETT-04]

duration: 18min
completed: 2026-04-12
---

# Phase 34 Plan 06: Client Dashboard Summary

**PURL-sourced client dashboard at `/portal/client/[token]` with 7-day sessions, per-request portalToken hash re-validation, and read-only gate on all mutation endpoints.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-04-12T00:45:43Z
- **Completed:** 2026-04-12T01:03:00Z
- **Tasks:** 3
- **Files created:** 3
- **Files modified:** 5
- **Tests green:** 80/80 across Plan 06 surfaces (17 session + 9 clientDashboard + 5 portalStages + 49 middleware)

## Accomplishments

- Full PURL session model: `createPurlSession(cookies, clientId, portalToken)` writes a 7-day-TTL cookie with `{ source: 'purl', portalTokenHash }` and is backward compatible with every existing `SessionData` consumer via two optional fields on the interface.
- Middleware enforces three new behaviors: `/portal/client/` is public (KR-7); `/portal/*` requests with PURL sessions re-derive `hashPortalToken(currentToken)` and clear-session + redirect on mismatch (T-34-07); `/api/*` non-safe methods return 401 on `source==='purl'` before any branch handler runs (T-34-08).
- `/portal/client/[token].astro` renders a minimal dashboard (brand eyebrow, welcome headline, project cards linking to `/portal/project/[projectId]`, contact footer). On unknown tokens, the same layout renders a `"Your portal link has expired or is invalid"` fallback with a `mailto:office@lasprezz.com` button. Copy is verbatim from UI-SPEC § Copywriting Contract.
- Flipped 8 Wave 0 `it.todo` stubs in `clientDashboard.test.ts` + 14 in `middleware.test.ts` to real green tests covering resolver edge cases and middleware behavioral flows (mocked sanity:client + session + portalTokenHash).

## Task Commits

1. **Task 1: portalTokenHash helper + session.ts extension + resolver** — `97151fb` (feat)
   - `src/lib/portal/portalTokenHash.ts` (new) — SHA-256 base64 hash + `timingSafeEqualHash`
   - `src/lib/session.ts` — `SessionData.source`, `SessionData.portalTokenHash`, `createPurlSession`, `PURL_SESSION_TTL = 604800`
   - `src/lib/portal/clientDashboard.ts` (new) — `resolveClientByToken`, `getClientDashboardData`
   - `src/sanity/queries.ts` — exported `CLIENT_BY_PORTAL_TOKEN_QUERY` + `getClientByPortalToken`
   - `src/lib/portal/clientDashboard.test.ts` — 9 passing tests (8 from Wave 0 stubs + 1 new edge case)

2. **Task 2: Middleware hash re-validation + read-only gate** — `2e991d4` (feat)
   - `src/middleware.ts` — `/portal/client/` in PUBLIC_PATHS, `SAFE_METHODS` set, T-34-08 gate, T-34-07 hash re-validation, new imports (`sanity:client`, `clearSession`, `hashPortalToken`, `timingSafeEqualHash`)
   - `src/middleware.test.ts` — 49 passing tests (26 pre-existing + 10 source-scan + 13 behavioral via dynamic import + vi.mock)

3. **Task 3: /portal/client/[token] route** — `72e1690` (feat)
   - `src/pages/portal/client/[token].astro` (new) — token resolution, PURL session mint, ternary body for token-invalid fallback, dashboard card list

## Files Created/Modified

### Created
- `src/lib/portal/portalTokenHash.ts` — Pure SHA-256 base64 hash + constant-time comparison helper.
- `src/lib/portal/clientDashboard.ts` — Unit-testable resolver (`resolveClientByToken`, `getClientDashboardData`) for the Astro route frontmatter.
- `src/pages/portal/client/[token].astro` — The PURL client dashboard route; public via middleware KR-7.

### Modified
- `src/lib/session.ts` — Extended `SessionData` with optional `source: 'purl'` and `portalTokenHash: string`; added `createPurlSession` with 7-day TTL and constant-time-safe hash storage.
- `src/middleware.ts` — Three changes: PUBLIC_PATHS entry; top-of-handler read-only gate; `/portal/*` branch hash re-validation.
- `src/sanity/queries.ts` — Added `CLIENT_BY_PORTAL_TOKEN_QUERY` constant + `getClientByPortalToken` helper, using `$purl` as the GROQ param name to sidestep the TS overload quirk.
- `src/lib/portal/clientDashboard.test.ts` — 8 stubs → 9 real tests (+1 undefined-guard edge case).
- `src/middleware.test.ts` — 14 stubs → 23 real tests (10 source-scan + 13 behavioral).

## Decisions Made

- **GROQ param `$purl` instead of `$token`:** `@sanity/client@7.17` has a TypeScript overload-resolution quirk where `sanityClient.fetch(CONST_QUERY, { token: string })` binds the default generic `Q extends QueryWithoutParams` and rejects `{ token: string }` as assignable to `Record<string, never>`. The same quirk still affects the pre-existing `getProjectByPortalToken` at `queries.ts:92` (unchanged by Plan 06). I sidestepped it for Plan 06 by renaming the GROQ param — external callers still pass a `token` string argument. Both `queries.ts` and `clientDashboard.ts` now use `{ purl: token }` at the fetch call site, documented with inline comments.
- **Session minted on every visit, not conditionally:** `createPurlSession` is called unconditionally when the token resolves, regardless of whether the visitor already has a PURL session cookie. This mirrors the UX expectation that clicking the Send Update email link acts like a login — TTL refresh is desired.
- **Middleware read-only gate at the top of `onRequest`, not inside the admin branch:** Placing the gate above the `/portal`, `/workorder`, `/building`, `/admin` branch routing means any future non-admin mutation surface (e.g. a hypothetical `/api/portal-client/notes`) automatically inherits T-34-08 protection without opt-in.
- **Resolver module has a LOCAL copy of the GROQ string:** Even though `queries.ts` exports the same query, `clientDashboard.ts` keeps its own local constant so the Vitest test file only has to mock `sanity:client`'s `fetch` once — importing from `queries.ts` would pull in many other queries and inflate the mock surface.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] GROQ param rename to sidestep `@sanity/client` TS overload quirk**
- **Found during:** Task 1 (tsc --noEmit)
- **Issue:** The plan's literal GROQ (`portalToken == $token`) combined with `sanityClient.fetch(CONST_QUERY, { token })` triggers TS2769 "Type 'string' is not assignable to type 'never'" because TypeScript's overload resolver binds the default `Q extends QueryWithoutParams` generic before the conditional can resolve. Casting the query to `string` didn't help (TS still picks the narrow overload). The same pattern fails in both `src/lib/portal/clientDashboard.ts` and `src/sanity/queries.ts`. Note: the pre-existing `src/sanity/queries.ts:92` (`getProjectByPortalToken`) has the identical failure and is part of the 143-error baseline — I did not fix it in this plan because it is outside my files_modified list.
- **Fix:** Renamed the GROQ parameter from `$token` to `$purl` in both the local `clientDashboard.ts` const and the exported `queries.ts` const. Updated the fetch call sites to pass `{ purl: token }`. Updated the Vitest assertion that inspected the params shape. External function signatures (`resolveClientByToken(token: string)`, `getClientByPortalToken(token: string)`) are unchanged — the token still flows through as a `token` argument from the URL down to the GROQ binding.
- **Files modified:** `src/lib/portal/clientDashboard.ts`, `src/sanity/queries.ts`, `src/lib/portal/clientDashboard.test.ts`
- **Verification:** `npx tsc --noEmit` returns exactly 143 errors (baseline), no new errors introduced. All 9 clientDashboard tests pass.
- **Committed in:** `97151fb` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added `timingSafeEqualHash` for constant-time comparison**
- **Found during:** Task 1 (reviewing T-34-07 threat mitigation)
- **Issue:** The plan's hash helper snippet only exports `hashPortalToken`. Using `===` to compare hashes in the middleware opens a timing side-channel that an attacker probing `/portal/project/*` could use to glean hash-prefix information. The threat model already called out constant-time comparison; plan pseudo-code used `!==` which was a simplification.
- **Fix:** Added a second export, `timingSafeEqualHash(a, b)`, that uses Node `crypto.timingSafeEqual` with defensive length-equality short-circuits (safe because `hashPortalToken` always returns a fixed-length SHA-256 base64 string). Middleware imports and uses it in the hash comparison.
- **Files modified:** `src/lib/portal/portalTokenHash.ts`, `src/middleware.ts`
- **Verification:** Middleware source-scan test asserts the presence of the hashPortalToken + constant-time call site; behavioral test confirms mismatched hashes trigger clearSession + redirect.
- **Committed in:** `97151fb` + `2e991d4` (split across Tasks 1 and 2)

---

**Total deviations:** 2 auto-fixed (1 blocking TS fix, 1 security hardening)
**Impact on plan:** Both necessary for correctness (deviation 1) and T-34-07 hardening (deviation 2). No scope creep — both changes are small, local, and fully covered by existing tests in the plan.

## Known Stubs

None. All dashboard fields render from real Sanity data (resolved client, live project list, live pipelineStage → StatusBadge, live engagement label from shared const). Empty-state copy is a contract, not a stub.

## Threat Flags

No new trust-boundary surface introduced beyond what the plan's threat model already lists. The new `/portal/client/[token]` route is the sole new network endpoint and is fully covered by T-34-06/T-34-07/T-34-08. The `CLIENT_BY_PORTAL_TOKEN_QUERY` is a read-only GROQ with parameter binding (not string interpolation), so there's no GROQ injection surface.

## Issues Encountered

**1. `@sanity/client` TypeScript overload quirk (TS2769)** — documented above as deviation 1. The same quirk affects the pre-existing `getProjectByPortalToken` at `queries.ts:92` which has been in the 143-error baseline since before Plan 06 started. I left that pre-existing error in place (it's outside my files_modified list) and worked around it in my own files with the `$purl` rename.

**2. `npx astro build` fails on pre-existing `bcryptjs` import** — `src/lib/adminAuth.ts:11` imports `bcryptjs` but the package is not in `package.json`. This fails both `tsc --noEmit` (`TS2307: Cannot find module 'bcryptjs'`) and `astro build` (`Rollup failed to resolve import "bcryptjs"`). Documented in `deferred-items.md` by Plan 02 already. Confirmed via `git stash + npx astro build` that the failure exists on clean `main` without my changes. `astro check` succeeds (160 errors, unchanged from baseline — all in pre-existing files) and reports zero errors in any of my new/modified files. The full `astro build` verification step in the plan's `<verify>` block is therefore not executable on the current baseline; I did not attempt a fix because adding a missing runtime package is outside Plan 06's scope and would alter both `package.json` and `package-lock.json`. The correct owner is the documented baseline hygiene pass.

**3. Middleware test needed `vi.resetModules` + dynamic import** — Vitest's `vi.mock` hoists factories, but my behavioral tests mock `sanity:client`, `./lib/session`, `./lib/portal/portalTokenHash`, `./lib/tenants`, and `astro:middleware` together. The middleware module has to be re-imported after mock setup, so each test in the behavioral `describe` runs `vi.resetModules()` + `await import("./middleware")` in `beforeEach`. This cleanly isolates per-test mock state. No regressions to the source-scan tests (which don't import middleware.ts as a module).

## User Setup Required

None — all changes are server-side. No new env vars, no dashboard configuration. The `/portal/client/[token]` route is reachable as soon as Liz sends the first personal-link Send Update that stamps a `portalToken` on a client (via Plan 04 + Plan 05).

## Next Phase Readiness

- **Plan 34-07 (Studio removal)** can run on this same working tree — no overlap in touched files. My files_modified list is narrow (session, middleware, queries, portal/client route, portal resolver, portalTokenHash, middleware.test, clientDashboard.test). Studio removal targets `src/sanity/components/**`, `src/sanity/structure.ts`, `src/sanity/schemas/project.ts`, and `astro.config.mjs` — zero conflict.
- **Working tree status at plan end:** clean except for the pre-existing unstaged `.planning/ROADMAP.md` and `.planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md` which the orchestrator owns. No stray files from Plan 06.
- **Regression posture:** 80/80 tests green across all Plan 06 surfaces. The 20 pre-existing vitest failures documented in `deferred-items.md` are unchanged (rendering, gemini, tenantClient, gantt, procurement — none touch Plan 06 files).
- **Residual risk T-34-06 (accepted):** Forwarded email → attacker clicks link → attacker gets a 7-day session. Mitigated by the 7-day TTL cap and Liz's ability to kill all active sessions via the D-22 regenerate action. No email-handshake or 2FA was in scope for Phase 34; Phase 35+ can revisit if the threat model evolves.

## Self-Check: PASSED

**Files verified present:**
- FOUND: src/lib/portal/portalTokenHash.ts
- FOUND: src/lib/portal/clientDashboard.ts
- FOUND: src/pages/portal/client/[token].astro
- FOUND: src/lib/session.ts (modified — grep confirmed `createPurlSession` + `source?: 'purl'` + `604800`)
- FOUND: src/middleware.ts (modified — grep confirmed `/portal/client/` + `session.source === "purl"` + `hashPortalToken` + `PURL sessions are read-only`)
- FOUND: src/sanity/queries.ts (modified — grep confirmed `CLIENT_BY_PORTAL_TOKEN_QUERY`)

**Commits verified present in git log:**
- FOUND: 97151fb (Task 1)
- FOUND: 2e991d4 (Task 2)
- FOUND: 72e1690 (Task 3)

**Tests green:**
- `npx vitest run src/lib/portal src/lib/session.test.ts src/middleware.test.ts` → 80 passed, 0 failed

**tsc / astro check:**
- `npx tsc --noEmit` → 143 errors (baseline, unchanged)
- `npx astro check` → 160 errors (baseline, unchanged) — zero errors in any Plan 06 file
- `npx astro build` → fails on pre-existing `bcryptjs` in `src/lib/adminAuth.ts` (not Plan 06; documented in deferred-items.md)

---
*Phase: 34-settings-and-studio-retirement*
*Plan: 06-client-dashboard*
*Completed: 2026-04-12*
