---
phase: 10
slug: ai-rendering-engine
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-17
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` (existing, with sanity:client alias) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Created By | Status |
|---------|------|------|-------------|-----------|-------------------|-----------------|--------|
| 10-01-01 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/renderingSession.test.ts -x` | Plan 01 Task 2 | pending |
| 10-01-02 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/designOption.test.ts -x` | Plan 01 Task 2 | pending |
| 10-01-03 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/renderingUsage.test.ts -x` | Plan 01 Task 2 | pending |
| 10-01-04 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/project.test.ts -x` | Existing | pending |
| 10-02-01 | 02 | 1 | RNDR-02 | unit | `npx vitest run src/lib/promptBuilder.test.ts -x` | Plan 02 Task 1 | pending |
| 10-02-02 | 02 | 1 | RNDR-02 | unit | `npx vitest run src/lib/geminiClient.test.ts -x` | Plan 02 Task 2 | pending |
| 10-02-03 | 02 | 1 | RNDR-02 | unit | `npx vitest run src/lib/renderingAuth.test.ts -x` | Plan 02 Task 2 | pending |
| 10-03-01 | 03 | 2 | RNDR-02,RNDR-06 | unit | `npx vitest run src/pages/api/rendering/generate.test.ts -x` | Plan 03 Task 0 | pending |
| 10-04-01 | 04 | 2 | RNDR-06 | unit | `npx vitest run src/pages/api/rendering/usage.test.ts -x` | Plan 04 Task 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/sanity/schemas/renderingSession.test.ts` — created by Plan 01 Task 2
- [ ] `src/sanity/schemas/designOption.test.ts` — created by Plan 01 Task 2
- [ ] `src/sanity/schemas/renderingUsage.test.ts` — created by Plan 01 Task 2
- [ ] `src/lib/promptBuilder.test.ts` — created by Plan 02 Task 1 (TDD)
- [ ] `src/lib/geminiClient.test.ts` — created by Plan 02 Task 2 (TDD)
- [ ] `src/lib/renderingAuth.test.ts` — created by Plan 02 Task 2 (TDD)
- [ ] `src/pages/api/rendering/generate.test.ts` — created by Plan 03 Task 0 (TDD)
- [ ] `src/pages/api/rendering/usage.test.ts` — created by Plan 04 Task 0 (TDD)
- [ ] Framework install: `npm install @google/genai @vercel/functions` — Plan 01 Task 1a

---

## RNDR-06 Behavioral Coverage

| Behavior | Test File | Test Description |
|----------|-----------|------------------|
| Generate returns 403 when monthly limit reached | `generate.test.ts` | "returns 403 with QUOTA_EXCEEDED when monthly limit reached" |
| Usage returns count/limit/remaining | `usage.test.ts` | "returns 200 with usage data when valid" |
| Usage returns 401 when auth fails | `usage.test.ts` | "returns 401 when x-studio-token is missing" |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gemini produces photorealistic room rendering | RNDR-02 | AI output quality requires visual inspection | POST to /api/rendering/generate with real room images, inspect output image quality |
| waitUntil background processing completes on Vercel | RNDR-02 | Requires deployed Vercel environment | Deploy to preview, POST generate, poll status until complete |
| Content policy rejection handling | RNDR-02 | Depends on Gemini's content filter | Submit edge-case images and verify graceful error response |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] RNDR-06 "403 when monthly limit reached" has automated test coverage

**Approval:** pending
