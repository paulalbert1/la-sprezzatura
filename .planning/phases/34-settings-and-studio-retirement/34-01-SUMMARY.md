---
phase: 34
plan: 01
slug: wave0-test-stubs
subsystem: testing-infrastructure
tags: [vitest, nyquist, tdd, test-stubs]
requires:
  - vitest.config.ts include glob covers *.test.ts + *.test.tsx (Phase 33 d8d6301)
  - src/lib/session.ts SessionData shape
  - src/lib/renderingAuth.ts buildUsageDocId signature
  - src/lib/generateToken.ts generatePortalToken signature
provides:
  - Nyquist Wave 0 sampling grid for Phase 34 (159 new it.todo stubs across 20 files)
  - Per-task verification contract for Plans 02-07
  - wave_0_complete: true gate flip in 34-VALIDATION.md (main worktree)
affects:
  - src/components/admin/ui/* (4 new stub files)
  - src/components/admin/settings/* (2 new stub files)
  - src/components/admin/SendUpdateModal.test.tsx, RegenerateLinkDialog.test.tsx (2 new stub files)
  - src/lib/sendUpdate/* (1 new stub file)
  - src/lib/portal/* (1 new stub file)
  - src/pages/api/send-update* (2 new stub files)
  - src/pages/api/admin/* (3 new stub files)
  - src/pages/api/blob-upload.test.ts (1 new stub file)
  - src/middleware.test.ts (extended +14 it.todo)
  - src/sanity/schemas/client.test.ts (extended +4 it.todo)
  - src/lib/renderingAuth.test.ts (extended +5 it.todo)
  - src/lib/generateToken.test.ts (extended +2 it.todo)
tech_stack:
  added: []
  patterns:
    - "Nyquist Wave 0: stub grid landed BEFORE implementation waves"
    - "it.todo over it.skip so tests count as pending, never fail the suite"
    - "Extended existing test files with new describe blocks rather than overwriting"
key_files:
  created:
    - src/components/admin/ui/AdminModal.test.tsx
    - src/components/admin/ui/AdminToast.test.tsx
    - src/components/admin/ui/CollapsibleSection.test.tsx
    - src/components/admin/ui/TagInput.test.tsx
    - src/components/admin/settings/SettingsPage.test.tsx
    - src/components/admin/settings/HeroSlideshowEditor.test.tsx
    - src/components/admin/SendUpdateModal.test.tsx
    - src/components/admin/RegenerateLinkDialog.test.tsx
    - src/lib/sendUpdate/emailTemplate.test.ts
    - src/lib/portal/clientDashboard.test.ts
    - src/pages/api/send-update.test.ts
    - src/pages/api/send-update/preview.test.ts
    - src/pages/api/admin/site-settings.test.ts
    - src/pages/api/admin/upload-sanity-image.test.ts
    - src/pages/api/admin/clients.test.ts
    - src/pages/api/blob-upload.test.ts
  modified:
    - src/middleware.test.ts
    - src/sanity/schemas/client.test.ts
    - src/lib/renderingAuth.test.ts
    - src/lib/generateToken.test.ts
    - .planning/phases/34-settings-and-studio-retirement/34-VALIDATION.md (main worktree only — .planning is gitignored)
decisions:
  - "Test stubs use it.todo (not it.skip) so downstream implementation clearly sees 'pending expected' vs 'explicitly disabled'"
  - "Extended client.test.ts, middleware.test.ts, renderingAuth.test.ts, generateToken.test.ts rather than overwriting — preserves existing tests while adding Wave 0 stubs"
  - "Reused existing VALIDATION.md task ID table — the planner already populated real task IDs (34-02-01..34-07-03), so only the frontmatter gate (wave_0_complete: true) needed flipping, not the table rewrite"
  - "Pre-existing 14 test failures at base commit are out of scope (SCOPE BOUNDARY rule) — logged to deferred-items.md for a separate hygiene pass"
metrics:
  duration_minutes: 18
  tasks_completed: 3
  files_created: 16
  files_modified: 4
  lines_added: 347
  it_todo_added: 159
  commits: 2
  completed_date: 2026-04-11
---

# Phase 34 Plan 01: Wave 0 Test Stubs Summary

Seeded 159 `it.todo` stubs across 20 test files as the Nyquist sampling grid for Phase 34 Settings and Studio Retirement — every Phase 34 implementation task (Plans 02-07) now has a waiting test file on disk, and the Wave 0 gate `wave_0_complete: true` is flipped in 34-VALIDATION.md.

## What Shipped

### Stub grid (16 new files)

**React component stubs (8 files, 64 it.todo — Task 1)**

| File | it.todo | Implementation plan |
|------|---------|---------------------|
| `src/components/admin/ui/AdminModal.test.tsx` | 10 | Plan 02 (foundation-primitives) |
| `src/components/admin/ui/AdminToast.test.tsx` | 8 | Plan 02 |
| `src/components/admin/ui/CollapsibleSection.test.tsx` | 6 | Plan 02 |
| `src/components/admin/ui/TagInput.test.tsx` | 8 | Plan 02 |
| `src/components/admin/settings/SettingsPage.test.tsx` | 6 | Plan 03 (settings-surface) |
| `src/components/admin/settings/HeroSlideshowEditor.test.tsx` | 8 | Plan 03 |
| `src/components/admin/SendUpdateModal.test.tsx` | 12 | Plan 04 (send-update-surface) |
| `src/components/admin/RegenerateLinkDialog.test.tsx` | 6 | Plan 05 (per-client-purl) |

**API / lib / middleware / schema stubs (8 new files, 70 it.todo — Task 2)**

| File | it.todo | Implementation plan |
|------|---------|---------------------|
| `src/lib/sendUpdate/emailTemplate.test.ts` | 10 | Plan 04 |
| `src/pages/api/send-update.test.ts` | 12 | Plan 04 |
| `src/pages/api/send-update/preview.test.ts` | 8 | Plan 04 |
| `src/pages/api/admin/site-settings.test.ts` | 14 | Plan 03 |
| `src/pages/api/admin/upload-sanity-image.test.ts` | 6 | Plan 02 |
| `src/pages/api/admin/clients.test.ts` | 6 | Plan 05 |
| `src/pages/api/blob-upload.test.ts` | 6 | Plan 02 (KR-3 backfill) |
| `src/lib/portal/clientDashboard.test.ts` | 8 | Plan 06 (client-dashboard) |

### Extended test files (4, +25 it.todo)

| File | New it.todo | Extension reason |
|------|-------------|-------------------|
| `src/middleware.test.ts` | +14 (new "PURL session middleware" describe block) | Existing file has 25 passing tests for Phase 29 auth — preserved, appended Wave 0 PURL stubs |
| `src/sanity/schemas/client.test.ts` | +4 (new "portalToken field" describe block) | Existing file has 7 passing schema tests — preserved, appended portalToken stubs |
| `src/lib/renderingAuth.test.ts` | +5 (new "excludedUsers edge cases" describe block) | Existing file has 16 passing tests for validateRenderingAuth/checkUsageQuota — preserved, appended case-normalization + unicode stubs |
| `src/lib/generateToken.test.ts` | +2 (new "generatePortalToken length" describe block) | Existing file has 4 passing tests — preserved, appended exact-length + alphabet-charset stubs |

### Validation gate (main worktree only)

`.planning/phases/34-settings-and-studio-retirement/34-VALIDATION.md` frontmatter flipped in the main worktree:
- `wave_0_complete: false` → `wave_0_complete: true`
- Sign-off checklist item for `wave_0_complete` ticked to `[x]`

This file is gitignored in the la-sprezzatura repo (`.gitignore:21 .planning/`), so the flip is not part of the branch commit. The main worktree persists the flip for the orchestrator and downstream waves to read.

## Verification

### Task 1 verify (React stubs)

```
npx vitest run src/components/admin/ui src/components/admin/settings \
  src/components/admin/SendUpdateModal.test.tsx src/components/admin/RegenerateLinkDialog.test.tsx
→ Test Files  8 skipped (8)
→ Tests  64 todo (64)
→ 0 failures, 0 passing tests (by design — every stub is todo)
```

### Task 2 verify (API/lib/schema stubs)

```
npx vitest run src/lib/sendUpdate src/pages/api/send-update \
  src/pages/api/admin/site-settings.test.ts src/pages/api/admin/upload-sanity-image.test.ts \
  src/pages/api/admin/clients.test.ts src/pages/api/blob-upload.test.ts \
  src/lib/portal src/middleware.test.ts src/sanity/schemas/client.test.ts \
  src/lib/renderingAuth.test.ts src/lib/generateToken.test.ts
→ Test Files  5 passed | 8 skipped (13)
→ Tests  58 passed | 95 todo (153)
→ 0 failures in Wave 0 subset
```

### Task 3 verify (full suite)

Baseline (before Wave 0, at commit f6db5f7):

```
Test Files  6 failed | 39 passed | 12 skipped (57)
Tests  14 failed | 599 passed | 79 todo (692)
```

Post-Wave 0 (after both commits):

```
Test Files  6 failed | 39 passed | 28 skipped (73)
Tests  14 failed | 599 passed | 238 todo (851)
```

Delta:
- Failures: 14 → 14 (zero regressions)
- Passes: 599 → 599 (nothing broken)
- Todo: 79 → 238 (+159 new stubs, matches the 8+8 Task 1 + Task 2 planned count exactly)
- Test files: 57 → 73 (+16 new stub files, matches the 16 net-new file count)

**Wave 0 is safely committable: zero regressions, full expected todo delta.**

## Grep acceptance (plan success criteria)

| Criterion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| `grep -c "it.todo" AdminModal.test.tsx` | 10 | 10 | PASS |
| `grep -c "it.todo" AdminToast.test.tsx` | 8 | 8 | PASS |
| `grep -c "it.todo" CollapsibleSection.test.tsx` | 6 | 6 | PASS |
| `grep -c "it.todo" TagInput.test.tsx` | 8 | 8 | PASS |
| `grep -c "it.todo" SettingsPage.test.tsx` | 6 | 6 | PASS |
| `grep -c "it.todo" HeroSlideshowEditor.test.tsx` | 8 | 8 | PASS |
| `grep -c "it.todo" SendUpdateModal.test.tsx` | 12 | 12 | PASS |
| `grep -c "it.todo" RegenerateLinkDialog.test.tsx` | 6 | 6 | PASS |
| `grep -c "it.todo" emailTemplate.test.ts` | 10 | 10 | PASS |
| `grep -c "it.todo" send-update.test.ts` | 12 | 12 | PASS |
| `grep -c "it.todo" preview.test.ts` | 8 | 8 | PASS |
| `grep -c "it.todo" site-settings.test.ts` | 14 | 14 | PASS |
| `grep -c "it.todo" upload-sanity-image.test.ts` | 6 | 6 | PASS |
| `grep -c "it.todo" blob-upload.test.ts` | 6 | 6 | PASS |
| `grep -c "it.todo" clients.test.ts` | 6 | 6 | PASS |
| `grep -c "it.todo" clientDashboard.test.ts` | 8 | 8 | PASS |
| `grep -c "it.todo" middleware.test.ts` | 14 | 14 | PASS |
| `grep -c "it.todo" client.test.ts` | 4 | 4 | PASS |
| `grep -c "it.todo" renderingAuth.test.ts` (new) | +5 | +5 | PASS |
| `grep -c "it.todo" generateToken.test.ts` (new) | +2 | +2 | PASS |
| `grep -c "wave_0_complete: true" 34-VALIDATION.md` | 1 | 1 (main worktree) | PASS |
| `grep -c "34-XX-" 34-VALIDATION.md` | 0 | 0 | PASS |
| `grep -cE "34-(02\|03\|04\|05\|06\|07)-" 34-VALIDATION.md` | ≥25 | 30 | PASS |
| `npx vitest run` reports 0 failures from Wave 0 additions | yes | yes | PASS |

## Deviations from Plan

### Out-of-scope baseline failures (Rule: SCOPE BOUNDARY)

Task 3 acceptance requires `npx vitest run` to exit 0. The suite exits non-zero because of 14 failures that exist at the base commit f6db5f7 in files Wave 0 does not touch:

- `src/lib/artifactUtils.test.ts` (3 badge-style tests)
- `src/lib/formatCurrency.test.ts` (3 basic currency tests)
- `src/lib/geminiClient.test.ts` (1 blob fetch test)
- `src/lib/tenantClient.test.ts` (2 client factory tests)
- `src/lib/gantt/ganttColors.test.ts` (3 contractor palette tests)
- `src/pages/api/blob-serve.test.ts` (2 session-401 tests)

These were confirmed present in the **baseline run before any Wave 0 changes** (`14 failed | 599 passed | 79 todo`). Per GSD deviation rules SCOPE BOUNDARY: "Only auto-fix issues DIRECTLY caused by the current task's changes." Wave 0 creates test stubs only — no implementation files touched, no regressions introduced.

Logged to `deferred-items.md` for a separate baseline hygiene pass before Wave 1 starts. Recommended ownership: pre-Wave-1 cleanup task.

### VALIDATION.md table rewrite not needed

Plan Task 2 Step C instructed a full rewrite of the Per-Task Verification Map with real task IDs replacing placeholder `34-XX-NN` rows. The VALIDATION.md the planner committed already had real task IDs (30 matches of `34-02-*`, `34-03-*`, etc., and zero `34-XX-*` placeholders). Only the frontmatter gate flip was needed. Treated as Rule 1 inline fix (plan step already satisfied by planner's output).

### Worktree base correction at start

Executor ran in a stale worktree (HEAD at `ffbfebc` from a divergent lineage missing phase 34 entirely). Performed `git reset --soft f6db5f78ace37c81af62c7765f9011fe684f8ac6` per the worktree_branch_check protocol, then `git stash push --include-untracked` to park the divergent working tree state, then copied phase 34 planning files from the main worktree's gitignored `.planning/` directory so the executor had the plan/validation/context/research/UI-spec to work from. The stash remains parked on the worktree branch and can be dropped by the orchestrator cleanup.

### node_modules symlinked from main worktree

This worktree has no `node_modules`. Created `node_modules → /Users/paulalbert/Dropbox/GitHub/la-sprezzatura/node_modules` symlink so `npx vitest run` can resolve deps. Symlink shows as untracked by git but does not pollute the commit (listed in `.gitignore` already).

## Commits

| Hash | Message |
|------|---------|
| `e1074f0` | test(34-01): add Wave 0 React component test stubs |
| `e38ed44` | test(34-01): add Wave 0 API/lib/schema test stubs + flip validation gate |

Both use `--no-verify` per the parallel_execution directive (orchestrator validates hooks once after the wave completes).

## Known Stubs

Every test file in this plan is intentionally a stub. The stubs are the deliverable — Plans 02-07 flip each `it.todo(...)` to `it(...)` as they land the implementation code. This is the design intent of Wave 0 in a Nyquist-compliant phase, not a defect.

## Threat Flags

None. Wave 0 adds only test scaffolds; no runtime surface, no auth paths, no network endpoints introduced.

## Self-Check: PASSED

- Task 1 files: all 8 exist on disk, all 8 appear in commit `e1074f0` (`git show --stat e1074f0` shows 8 create mode entries)
- Task 2 files: all 8 new + 4 extended exist on disk, all 12 appear in commit `e38ed44` (`git show --stat e38ed44` shows 8 create mode + 4 modify entries)
- Wave 0 gate flip: verified via `grep -c "wave_0_complete: true" /Users/paulalbert/Dropbox/GitHub/la-sprezzatura/.planning/phases/34-settings-and-studio-retirement/34-VALIDATION.md` returns `1`
- Commit hashes resolve: `git log --oneline f6db5f7..HEAD` shows both commits
- Vitest regression check: baseline 14 fail → post 14 fail (zero regressions added)
- Todo delta check: baseline 79 → post 238 = +159 (matches exactly the 64 + 95 planned additions)
