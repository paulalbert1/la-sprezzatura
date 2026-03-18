---
phase: 11
slug: rendering-studio-tool-and-design-options-gallery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/sanity/components/rendering/ src/components/portal/DesignOption` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (full suite, fast ~5s)
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | RNDR-04 | unit | `npx vitest run src/sanity/components/rendering/PromoteDialog.test.ts -x` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 0 | RNDR-04 | unit | `npx vitest run src/sanity/components/rendering/UsageBadge.test.ts -x` | ❌ W0 | ⬜ pending |
| 11-01-03 | 01 | 0 | RNDR-05 | unit | `npx vitest run src/components/portal/DesignOptionsSection.test.ts -x` | ❌ W0 | ⬜ pending |
| 11-01-04 | 01 | 0 | RNDR-05 | unit | `npx vitest run src/components/portal/DesignOptionLightbox.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/sanity/components/rendering/PromoteDialog.test.ts` — stubs for RNDR-04 promote/unpromote
- [ ] `src/sanity/components/rendering/UsageBadge.test.ts` — stubs for RNDR-04 usage badge color tiers
- [ ] `src/components/portal/DesignOptionsSection.test.ts` — stubs for RNDR-05 gallery rendering + hidden when 0
- [ ] `src/components/portal/DesignOptionLightbox.test.ts` — stubs for RNDR-05 heart toggle + comment submit
- [ ] Update `blob-upload.ts` allowedContentTypes to include `image/heic, image/heif` — prerequisite for HEIC upload

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Wizard 4-step flow UX | RNDR-04 | Multi-step UI flow with file uploads requires visual verification | Open Rendering tool → New Session → complete all 4 steps → verify stepper progress |
| Rendering generation via API | RNDR-04 | Requires live API call to rendering service | Create session → fill wizard → click Generate → verify image appears in chat |
| Lightbox image display | RNDR-05 | Visual rendering quality check | Open gallery → click image → verify lightbox displays full-size image with navigation |
| Confidentiality notice text | RNDR-05 | Text varies by project type (residential/commercial) | View gallery for residential project → verify notice text. Repeat for commercial. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
