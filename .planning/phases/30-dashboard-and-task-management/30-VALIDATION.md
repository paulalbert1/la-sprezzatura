---
phase: 30
slug: dashboard-and-task-management
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-08
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 30-01-01 | 01 | 1 | DASH-01 | — | N/A | manual | See Manual-Only Verifications | N/A | ⬜ pending |
| 30-01-02 | 01 | 1 | DASH-02 | — | N/A | unit | `npx vitest run src/lib/dashboardUtils.test.ts -t "overdue milestones"` | ❌ W0 | ⬜ pending |
| 30-01-03 | 01 | 1 | DASH-03 | — | N/A | manual | See Manual-Only Verifications | N/A | ⬜ pending |
| 30-01-04 | 01 | 1 | DASH-04 | — | N/A | unit | `npx vitest run src/lib/dashboardUtils.test.ts -t "overdue banner"` | ❌ W0 | ⬜ pending |
| 30-01-05 | 01 | 1 | DASH-05 | — | N/A | manual | See Manual-Only Verifications | N/A | ⬜ pending |
| 30-01-06 | 01 | 1 | DASH-06 | — | N/A | manual | See Manual-Only Verifications | N/A | ⬜ pending |
| 30-02-01 | 02 | 1 | TASK-01 | T-30-01 | Session+role check before task creation | unit | `npx vitest run src/pages/api/admin/tasks.test.ts -t "create"` | ❌ W0 | ⬜ pending |
| 30-02-02 | 02 | 1 | TASK-02 | T-30-01 | Session+role check before task toggle | unit | `npx vitest run src/pages/api/admin/tasks.test.ts -t "toggle"` | ❌ W0 | ⬜ pending |
| 30-02-03 | 02 | 1 | TASK-03 | — | N/A | unit | `npx vitest run src/lib/dashboardUtils.test.ts -t "overdue task"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/dashboardUtils.test.ts` — stubs for DASH-02, DASH-04, TASK-03 (overdue logic, days-in-stage computation)
- [ ] `src/pages/api/admin/tasks.test.ts` — stubs for TASK-01, TASK-02 (task CRUD API)

**GROQ query tests (DASH-01, DASH-03, DASH-05, DASH-06) excluded from Wave 0:** These queries run against a live Sanity Content Lake instance and cannot be realistically unit tested with mocks. The GROQ query correctness is verified manually via the dashboard UI (Plan 30-03 checkpoint) and through the `/gsd-verify-work` phase gate.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| GROQ queries return correct active projects with stage + days-in-stage | DASH-01 | Queries run against live Sanity Content Lake; mocking would test mock fidelity, not query correctness | Verify dashboard Active Projects card shows real project data with stage badges and days counters |
| GROQ queries return active deliveries with correct status filters | DASH-03 | Same as DASH-01 -- live Sanity dependency | Verify Deliveries card shows items with ordered/warehouse/in-transit status pills |
| GROQ activity feed query sorts correctly and limits count | DASH-05 | Same as DASH-01 -- live Sanity dependency | Verify Activity feed shows recent entries sorted by timestamp desc, max 15 |
| GROQ tasks query returns tasks with correct state fields | DASH-06 | Same as DASH-01 -- live Sanity dependency | Verify Tasks card shows tasks with completed/overdue state from real data |
| 2-column responsive layout stacks on narrow screens | DASH-01, D-02 | Visual layout requires browser | Resize browser to <768px, verify single-column stack |
| Overdue items highlighted in red | TASK-03 | CSS visual verification | Create overdue task, verify red text/border in browser |
| Task checkbox toggles inline without navigation | TASK-02, D-15 | Interactive browser behavior | Click checkbox on dashboard, verify API call and no page change |
| Click navigation to project detail page | D-14 | Navigation flow | Click project row, milestone, delivery links and verify targets |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (dashboardUtils.test.ts, tasks.test.ts)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] GROQ query tests documented as manual-only with rationale

**Approval:** ready
