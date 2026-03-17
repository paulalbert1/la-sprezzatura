---
phase: 7
slug: schema-extensions-multi-role-auth-and-document-storage
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | ENGMT-02 | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "engagement"` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | PRJT-01, PRJT-02 | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "commercial"` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | CONTR-01 | unit | `npx vitest run src/sanity/schemas/contractor.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-04 | 01 | 1 | CONTR-05 | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "estimate"` | ❌ W0 | ⬜ pending |
| 07-01-05 | 01 | 1 | CONTR-06, CONTR-07 | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "contractors"` | ❌ W0 | ⬜ pending |
| 07-01-06 | 01 | 1 | BLDG-01 | unit | `npx vitest run src/sanity/schemas/project.test.ts -t "building"` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | CONTR-02 | unit | `npx vitest run src/lib/session.test.ts -t "contractor"` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | DOCS-01 | unit | `npx vitest run src/pages/api/blob-serve.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/sanity/schemas/project.test.ts` — stubs for ENGMT-02, PRJT-01, PRJT-02, CONTR-05, CONTR-06, CONTR-07, BLDG-01 (hidden callback tests)
- [ ] `src/sanity/schemas/contractor.test.ts` — stubs for CONTR-01 (schema validation)
- [ ] `src/lib/session.test.ts` — stubs for CONTR-02 (multi-role session create/get with backward compatibility)
- [ ] `src/pages/api/blob-serve.test.ts` — stubs for DOCS-01 (auth-gated file serving)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sanity Studio tab visibility toggles when engagement type changes | ENGMT-02 | Studio UI interaction requires browser | Open Studio, create project, toggle engagementType, verify Contractors/Procurement tabs appear/disappear |
| Contractor magic link email arrives with correct branding and project names | CONTR-02 | Email delivery requires Resend integration | Trigger "Send Work Order Access" action, verify email in Resend dashboard |
| Vercel Blob file upload from Sanity Studio custom input component | DOCS-01 | Requires Blob store connection and Studio UI | Upload file via custom input in Studio, verify blob URL stored in document |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
