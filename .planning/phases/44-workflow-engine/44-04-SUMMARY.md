---
phase: 44-workflow-engine
plan: "04"
subsystem: api
tags: [workflow-templates, sanity, crud, admin, api]

requires:
  - phase: 44-01
    provides: WorkflowTemplate types (types.ts)
  - phase: 44-03
    provides: ALL_SEEDS seed data (seeds.ts)

provides:
  - "POST /api/admin/workflow-templates — create template"
  - "GET /api/admin/workflow-templates — list templates with inUseCount"
  - "GET /api/admin/workflow-templates/[id] — read single template"
  - "PATCH /api/admin/workflow-templates/[id] — update with server-side version auto-increment"
  - "DELETE /api/admin/workflow-templates/[id] — guarded delete (409 when in use)"
  - "POST /api/admin/workflow-templates/[id]/duplicate — clone with regenerated _keys"
  - "POST /api/admin/workflow-templates/seed — idempotent seed endpoint"

affects: [44-08, 44-10]

tech-stack:
  added: []
  patterns:
    - "regenKeys() recursive _key regeneration using crypto.randomUUID() for deep-cloned Sanity arrays"
    - "Server-side version auto-increment: fetch current version, compute version+1, set in patch"
    - "Delete guard pattern: count(*[_type==X && foreignKey==id]) > 0 → 409 before delete"
    - "Idempotent seed: per-seed count check + createIfNotExists with deterministic _id"

key-files:
  created:
    - src/pages/api/admin/workflow-templates/index.ts
    - src/pages/api/admin/workflow-templates/index.test.ts
    - src/pages/api/admin/workflow-templates/[id].ts
    - src/pages/api/admin/workflow-templates/[id].test.ts
    - src/pages/api/admin/workflow-templates/[id]/duplicate.ts
    - src/pages/api/admin/workflow-templates/[id]/duplicate.test.ts
    - src/pages/api/admin/workflow-templates/seed.ts
    - src/pages/api/admin/workflow-templates/seed.test.ts
  modified: []

key-decisions:
  - "Server ignores request-body version on PATCH — only the server computes version = current.version + 1 after reading current doc (T-44-04-02 tamper mitigation)"
  - "DELETE refuses 409 when count(*[_type=='projectWorkflow' && templateId == id]) > 0 — orphan prevention (T-44-04-03)"
  - "regenKeys() regenerates every _key with crypto.randomUUID() recursively to prevent Sanity duplicate-key errors in duplicated nested arrays (T-44-04-05)"
  - "Seed idempotency uses per-seed count(*[name == $name]) check + createIfNotExists with deterministic _id for defense in depth (T-44-04-06)"
  - "inUseCount computed inline in GROQ projection — single query, no N+1 round trips"

patterns-established:
  - "regenKeys(value): recursive deep-clone with crypto.randomUUID() _key replacement for Sanity array cloning"
  - "Server-side PATCH version increment: fetch current doc version → compute new version → include in set() payload"
  - "Idempotent seed loop: fetch count per seed name → skip if > 0, createIfNotExists if 0"

requirements-completed: [WF-01, WF-02]

duration: 2min
completed: "2026-04-23"
---

# Phase 44 Plan 04: Workflow Template CRUD API Summary

**Four Astro API route files (8 endpoints) for WorkflowTemplate CRUD: list/create, read/update/delete with in-use guard, duplicate with recursive _key regeneration, and idempotent seed — 32 tests green.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-23T18:51:25Z
- **Completed:** 2026-04-23T18:53:55Z
- **Tasks:** 3
- **Files modified:** 8 (all new)

## Accomplishments
- Full WorkflowTemplate CRUD API: POST+GET (index), GET+PATCH+DELETE ([id]), POST duplicate, POST seed — 4 route files, 8 HTTP handlers
- Server-enforced version auto-increment on PATCH (client cannot supply arbitrary version — T-44-04-02)
- DELETE guard queries projectWorkflow references before delete; refuses 409 with inUseCount when template is in use (T-44-04-03)
- Duplicate endpoint deep-clones phases with `regenKeys()` — every nested `_key` regenerated via `crypto.randomUUID()` (T-44-04-05)
- Seed endpoint is fully idempotent via per-seed count check + `createIfNotExists` with deterministic `_id` (T-44-04-06)
- 32 tests across 4 test files covering 401/403/400/404/409/500 paths and all business rules

## Task Commits

1. **Task 1: Template list + create (index.ts + test)** - `bde1380` (feat)
2. **Task 2: Template read / patch / delete-guarded ([id].ts + test)** - `e09a872` (feat)
3. **Task 3: Duplicate + seed endpoints (both + tests)** - `a16dbaf` (feat)

## Files Created/Modified

- `src/pages/api/admin/workflow-templates/index.ts` — POST create + GET list with inUseCount projection
- `src/pages/api/admin/workflow-templates/index.test.ts` — 9 tests (auth, validation, success, 500)
- `src/pages/api/admin/workflow-templates/[id].ts` — GET read + PATCH update (version++) + DELETE (409 guard)
- `src/pages/api/admin/workflow-templates/[id].test.ts` — 11 tests (all HTTP verbs, version increment, in-use guard)
- `src/pages/api/admin/workflow-templates/[id]/duplicate.ts` — POST duplicate with regenKeys() recursive _key regeneration
- `src/pages/api/admin/workflow-templates/[id]/duplicate.test.ts` — 6 tests (auth, 404, name suffix, key regen, 500)
- `src/pages/api/admin/workflow-templates/seed.ts` — POST idempotent seed from ALL_SEEDS
- `src/pages/api/admin/workflow-templates/seed.test.ts` — 6 tests (auth, fresh run, re-run, partial, 500)

## Decisions Made
- Server-side version auto-increment: PATCH fetches current version from Sanity, computes `(current.version ?? 0) + 1`, writes result — client-supplied version is never trusted
- In-use guard uses GROQ `count(*[_type=="projectWorkflow" && templateId == $id])` before delete
- `regenKeys()` recursively walks both arrays and objects to regenerate `_key` at every level — not just top-level phase items but nested milestone arrays too
- Seed endpoint uses `createIfNotExists` with deterministic `_id` (from seed data) as defense in depth alongside the per-name count check
- inUseCount computed via inline GROQ projection `"inUseCount": count(...)` in the GET list query — single round trip, no N+1

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All four endpoint groups are complete and tested; Plan 08 (template editor + settings) can now consume these APIs
- Auth gate pattern, version auto-increment, and in-use delete guard are server-enforced — UI can trust 409 responses to disable delete buttons with truthful tooltips
- Seed endpoint is ready for deploy-time invocation (POST /api/admin/workflow-templates/seed from settings or scripts)

---
*Phase: 44-workflow-engine*
*Completed: 2026-04-23*

## Self-Check: PASSED

- `src/pages/api/admin/workflow-templates/index.ts` — FOUND
- `src/pages/api/admin/workflow-templates/index.test.ts` — FOUND
- `src/pages/api/admin/workflow-templates/[id].ts` — FOUND
- `src/pages/api/admin/workflow-templates/[id].test.ts` — FOUND
- `src/pages/api/admin/workflow-templates/[id]/duplicate.ts` — FOUND
- `src/pages/api/admin/workflow-templates/[id]/duplicate.test.ts` — FOUND
- `src/pages/api/admin/workflow-templates/seed.ts` — FOUND
- `src/pages/api/admin/workflow-templates/seed.test.ts` — FOUND
- Commit `bde1380` (Task 1) — FOUND
- Commit `e09a872` (Task 2) — FOUND
- Commit `a16dbaf` (Task 3) — FOUND
