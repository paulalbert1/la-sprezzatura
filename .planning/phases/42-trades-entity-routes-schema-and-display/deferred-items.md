# Phase 42 Deferred Items

## Pre-existing astro check errors (out of scope for Plan 01)

`npx astro check` during Plan 01 verification reported 39 errors in files NOT modified by this plan. None originate in contractor.ts, siteSettings.ts, queries.ts, api/admin/contractors.ts, or relationshipLabel.ts.

Affected files (carried from prior phases):
- src/components/admin/ScheduleEditor.tsx (GanttTask types)
- src/components/layout/Header.astro (null checks)
- src/components/layout/MobileMenu.astro (null checks)
- src/components/portal/ArtifactApprovalForm.tsx (state type narrowing)
- src/components/portal/ContractorNoteForm.tsx (FormData shape)
- src/lib/geminiClient.ts (GenerateContentResponse typing)
- src/sanity/image.ts (missing @sanity/image-url types)
- src/sanity/queries.ts line 92 (unrelated portal query — NOT the contractor projections edited in this plan)
- src/pages/workorder/verify.astro (unused var warning)

These were present on `main` before Plan 01 began and are pre-existing tech debt. Per SCOPE BOUNDARY rule, not fixed here.
