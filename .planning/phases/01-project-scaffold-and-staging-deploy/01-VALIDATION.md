---
phase: 1
slug: project-scaffold-and-staging-deploy
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No test framework for Phase 1 (infrastructure/scaffold only) |
| **Config file** | None — Phase 1 has no testable application logic |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && curl -s -o /dev/null -w "%{http_code}" $PREVIEW_URL` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build` + visual check of Vercel preview URL
- **Before `/gsd:verify-work`:** All 5 smoke tests must pass
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | INFRA-05 | build | `npm run build` | Wave 0 | ⬜ pending |
| 1-01-02 | 01 | 1 | INFRA-05 | smoke | `curl -s $PREVIEW_URL \| grep "La Sprezzatura"` | N/A | ⬜ pending |
| 1-01-03 | 01 | 1 | INFRA-05 | smoke | `curl -s -o /dev/null -w "%{http_code}" $PREVIEW_URL/admin` | N/A | ⬜ pending |
| 1-01-04 | 01 | 1 | INFRA-05 | smoke | `curl -s -o /dev/null -w "%{http_code}" https://lasprezz.com` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- No test framework needed for Phase 1. All validations are build checks and smoke tests.
- Vitest should be added in Phase 2 when application logic exists.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Push triggers Vercel deploy | INFRA-05 | Requires GitHub→Vercel webhook | Push a commit, verify deploy appears in Vercel dashboard |
| Placeholder page renders | INFRA-05 | Requires deployed URL | Visit preview URL, verify page content |
| Sanity Studio accessible | INFRA-05 | Requires deployed URL + Sanity project | Visit preview URL/admin, verify Studio loads |
| Wix site unaffected | INFRA-05 | Requires checking external site | Visit lasprezz.com, verify Wix site still serves |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
