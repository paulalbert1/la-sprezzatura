---
phase: 48-smaller-transactional-emails
plan: "02"
subsystem: email
tags: [email, react-email, templates, EMAIL-04, EMAIL-05, tdd, snapshot]
dependency_graph:
  requires:
    - phase: 48-01
      provides: "tokenTtl.ts with formatExpiryCopy + D-14 signoffNameFormal fix"
  provides:
    - "src/emails/workOrderAccess/WorkOrderAccess.tsx — casual-register contractor access invite (EMAIL-04 + EMAIL-05)"
    - "src/emails/buildingAccess/BuildingAccess.tsx — formal-register building-manager access invite (EMAIL-04 + EMAIL-05)"
    - "src/emails/artifactReady/ArtifactReady.tsx — casual-register client notification (no token, no expiry)"
    - "12 new files across 3 email template dirs (tsx + fixtures + test + snap)"
  affects:
    - "48-03 (API rewires): imports WorkOrderAccess, BuildingAccess, ArtifactReady"
    - "48-04 (drift guard): cross-template invariant tests"
tech_stack:
  added: []
  patterns:
    - "EMAIL-04 link-fallback paragraph pattern: Section inside children with literal magicLink as JSX text expression — appears above EmailShell CTA, pairs URL with action"
    - "EMAIL-05 expiry copy pattern: formatExpiryCopy(expiresInSeconds) called inside template from prop — never the TTL constant import (Pitfall 2 guard)"
    - "Notification vs. invitation split: ArtifactReady omits both EMAIL-04 and EMAIL-05 blocks by structural absence, enforced by 3 negative test asserts"
    - "Template literal pattern for multi-value JSX strings: h1Copy/bodyCopy computed before return to avoid react-email comment-node insertion between adjacent text and expressions"
key_files:
  created:
    - src/emails/workOrderAccess/WorkOrderAccess.tsx
    - src/emails/workOrderAccess/fixtures.ts
    - src/emails/workOrderAccess/WorkOrderAccess.test.ts
    - src/emails/workOrderAccess/__snapshots__/WorkOrderAccess.test.ts.snap
    - src/emails/buildingAccess/BuildingAccess.tsx
    - src/emails/buildingAccess/fixtures.ts
    - src/emails/buildingAccess/BuildingAccess.test.ts
    - src/emails/buildingAccess/__snapshots__/BuildingAccess.test.ts.snap
    - src/emails/artifactReady/ArtifactReady.tsx
    - src/emails/artifactReady/fixtures.ts
    - src/emails/artifactReady/ArtifactReady.test.ts
    - src/emails/artifactReady/__snapshots__/ArtifactReady.test.ts.snap
  modified: []
key_decisions:
  - "Template literal pre-computation (h1Copy/bodyCopy) required for ArtifactReady to avoid react-email comment nodes between adjacent JSX text and interpolated expression children — inline JSX interpolation `New {artifactLabel} Available` produces `New <!-- -->Mood Board<!-- --> Available` in rendered HTML"
  - "EMAIL-04/05 blocks placed inside EmailShell children (above the shell-rendered CTA) per D-02 contract — structurally equivalent to after-CTA per 48-PATTERNS.md guidance; no EmailShell fork needed"
  - "Three separate template dirs (D-01) with no shared parameterized invitation component — copy diverges per recipient role per plan objective"
requirements_completed: [EMAIL-04, EMAIL-05]
duration: 7min
completed: "2026-04-30"
---

# Phase 48 Plan 02: Three New Email Templates Summary

**Three react-email templates created (WorkOrderAccess, BuildingAccess, ArtifactReady) with EMAIL-04 link-fallback + EMAIL-05 expiry enforcement and D-08 negative-assert notification contract; 48 tests, 7 snapshots, all green.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-30T23:31:54Z
- **Completed:** 2026-04-30T23:39:00Z
- **Tasks:** 3
- **Files modified:** 12 created

## Accomplishments

- WorkOrderAccess casual-register invitation: EMAIL-04 link-fallback + EMAIL-05 expiry, `signoffStyle="casual"` (D-10 "Elizabeth" signoff), 16 tests green
- BuildingAccess formal-register invitation: same EMAIL-04/05 structure with `/building/verify` path, `signoffStyle="formal"` (D-11 "Elizabeth Olivier" signoff), 15 tests green
- ArtifactReady casual-register notification: no token, no expiry, no link-fallback (D-08/D-09), 3 negative asserts enforce the omission at test level, 17 tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: WorkOrderAccess template + fixtures + tests + snapshots** - `a8c9b28` (feat)
2. **Task 2: BuildingAccess template + fixtures + tests + snapshots** - `7b9b0cb` (feat)
3. **Task 3: ArtifactReady template + fixtures + tests + snapshots** - `9b1485c` (feat)

## Files Created/Modified

- `src/emails/workOrderAccess/WorkOrderAccess.tsx` - Casual-register contractor access invitation; EMAIL-04 fallback + EMAIL-05 expiry via `formatExpiryCopy`
- `src/emails/workOrderAccess/fixtures.ts` - WorkOrderAccessEmailInput type + 3 fixtures (default, multipleProjects, noProjects)
- `src/emails/workOrderAccess/WorkOrderAccess.test.ts` - 12 behavioral + 3 snapshot + 1 plain-text tests
- `src/emails/workOrderAccess/__snapshots__/WorkOrderAccess.test.ts.snap` - Committed HTML snapshots (cream/gold tokens, "Elizabeth" casual signoff)
- `src/emails/buildingAccess/BuildingAccess.tsx` - Formal-register building-manager access invitation; same EMAIL-04/05 structure
- `src/emails/buildingAccess/fixtures.ts` - BuildingAccessEmailInput type + 2 fixtures (default, longProjectTitle)
- `src/emails/buildingAccess/BuildingAccess.test.ts` - 12 behavioral + 2 snapshot + 1 plain-text tests
- `src/emails/buildingAccess/__snapshots__/BuildingAccess.test.ts.snap` - Committed snapshots (contains "Elizabeth Olivier", "/building/verify")
- `src/emails/artifactReady/ArtifactReady.tsx` - Casual-register client notification; no EMAIL-04/05 blocks by structural absence
- `src/emails/artifactReady/fixtures.ts` - ArtifactReadyEmailInput type + 2 fixtures (default, customArtifactName); no expiresInSeconds field
- `src/emails/artifactReady/ArtifactReady.test.ts` - 14 behavioral (3 negative EMAIL-04/05) + 2 snapshot + 1 plain-text tests
- `src/emails/artifactReady/__snapshots__/ArtifactReady.test.ts.snap` - Committed snapshots; verified clean of "expires in" and "paste this link"

## Decisions Made

- **Template literal pre-computation:** In ArtifactReady.tsx, `h1Copy` and `bodyCopy` are computed as template literals before the JSX return, not interpolated inline. Inline JSX expression interpolation (`New {artifactLabel} Available`) causes react-email to insert comment nodes (`New <!-- -->Mood Board<!-- --> Available`) between adjacent text and expression children. The template literal pattern prevents this and is the correct pattern for all mixed-text JSX in react-email templates.
- **EMAIL-04/05 placement:** Both EMAIL-04 (link-fallback) and EMAIL-05 (expiry copy) sections live inside EmailShell children (above the shell-rendered CTA button) rather than after it. Per 48-PATTERNS.md this is structurally equivalent — "If the button doesn't work, copy and paste this link" reads naturally in proximity to the action. No EmailShell fork needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Template literal pre-computation for ArtifactReady H1 and body copy**
- **Found during:** Task 3 (ArtifactReady GREEN phase)
- **Issue:** Plan specified `New {artifactLabel} Available` as inline JSX interpolation. react-email renders this as `New <!-- -->Mood Board<!-- --> Available` with comment nodes, causing `toContain("New Mood Board Available")` to fail.
- **Fix:** Pre-computed `h1Copy = \`New ${artifactLabel} Available\`` and `bodyCopy = \`Liz has uploaded...\`` as template literals before the JSX return block. This is the correct pattern for react-email templates with mixed text + expression children.
- **Files modified:** `src/emails/artifactReady/ArtifactReady.tsx`
- **Verification:** 17/17 tests green; snapshot content verified correct
- **Committed in:** `9b1485c` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Fix was required for test correctness. Pattern extends to any future react-email template that mixes text and interpolated values in the same JSX text node — use template literals, not inline expressions.

## Issues Encountered

None beyond the auto-fixed deviation above.

## Known Stubs

None — all three templates are fully implemented with live prop wiring. Plan 03 will rewire the call sites from legacy inline HTML to these templates.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. JSX auto-escape confirmed by explicit `<script>alert(1)</script>` tests in all three test files.

## Next Phase Readiness

- All three templates ready for Plan 03 API rewires — `WorkOrderAccess`, `BuildingAccess`, and `ArtifactReady` are importable from their respective dirs
- `WorkOrderAccessEmailInput`, `BuildingAccessEmailInput`, `ArtifactReadyEmailInput` types exported for call-site type safety
- Snapshot baselines committed; any structural regression caught on next test run

## Self-Check: PASSED

- [x] `src/emails/workOrderAccess/WorkOrderAccess.tsx` exists
- [x] `src/emails/workOrderAccess/fixtures.ts` exists
- [x] `src/emails/workOrderAccess/WorkOrderAccess.test.ts` exists
- [x] `src/emails/workOrderAccess/__snapshots__/WorkOrderAccess.test.ts.snap` exists
- [x] `src/emails/buildingAccess/BuildingAccess.tsx` exists
- [x] `src/emails/buildingAccess/fixtures.ts` exists
- [x] `src/emails/buildingAccess/BuildingAccess.test.ts` exists
- [x] `src/emails/buildingAccess/__snapshots__/BuildingAccess.test.ts.snap` exists
- [x] `src/emails/artifactReady/ArtifactReady.tsx` exists
- [x] `src/emails/artifactReady/fixtures.ts` exists
- [x] `src/emails/artifactReady/ArtifactReady.test.ts` exists
- [x] `src/emails/artifactReady/__snapshots__/ArtifactReady.test.ts.snap` exists
- [x] Commits `a8c9b28`, `7b9b0cb`, `9b1485c` all present in git log
- [x] 203 tests green across all 9 email test files (`npm test -- src/emails`)
- [x] No MAGIC_LINK_ACCESS_TTL_SECONDS in any new .tsx template file
- [x] "Elizabeth Olivier" absent from WorkOrderAccess snapshot (casual signoff, D-10)
- [x] "Elizabeth Olivier" present 3+ times in BuildingAccess snapshot (formal signoff, D-11)
- [x] "expires in" absent from ArtifactReady snapshot (D-08 contract)
- [x] "paste this link" absent from ArtifactReady snapshot (D-09 contract)

---
*Phase: 48-smaller-transactional-emails*
*Completed: 2026-04-30*
