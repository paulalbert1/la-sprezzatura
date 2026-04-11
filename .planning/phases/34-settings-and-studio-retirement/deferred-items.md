# Phase 34 Deferred Items

## Pre-existing test failures at base commit f6db5f7 (out of scope for Wave 0)

Captured during Plan 01 (Wave 0) execution on 2026-04-11. These 14 failures exist in files unrelated to Phase 34 Wave 0 (test stub creation only). Wave 0 does not touch any of the implementation files these tests target.

### Baseline confirmation

- Baseline before Wave 0: `14 failed | 599 passed | 79 todo (692)` across `6 failed | 39 passed | 12 skipped (57)` test files
- Post-Wave 0: `14 failed | 599 passed | 238 todo (851)` across `6 failed | 39 passed | 28 skipped (73)` test files
- Delta: `+0 failures, +0 passes, +159 todo, +16 skipped files` — zero regressions, all new signal is the stub grid

### Failing tests

| File | Failing tests | Likely cause |
|------|---------------|--------------|
| `src/lib/artifactUtils.test.ts` | 3 (contract/close-document/proposal badge style lookups) | Tailwind token rename between Phase 32 and f6db5f7 — tests expect old color names |
| `src/lib/formatCurrency.test.ts` | 3 (basic cent formatting) | Currency format library bump — likely `Intl.NumberFormat` locale drift |
| `src/lib/geminiClient.test.ts` | 1 (fetchAndEncodeImage blob path) | Test mock assumes an older Vercel Blob response shape |
| `src/lib/tenantClient.test.ts` | 2 (client factory + cache) | Phase 29 tenant config refactor — test fixture drift |
| `src/lib/gantt/ganttColors.test.ts` | 3 (CONTRACTOR_PALETTE indexing) | Palette constants renamed between Phase 28 and f6db5f7 |
| `src/pages/api/blob-serve.test.ts` | 2 (session 401 + access: private) | Phase 29/30 session refactor changed the 401 early-return path |

### Why not fixed in Wave 0

Per GSD deviation rules SCOPE BOUNDARY: "Only auto-fix issues DIRECTLY caused by the current task's changes." Wave 0 creates test stubs only — no implementation files touched. The 14 failing tests exist at the base commit before any Wave 0 change. Fixing them would require reading each implementation file, diagnosing a token-rename or signature drift, and patching — work that belongs to a separate hygiene pass.

### Recommended owner

These should be triaged in a dedicated "baseline test hygiene" task, ideally before Wave 1 starts so downstream waves inherit a green baseline. None of the failing files are in the Phase 34 blast radius, so Waves 1-3 do not need to block on this.

---

## Plan 02 (Wave 1) correction — missing bcryptjs dependency

During Plan 02 execution (2026-04-11) the full-suite run surfaced an additional pre-existing failure the Wave 0 accounting missed:

- `src/lib/adminAuth.test.ts` — 2 tests fail because `src/lib/adminAuth.ts:11` imports `bcryptjs` but the package is not declared in `package.json` and has never been installed. The test file runs `vi.resetModules()` + `await import("./adminAuth")` in `verifyAdminPassword runtime behavior`, which triggers Vite's module resolver and hits `Failed to load url bcryptjs`.

This is a pre-existing repo bug (admin login route is effectively broken outside dev), not caused by Plan 02 changes. The Wave 0 summary reports `14 failed` baseline but the actual baseline is `16 failed` once `adminAuth.test.ts`'s runtime-behavior block is counted. Plan 02 observed this undercount by running the full suite after its implementation commits landed — delta `+0 regressions, +44 new passes (admin/ui primitives + blob-upload + upload-sanity-image), -44 todo`.

**Plan 02 does NOT fix `bcryptjs` because:**
1. `src/lib/adminAuth.ts` is outside the Plan 02 blast radius (Plan 02 scope: admin/ui primitives + upload routes + ENGAGEMENT_LABELS extraction)
2. Installing `bcryptjs` + `@types/bcryptjs` would be a Rule 3 auto-fix only if Plan 02 work depended on it — it doesn't
3. Fixing it is identical baseline-hygiene work to the 6-file list above

**Recommended:** include `bcryptjs` in the same baseline hygiene task (`npm install bcryptjs @types/bcryptjs`, verify adminAuth tests pass, no code changes needed in adminAuth.ts).

## Plan 02 non-scope note — pre-existing tsc errors in unrelated files

Running `npx tsc --noEmit` surfaces ~20 errors in these files that predate Plan 02 and are outside its scope:

- `src/components/admin/ScheduleEditor.tsx` (3 errors — GanttTask shape drift)
- `src/components/portal/ArtifactApprovalForm.tsx` (2 errors — state type narrowing)
- `src/lib/adminAuth.ts` (1 error — bcryptjs import)
- `src/lib/gantt/ganttTransforms.ts` + `ganttTypes.ts` + `ganttTransforms.test.ts` (12 errors — GanttTask array vs object confusion)
- `src/lib/geminiClient.ts` (1 error — Gemini SDK Candidate type drift)

`npx astro check` adds ~140 more errors, almost all inside `src/sanity/components/rendering/**` and `src/sanity/schemas/project.ts` — Studio-side code slated for deletion in Phase 34 Plan 07 (studio-removal). Plan 02 does not touch any of these files; the errors are captured here only to make the baseline state explicit for downstream waves.
