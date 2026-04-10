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
