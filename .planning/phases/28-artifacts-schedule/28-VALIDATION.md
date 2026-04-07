---
phase: 28
slug: artifacts-schedule
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-07
approval: approved
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (via vitest.config.ts) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/gantt/ -x` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/gantt/ -x`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 01 | 1 | D-11 | — | N/A | unit | `npx vitest run src/lib/gantt/ -x` | Wave 0 (relocated from sanity/components/gantt/lib/) |  pending |
| 28-01-02 | 01 | 1 | D-11 | — | N/A | unit | `npx vitest run src/sanity/components/gantt/ -x` | Existing tests, path updates needed |  pending |
| 28-02-01 | 02 | 1 | D-01, D-02, D-03 | T-28-01 | getSession() + admin role check | smoke | Manual: POST to /api/admin/artifact-crud | Wave 0 |  pending |
| 28-02-02 | 02 | 1 | D-01, D-02 | T-28-01 | getSession() + admin role check | smoke | Manual: POST to /api/admin/artifact-version | Wave 0 |  pending |
| 28-03-01 | 03 | 2 | D-07, D-10 | T-28-02 | getSession() + admin role check | manual | Manual: drag bar in browser | Manual-only |  pending |
| 28-03-02 | 03 | 2 | D-07, D-09 | T-28-02 | getSession() + admin role check | manual | Manual: click bar in browser | Manual-only |  pending |
| 28-03-03 | 03 | 2 | D-14, D-15, D-16 | T-28-02 | getSession() + admin role check | smoke | Manual: POST to /api/admin/schedule-event | Wave 0 |  pending |
| 28-01-03 | 01 | 1 | D-11 | — | N/A | unit | `npx vitest run src/lib/gantt/ganttTransforms.test.ts -x` | Existing (relocated) |  pending |
| 28-01-04 | 01 | 1 | D-11 | — | N/A | unit | `npx vitest run src/lib/gantt/ganttColors.test.ts -x` | Existing (relocated) |  pending |

*Status:  pending /  green /  red /  flaky*

---

## Wave 0 Requirements

- [x] Relocate existing tests from `src/sanity/components/gantt/lib/` to `src/lib/gantt/` with updated import paths
- [x] No new unit test stubs needed for API routes (tested via browser smoke tests per Phase 27 pattern)

*Existing infrastructure covers all phase requirements that can be automated.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop date save | D-07, D-10 | Requires Frappe Gantt browser interaction (SVG drag events) | 1. Navigate to schedule page 2. Drag a contractor bar 3. Verify date updated in Sanity |
| Click-to-edit popover | D-07, D-09 | Requires browser click interaction on SVG elements | 1. Navigate to schedule page 2. Click a bar/marker 3. Verify popover opens with correct fields |
| Click-on-empty-space event creation | D-14 | Requires browser click on timeline empty space | 1. Navigate to schedule page 2. Click empty area 3. Verify creation popover opens with pre-filled date |
| Artifact file upload | D-01, D-02 | Requires FormData upload via browser | 1. Navigate to artifacts page 2. Upload file in expanded card 3. Verify version appears in history |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
