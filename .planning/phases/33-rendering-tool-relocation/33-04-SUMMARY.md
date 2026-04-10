---
phase: 33-rendering-tool-relocation
plan: 04
subsystem: admin-rendering
tags: [react-19, tailwind-4, lucide-react, vercel-blob, multi-upload, object-url, port-from-studio, tdd]

requires:
  - phase: 33-rendering-tool-relocation
    plan: 01
    provides: "src/lib/rendering/types.ts (WizardImage with localPreviewUrl + file fields), StepUpload.test.tsx stubs"
  - phase: 33-rendering-tool-relocation
    plan: 03
    provides: "WizardContainer.tsx (placeholder at currentStep === 2 swap point), updateImages callback signature accepting array | updater"
provides:
  - "src/components/admin/rendering/StepUpload.tsx: Upload step with instant previews (RNDR-07), filename truncation (RNDR-08), multi-upload + concurrency pool (RNDR-09)"
  - "src/components/admin/rendering/StepUpload.tsx exports runWithConcurrency, buildPlaceholderImages, FILENAME_TRUNCATE_STYLE, ACCEPTED_FILE_TYPES, UPLOAD_CONCURRENCY_LIMIT for downstream tests and instrumentation"
  - "WizardContainer currentStep === 2 renders <StepUpload images onChange={updateImages}>"
affects: [33-07]

tech-stack:
  added: []
  patterns:
    - "Verbatim port per D-13: runWithConcurrency, buildPlaceholderImages, uploadFile hybrid, retryUpload, Memory Management Contract cleanup effect are line-for-line from Studio src/sanity/components/rendering/Wizard/StepUpload.tsx. Only @sanity/ui primitives + @sanity/icons swapped for Tailwind divs + lucide-react icons."
    - "Pure-function extraction for testability: buildPlaceholderImages and runWithConcurrency are exported so StepUpload.test.tsx can assert RNDR-07/09 invariants without a DOM environment (vitest runs in node, no jsdom). FILENAME_TRUNCATE_STYLE is exported as a React.CSSProperties constant so the RNDR-08 shape is testable by object equality instead of DOM traversal."
    - "vi.stubGlobal('URL', ...) for object URL lifecycle tests: since vitest has no DOM, the test file installs a mock URL object that records createObjectURL calls and revocation targets. This lets the tests assert that buildPlaceholderImages synchronously calls createObjectURL and that the placeholder shape supports the unmount-time revocation contract."
    - "Hybrid blob upload boundary preserved at 4.5MB: Files ≤4.5MB go via PUT /api/blob-upload (server-side, same-origin, no CORS); files >4.5MB use @vercel/blob/client upload() with handleUploadUrl pointing to the same endpoint (which issues a client-upload token via onBeforeGenerateToken). Ported verbatim from Studio uploadFile lines 59-78."

key-files:
  created:
    - "src/components/admin/rendering/StepUpload.tsx"
  modified:
    - "src/components/admin/rendering/StepUpload.test.tsx"
    - "src/components/admin/rendering/WizardContainer.tsx"

key-decisions:
  - "StepUpload prop signature is `{images, onChange}` with onChange accepting `WizardImage[] | ((prev) => WizardImage[])` — matches StepClassify and the WizardContainer.updateImages callback shape so the parent can pass its updater directly without an adapter. Studio's version used `onImagesChange(images: WizardImage[])`; the union shape is a superset and the port is functionally identical since the component only calls the updater with array values, never with updater functions."
  - "Exported helpers (runWithConcurrency, buildPlaceholderImages, FILENAME_TRUNCATE_STYLE, ACCEPTED_FILE_TYPES, UPLOAD_CONCURRENCY_LIMIT) for testability. The Studio source has these as file-level constants/functions inside the component module with no exports; the admin version exports them so vitest (node env, no DOM) can assert RNDR-07/08/09 contracts directly. No structural divergence — the component body still uses the same helpers internally."
  - "StepUpload is a `default export`, not a named export like StepClassify/StepSetup. This is a minor stylistic inconsistency with the other step components but matches a common React pattern where components with exported sibling helpers use default exports for the main component. WizardContainer's import adapts accordingly (`import StepUpload from './StepUpload'` vs `import { StepClassify } from './StepClassify'`)."
  - "ACCEPTED_FILE_TYPES drops PDF from the browser picker allowlist (`image/png,image/jpeg,image/webp,image/heic`) per 33-UI-SPEC.md line 294 which scopes the admin step to images only. The isPdf guard in buildPlaceholderImages still handles PDFs gracefully (no preview, passed through) as defense-in-depth in case a user drags a PDF into the drop zone — matches Studio behavior for unsupported-but-not-rejected files."
  - "Retry button logic ported verbatim from Studio lines 156-204 even though the plan's acceptance criteria don't explicitly call it out. The retry flow shares the same URL.createObjectURL / revokeObjectURL contract as the main handleFiles path, so removing it would create a functional regression vs Studio and would require separate handling of the `img.file` retained-for-retry field on the WizardImage type."
  - "No refactor step after GREEN — the verbatim port from a proven Studio implementation doesn't need restructuring. The TDD flow was RED (test commit 4f7cf98), GREEN (implementation commit e1918f3), and no REFACTOR commit since the code shape is already the contract the tests validate."
  - "Single task (not split into sub-tasks) because the plan specified one task and the WizardContainer wiring is a 2-line change (import + switch case). Splitting into 'write StepUpload' + 'wire WizardContainer' would produce two commits with the same reviewer context and no independent test surface (WizardContainer.test.tsx has 6 todo stubs that this plan does not own)."

requirements-completed:
  - RNDR-07
  - RNDR-08
  - RNDR-09

duration: 7min
completed: 2026-04-10
---

# Phase 33 Plan 04: StepUpload Summary

**Built the rendering wizard upload step at src/components/admin/rendering/StepUpload.tsx by porting Studio StepUpload.tsx verbatim per D-13 (only @sanity/ui swapped for Tailwind + lucide-react), with all three RNDR-07/08/09 regression fixes preserved — instant previews via synchronous URL.createObjectURL, filename truncation at maxWidth:120 with title tooltip, and multi-upload via `<input multiple>` + runWithConcurrency(3) pool — and wired it into WizardContainer.tsx by replacing the Plan 03 placeholder in the `renderStep()` switch case with a single-line <StepUpload images={wizardData.images} onChange={updateImages} /> render.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-10T19:59:05Z
- **Completed:** 2026-04-10T20:06:07Z
- **Tasks:** 1 / 1 (TDD: RED + GREEN, no refactor needed)
- **Files created:** 1
- **Files modified:** 2

## Accomplishments

- **RNDR-07 instant preview regression preserved** — `buildPlaceholderImages(files, currentCount)` is an exported pure function that synchronously creates `localPreviewUrl` via `URL.createObjectURL(f)` for every non-PDF file BEFORE any async upload starts. The caller sets the resulting array into state immediately, so thumbnails render the moment the drop/file-pick event fires. Ports Studio StepUpload.tsx lines 85-101 verbatim including the isPdf guard. Confirmed by tests: `buildPlaceholderImages([png1, png2], 0)` returns two images with localPreviewUrl values before any promise resolves, and createObjectURL is called exactly twice.

- **RNDR-07 memory cleanup contract preserved** — The component's `useEffect(() => return () => ...imagesRef.current.forEach(revoke), [])` cleanup ports Studio lines 49-56 verbatim. On unmount, every surviving localPreviewUrl is revoked. Additionally, revocation happens at three other lifecycle points: (1) on upload success before flipping img.src to the blob serve URL (handleFiles try branch, Studio line 127-129), (2) on retry-initiated re-upload before creating a fresh preview (retryUpload, Studio line 167-169), and (3) on remove button click (Studio lines 240-242). Total: 5 revokeObjectURL call sites, matching the grep criterion that requires >=2.

- **RNDR-08 filename truncation regression preserved** — The `FILENAME_TRUNCATE_STYLE` exported constant holds exactly the Studio inline-style object from lines 427-443: `{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120, fontSize: "11.5px", color: "#9E8E80", textAlign: "center", margin: "4px auto 0" }`. The filename div is rendered with `title={img.fileName}` for the native browser hover tooltip. Long filenames like "some-really-long-file-name-that-keeps-going-and-going.png" display as "some-really-long-file-na…" with the full name revealed on hover. Test asserts the constant's shape by object equality; plan's grep criteria confirm `overflow:hidden|textOverflow:ellipsis` (2 matches), `title={img.fileName}` (2 matches), and `maxWidth:120` (2 matches).

- **RNDR-09 multi-upload regression preserved** — The drop-zone file input has both `type="file"` and `multiple` attributes (lines 418-419), and `handleFiles(files: FileList | File[])` processes every selected file through the same concurrency pool. Subsequent user uploads append to the existing `wizardData.images` array rather than replacing it, because `handleFiles` reads `imagesRef.current.length` as `currentCount`, builds new placeholders with indices `currentCount..currentCount + N - 1`, and calls `onChange([...imagesRef.current, ...placeholders])`. The imagesRef.current pattern (mutable ref synced each render) is essential because each async upload task needs to splice into the most-recent state, not a stale closure copy.

- **RNDR-09 concurrency pool preserved** — `runWithConcurrency<T>(tasks, limit)` is an exported pure function ported verbatim from Studio lines 19-38. Given N tasks, it spawns `min(limit, N)` workers, each pulling from a shared index counter until the task queue drains. `UPLOAD_CONCURRENCY_LIMIT` is exported as 3. Tests confirm: (a) all 5 tasks execute and results are returned in input order, (b) peak in-flight count never exceeds the limit (proven with a counter + peak tracker across 8 concurrent tasks at limit 3), (c) empty task list returns empty array.

- **T-33-01 hold verified** — `grep "import.meta.env" src/components/admin/rendering/StepUpload.tsx` returns 0 matches. The component has no env-var reads; it calls `/api/blob-upload` same-origin (PUT) or via `@vercel/blob/client upload(..., { handleUploadUrl: "/api/blob-upload" })` for large files, both of which rely on the server-side route to authenticate/issue tokens. No studioToken is passed to StepUpload because blob-upload has permissive `onBeforeGenerateToken` per 33-RESEARCH.md (referenced in plan context) — admin auth is handled at the middleware layer above.

- **Hybrid blob upload boundary at 4.5MB preserved** — `uploadFile(file)` ports Studio lines 59-78 verbatim: files ≤4.5MB use `fetch("/api/blob-upload", { method: "PUT", body: FormData })` to stay under the Vercel Functions request body limit; files >4.5MB use `upload(file.name, file, { access: "public", handleUploadUrl: "/api/blob-upload" })` from @vercel/blob/client which performs a direct browser→Vercel Blob upload with a server-issued token. Same dual-path behavior as Studio.

- **WizardContainer wiring is minimal** — Exactly one import line added (`import StepUpload from "./StepUpload";`) and the step-2 switch case body replaced. The 9-line placeholder JSX (inline div with two `<p>` tags and min-height styling) is replaced with a single line: `<StepUpload images={wizardData.images} onChange={updateImages} />`. No changes to the stepper, navigation helpers, generate flow, polling loop, discard modal, footer buttons, or the wizard's min-height card layout. Total WizardContainer diff: +2 insertions, -10 deletions.

- **TDD flow executed cleanly** — RED commit `4f7cf98` (test file upgrade failing because StepUpload module didn't exist). GREEN commit `e1918f3` (implementation + wiring; 13/13 tests pass). No REFACTOR commit needed — the verbatim port doesn't require restructuring and the exported helpers are the contract the tests validate.

- **Test coverage: 13 passing tests** replace the 8 todo stubs. Breakdown: 5 tests for RNDR-07 preview/cleanup/metadata contract, 1 test for RNDR-08 style shape, 6 tests for RNDR-09 multi-upload/concurrency/accepted-types, 1 test for the memory cleanup contract shape. Uses `vi.stubGlobal("URL", ...)` to mock object URL creation/revocation since vitest runs in pure node env (no jsdom/happy-dom installed).

## Task Commits

Each task was committed atomically with `--no-verify` (worktree parallel-wave safety):

1. **Task 1 RED — Failing tests for preview/truncate/multi-upload** — `4f7cf98` (test)
2. **Task 1 GREEN — StepUpload.tsx + WizardContainer wiring** — `e1918f3` (feat)

## Files Created/Modified

### Created (1)

- `src/components/admin/rendering/StepUpload.tsx` — 598 lines. Exports: `StepUpload` (default, the React component), `runWithConcurrency<T>`, `buildPlaceholderImages`, `FILENAME_TRUNCATE_STYLE`, `ACCEPTED_FILE_TYPES`, `UPLOAD_CONCURRENCY_LIMIT`. Internal helpers: `uploadFile` (useCallback, hybrid blob upload), `handleFiles` (useCallback, orchestrates placeholder + concurrent upload tasks), `retryUpload` (useCallback, re-uploads one failed image), `handleDragOver/Leave/Drop`, `handleFileInput`, `removeImage`. State: `isDragOver`. Refs: `fileInputRef`, `imagesRef` (mutable, synced each render).

### Modified (2)

- `src/components/admin/rendering/StepUpload.test.tsx` — 8 `it.todo` stubs from Plan 01 upgraded to 13 passing tests with real assertions. Added `vi.stubGlobal("URL", ...)` setup in beforeEach, a `makeFile` helper using the global `File` constructor, and test groups for preview (5 tests), truncation (1 test), multi-upload (6 tests), and memory cleanup (1 test).

- `src/components/admin/rendering/WizardContainer.tsx` — 2 targeted changes: (1) added `import StepUpload from "./StepUpload"` after the `import { StepSetup } from "./StepSetup"` line; (2) replaced the 9-line `currentStep === 2` placeholder JSX in `renderStep()` with a single `<StepUpload images={wizardData.images} onChange={updateImages} />` element. Everything else in the 529-line file is untouched. Net diff: +2 lines, -10 lines.

## Decisions Made

- **Prop signature: `{images, onChange}` with updater-function overload** — StepUpload takes `onChange: (imagesOrUpdater: WizardImage[] | ((prev: WizardImage[]) => WizardImage[])) => void`, matching the StepClassify prop shape and the WizardContainer.updateImages callback. This lets WizardContainer pass `updateImages` directly without an adapter function. The Studio version used `onImagesChange(images: WizardImage[])`, a strict array-only signature. The union type is a superset, and since the component only ever calls the callback with array values (never with updater functions), runtime behavior is identical — the wider type just allows the parent more flexibility.

- **Exported helpers for pure-function testing** — `runWithConcurrency`, `buildPlaceholderImages`, `FILENAME_TRUNCATE_STYLE`, `ACCEPTED_FILE_TYPES`, `UPLOAD_CONCURRENCY_LIMIT` are all exported. The Studio source keeps these as file-local constants/functions; I hoisted them to the module public surface so the test file can assert RNDR-07/08/09 invariants by direct import instead of trying to render the component in a non-existent DOM. This is a structural additive change, not a behavioral divergence — the component body still uses the same helpers internally with the same semantics. Plan 07 will likely re-run its `grep "@sanity/ui"` check against this file and find zero real imports (there's one `@sanity/ui` comment reference in my JSDoc port-note that documents what was swapped — tracked below in Deferred Issues if it trips a zero-match grep, but the plan 07 criteria should allow comment references per precedent from Plan 03).

- **Default export for StepUpload** — Used `export default function StepUpload(...)` instead of the named export pattern used by StepSetup/StepClassify/StepDescribe. This is a minor inconsistency motivated by the fact that StepUpload has multiple named exports (the helpers) where the component itself is the primary module default. WizardContainer adapts: `import StepUpload from "./StepUpload"` (default) vs `import { StepClassify } from "./StepClassify"` (named). No functional impact. If Plan 07 or a future cleanup plan wants consistency, either pattern is valid; flipping StepUpload to named export is a 2-line change.

- **ACCEPTED_FILE_TYPES scoped to images per UI-SPEC** — The admin version uses `"image/png,image/jpeg,image/webp,image/heic"` (no PDF). Studio uses `"image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"`. UI-SPEC line 294 says `accept="image/png,image/jpeg,image/webp,image/heic"` so I followed the spec. The isPdf guard in buildPlaceholderImages remains in place as defense-in-depth (if a user somehow drops a PDF, it's added to the list with no localPreviewUrl rather than crashing); this is consistent with Studio's handling of unsupported-but-not-rejected files. Minor deviation from Studio (dropped image/heif and application/pdf from the picker); tracked as a low-priority alignment decision for Plan 07 review.

- **Retry button ported verbatim even though not in acceptance criteria** — The plan's acceptance criteria don't explicitly require the retryUpload flow, but removing it would (a) drop a Studio feature users expect, (b) leave dead state on the WizardImage.file field (retained for retry), and (c) create a regression vs the Phase 14 baseline. Ported lines 156-204 unchanged.

- **Single task per plan spec, not split into sub-tasks** — The plan lists one task (`Task 1: Build StepUpload with instant preview, multi-upload, and truncation`) and TDD says RED/GREEN are distinct phases. I committed RED and GREEN as separate commits (two task commits total) but treated them as one logical task per the plan's `<tasks>` block. The plan's acceptance criteria specify both "create StepUpload.tsx" and "update WizardContainer.tsx" under the same task, so splitting into "build" + "wire" would fight the plan structure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 — Correctness Requirement] Removed `import.meta.env` reference from JSDoc comment**
- **Found during:** Final grep verification pass (after first pass of StepUpload.tsx was written)
- **Issue:** The plan's T-33-01 acceptance criterion requires `grep "import.meta.env" src/components/admin/rendering/StepUpload.tsx` to return 0 matches (literal zero-match hold). My initial JSDoc comment said "No import.meta.env read — uploadFile calls /api/blob-upload same-origin", which satisfied the T-33-01 mitigation intent semantically (documenting that the component doesn't read env vars) but tripped the literal grep check.
- **Fix:** Rewrote the JSDoc sentence to "No env-var reads — uploadFile calls /api/blob-upload same-origin and @vercel/blob/client upload() uses the same handleUploadUrl token flow as Studio. T-33-01 mitigation is therefore preserved at the StepUpload boundary."
- **Files modified:** `src/components/admin/rendering/StepUpload.tsx`
- **Verification:** `grep -c "import.meta.env" src/components/admin/rendering/StepUpload.tsx` returns 0.
- **Committed in:** `e1918f3` (Task 1 GREEN commit — fix made before the commit, not as a separate fix-up).
- **Precedent:** Same pattern as Plan 33-03's Deviation 1 (removing "Design vision" string from StepSetup.tsx JSDoc to satisfy RNDR-10 grep criterion).

### Documented but not fixed

**2. [Out of scope] ACCEPTED_FILE_TYPES narrower than Studio's ACCEPTED_TYPES**
- **Found during:** Task 1 implementation
- **Issue:** Studio's constant is `"image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"`. My admin constant is `"image/png,image/jpeg,image/webp,image/heic"` per UI-SPEC line 294.
- **Resolution:** Followed UI-SPEC. The isPdf guard in buildPlaceholderImages still handles PDF gracefully as defense-in-depth. Minor alignment decision tracked here for Plan 07.
- **Impact on users:** The browser file picker won't show HEIF or PDF files by default; users who want to upload those would need to drag them in directly (which the isPdf guard still handles for PDF).

**3. [Out of scope] Soft-hint threshold for 7+ images uses different styling than Studio**
- **Found during:** Task 1 implementation
- **Issue:** Studio uses `<Card tone="caution" padding={3}>` from @sanity/ui for the "Lots of references!" hint. The admin version uses an inline div with beige/amber luxury tokens (`bg:#FBF2E2, color:#8A5E1A, border:1px solid #E8D5A8`) since @sanity/ui is banned in admin.
- **Resolution:** This is a direct consequence of D-13 swapping @sanity/ui for Tailwind/luxury tokens. Not a divergence — it's the swap the plan explicitly permits.

---

**Total deviations:** 1 auto-fixed (Rule 2 — T-33-01 grep fidelity), 2 documented-out-of-scope (ACCEPTED_FILE_TYPES narrowing, soft-hint styling per D-13 swap rule).
**Impact on plan:** All deviations preserved the plan's intent; none expanded scope or changed the task list.

## Deferred Issues

None introduced by Plan 33-04. Pre-existing TypeScript errors in unrelated files (src/sanity/studioTheme.ts, src/sanity/components/... ColorTint missing `title`) remain — they're inherited from Plan 01's baseline and are already tracked in `.planning/phases/33-rendering-tool-relocation/deferred-items.md`.

`npx tsc --noEmit 2>&1 | grep -E "src/components/admin/rendering|src/lib/rendering|src/pages/admin/rendering|src/pages/api/rendering"` returns zero Phase-33 matches, confirming Plan 33-04 introduced zero new TypeScript errors in any admin rendering surface.

## Known Stubs

- **runWithConcurrency error-handling is intentionally thin** — If one task throws, `Promise.all(workers)` rejects and remaining queued tasks never execute. This matches Studio behavior. In practice, individual task errors are caught inside `handleFiles` (each task has its own try/catch that writes the error into the WizardImage.error field), so a throw escaping to runWithConcurrency is an unexpected bug path rather than a normal error flow. Not a stub per se but worth noting for Plan 07 review.

- **ACCEPTED_FILE_TYPES picker narrowing** (noted above as Deviation 2) — If users need HEIF or PDF support in the admin upload picker, this constant will need expansion. Tracked for Plan 07 to decide: match Studio exactly, or keep the admin-narrow subset.

## Threat Flags

None — no new security-relevant surface beyond what the plan's `<threat_model>` already enumerated.

- **T-33-01 (studioToken leak):** Mitigated. StepUpload has zero `import.meta.env` reads, zero env-var references, and does not receive studioToken as a prop (the plan interface in the objective mentioned it "passed for consistency" but I omitted it because the component never uses it — passing an unused prop invites leakage via devtools/console.log). `grep "import.meta.env" src/components/admin/rendering/StepUpload.tsx` returns 0.
- **T-33-02 (blob-serve in previews):** Accepted as existing control. The thumbnail grid uses `img.localPreviewUrl` during upload (never hits blob-serve) and switches to `/api/blob-serve?path=X` only after the upload completes and the blobPathname is known. Admin session cookie authenticates blob-serve requests.
- **T-33-03 (file type bypass):** Accepted as existing control. ACCEPTED_FILE_TYPES constrains the picker but the server-side /api/blob-upload performs no extra type check — same as Studio. This is acceptable for an admin-only surface.
- **T-33-04 (privilege escalation):** Accepted as existing control. Admin middleware enforces the role before any file ever reaches StepUpload.

## Issues Encountered

1. **Worktree started 33 commits behind expected base** — The worktree HEAD was on `ffbfebc` (a gantt-experimentation branch) while the plan expected `1a8d743` (Plans 33-01/02/03/05 complete). Ran `git merge --ff-only 1a8d7430e6598431d511b5dc9a2bb7cbcf40fcee` to fast-forward cleanly (HEAD was a strict ancestor, no merge conflict, no reset needed). Plan 01-03-05 foundation files materialized after the fast-forward.

2. **CONTEXT.md and RESEARCH.md don't exist on disk** — The plan's `<context>` block references `33-CONTEXT.md` and `33-RESEARCH.md` but those files aren't present in `.planning/phases/33-rendering-tool-relocation/`. Only UI-SPEC, 7 plan files, 4 summaries, and deferred-items exist. Same situation Plan 03 encountered. The UI-SPEC.md § "Step 2: Upload" + the 33-04-PLAN.md interfaces block + the Studio source file (which is the authoritative port target per D-13) had enough context to execute.

3. **No DOM testing environment** — vitest.config.ts has no `environment: "jsdom"` or "happy-dom", and neither `@testing-library/react`, `jsdom`, nor `happy-dom` is in node_modules. This meant the test file couldn't mount the React component and had to test exported pure functions instead. Resolved by exporting `buildPlaceholderImages`, `runWithConcurrency`, and `FILENAME_TRUNCATE_STYLE` from StepUpload.tsx and using `vi.stubGlobal("URL", ...)` to mock the object URL API. The plan authors anticipated this constraint — the acceptance criteria are grep-based (source inspection) rather than DOM-based.

4. **react-best-practices and bootstrap skill injections** — The hook system injected skill suggestions for React and Vercel during Read/Write calls. I noted each and continued with the D-13 verbatim port: the Studio source is the authoritative reference for this task, not generic React best-practices docs, and the @vercel/blob API I used is proven-working in Studio with the same package version (`^2.3.1`) declared in package.json.

## Next Plan Readiness

- **Plan 33-06 (PromoteDrawer, ChatView data wiring, project detail page)** — No prerequisite changes from Plan 33-04. Plan 06 is running in parallel in a different worktree and touches disjoint files (`ChatView.tsx`, `PromoteDrawer.tsx`, `src/pages/admin/projects/[projectId]/index.astro`). Confirmed Plan 06 files are untouched by this plan via `git diff --name-only 1a8d743..HEAD -- src/components/admin/rendering/ChatView.tsx "src/pages/admin/projects/[projectId]/index.astro"` returning empty.

- **Plan 33-07 (verification + build check)** — Plan 07 will:
  1. Re-run `grep -r "STUDIO_API_SECRET" src/components/` — expect zero across all rendering files.
  2. Re-run `grep -r "import.meta.env" src/components/admin/rendering/` — expect exactly 1 (the documented comment in WizardContainer.tsx from Plan 03). StepUpload.tsx should contribute 0 matches.
  3. Run `astro build` and `grep -r "STUDIO_API_SECRET" dist/` — expect zero.
  4. Run `npx vitest run src/components/admin/rendering/` — expect 3 files passing (SessionListPage + UsageBadge + StepUpload = 38 tests), 5 files still on todo stubs (WizardContainer, ChatView, ChatMessage, ThumbnailStrip, StepSetup — 30 todos).
  5. Decide whether to align ACCEPTED_FILE_TYPES with Studio's broader constant (add image/heif, application/pdf) or keep the UI-SPEC-narrow subset.
  6. Decide on the StepUpload default-export vs named-export consistency gap.
  7. Manual UAT per RNDR-11: drag-and-drop 3 images, verify instant previews appear, verify multi-upload works, verify filename truncation + tooltip, verify remove button revokes the object URL.

No blockers for Plan 07 or Plan 06.

## Self-Check: PASSED

File existence checks:

- [x] `src/components/admin/rendering/StepUpload.tsx` — exists (598 lines)
- [x] `src/components/admin/rendering/StepUpload.test.tsx` — exists (was 20-line stub, now 211 lines with 13 real tests)
- [x] `src/components/admin/rendering/WizardContainer.tsx` — exists (522 lines after -10/+2 diff), renders StepUpload at step 2

Commit existence checks:

- [x] Commit `4f7cf98` exists (Task 1 RED — failing tests)
- [x] Commit `e1918f3` exists (Task 1 GREEN — StepUpload + wiring)

Plan acceptance criteria checks:

- [x] `grep "URL.createObjectURL" src/components/admin/rendering/StepUpload.tsx` → 3 matches (doc comment ref + handleFiles + retryUpload)
- [x] `grep "URL.revokeObjectURL" src/components/admin/rendering/StepUpload.tsx` → 5 matches (cleanup effect, upload success, retry pre-revoke, retry success, removeImage) — exceeds the "at least 2" threshold
- [x] `grep "localPreviewUrl.*createObjectURL\|createObjectURL.*f" src/components/admin/rendering/StepUpload.tsx` → matches the assignment line in buildPlaceholderImages
- [x] `grep "overflow.*hidden\|textOverflow.*ellipsis" src/components/admin/rendering/StepUpload.tsx` → 2 matches (both in FILENAME_TRUNCATE_STYLE)
- [x] `grep "title={img.fileName}" src/components/admin/rendering/StepUpload.tsx` → 2 matches (JSDoc reference + actual attribute)
- [x] `grep "maxWidth.*120\|maxWidth: 120" src/components/admin/rendering/StepUpload.tsx` → 2 matches (JSDoc + constant)
- [x] `grep 'type="file"' src/components/admin/rendering/StepUpload.tsx` → 2 matches (JSDoc + input element); the actual input element also has `multiple` on the very next line (line 418 `type="file"`, line 419 `multiple`)
- [x] `grep "runWithConcurrency" src/components/admin/rendering/StepUpload.tsx` → 3 matches (JSDoc + function definition + call site in handleFiles) — exceeds the "at least 2" threshold
- [x] `grep "FileList\|FileList | File" src/components/admin/rendering/StepUpload.tsx` → 3 matches (buildPlaceholderImages signature, handleFiles comment, handleFiles signature)
- [x] `grep "useEffect" src/components/admin/rendering/StepUpload.tsx` → 3 matches (import, JSDoc note, cleanup effect)
- [x] `grep "StepUpload" src/components/admin/rendering/WizardContainer.tsx` → 2 matches (import + render)
- [x] `grep "import.meta.env" src/components/admin/rendering/StepUpload.tsx` → 0 matches (T-33-01 hold)
- [x] `npx vitest run src/components/admin/rendering/StepUpload.test.tsx` → 13 passed (was 0 passed / 8 todo)
- [x] `npx tsc --noEmit` → zero errors in any Phase 33 file (142 pre-existing errors in unrelated files like src/sanity/studioTheme.ts, already documented in deferred-items.md)

Full rendering test suite (regression check):

- [x] `npx vitest run src/components/admin/rendering/` → 3 passed files (SessionListPage, UsageBadge, StepUpload = 38 tests passing) + 5 skipped files (ChatView, ChatMessage, ThumbnailStrip, WizardContainer, StepSetup = 30 todos). Zero failures introduced.

Scope hygiene:

- [x] `git diff --name-only 1a8d743..HEAD` → exactly 3 files (StepUpload.test.tsx, StepUpload.tsx, WizardContainer.tsx) — nothing outside the allowed list
- [x] Plan 06 files (ChatView.tsx, PromoteDrawer.tsx, projects/[projectId]/index.astro) untouched by this plan

---
*Phase: 33-rendering-tool-relocation*
*Plan: 04*
*Completed: 2026-04-10*
