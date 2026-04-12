---
phase: 34-settings-and-studio-retirement
plan: 07
subsystem: infra
tags: [sanity, studio-removal, schema, astro, vercel, refactor]

# Dependency graph
requires:
  - phase: 34-settings-and-studio-retirement
    provides: Wave 2 /admin/settings surface so the Studio-removal retirement notice points at a live replacement
  - phase: 33-rendering-tool-relocation
    provides: Admin-side rendering tool (/admin/rendering) + re-export shim for shared rendering types at src/lib/rendering/types.ts
provides:
  - Studio UI fully retired from la-sprezzatura (studioBasePath dropped, @sanity/astro runs in schema-only distribution mode)
  - project.ts schema free of Studio input component references (8 registration sites stripped, 4 imports removed)
  - 51 Studio-only source files deleted across sanity.config.ts, structure.ts, components/rendering/**, components/gantt/**, components/BlobFileInput.tsx, components/PortalUrlDisplay.tsx, components/StudioNavbar.tsx, studioTheme.ts, studio.css, and actions/**
  - REQUIREMENTS.md annotated with SETT-07 (superseded) and SETT-08 (satisfied) reinterpretation per Phase 34 CONTEXT.md
affects: [phase-35+, future-studio-removal, sanity-content-lake, admin-app]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Schema-only @sanity/astro integration (no Studio mount) — project.ts still distributes types to Content Lake, sanity:client virtual module continues to drive GROQ queries"
    - "Pure-deletion refactor with strict dependency ordering (strip schema imports → delete dependent files → drop config flag) to keep build green at each atomic commit"

key-files:
  created: []
  modified:
    - "src/sanity/schemas/project.ts (4 imports + 8 components.input registrations removed, ~24 lines deleted)"
    - "astro.config.mjs (dropped studioBasePath: '/admin' — 1 line)"
    - ".planning/REQUIREMENTS.md (SETT-07/08 annotated as superseded/satisfied + traceability table updated)"
  deleted:
    - "sanity.config.ts (root — Sanity Studio entry config, not in plan's files_modified list but removed per Rule 3 blocking-issue deviation; grep-verified zero consumers outside Studio)"
    - "src/sanity/structure.ts (Studio document-node view customizer, dead code once Studio is unmounted)"
    - "src/sanity/studioTheme.ts (only referenced by sanity.config.ts)"
    - "src/sanity/studio.css (only referenced by sanity.config.ts)"
    - "src/sanity/actions/{notifyClient,completeProject,reopenProject,sendWorkOrderAccess,sendBuildingAccess,sendUpdate}.tsx (6 Sanity DocumentAction buttons, Studio-only, zero consumers outside sanity.config.ts)"
    - "src/sanity/components/rendering/** (20 files — ChatMessage, ChatView, DesignOptionsTab, GeneratingOverlay, PromoteDialog(.test), RenderingCard, RenderingTool, RenderingToolPlugin, SessionCard, SessionList, ThumbnailStrip, UsageBadge(.test), types.ts shim + Wizard/ subtree with 5 step components)"
    - "src/sanity/components/gantt/** (17 files — DependencyPreview, GanttChart, GanttEmptyState, GanttLegend, GanttScheduleView, ScaleToggle, ScheduleItemPicker, frappe-gantt.css, gantt.css, hooks/useGanttData, lib/{ganttColors,ganttDates,ganttTransforms,ganttTypes} + their tests)"
    - "src/sanity/components/BlobFileInput.tsx"
    - "src/sanity/components/PortalUrlDisplay.tsx"
    - "src/sanity/components/StudioNavbar.tsx"

key-decisions:
  - "Rule 3 auto-fix: delete sanity.config.ts, studioTheme.ts, studio.css, and src/sanity/actions/ as part of Task 1. Plan's files_modified list missed these 9 files; without deleting them, deleting structure.ts and the component subtrees leaves sanity.config.ts with broken imports on a type-checked file and blocks the plan's stated goal of retiring Studio entirely."
  - "Kept the `hasSanity` ternary in astro.config.mjs (D-04 discretion per research § 1.1) — it earns its keep for CI/placeholder projectId guard."
  - "Used `npx astro build` as the ground-truth verification check instead of `npx tsc --noEmit`; the latter has 25 pre-existing errors in surviving files (bcryptjs, GanttTask drift, etc.) and cannot exit 0 per the deferred-items.md baseline."
  - "SETT-07 and SETT-08 claimed by this plan and recorded as 'superseded' / 'satisfied by D-01' in REQUIREMENTS.md traceability table."

patterns-established:
  - "Schema-only Sanity integration: drop studioBasePath, keep @sanity/astro installed, keep schemas/** for type distribution, delete sanity.config.ts (the Studio entry) and all Studio-only sibling modules (actions, studioTheme, studio.css)."
  - "Strict deletion ordering for cross-imported Studio graphs: (1) strip schema-level input registrations, (2) delete dependent top-level entry (sanity.config.ts) + structure.ts, (3) delete component subtrees, (4) drop integration flag."

requirements-completed:
  - SETT-07
  - SETT-08

# Metrics
duration: ~24 min
completed: 2026-04-11
---

# Phase 34 Plan 07: Studio Removal Summary

**Sanity Studio fully retired from la-sprezzatura — studioBasePath dropped, sanity.config.ts + 50 Studio-only source files deleted, @sanity/astro now runs in schema-only distribution mode, astro build behavior unchanged from baseline (only the pre-existing bcryptjs failure remains).**

## Performance

- **Duration:** ~24 min
- **Started:** 2026-04-11T21:11Z (base commit c9f1e22 parent time: 21:05:15 -04:00)
- **Completed:** 2026-04-11T21:35Z
- **Tasks:** 3 (all type="auto")
- **Files changed:** 52 (1 modified, 51 deleted in src/sanity/** + sanity.config.ts, 1 modified in astro.config.mjs, 1 modified in .planning/REQUIREMENTS.md)
- **Net line delta:** -6,503 lines removed across all commits

## Accomplishments

- Retired Sanity Studio UI completely from the Astro application. `studioBasePath` is dropped; `@sanity/astro` now operates in schema-only distribution mode (the `sanity:client` virtual module still drives GROQ fetches via `src/sanity/queries.ts`, which Content Lake reads for the admin dashboards and public site).
- Deleted 51 source files across the entire `src/sanity/components/` directory (rendering, gantt, and root-level input subdirectories), `src/sanity/actions/`, `src/sanity/structure.ts`, `src/sanity/studioTheme.ts`, `src/sanity/studio.css`, and the root `sanity.config.ts`. Total deletion: 6,503 lines across 2 commits.
- Stripped 4 Studio-component imports and 8 `components: { input: … }` registrations from `src/sanity/schemas/project.ts` (lines 15-18 and registration sites at 231, 571, 700, 750, 810, 1219, 1226, 1246). Schema still feeds Content Lake with default Sanity input fallbacks.
- Annotated `.planning/REQUIREMENTS.md` with the SETT-07 / SETT-08 reinterpretation (superseded / satisfied by D-01) in both the inline checklist (lines 86-87) and the Traceability table (lines 180-181), completing the plan's REQ-ID coverage claim.
- Zero test regressions across the entire Vitest suite: baseline `9 failed files / 20 failed tests` remains unchanged post-deletion; the 5 Studio-resident test files were correctly removed alongside their source.

## Task Commits

Each task was committed atomically:

1. **Task 1: Strip Studio imports from project.ts + delete structure.ts + delete blocking sanity.config.ts surface** — `e7b7650` (refactor)
2. **Task 2: Delete Studio component files + drop studioBasePath** — `e8b97dc` (refactor)
3. **Task 3: Annotate REQUIREMENTS.md with SETT-07/08 reinterpretation** — committed as part of the plan metadata commit below (`.planning/` is gitignored; force-added with the SUMMARY).

**Plan metadata commit:** to be created next (docs(34-07): plan summary + requirements SETT-07/08 validated).

## Files Created/Modified

### Modified
- `src/sanity/schemas/project.ts` — Removed 4 Studio input component imports (BlobFileInput, PortalUrlDisplay, ScheduleItemPicker, DependencyPreview) at lines 15-18. Removed 8 `components: { input: ... }` registrations: PortalUrlDisplay on `portalToken`, 4× BlobFileInput on `estimateFile`/`file`/`file`/`file` (estimates, plans, COIs, legalDocs), 2× ScheduleItemPicker on `source`/`target`, and the `DependencyPreview({ ... })` wrapper on the `scheduleDependency` preview. Schema still defines and distributes all fields to Content Lake via `@sanity/astro` schema-only integration.
- `astro.config.mjs` — Dropped `studioBasePath: "/admin"` from the Sanity integration block. Kept the `hasSanity` ternary (D-04 discretion: guards CI/placeholder projectId). Everything else in the integration call (projectId, dataset, useCdn, apiVersion) is preserved.
- `.planning/REQUIREMENTS.md` — Line 86 (SETT-07) annotated with **superseded** — see Phase 34 CONTEXT.md § Requirements reinterpretation. Line 87 (SETT-08) annotated with **satisfied** by immediate studioBasePath drop per D-01. Traceability table rows 180-181 updated from "Pending" → "Superseded (see CONTEXT.md reinterpretation)" and "Satisfied via D-01 (immediate removal)".

### Deleted — Scoped to Studio-only surface
- `sanity.config.ts` (root) — Sanity Studio entry file; was importing from the Studio component tree and would have broken tsc/astro check once structure.ts was removed.
- `src/sanity/structure.ts` — Studio document-node view customizer (15 lines), Studio-only.
- `src/sanity/studioTheme.ts` — Studio color palette (only consumer was sanity.config.ts).
- `src/sanity/studio.css` — Studio stylesheet (only consumer was sanity.config.ts).
- `src/sanity/actions/notifyClient.tsx`, `completeProject.tsx`, `reopenProject.tsx`, `sendWorkOrderAccess.tsx`, `sendBuildingAccess.tsx`, `sendUpdate.tsx` — 6 Sanity DocumentAction buttons; only consumer was sanity.config.ts. These Studio-level trigger buttons are orthogonal to the `/admin/*` HTTP surface which has its own action endpoints.
- `src/sanity/components/rendering/**` (20 files) — ChatMessage.tsx, ChatView.tsx, DesignOptionsTab.tsx, GeneratingOverlay.tsx, PromoteDialog.tsx, PromoteDialog.test.ts, RenderingCard.tsx, RenderingTool.tsx, RenderingToolPlugin.ts, SessionCard.tsx, SessionList.tsx, ThumbnailStrip.tsx, UsageBadge.tsx, UsageBadge.test.ts, types.ts (re-export shim from Phase 33 — grep verified zero external consumers), Wizard/StepClassify.tsx, Wizard/StepDescribe.tsx, Wizard/StepSetup.tsx, Wizard/StepUpload.tsx, Wizard/WizardContainer.tsx. These were preserved by Phase 33 D-21 for coexistence; Phase 34 drops that coexistence.
- `src/sanity/components/gantt/**` (17 files) — DependencyPreview.tsx, frappe-gantt.css, gantt.css, GanttChart.tsx, GanttEmptyState.tsx, GanttLegend.tsx, GanttScheduleView.tsx, ScaleToggle.tsx, ScheduleItemPicker.tsx, hooks/useGanttData.ts, lib/ganttColors.ts, lib/ganttColors.test.ts, lib/ganttDates.ts, lib/ganttDates.test.ts, lib/ganttTransforms.ts, lib/ganttTransforms.test.ts, lib/ganttTypes.ts. The admin gantt at `src/lib/gantt/**` is independent (research § 1.3) and was not touched.
- `src/sanity/components/BlobFileInput.tsx`, `PortalUrlDisplay.tsx`, `StudioNavbar.tsx` — 3 root-level Studio input components.

Total source files deleted: **51**.

## Decisions Made

- **Rule 3 auto-fix: expand the Task 1 deletion set to include sanity.config.ts + 8 dependent Studio modules.** See Deviations section below for the full rationale.
- **Keep the `hasSanity` ternary in astro.config.mjs** (D-04 discretion). The plan's research § 1.1 explicitly left this to planner/executor judgement. The ternary earns its keep for CI and placeholder-projectId scenarios and removing it offers no value for the plan's stated goal.
- **Use `npx astro build` as the ground-truth verification check** instead of `npx tsc --noEmit`. The repo has 25 pre-existing tsc errors in surviving files (bcryptjs, GanttTask shape drift, geminiClient SDK types, etc.) that cannot be fixed within this plan's SCOPE BOUNDARY. `astro build` cleanly surfaces the single pre-existing bcryptjs blocker and is the load-bearing acceptance signal per the orchestrator's briefing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Expanded Task 1 deletion set to include sanity.config.ts and 8 dependent Studio modules not on the plan's files_modified list.**

- **Found during:** Task 1 (Strip Studio imports from project.ts + delete structure.ts)
- **Issue:** After deleting `src/sanity/structure.ts` per plan, `npx astro check` immediately reported `sanity.config.ts:11 Cannot find module './src/sanity/structure'`. Grep-verification then showed `sanity.config.ts` (which is a real file at the repo root, not mentioned in the plan or the `files_modified` list) imports from the following Studio-only modules the plan mandates deleting:
  - `./src/sanity/components/rendering/RenderingToolPlugin` (deleted in Task 2 per plan)
  - `./src/sanity/structure` (deleted in Task 1 per plan)
  - `./src/sanity/components/StudioNavbar` (deleted in Task 2 per plan)
  - `./src/sanity/studioTheme` (NOT in plan, zero non-Studio consumers)
  - `./src/sanity/studio.css` (NOT in plan, zero non-Studio consumers)
  - `./src/sanity/actions/{notifyClient,completeProject,reopenProject,sendWorkOrderAccess,sendBuildingAccess,sendUpdate}` — 6 document-action files (NOT in plan, zero non-Studio consumers)

  Leaving `sanity.config.ts` alive after Task 2 would break `astro check` on 14+ lines of now-dangling imports and contradict the plan's stated goal of "Retire Sanity Studio entirely from the application (D-01..D-04)". This is a textbook Rule 3 blocking issue — without the expansion, the plan cannot satisfy its own verification criteria.
- **Fix:** Added `sanity.config.ts`, `src/sanity/studioTheme.ts`, `src/sanity/studio.css`, and the 6 files in `src/sanity/actions/` to the Task 1 deletion set. Grep verified each had zero consumers outside `sanity.config.ts` itself. Task 1 now deletes 11 files total (the planned 2 + 9 Rule 3 additions). Task 2 proceeded exactly as planned.
- **Files modified:** `sanity.config.ts` (deleted), `src/sanity/studioTheme.ts` (deleted), `src/sanity/studio.css` (deleted), `src/sanity/actions/notifyClient.tsx` (deleted), `src/sanity/actions/completeProject.tsx` (deleted), `src/sanity/actions/reopenProject.tsx` (deleted), `src/sanity/actions/sendWorkOrderAccess.tsx` (deleted), `src/sanity/actions/sendBuildingAccess.tsx` (deleted), `src/sanity/actions/sendUpdate.tsx` (deleted).
- **Verification:** After Task 1, `npx astro check` error count dropped from 160 (baseline) to 57, confirming Studio-surface errors were removed and no new errors were introduced. After Task 2, `astro check` dropped further to 42 errors, all of which match pre-existing entries in `.planning/phases/34-settings-and-studio-retirement/deferred-items.md` (adminAuth bcryptjs, gantt shape drift in surviving files, geminiClient SDK drift, etc.). `npx astro build` continues to fail only on the pre-existing bcryptjs issue, identical to baseline.
- **Committed in:** `e7b7650` (Task 1 commit — explicitly called out in commit message body).

---

**Total deviations:** 1 auto-fixed (Rule 3 - Blocking Issue)
**Impact on plan:** Deviation was strictly necessary to complete the plan's stated goal of retiring Studio entirely. No scope creep — all 9 added files were grep-verified Studio-only with zero consumers outside `sanity.config.ts`. All additions match the plan's intent and the `34-CONTEXT.md` D-01..D-04 language ("Full Sanity Studio removal … schema-only distribution"). The plan's `files_modified` list was simply incomplete at planning time because the planner didn't notice that `sanity.config.ts` and its exclusive dependencies existed separately from the `src/sanity/components/` tree the research surveyed.

## Issues Encountered

- **Pre-existing test and build baseline**: 20 tests in 9 files were failing before this plan started, documented in `.planning/phases/34-settings-and-studio-retirement/deferred-items.md`. Plus 25 pre-existing tsc errors in surviving files. This execution verified zero regressions against that baseline (same 9 files, same 20 failing tests, same `astro build` bcryptjs blocker) but did not attempt to fix them — outside this plan's SCOPE BOUNDARY per GSD deviation rules.
- **Verified no new untracked files**: `git status --short` after each commit showed only the pre-existing `.planning/ROADMAP.md` and `.planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md` modifications left in the working tree (both owned by the orchestrator, pre-existing, not touched).

## User Setup Required

None — no external service configuration is required.

Sanity Studio on the `sanity.io/manage` dashboard is not affected by this deletion; the hosted Studio (if the user ever visits `https://www.sanity.io/organizations/.../project/.../desk`) continues to work because it's cloud-hosted and independent of this repository's code. What's removed is the *self-hosted Studio mount* at `lasprezz.com/admin` (which was superseded by the custom `/admin/*` app already built in Phases 18-33).

## Next Phase Readiness

- **Phase 34 is now code-complete.** All 7 plans (34-01 through 34-07) are committed. Main HEAD is at `e8b97dc` (this plan's Task 2 commit) — the orchestrator will append a plan-metadata commit next.
- **Studio retirement is final**: no deprecation window, no coexistence path, no rollback file. Re-adding Studio would require restoring `sanity.config.ts` and approximately 50 component files from git history.
- **Content Lake is untouched.** All `src/sanity/queries.ts` GROQ queries, `src/sanity/client.ts`, `src/sanity/writeClient.ts`, `src/sanity/image.ts`, and `src/sanity/schemas/**` remain intact and functional. The admin dashboards (`/admin/*`) and public site continue to read from Sanity Content Lake exactly as before.
- **Known carryover for the next phase / baseline-hygiene task** (not created by this plan but worth flagging explicitly so the v5.0 milestone wrap-up does not miss them):
  - `src/lib/adminAuth.ts:11` — missing `bcryptjs` dependency. Fix: `npm install bcryptjs @types/bcryptjs`. Blocks `astro build`.
  - 24 other pre-existing tsc errors across 8 surviving files (ScheduleEditor, ArtifactApprovalForm, ContractorNoteForm, geminiClient, gantt/ganttTransforms, close-document, sanity/image, sanity/queries) — enumerated in `deferred-items.md`.
  - 20 pre-existing test failures in 9 files (enumerated in `deferred-items.md`).
  - None of these are regressions from Phase 34.

## Self-Check: PASSED

Verified 2026-04-11 after SUMMARY.md was drafted:

**Created/modified files (all FOUND):**
- `.planning/phases/34-settings-and-studio-retirement/34-07-SUMMARY.md`
- `src/sanity/schemas/project.ts`
- `astro.config.mjs`
- `.planning/REQUIREMENTS.md`

**Deleted files (all confirmed GONE):**
- `sanity.config.ts`
- `src/sanity/structure.ts`
- `src/sanity/studioTheme.ts`
- `src/sanity/studio.css`
- `src/sanity/components/BlobFileInput.tsx`
- `src/sanity/components/PortalUrlDisplay.tsx`
- `src/sanity/components/StudioNavbar.tsx`
- `src/sanity/components/rendering/` (entire directory)
- `src/sanity/components/gantt/` (entire directory)
- `src/sanity/actions/` (entire directory)

**Task commits (all FOUND in `git log`):**
- `e7b7650` refactor(34-07): strip Studio input components from project schema
- `e8b97dc` refactor(34-07): retire Sanity Studio UI (D-01..D-04)

**Regression parity:**
- Baseline failing tests: `9 failed files | 20 failed tests`
- Post-deletion failing tests: `9 failed files | 20 failed tests`
- Diff: zero. Same files, same tests. All Phase 34 prior-wave tests (Wave 1, Plans 34-03/04/05/06 — 239 plan-scoped tests) continue to pass.
- Baseline `astro build` failure: pre-existing bcryptjs in `src/lib/adminAuth.ts`.
- Post-deletion `astro build` failure: identical (bcryptjs in `src/lib/adminAuth.ts`). No new errors introduced.
- `astro check` error count: 160 (baseline) → 42 (post-deletion) — a 118-error reduction from removed Studio files. Zero new errors in surviving files.

---
*Phase: 34-settings-and-studio-retirement*
*Plan: 07 — studio-removal*
*Completed: 2026-04-11*
