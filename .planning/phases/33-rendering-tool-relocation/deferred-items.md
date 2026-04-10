# Phase 33 Deferred Items

Pre-existing issues found during execution but NOT caused by Phase 33 changes.
Per GSD scope boundary rule, these are out of scope and tracked here.

## Pre-existing TypeScript errors (not introduced by Phase 33)

Found during Plan 33-01 Task 1 verification (`npx tsc --noEmit`). None of these
are in files modified by Phase 33 work.

- `src/components/admin/ScheduleEditor.tsx` — `SanityProjectData` engagementType incompatibility; stray `.tasks`/`.links` accessors on GanttTask[]
- `src/components/portal/ArtifactApprovalForm.tsx` — union discriminant overlap warnings (unreachable branches)
- `src/lib/gantt/ganttTransforms.ts` — object-literal shape mismatch with `GanttTask[]`
- `src/lib/gantt/ganttTransforms.test.ts` — same mismatch; implicit `any` parameters
- `src/lib/gantt/ganttTypes.ts` — missing module `../procurementStages`
- `src/lib/geminiClient.ts` — `GenerateContentResponse` type narrowing vs. usage site
- `src/sanity/queries.ts` line 92 — `getProjectByPortalToken` overload mismatch (pre-existing; confirmed by stash + re-run). Unrelated to the new RENDERING_SESSIONS_TENANT_QUERY at line 605.

These pre-date Phase 33 and should be addressed in a dedicated cleanup plan.

## Pre-existing Vitest failures (not introduced by Phase 33)

Found during Plan 33-07 Task 1 (`npx vitest run`). 14 failing tests across 6 files,
all of which were last modified in phases prior to 33 (Phase 28 palette, Phase 29
tenant client, pre-Phase-33 formatCurrency refactor, Phase 10 geminiClient). Zero
failures in `src/components/admin/rendering/` or `src/pages/api/rendering/` (the
Phase 33 scope).

- `src/lib/artifactUtils.test.ts` — 3 badge-style failures (charcoal/emerald/terracotta); source updated when design system changed, test not updated
- `src/lib/formatCurrency.test.ts` — 3 failures expecting `.00` suffix; source was updated in `9da6e12` to drop `.00` from whole dollar amounts, test not updated
- `src/lib/gantt/ganttColors.test.ts` — 3 failures expecting Tailwind-500 hex values; palette was desaturated in `9a1e5cc` (Phase 28 work), test still asserts old values
- `src/lib/geminiClient.test.ts` — 1 failure in `fetchAndEncodeImage` (Phase 10 scope)
- `src/lib/tenantClient.test.ts` — 2 runtime-behavior failures (Phase 29 scope)
- `src/pages/api/blob-serve.test.ts` — 2 failures (401 on null session, access:private); source changed to `access: "public"` in `353056c` post-Phase-07, test not updated

Also captured: 2 "Unhandled Rejection" warnings from `src/pages/api/rendering/generate.test.ts`
caused by the existing mock of `sanityWriteClient` not stubbing `.getDocument()`, which
is called in the catch-path of `processGeneration` added well before Phase 33. The tests
themselves all pass (11 passed, 11 todo); the warnings are mock-completeness issues in
the catch branch, not a test failure.

These pre-date Phase 33 and are out of Phase 33 scope per GSD scope boundary rule.
