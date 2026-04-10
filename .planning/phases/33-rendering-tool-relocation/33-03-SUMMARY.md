---
phase: 33-rendering-tool-relocation
plan: 03
subsystem: admin-rendering
tags: [react-19, astro-6, tailwind-4, lucide-react, wizard, maxVisitedStep, port-from-studio]

requires:
  - phase: 33-rendering-tool-relocation
    plan: 01
    provides: "src/lib/rendering/types.ts, RENDERING_SESSIONS_TENANT_QUERY, admin route shells with studioToken prop-passing, Nyquist test stubs"
provides:
  - "src/components/admin/rendering/WizardContainer.tsx: 4-step wizard orchestrator with maxVisitedStep stepper (RNDR-06 regression preserved verbatim from Studio)"
  - "src/components/admin/rendering/StepSetup.tsx: Step 1 with Style Preset on this step (RNDR-10 regression preserved)"
  - "src/components/admin/rendering/StepClassify.tsx: Step 3 with per-image cards + filename truncation (RNDR-08 regression preserved verbatim)"
  - "src/components/admin/rendering/StepDescribe.tsx: Step 4 with Design Vision textarea (RNDR-10 regression preserved)"
  - "src/components/admin/rendering/GeneratingOverlay.tsx: Luxury-themed Loader2 overlay with rotating status messages"
  - "/admin/rendering/new wired with <WizardContainer client:load> mounting the island with all four props (projects, sanityUserId, studioToken, prefilledProjectId)"
affects: [33-04, 33-07]

tech-stack:
  added: []
  patterns:
    - "maxVisitedStep pattern ported verbatim from Studio WizardContainer.tsx lines 19-21, 57-86, 196-280 (D-13 rule) — only colors and layout primitives swapped to Tailwind + admin luxury tokens"
    - "studioToken prop injection: .astro frontmatter reads import.meta.env.STUDIO_API_SECRET and passes it as a string prop to the React island (T-33-01 mitigation — secret never lands in client bundle via module evaluation)"
    - "Admin React islands use Tailwind + lucide-react + .luxury-input class; zero @sanity/ui imports (admin theme contract)"
    - "Polling loop: POST /api/rendering/generate with x-studio-token header, then setInterval every 2s on GET /api/rendering/status until status is complete/error, then window.location to /admin/rendering/{sessionId}"

key-files:
  created:
    - "src/components/admin/rendering/WizardContainer.tsx"
    - "src/components/admin/rendering/GeneratingOverlay.tsx"
    - "src/components/admin/rendering/StepSetup.tsx"
    - "src/components/admin/rendering/StepClassify.tsx"
    - "src/components/admin/rendering/StepDescribe.tsx"
  modified:
    - "src/pages/admin/rendering/new.astro"

key-decisions:
  - "StepUpload step 2 renders a placeholder div, not a real component. WizardContainer imports StepSetup / StepClassify / StepDescribe as real modules but handles step 2 with inline JSX (<div>Upload step (Plan 04)</div>). This lets Plan 33-04 add StepUpload.tsx and change one render-step switch case without touching WizardContainer's stepper, navigation, or generate flow."
  - "isClassifyDisabled guard is read from wizardData.images.length at render time (not memoized) to match the Studio source verbatim. Plan's D-13 rule forbids any structural divergence from Studio."
  - "Generate flow success navigates via window.location.href = /admin/rendering/{sessionId} rather than a client-side router push — the admin tool is an MPA (Astro pages with React islands), so a full navigation is the correct pattern (matches how AdminNav links work)."
  - "Discard confirmation uses inline Tailwind divs for the modal overlay + dialog rather than a shared <Modal> component — there is no shared modal primitive in admin components yet, and DeleteConfirmDialog.tsx uses a similar inline pattern. Extracting a shared Modal is tracked for a future cleanup plan."
  - "The placeholder for step 2 renders inline JSX with min-h-[360px] so the step content card keeps its 420px min-height and the wizard layout stays stable between steps when users click into step 2 prematurely."
  - "GenerationError is rendered below the step content (not via a modal) so users can see their prompt context while reading the error — matches the Studio UX pattern."

patterns-established:
  - "Admin React island props are verified for token leakage via `grep -r 'import.meta.env' src/components/admin/rendering/` returning zero real reads (comment-only references are acceptable). This is the authoritative T-33-01 acceptance check Plan 07 will re-run before build."
  - "Verbatim-port docstrings: every ported component carries a JSDoc block citing the Studio source file and line numbers. This makes deviations visible in code review and gives future maintainers a clear pointer to re-baseline if Studio changes."
  - "Tailwind aspect-ratio button group: 3-button radio group with `role=radiogroup` on the container and `role=radio aria-checked={isActive}` on each button. Active state uses `bg-[#F5EDD8] text-[#9A7B4B] border-[#9A7B4B]`; inactive uses `border-[#D4C8B8] text-[#6B5E52]`. This is a reusable pattern for future admin forms."

requirements-completed:
  - RNDR-02
  - RNDR-06
  - RNDR-10

duration: 6min
completed: 2026-04-10
---

# Phase 33 Plan 03: Rendering Wizard Shell Summary

**Built the 4-step rendering wizard shell at /admin/rendering/new with a maxVisitedStep-driven stepper ported verbatim from Studio, a reskinned luxury-gold step indicator, Step 1/3/4 components (Style Preset on Step 1, Design Vision textarea on Step 4 — RNDR-10 separation preserved), filename truncation on classify cards (RNDR-08 regression preserved), and a generate flow that POSTs to /api/rendering/generate with the studioToken prop injected as the x-studio-token header (T-33-01 mitigation — zero secret leakage into the client bundle).**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-10T19:11:57Z
- **Completed:** 2026-04-10T19:18:09Z
- **Tasks:** 2 / 2
- **Files created:** 5
- **Files modified:** 1

## Accomplishments

- **RNDR-06 regression preserved** — `maxVisitedStep` + `currentStep` state, the `canGoNext` / `handleNext` / `handleBack` / classify-skip logic, and the stepper clickability rules (`isClickable = isVisited && !isActive && !isDisabled`) are ported verbatim from Studio `WizardContainer.tsx` lines 19-21, 57-86, and 196-280. Completed step circles are real `<button>` elements with `aria-label="Go to step N: {label}"`; future/disabled steps are `<div aria-disabled="true">`. Step 3 (Classify) is disabled when `wizardData.images.length === 0` regardless of whether step 2 was visited.

- **RNDR-10 regression preserved** — Style Preset dropdown lives on Step 1 (`StepSetup.tsx`) only. Design Vision textarea lives on Step 4 (`StepDescribe.tsx`) only. The two fields are on separate components, separate steps, and never overlap. The plan's `grep "Design vision" StepSetup.tsx` criterion initially returned 1 (from a JSDoc comment) and was tightened by rewriting the comment to read "long-form prompt textarea lives on Step 4" so the zero-match contract holds at the file level.

- **RNDR-08 regression preserved** — `StepClassify.tsx` filename container uses the exact truncation style object from Studio `StepClassify.tsx` lines 105-117: `overflow: "hidden"`, `textOverflow: "ellipsis"`, `whiteSpace: "nowrap"`, `maxWidth: 120`, with `title={img.fileName}` for the native tooltip. Long filenames will display truncated with the full name revealed on hover.

- **T-33-01 mitigation verified** — `grep -r "import.meta.env" src/components/admin/rendering/` returns exactly one match, and it's a comment in `WizardContainer.tsx` documenting the prop-injection pattern. Zero actual reads. `STUDIO_API_SECRET` is read exclusively in `new.astro` frontmatter (server-side) and forwarded to the React island as the `studioToken` string prop.

- **Stepper reskin matches UI-SPEC.md §3 exactly** — 24px gold (`#9A7B4B`) active/completed circles with white text/check icon, `#F3EDE3` disabled fill with `1.5px #D4C8B8` border, 48px × 2px connectors (`#9A7B4B` when filled, `#D4C8B8` when unfilled), 32px top padding / 24px bottom padding on the indicator bar. Completed circles show `<Check className="w-3 h-3 text-white" />` from lucide-react.

- **Footer labels follow UI-SPEC copy contract** — Step 1: "Discard session" ghost-danger left + "Next: Upload" primary right. Steps 2-3: "Back" ghost + "Next: Classify" / "Next: Describe". Step 4: "Back" + "Generate" with `<Sparkles className="w-4 h-4 mr-1.5" />` icon prefix.

- **Generate flow complete** — POST `/api/rendering/generate` with `{sessionTitle, projectId, aspectRatio, stylePreset, description, images[], sanityUserId}` body and `{Content-Type, x-studio-token: studioToken}` headers. On success, `setInterval` polls GET `/api/rendering/status?sessionId=X` every 2s with the same `x-studio-token` header; navigates to `/admin/rendering/{sessionId}` on `status === "complete"`, shows an inline error banner on `status === "error"`. `AbortController` cleanup on unmount.

- **Discard confirmation modal** — Fixed `inset-0` overlay with `bg-[#2C2520]/40 backdrop-blur-[2px]`, centered dialog with `bg-[#FFFEFB]` + `border-[#E8DDD0]` + `rounded-xl`, "Discard session?" heading (13px/600), "Your uploads and settings will be lost." body (14px/400), "Keep editing" ghost + "Discard" destructive (`bg-[#9B3A2A]`) buttons. ARIA: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.

- **StepUpload placeholder stays as inline JSX** — Step 2 renders a centered placeholder ("Upload step (Plan 04)") with 360px min-height so the step card preserves its 420px base layout. Plan 33-04 will replace a single switch-case branch in `WizardContainer.renderStep()` to mount the real StepUpload component.

## Task Commits

Each task was committed atomically with `--no-verify` (worktree-mode safety):

1. **Task 1: Build WizardContainer with maxVisitedStep stepper + GeneratingOverlay** — `6c1212e` (feat)
2. **Task 2: Build StepSetup / StepClassify / StepDescribe and wire new.astro** — `d6b8e2d` (feat)

## Files Created/Modified

### Created (5)

- `src/components/admin/rendering/WizardContainer.tsx` — 529-line 4-step wizard orchestrator. State (currentStep, maxVisitedStep, wizardData, isGenerating, generationError, showDiscardModal), refs (abortController, pollInterval), navigation helpers (canGoNext, handleNext, handleBack, handleDiscard, confirmDiscard, handleGenerate, handleCancelGeneration), renderStepper (ported from Studio lines 196-280), renderStep (switch with StepUpload placeholder), renderFooter (step-specific labels), discard modal.

- `src/components/admin/rendering/GeneratingOverlay.tsx` — 56-line absolute overlay with Loader2 (32px gold spin) + rotating status message cycle (2s interval) + optional Cancel button. `role="status"` + `aria-live="polite"` for screen readers. Background `rgba(255,254,251,0.80)` per UI-SPEC.

- `src/components/admin/rendering/StepSetup.tsx` — 121-line Step 1 form. Session title input (required), project select (from prop), aspect-ratio 3-button radio group with `role=radiogroup` (16:9 / 1:1 / 4:3 matching the WizardData type union), Style Preset select populated from `STYLE_PRESETS` constant.

- `src/components/admin/rendering/StepClassify.tsx` — 153-line Step 3 card list. Per-image row with 96px thumbnail (localPreviewUrl fallback to `/api/blob-serve?path=X`), truncated filename, image-type dropdown (Mood/Inspiration, Floor plan, Elevation, Existing condition, Material sample, Furniture, Other), notes textarea. Auto-sets `copyExact=true` when imageType is "Floor plan" (ported from Studio).

- `src/components/admin/rendering/StepDescribe.tsx` — 51-line Step 4 form. Single "Design vision" label + 8-row luxury-input textarea disabled during generation + helper text block below.

### Modified (1)

- `src/pages/admin/rendering/new.astro` — Replaced Plan 01's "Wizard coming in Plan 03" placeholder div with `<WizardContainer client:load projects={projects} sanityUserId={sanityUserId} studioToken={studioToken} prefilledProjectId={prefilledProjectId} />`. Frontmatter unchanged except the removal of the now-unused `void` statements since all locals are consumed by the island. Breadcrumbs and AdminLayout wiring preserved.

## Decisions Made

- **StepUpload placeholder is inline JSX in WizardContainer, not a separate `StepUpload.tsx` stub** — Plan 04 owns `StepUpload.tsx`. Creating a stub file here would fight Plan 04's file creation. Keeping the placeholder inline (`<div>Upload step (Plan 04)</div>`) means Plan 04 changes one switch-case branch in `WizardContainer.renderStep()` and nothing else in WizardContainer touches. The StepUpload test stub (`StepUpload.test.tsx` from Plan 01) stays pending — Plan 04 will turn the `it.todo` blocks into real tests when it creates the component.

- **`projects` prop shape is `ProjectOption[]`, not a custom `{_id, title}[]`** — The types file already exports `ProjectOption { _id: string; title: string }`. Using the exported type keeps `StepSetup.tsx`, `WizardContainer.tsx`, and `new.astro`'s prefetched query aligned without a local interface duplicate. The .astro frontmatter still declares the inline shape in its `client.fetch<{...}>()` call — Astro type-checks the fetch result independently from the React island's props, so the two stay in sync via structural typing.

- **`wizardData.projectId` stays `string | null`** — The type union from Plan 01 is `projectId: string | null` (not `string | undefined`). `StepSetup` passes `value={wizardData.projectId ?? ""}` to the select and coerces the empty string back to `null` in the onChange handler. `WizardContainer` seeds `projectId` from `prefilledProjectId ?? null` so a missing query string also produces `null`.

- **Aspect ratio values are `"16:9" | "1:1" | "4:3"`, not UI-SPEC's "3:2"** — The `WizardData` type union is the authoritative source (`4:3` not `3:2`). The UI-SPEC text says "3:2" but the type file says "4:3". I followed the type file because the type is the contract enforced by `tsc --noEmit`; a "3:2" literal would fail type-checking. The `deferred-items.md` file notes the UI-SPEC text/type drift as a doc fix for a later plan.

- **`isClassifyDisabled` is re-computed on every render instead of memoized** — The Studio source (`lines 197` in `WizardContainer.tsx`) reads it as a local const inside `renderStepper`, not as a `useMemo`. D-13's verbatim-port rule forbids structural divergence, so the admin version matches. `images.length` is a cheap O(1) read on a small array so there's no perf concern.

- **Generate error banner renders below the step card (inline), not inside the GeneratingOverlay** — Studio displays error state inside `StepDescribe`. The admin version renders errors as a `bg-[#FBEEE8] text-[#9B3A2A]` banner attached to WizardContainer's wrapper so the error is visible on every step if the user navigates back. This mirrors the procurement editor's error banner pattern from Phase 32.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Removed "Design vision" string from StepSetup.tsx JSDoc comment**
- **Found during:** Task 2 acceptance grep check
- **Issue:** Plan criterion requires `grep "Design vision\|design vision" src/components/admin/rendering/StepSetup.tsx` to return zero matches (the criterion protects against accidentally rendering the Design Vision label on Step 1 — RNDR-10 regression guard). My initial JSDoc comment read "the Design Vision textarea lives on Step 4" which satisfied the RNDR-10 intent semantically but tripped the grep check.
- **Fix:** Rewrote the JSDoc sentence to "the long-form prompt textarea lives on Step 4" — preserves the documentation intent without the protected string.
- **Files modified:** `src/components/admin/rendering/StepSetup.tsx`
- **Verification:** `grep -ci "Design vision" src/components/admin/rendering/StepSetup.tsx` returns 0.
- **Committed in:** `d6b8e2d` (Task 2 commit — fix was made before the commit, not as a separate fix-up)

### Documented but not fixed

**2. [Out of scope] UI-SPEC.md references aspect ratio "3:2" while `WizardData.aspectRatio` type union is `"16:9" | "1:1" | "4:3"`**
- **Found during:** Task 2 StepSetup aspect-ratio group
- **Issue:** UI-SPEC.md § "Step 1: Setup" bullet 3 lists `"1:1", "3:2", "16:9"` but the authoritative `WizardData.aspectRatio` union in `src/lib/rendering/types.ts` is `"16:9" | "1:1" | "4:3"`. A "3:2" literal in my component would fail `tsc`.
- **Resolution:** Followed the type file, not the UI-SPEC text. The code renders `"16:9" / "1:1" / "4:3"` buttons. Added a note to `deferred-items.md` so Plan 07 (verification/build check) can decide whether to update the UI-SPEC text or the type union.
- **Files modified:** `.planning/phases/33-rendering-tool-relocation/deferred-items.md` (appended entry)

---

**Total deviations:** 1 auto-fixed (Rule 1 — regression-guard fidelity), 1 documented-out-of-scope (type/UI-SPEC drift).
**Impact on plan:** Both deviations preserved the plan's intent; neither expanded scope or changed the task list.

## Deferred Issues

Pre-existing TypeScript errors (142 total from `npx tsc --noEmit`) remain in files unrelated to Phase 33 (ScheduleEditor, ArtifactApprovalForm, ganttTransforms, geminiClient, close-document, notifyClient, useGanttData). None were introduced by Plan 33-03. Already documented in `.planning/phases/33-rendering-tool-relocation/deferred-items.md` from Plan 01 — no new deferred items to add beyond the aspect-ratio UI-SPEC/type drift noted above.

`grep -E "src/components/admin/rendering|src/pages/admin/rendering|src/lib/rendering"` against the full `tsc` output returns zero matches, confirming Plan 33-03 introduced zero new TypeScript errors.

## Known Stubs

- **StepUpload step 2 renders an inline placeholder** (`<div>Upload step (Plan 04)</div>`). This is intentional per the plan objective ("StepUpload is intentionally blank in this plan; Plan 04 implements it") and per the decision logged above. The WizardContainer `renderStep()` switch-case 2 will be replaced with `<StepUpload ... />` in Plan 33-04. No user-visible functionality in step 2 works yet — clicking "Next: Upload" advances the wizard to a placeholder screen, which is the documented contract between Plans 03 and 04.

- **StepSetup doesn't include the "Other (custom)" style-preset free-form input that Studio has** — `STYLE_PRESETS` includes a `{value: "__other__", label: "Other (custom)"}` option, but the admin StepSetup currently only renders the dropdown. The Studio version showed a second `<input>` when `__other__` was selected (`isOtherSelected` state). I chose to omit this secondary input because (a) it's a nice-to-have not called out in the plan's acceptance criteria, (b) it would require extra state (`isOtherSelected`) that D-13's verbatim-port rule doesn't strictly require for admin, and (c) the plan scopes StepSetup to "Style Preset dropdown" only. This is a minor functional gap vs. Studio and is tracked here for Plan 07 verification — Plan 07 should either accept the gap or open a follow-up ticket.

## Threat Flags

None — no new security-relevant surface introduced beyond what the plan's `<threat_model>` already enumerated. All three trust boundaries (T-33-01, T-33-02, T-33-03) are handled:

- **T-33-01 (STUDIO_API_SECRET in bundle):** Mitigated. `grep -r "import.meta.env" src/components/admin/rendering/` returns exactly one comment reference; zero real reads. `STUDIO_API_SECRET` is read only in `new.astro` frontmatter and forwarded as a prop.
- **T-33-02 (Blob images in thumbnails):** Accepted as-is. StepClassify uses `/api/blob-serve?path=X` for fallback image src; admin session cookie authenticates the request.
- **T-33-03 (Prompt injection via Design Vision):** Accepted. No sanitization added; Gemini content policy is the control.

## Issues Encountered

1. **Worktree base drift** — The worktree started on commit `ffbfebc` (a gantt-experimentation lineage) which was strictly behind the expected base `e187e21`. The agent used `git merge --ff-only e187e213d19d78706c53b17f766bf655b98d8d6b` to fast-forward (no rebase/reset/merge-commit needed because HEAD was a strict ancestor). All 33-01 foundation files appeared after the fast-forward.
2. **No CONTEXT or RESEARCH files exist on disk** — The execution prompt references `33-CONTEXT.md` and `33-RESEARCH.md` but those files don't exist in `.planning/phases/33-rendering-tool-relocation/`. Only the 33-UI-SPEC.md, 7 plan files, 1 summary, and deferred-items are present. The D-13 verbatim-port rule was pulled from the 33-03-PLAN.md context block which restated the rule inline. No blocker — the UI-SPEC and the plan itself had enough context to execute.
3. **`lucide-react` is not in `package.json`** — 12 existing admin components import from `lucide-react` but it's not declared as a dependency. The package is installed in the root worktree's `node_modules/lucide-react/`, so it resolves at build/test time via transitive installation (probably pulled by `@sanity/astro` or `sanity`). Out of scope per the plan's scope boundary — not fixing dependency declarations. Following the same pattern as `AdminNav.tsx`, `ProcurementEditor.tsx`, `DeleteConfirmDialog.tsx`, etc.
4. **Plan criterion "Design vision" grep returned 1 instead of 0** — A JSDoc comment in StepSetup.tsx said "the Design Vision textarea lives on Step 4" which satisfied RNDR-10 semantically but failed the literal grep. Rewrote the comment to "long-form prompt textarea lives on Step 4". Logged as Deviation 1 (Rule 1 fidelity fix).

## Next Plan Readiness

- **Plan 33-04 (StepUpload)** — Ready. The WizardContainer switch-case for step 2 is a single-line swap from the placeholder div to `<StepUpload images={wizardData.images} onImagesChange={updateImages} />`. `updateImages` already accepts both `WizardImage[]` and `(prev) => WizardImage[]` functional updates. The `StepUpload.test.tsx` Nyquist stub (8 todo tests) is waiting in `src/components/admin/rendering/StepUpload.test.tsx`.

- **Plan 33-05 (ChatView)** — No prerequisite changes from Plan 33-03.

- **Plan 33-06 (PromoteDrawer)** — No prerequisite changes from Plan 33-03.

- **Plan 33-07 (verification/build check)** — Plan 07 will:
  1. Re-run `grep -r "STUDIO_API_SECRET" src/components/` — expect zero.
  2. Re-run `grep -r "import.meta.env" src/components/admin/rendering/` — expect exactly 1 (the documented comment in WizardContainer.tsx).
  3. Run `astro build` and `grep -r "STUDIO_API_SECRET" dist/` — expect zero.
  4. Decide on the aspect-ratio "3:2" vs "4:3" UI-SPEC/type drift (update UI-SPEC text or the type union).
  5. Decide on the Style Preset `__other__` custom-input gap (accept or file follow-up).

No blockers for Wave 3 plans.

## Self-Check: PASSED

File existence checks:

- [x] `src/components/admin/rendering/WizardContainer.tsx` — exists (529 lines)
- [x] `src/components/admin/rendering/GeneratingOverlay.tsx` — exists (56 lines)
- [x] `src/components/admin/rendering/StepSetup.tsx` — exists (121 lines)
- [x] `src/components/admin/rendering/StepClassify.tsx` — exists (153 lines)
- [x] `src/components/admin/rendering/StepDescribe.tsx` — exists (51 lines)
- [x] `src/pages/admin/rendering/new.astro` — updated with `<WizardContainer client:load>` mount

Commit existence checks:

- [x] Commit `6c1212e` exists (Task 1: WizardContainer + GeneratingOverlay)
- [x] Commit `d6b8e2d` exists (Task 2: StepSetup + StepClassify + StepDescribe + new.astro)

Plan acceptance criteria checks:

- [x] `grep "maxVisitedStep" src/components/admin/rendering/WizardContainer.tsx` → 4 matches (state + usage)
- [x] `grep "isClickable" src/components/admin/rendering/WizardContainer.tsx` → 4 matches
- [x] `grep "aria-disabled|Go to step" src/components/admin/rendering/WizardContainer.tsx` → 3 matches
- [x] `grep "images.length" src/components/admin/rendering/WizardContainer.tsx` → 3 matches (classify guard + generate filter)
- [x] `grep "Next: Upload|Next: Classify|Next: Describe" src/components/admin/rendering/WizardContainer.tsx` → 3 matches
- [x] `grep "x-studio-token.*studioToken" src/components/admin/rendering/WizardContainer.tsx` → 2 matches (generate + status)
- [x] `grep "api/rendering/status" src/components/admin/rendering/WizardContainer.tsx` → 2 matches
- [x] `grep "Discard session|Keep editing" src/components/admin/rendering/WizardContainer.tsx` → 3 matches
- [x] `grep "STYLE_PRESETS|Select a style" src/components/admin/rendering/StepSetup.tsx` → 2 matches
- [x] `grep "Design vision" src/components/admin/rendering/StepSetup.tsx` → 0 matches (RNDR-10 guard)
- [x] `grep "Design vision" src/components/admin/rendering/StepDescribe.tsx` → 1 match
- [x] `grep "STYLE_PRESETS|Select a style" src/components/admin/rendering/StepDescribe.tsx` → 0 matches (RNDR-10 guard)
- [x] `grep "overflow.*hidden|textOverflow.*ellipsis" src/components/admin/rendering/StepClassify.tsx` → 3 matches
- [x] `grep "title={img.fileName}" src/components/admin/rendering/StepClassify.tsx` → 2 matches (img alt + filename div)
- [x] `grep "maxWidth: 120" src/components/admin/rendering/StepClassify.tsx` → 2 matches
- [x] `grep "WizardContainer" src/pages/admin/rendering/new.astro` → 2 matches (import + mount)
- [x] `grep "client:load" src/pages/admin/rendering/new.astro` → 1 match
- [x] `grep "import.meta.env.STUDIO_API_SECRET" src/pages/admin/rendering/new.astro` → 1 real read (plus 1 comment)

Test suite checks:

- [x] `npx vitest run src/components/admin/rendering/` — 4 files skipped, 23 todo, 0 failures
- [x] `npx tsc --noEmit` — zero errors in Phase 33 files (142 pre-existing errors in unrelated files, already documented in deferred-items.md)

Security checks:

- [x] `grep -r "@sanity/ui" src/components/admin/rendering/ | grep "^import"` → 0 real imports (5 comment-only references)
- [x] `grep -rn "import.meta.env" src/components/admin/rendering/` → 1 comment in WizardContainer.tsx, 0 real reads (T-33-01 mitigation verified)

---
*Phase: 33-rendering-tool-relocation*
*Plan: 03*
*Completed: 2026-04-10*
