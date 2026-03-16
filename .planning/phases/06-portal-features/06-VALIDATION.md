---
phase: 6
slug: portal-features
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.2.4 |
| **Config file** | `vitest.config.ts` (exists, aliases `sanity:client` mock) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | MILE-01 | unit | `npx vitest run src/sanity/schemas/project.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | PROC-01 | unit | `npx vitest run src/sanity/schemas/project.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | ARTF-01 | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | CLNT-06 | smoke | N/A -- SSR page rendering | N/A | ⬜ pending |
| 06-02-02 | 02 | 2 | CLNT-07 | unit | `npx vitest run src/lib/projectVisibility.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | MILE-02 | unit | `npx vitest run src/lib/milestoneUtils.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-04 | 02 | 2 | MILE-03 | smoke | N/A -- Astro component | N/A | ⬜ pending |
| 06-02-05 | 02 | 2 | PROC-02 | unit | `npx vitest run src/lib/formatCurrency.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-06 | 02 | 2 | PORT-05 | smoke | N/A -- static HTML | N/A | ⬜ pending |
| 06-02-07 | 02 | 2 | PORT-07 | smoke | N/A -- SSR page | N/A | ⬜ pending |
| 06-03-01 | 03 | 2 | ARTF-02 | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | ARTF-03 | unit | `npx vitest run src/actions/portalActions.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-03 | 03 | 2 | ARTF-04 | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-04 | 03 | 2 | ARTF-08 | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-05 | 03 | 2 | ARTF-09 | unit | `npx vitest run src/actions/portalActions.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-03-06 | 03 | 2 | PORT-06 | unit | `npx vitest run src/actions/portalActions.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-04-01 | 03 | 3 | POST-01 | unit | `npx vitest run src/lib/generateClosePdf.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-04-02 | 03 | 3 | POST-02 | unit | `npx vitest run src/lib/projectVisibility.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-04-03 | 03 | 3 | POST-03 | unit | `npx vitest run src/lib/artifactUtils.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-04-04 | 03 | 3 | POST-04 | unit | `npx vitest run src/actions/portalActions.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/formatCurrency.test.ts` — covers PROC-02 (savings computation, cents formatting)
- [ ] `src/lib/trackingUrl.test.ts` — covers tracking number carrier detection
- [ ] `src/lib/milestoneUtils.test.ts` — covers MILE-02 (sorting, progress calculation, overdue detection)
- [ ] `src/lib/artifactUtils.test.ts` — covers ARTF-01/02/04/08, POST-03 (type detection, version ordering, decision log)
- [ ] `src/lib/projectVisibility.test.ts` — covers CLNT-07, POST-02 (30-day window, reopen logic)
- [ ] `src/lib/generateClosePdf.test.ts` — covers POST-01 (PDF buffer generation)
- [ ] `src/actions/portalActions.test.ts` — covers ARTF-03/09, PORT-06, POST-04 (action input validation)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard greets client by name | CLNT-06 | SSR page rendering with session data | Log in as test client; verify greeting shows correct name |
| Pipeline status bar renders | MILE-03 | Astro component visual rendering | Navigate to project detail; verify 6-stage pipeline bar visible |
| Confidentiality notice displayed | PORT-05 | Static HTML presence check | Navigate to project detail; verify banner below header |
| Artifacts section renders with versions | PORT-07 | SSR page with dynamic data | Upload test artifact in Sanity; verify it appears with version info |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
