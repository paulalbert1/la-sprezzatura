---
phase: 33-rendering-tool-relocation
plan: 01
subsystem: infra
tags: [astro, sanity, groq, vitest, tenant, lucide-react]

requires:
  - phase: 29-tenant-aware-platform-foundation
    provides: "tenant config loader, getTenantClient factory, tenant-scoped admin auth"
  - phase: 32-procurement-editor
    provides: "luxury parchment/gold-light admin theme tokens that Phase 33 UI adopts"
provides:
  - "Astro.locals.sanityUserId resolved from tenants.json for admin sessions (Risk 1 closed)"
  - "RENDERING_SESSIONS_TENANT_QUERY: dataset-scoped all-tenant rendering session GROQ query"
  - "src/lib/rendering/types.ts: shared rendering types importable by both Studio and admin"
  - "Three admin route shells (/admin/rendering index, new, [sessionId]) with studioToken prop-passing scaffolded"
  - "AdminNav uses Sparkles icon and 'Rendering' label"
  - "Six Wave 0 Nyquist test stubs (34 todo tests) documenting behavior contracts for Plans 02-06"
  - "vitest.config.ts extended to discover *.test.tsx files"
affects: [33-02, 33-03, 33-04, 33-05, 33-06, 33-07]

tech-stack:
  added: []
  patterns:
    - "Shared types between Studio and admin via re-export shim (src/sanity/components/rendering/types.ts re-exports from src/lib/rendering/types.ts)"
    - "Studio token injection via Astro frontmatter (const studioToken = import.meta.env.STUDIO_API_SECRET) passed as React island prop — secret never lands in client bundle via module load"
    - "Nyquist test-stub pattern: describe/it.todo blocks with source-of-truth comments so Vitest counts pending work without failing the suite"

key-files:
  created:
    - "src/lib/rendering/types.ts"
    - "src/pages/admin/rendering/index.astro"
    - "src/pages/admin/rendering/new.astro"
    - "src/pages/admin/rendering/[sessionId]/index.astro"
    - "src/components/admin/rendering/WizardContainer.test.tsx"
    - "src/components/admin/rendering/StepUpload.test.tsx"
    - "src/components/admin/rendering/StepSetup.test.tsx"
    - "src/components/admin/rendering/SessionListPage.test.tsx"
    - "src/pages/api/rendering/refine.test.ts"
    - "src/pages/api/rendering/promote.test.ts"
  modified:
    - "src/config/tenants.json"
    - "src/lib/tenants.ts"
    - "src/env.d.ts"
    - "src/middleware.ts"
    - "src/components/admin/AdminNav.tsx"
    - "src/sanity/queries.ts"
    - "src/sanity/components/rendering/types.ts"
    - "vitest.config.ts"

key-decisions:
  - "sanityUserId for admin sessions = admin email (from tenants.json) — stable, consistent within admin tool; scratch-pad for future real Sanity user ID migration"
  - "All-tenant rendering session GROQ query lives at the queries.ts module level, named RENDERING_SESSIONS_TENANT_QUERY; tenant scoping is implicit via getTenantClient(tenantId) dataset targeting"
  - "Shared rendering types moved to src/lib/rendering/types.ts; Studio file becomes a 5-line re-export shim so no Studio import has to change"
  - "getStudioToken() function body kept (not removed) in the moved types.ts because 6 existing Studio files call it; comment above documents the admin-side prop-passing pattern instead"
  - "vitest.config.ts include glob extended from ['*.test.ts'] to ['*.test.ts', '*.test.tsx'] so React component stubs are discoverable"

patterns-established:
  - "Admin page shells pre-wire server-side fetches and secrets so later plans can mount islands without re-plumbing (prefetch in .astro, pass as props, reference locals via `void` to prevent TS pruning)"
  - "STUDIO_API_SECRET reads happen only inside .astro frontmatter (server context); verified via `grep -r STUDIO_API_SECRET src/components/` returning zero matches"
  - "Nyquist test-stub pattern for multi-plan phases: Wave 0 creates all pending test files before any implementation so later waves can port behavior into existing describes"

requirements-completed:
  - RNDR-01
  - RNDR-05

duration: 8min
completed: 2026-04-10
---

# Phase 33 Plan 01: Infrastructure Foundation Summary

**Resolved the admin sanityUserId identity gap, added the all-tenant GROQ query, moved shared rendering types to a clean shared location, scaffolded three Astro route shells with studioToken prop-passing, swapped AdminNav to Sparkles, and planted six Nyquist test stubs so Plans 02-06 have discoverable pending tests from day one.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-10T18:56:20Z
- **Completed:** 2026-04-10T19:04:18Z
- **Tasks:** 3 / 3
- **Files created:** 10
- **Files modified:** 8

## Accomplishments

- **Risk 1 closed** — `Astro.locals.sanityUserId` is now typed in `env.d.ts`, populated in `middleware.ts` from the tenants.json admin lookup, and backed by a `sanityUserId` field on every admin entry. Admin-created rendering sessions will carry a stable, consistent creator ID from this commit forward.
- **Open Question 3 closed** — `RENDERING_SESSIONS_TENANT_QUERY` added to `src/sanity/queries.ts` with the full projection Plan 02 will consume (`thumbnail`, `createdBy`, `renderingCount`, `project->`, `status`, `createdAt`).
- **Shared-type split finished** — `src/lib/rendering/types.ts` now holds the canonical interfaces (`RenderingSession`, `WizardData`, `UsageData`, etc.) and constants (`STYLE_PRESETS`, `INITIAL_WIZARD_DATA`). The old `src/sanity/components/rendering/types.ts` is a 5-line re-export shim so all 6 existing Studio imports still resolve unchanged.
- **Three Astro route shells stood up** — `/admin/rendering` (session list), `/admin/rendering/new` (wizard), `/admin/rendering/[sessionId]` (chat view). Each shell pre-fetches its server-side data, reads `STUDIO_API_SECRET` from `import.meta.env` (never exposed to the client), wires `sanityUserId` and the breadcrumb trail, and guards with the `tenantId` redirect pattern copied from `admin/clients/index.astro`.
- **AdminNav reskin** — `Palette` dropped entirely from the lucide import list; `Sparkles` replaces it; nav label shortened from "Rendering Tool" to "Rendering" per UI-SPEC copy contract and D-02.
- **Nyquist stubs** — 6 stub files, 34 `it.todo` tests, 0 failures. Every stub carries a source-of-truth comment pointing Plans 02-06 at the exact Studio file and line numbers to port behavior from.

## Task Commits

Each task was committed atomically with `--no-verify` (parallel-wave safety):

1. **Task 1: Resolve sanityUserId identity gap and update AdminNav** — `39c0dee` (feat)
2. **Task 2: Add RENDERING_SESSIONS_TENANT_QUERY, move types, create route shells** — `1748db0` (feat)
3. **Task 3: Create Wave 0 test stubs (Nyquist requirement)** — `d8d6301` (test)

## Files Created/Modified

### Created (10)

- `src/lib/rendering/types.ts` — Canonical shared rendering types and constants (moved from `src/sanity/components/rendering/types.ts`)
- `src/pages/admin/rendering/index.astro` — Session list page shell with `RENDERING_SESSIONS_TENANT_QUERY` pre-fetched
- `src/pages/admin/rendering/new.astro` — Wizard page shell with project list pre-fetched server-side
- `src/pages/admin/rendering/[sessionId]/index.astro` — Chat view shell with sessionId param extracted
- `src/components/admin/rendering/WizardContainer.test.tsx` — 6 todo tests for RNDR-06 stepper navigation
- `src/components/admin/rendering/StepUpload.test.tsx` — 8 todo tests covering RNDR-07/08/09 (preview, filename truncation, multi-upload)
- `src/components/admin/rendering/StepSetup.test.tsx` — 3 todo tests for RNDR-10 field separation
- `src/components/admin/rendering/SessionListPage.test.tsx` — 6 todo tests for RNDR-01 session list
- `src/pages/api/rendering/refine.test.ts` — 6 todo tests for RNDR-03 chat refinement API
- `src/pages/api/rendering/promote.test.ts` — 5 todo tests for RNDR-04 design option promotion API

### Modified (8)

- `src/config/tenants.json` — Added `sanityUserId` field to both admin entries (email as value)
- `src/lib/tenants.ts` — Extended `TenantAdmin` interface with `sanityUserId`; added `getAdminBySanityUserId()` helper
- `src/env.d.ts` — Added `sanityUserId: string | undefined` to `App.Locals`
- `src/middleware.ts` — Admin session block now resolves and assigns `context.locals.sanityUserId` from tenant admin lookup
- `src/components/admin/AdminNav.tsx` — Swapped `Palette` → `Sparkles`, label "Rendering Tool" → "Rendering"
- `src/sanity/queries.ts` — Added `RENDERING_SESSIONS_TENANT_QUERY` export after `RENDERING_SESSIONS_BY_CREATOR_QUERY`
- `src/sanity/components/rendering/types.ts` — Replaced 186-line type file with 5-line re-export shim pointing at `src/lib/rendering/types.ts`
- `vitest.config.ts` — Extended test include glob from `['src/**/*.test.ts']` to `['src/**/*.test.ts', 'src/**/*.test.tsx']`

## Decisions Made

- **sanityUserId = admin email** — Plan explicitly called for Option C from RESEARCH.md adapted for zero-config. The real Sanity user ID isn't stored in the codebase and looking it up at runtime is out of scope. Using the email as a stable unique identifier keeps usage docs (`usage-liz@lasprezz.com-2026-04`) and `createdBy` values consistent within the admin tool. A comment in the new field documents this as a future migration target.
- **Shared-type move preserved the Studio path via re-export** — The plan could have been interpreted as "delete the Studio file"; instead I left a 5-line `export *` shim so zero Studio imports need rewriting. The relative path from `src/sanity/components/rendering/types.ts` is `../../../lib/rendering/types` (3 levels up through `components/ -> sanity/ -> src/`).
- **`void` references for prefetched locals in Astro shells** — Each shell declares `sanityUserId`, `studioToken`, and (for `new.astro`) `prefilledProjectId` in frontmatter even though the shell template only renders scaffolding text. I added `void identifier;` statements so TypeScript and unused-variable linters don't prune the assignments before Plans 02/03/05 mount their islands. The template also references one or two of the variables in the scaffolding copy so the wiring is visibly exercised.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Retained `getStudioToken()` function body in the moved `types.ts`**
- **Found during:** Task 2 Step B (types.ts move)
- **Issue:** Plan said to "remove the function body" and "replace the function with a comment". But `getStudioToken()` is called by 6 existing Studio files (`RenderingTool.tsx`, `RenderingCard.tsx`, `PromoteDialog.tsx`, `DesignOptionsTab.tsx`, `ChatView.tsx`, `Wizard/WizardContainer.tsx`). Removing the body would break all of those imports since the Studio shim re-exports everything from the new file.
- **Fix:** Kept the `getStudioToken()` and `getStudioHeaders()` function bodies intact in `src/lib/rendering/types.ts` so Studio consumers still work. Added a multi-line comment above documenting the admin-side pattern: _"getStudioToken() is Studio-only — admin pages pass studioToken as a prop from Astro instead. Admin islands receive the token as a string prop from the .astro shell (const studioToken = import.meta.env.STUDIO_API_SECRET) so the secret never ships in the client bundle via module-level evaluation."_ The admin intent is satisfied at the architecture level without breaking Studio.
- **Files modified:** `src/lib/rendering/types.ts`
- **Verification:** `grep -r "STUDIO_API_SECRET" src/components/` returns zero matches; `grep "STUDIO_API_SECRET" src/pages/admin/rendering/` returns the 3 expected server-side assignments.
- **Committed in:** `1748db0` (Task 2 commit)

**2. [Rule 3 — Blocking] Extended `vitest.config.ts` include glob to cover `*.test.tsx`**
- **Found during:** Task 3 (stub test run)
- **Issue:** Initial stub run showed only the 2 `.ts` files (refine, promote) — the 4 `.tsx` React component stubs were silently excluded. Root cause: `vitest.config.ts` had `test: { include: ['src/**/*.test.ts'] }` which excludes `.tsx`. Plan acceptance criterion "completes without TypeScript compilation errors" + "all tests are pending / todo" could not be satisfied without this fix.
- **Fix:** Extended the include glob to `['src/**/*.test.ts', 'src/**/*.test.tsx']`. Re-ran stubs: 6 files picked up, 34 todo tests, 0 failures.
- **Files modified:** `vitest.config.ts`
- **Verification:** `npx vitest run src/components/admin/rendering/ src/pages/api/rendering/refine.test.ts src/pages/api/rendering/promote.test.ts` now reports 6 skipped files, 34 todo tests, 0 failures.
- **Committed in:** `d8d6301` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (2 Rule 3 blocking)
**Impact on plan:** Both deviations were required for the plan's acceptance criteria to be satisfiable. Neither expanded scope — both preserved the plan's intent (admin pattern for tokens; Nyquist stubs run as pending) while working around existing constraints (Studio consumers; vitest config).

## Deferred Issues

Pre-existing TypeScript errors found during `npx tsc --noEmit` baseline run in unrelated files (ScheduleEditor, ArtifactApprovalForm, ganttTransforms, geminiClient, queries.ts line 92). None were introduced by Plan 33-01. Documented in `.planning/phases/33-rendering-tool-relocation/deferred-items.md` per the GSD scope-boundary rule. Verified via `git stash + npx tsc` that `queries.ts` line 92 error pre-dates this plan.

## Known Stubs

The three admin route shells intentionally render scaffolding text ("Session list coming in Plan 02", "Wizard coming in Plan 03", "Chat view coming in Plan 05") in place of the React islands they will mount in subsequent plans. This is intentional per the plan objective ("wire the Astro route shells...may be shells"). The server-side data fetches, secret assignments, and `Astro.locals` reads are all live — only the island components are pending:

- `src/pages/admin/rendering/index.astro` — `sessions` fetched; waiting on `<SessionListPage>` island (Plan 02 / RNDR-01)
- `src/pages/admin/rendering/new.astro` — `projects` fetched; waiting on `<WizardContainer>` island (Plan 03 / RNDR-06-10)
- `src/pages/admin/rendering/[sessionId]/index.astro` — `sessionId` extracted; waiting on `<ChatView>` island (Plan 05 / RNDR-03)

The 34 Vitest `it.todo` stubs are also intentional pending work — each one documents a behavior contract with a source-of-truth reference that the corresponding implementation plan will turn green.

## Threat Flags

None — no new security-relevant surface introduced beyond what the plan's `<threat_model>` already enumerated. `STUDIO_API_SECRET` handling follows the existing `import.meta.env` server-side pattern (T-33-01 mitigation), no new endpoints, no new auth paths, no new file access patterns.

## Issues Encountered

None beyond the two deviations documented above. The identified worktree base drift (ACTUAL_BASE was on a Gantt-experimentation lineage `ffbfebc` while EXPECTED_BASE was the phase 33 planning commit `152a33c`) was resolved via the `git reset --soft` + `git checkout HEAD -- .` sequence specified in the executor rebase instructions.

## Next Plan Readiness

- **Plan 02 (Session List)** — Ready: `RENDERING_SESSIONS_TENANT_QUERY` exported, session list shell prefetches sessions, Nyquist stub `SessionListPage.test.tsx` is waiting.
- **Plan 03 (Wizard)** — Ready: wizard shell prefetches projects, Nyquist stubs `WizardContainer.test.tsx` + `StepUpload.test.tsx` + `StepSetup.test.tsx` are waiting, `src/lib/rendering/types.ts` is importable.
- **Plan 04 (Generate API relocation)** — No prerequisite changes from Plan 01 beyond the middleware `sanityUserId` field.
- **Plan 05 (Chat view)** — Ready: `[sessionId]/index.astro` shell wired, `refine.test.ts` stub ready.
- **Plan 06 (Promote)** — Ready: `promote.test.ts` stub ready.
- **Plan 07 (Final verification/build check)** — Will need to confirm `grep -r "STUDIO_API_SECRET" dist/` returns zero matches after `astro build` (T-33-01 acceptance).

No blockers for Wave 1 plans.

## Self-Check: PASSED

- [x] `src/config/tenants.json` — contains 2 `sanityUserId` matches
- [x] `src/lib/tenants.ts` — contains `TenantAdmin.sanityUserId` field + `getAdminBySanityUserId` function
- [x] `src/env.d.ts` — contains `sanityUserId: string | undefined`
- [x] `src/middleware.ts` — contains `context.locals.sanityUserId = adminEntry?.sanityUserId`
- [x] `src/components/admin/AdminNav.tsx` — contains `Sparkles` import and nav item; zero `Palette` matches
- [x] `src/sanity/queries.ts` — contains `RENDERING_SESSIONS_TENANT_QUERY` export
- [x] `src/lib/rendering/types.ts` — created with `RenderingSession`, `WizardData`, `UsageData` interfaces
- [x] `src/sanity/components/rendering/types.ts` — now a re-export shim: `export * from "../../../lib/rendering/types"`
- [x] `src/pages/admin/rendering/index.astro` — exists, `STUDIO_API_SECRET` assignment present, `tenantId` redirect guard present
- [x] `src/pages/admin/rendering/new.astro` — exists, same checks
- [x] `src/pages/admin/rendering/[sessionId]/index.astro` — exists, same checks
- [x] All 6 test stub files exist, vitest reports 34 todo / 0 failure
- [x] `vitest.config.ts` include glob covers `*.test.tsx`
- [x] Commit `39c0dee` exists (Task 1)
- [x] Commit `1748db0` exists (Task 2)
- [x] Commit `d8d6301` exists (Task 3)
- [x] `grep -r STUDIO_API_SECRET src/components/` returns zero matches

---
*Phase: 33-rendering-tool-relocation*
*Plan: 01*
*Completed: 2026-04-10*
