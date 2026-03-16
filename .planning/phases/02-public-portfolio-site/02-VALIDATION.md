---
phase: 2
slug: public-portfolio-site
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (compatible with Astro 6 via `getViteConfig()`) |
| **Config file** | vitest.config.ts (Wave 0 -- create if not exists) |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PORT-01 | smoke | `npm run build` | Wave 0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PORT-02 | smoke | `npm run build` | Wave 0 | ⬜ pending |
| 02-01-03 | 01 | 1 | PORT-03 | unit | `npx vitest run --testPathPattern sanity` | Wave 0 | ⬜ pending |
| 02-01-04 | 01 | 1 | PORT-04 | manual | Visual check: /admin | Manual | ⬜ pending |
| 02-02-01 | 02 | 1 | SITE-01 | smoke | `npm run build` | Wave 0 | ⬜ pending |
| 02-02-02 | 02 | 1 | SITE-02 | smoke | `npm run build` | Wave 0 | ⬜ pending |
| 02-02-03 | 02 | 1 | SITE-03 | smoke | `npm run build` | Wave 0 | ⬜ pending |
| 02-02-04 | 02 | 1 | SITE-04 | smoke | `npm run build` | Wave 0 | ⬜ pending |
| 02-02-05 | 02 | 1 | DSGN-01 | manual | Visual review of staging URL | Manual | ⬜ pending |
| 02-02-06 | 02 | 1 | DSGN-02 | manual | Chrome DevTools responsive mode | Manual | ⬜ pending |
| 02-02-07 | 02 | 1 | DSGN-03 | unit | `npx vitest run --testPathPattern image` | Wave 0 | ⬜ pending |
| 02-03-01 | 03 | 2 | SITE-05 | integration | `npx vitest run --testPathPattern contact` | Wave 0 | ⬜ pending |
| 02-03-02 | 03 | 2 | SITE-06 | manual | Visual check on contact page | Manual | ⬜ pending |
| 02-03-03 | 03 | 2 | SITE-07 | smoke | `npm run build` | Wave 0 | ⬜ pending |
| 02-03-04 | 03 | 2 | DSGN-04 | performance | `npx lighthouse staging-url --only-categories=performance` | Wave 0 | ⬜ pending |
| 02-03-05 | 03 | 2 | SEO-01 | unit | `npx vitest run --testPathPattern seo` | Wave 0 | ⬜ pending |
| 02-03-06 | 03 | 2 | SEO-02 | unit | `npx vitest run --testPathPattern seo` | Wave 0 | ⬜ pending |
| 02-03-07 | 03 | 2 | SEO-03 | unit | `npx vitest run --testPathPattern seo` | Wave 0 | ⬜ pending |
| 02-03-08 | 03 | 2 | SEO-04 | smoke | Check `dist/sitemap-index.xml` after build | Wave 0 | ⬜ pending |
| 02-03-09 | 03 | 2 | SEO-05 | unit | `npx vitest run --testPathPattern seo` | Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` -- Vitest config using Astro's `getViteConfig()` helper
- [ ] `tests/seo.test.ts` -- Verify meta tags, OG tags, JSON-LD, heading hierarchy
- [ ] `tests/image.test.ts` -- Verify SanityImage component generates correct srcset
- [ ] `tests/contact.test.ts` -- Verify contact action validates input correctly
- [ ] Framework install: `npm install -D vitest` (Vitest compatible with Astro 6's Vite 7)
- [ ] Add `"test": "vitest run"` to package.json scripts

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sanity Studio editable at /admin | PORT-04 | Requires authenticated browser session | Navigate to /admin, create test project, verify fields |
| Cal.com widget renders | SITE-06 | Third-party embed, runtime-only | Load contact page, verify Cal.com widget loads |
| Design tokens applied correctly | DSGN-01 | Visual judgment required | Review staging URL against design spec |
| Mobile responsive | DSGN-02 | Visual layout judgment | Chrome DevTools responsive mode, test 375px/768px/1024px |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
