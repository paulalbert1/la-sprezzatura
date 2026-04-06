---
phase: 25
slug: admin-shell-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-01-01 | 01 | 1 | SC-01 | — | Admin email detection creates admin-role token | unit | `npx vitest run src/actions/magicLink.test.ts -x` | ✅ (extend) | ⬜ pending |
| 25-01-02 | 01 | 1 | SC-02 | — | verify.astro redirects admin to /admin/dashboard | unit | `npx vitest run src/pages/portal/verify.test.ts -x` | ❌ W0 | ⬜ pending |
| 25-01-03 | 01 | 1 | SC-03 | — | Middleware protects /admin/* and allows /admin/login | unit | `npx vitest run src/middleware.test.ts -x` | ✅ (extend) | ⬜ pending |
| 25-01-04 | 01 | 1 | SC-04 | — | session.ts role union includes 'admin' | unit | `npx vitest run src/lib/session.test.ts -x` | ✅ (extend) | ⬜ pending |
| 25-01-05 | 01 | 1 | SC-05 | — | env.d.ts declares adminEmail in Locals | unit | `npx vitest run src/lib/session.test.ts -x` | ✅ (extend) | ⬜ pending |
| 25-02-01 | 02 | 2 | SC-06 | — | Admin layout renders sidebar and top bar | manual | Browser verification | N/A | ⬜ pending |
| 25-02-02 | 02 | 2 | SC-07 | — | Unauthenticated /admin/dashboard redirects to login | manual | Browser verification | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `src/middleware.test.ts` — add admin route protection assertions
- [ ] Extend `src/lib/session.test.ts` — add 'admin' role assertion
- [ ] Extend `src/actions/magicLink.test.ts` — add ADMIN_EMAIL detection assertion
- [ ] Create `src/pages/portal/verify.test.ts` — verify admin redirect case (new file, source assertion pattern)

*Existing infrastructure covers most requirements. Only one new test file needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin layout sidebar + top bar renders correctly | SC-06 | Visual layout verification | Start dev server, login as admin, verify sidebar nav items and top bar render with warm neutral palette |
| Unauthenticated redirect works end-to-end | SC-07 | Cookie/redirect chain | Open incognito browser, visit /admin/dashboard, verify redirect to /admin/login |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
