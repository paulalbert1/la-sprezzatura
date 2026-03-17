---
phase: 10
slug: ai-rendering-engine
status: draft
nyquist_compliant: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/renderingSession.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/designOption.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/renderingUsage.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 1 | RNDR-01 | unit | `npx vitest run src/sanity/schemas/project.test.ts -x` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 1 | RNDR-02 | unit | `npx vitest run src/lib/promptBuilder.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 1 | RNDR-02 | unit | `npx vitest run src/lib/geminiClient.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 2 | RNDR-02 | unit | `npx vitest run src/pages/api/rendering/generate.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-03-02 | 03 | 2 | RNDR-03 | unit | `npx vitest run src/lib/geminiClient.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-04-01 | 04 | 2 | RNDR-06 | unit | `npx vitest run src/pages/api/rendering/usage.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-04-02 | 04 | 2 | RNDR-06 | unit | `npx vitest run src/pages/api/rendering/generate.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-04-03 | 04 | 2 | RNDR-07 | unit | `npx vitest run src/lib/geminiClient.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/sanity/schemas/renderingSession.test.ts` — stubs for RNDR-01 (session schema)
- [ ] `src/sanity/schemas/designOption.test.ts` — stubs for RNDR-01 (design option schema)
- [ ] `src/sanity/schemas/renderingUsage.test.ts` — stubs for RNDR-01 (usage schema)
- [ ] `src/lib/promptBuilder.test.ts` — stubs for RNDR-02 (prompt assembly)
- [ ] `src/lib/geminiClient.test.ts` — stubs for RNDR-02, RNDR-03, RNDR-07 (Gemini integration)
- [ ] `src/lib/renderingAuth.test.ts` — stubs for auth validation
- [ ] `src/pages/api/rendering/generate.test.ts` — stubs for RNDR-02, RNDR-06 (generate endpoint)
- [ ] `src/pages/api/rendering/usage.test.ts` — stubs for RNDR-06 (usage endpoint)
- [ ] Framework install: `npm install @google/genai @vercel/functions` — new dependencies

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Gemini produces photorealistic room rendering | RNDR-02 | AI output quality requires visual inspection | POST to /api/rendering/generate with real room images, inspect output image quality |
| waitUntil background processing completes on Vercel | RNDR-02 | Requires deployed Vercel environment | Deploy to preview, POST generate, poll status until complete |
| Content policy rejection handling | RNDR-02 | Depends on Gemini's content filter | Submit edge-case images and verify graceful error response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
