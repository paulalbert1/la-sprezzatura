---
phase: 3
slug: client-operations-portal
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^3.2.4 (installed as devDependency) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CLNT-01 | unit | `npx vitest run src/lib/generateToken.test.ts -t "generates valid token"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CLNT-01 | unit | `npx vitest run src/lib/generateToken.test.ts -t "unique"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | CLNT-01 | manual-only | Visit `/portal/INVALID` on staging | N/A | ⬜ pending |
| 03-01-04 | 01 | 1 | CLNT-02 | unit | `npx vitest run src/lib/portalStages.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | CLNT-02 | manual-only | Visit portal page on staging | N/A | ⬜ pending |
| 03-01-06 | 01 | 1 | CLNT-02 | manual-only | Visit portal page on staging | N/A | ⬜ pending |
| 03-01-07 | 01 | 1 | CLNT-03 | manual-only | Open project document in Sanity Studio `/admin` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — minimal vitest configuration file (no special setup needed for pure utility tests)
- [ ] `src/lib/generateToken.test.ts` — covers CLNT-01 (token generation, length, charset, uniqueness)
- [ ] `src/lib/portalStages.test.ts` — covers CLNT-02 (stage metadata completeness, stage order matches schema)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Invalid token returns 404 (no info leakage) | CLNT-01 | Requires running Astro SSR server with Sanity connection | Visit `/portal/INVALID` on staging, verify generic 404 page |
| Status badge renders correct stage name | CLNT-02 | Visual verification of rendered HTML | Visit portal page, check stage name matches Sanity data |
| Timeline highlights correct current stage | CLNT-02 | Visual verification of stepper component | Visit portal page, verify current stage is highlighted |
| Sanity schema fields present | CLNT-03 | Requires Sanity Studio running with deployed schema | Open project in Studio, verify portalToken, clientName, portalEnabled fields |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
