---
phase: 5
slug: data-foundation-auth-and-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-xx-01 | 01 | 0 | CLNT-04 | unit | `npm test -- src/sanity/schemas/client.test.ts` | ❌ W0 | ⬜ pending |
| 05-xx-02 | 01 | 0 | CLNT-05 | unit | `npm test -- src/sanity/schemas/project.test.ts` | ❌ W0 | ⬜ pending |
| 05-xx-03 | 01 | 0 | INFRA-07 | unit | `npm test -- src/lib/rateLimit.test.ts` | ❌ W0 | ⬜ pending |
| 05-xx-04 | 01 | 0 | AUTH-01, INFRA-08 | unit | `npm test -- src/actions/magicLink.test.ts` | ❌ W0 | ⬜ pending |
| 05-xx-05 | 01 | 0 | AUTH-04, AUTH-05 | unit | `npm test -- src/middleware.test.ts` | ❌ W0 | ⬜ pending |
| 05-xx-06 | 02 | 1 | AUTH-02 | unit | `npm test -- src/lib/session.test.ts` | ❌ W0 | ⬜ pending |
| 05-xx-07 | 02 | 1 | AUTH-03 | unit | `npm test -- src/sanity/queries.test.ts` | ❌ W0 | ⬜ pending |
| 05-xx-08 | 02 | 2 | PROC-03 | unit | `npm test -- src/sanity/schemas/project.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/sanity/schemas/client.test.ts` — stubs for CLNT-04 (client schema field presence)
- [ ] `src/sanity/schemas/project.test.ts` — stubs for CLNT-05, PROC-03 (clients array, integer cents validation)
- [ ] `src/lib/rateLimit.test.ts` — stubs for INFRA-07 (mock @upstash/ratelimit, verify sliding window)
- [ ] `src/actions/magicLink.test.ts` — stubs for AUTH-01, INFRA-08 (mock Redis + Resend, assert token stored, from address)
- [ ] `src/middleware.test.ts` — stubs for AUTH-04, AUTH-05 (mock Redis, test redirect logic)
- [ ] `src/lib/session.test.ts` — stubs for AUTH-02 (session cookie options)
- [ ] `src/sanity/queries.test.ts` — stubs for AUTH-03 (GROQ query correctness)

*Existing `generateToken.test.ts` and `portalStages.test.ts` remain unchanged.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Resend domain verification (SPF/DKIM passing) | INFRA-08 | DNS propagation is external; requires real DNS provider | 1. Log into Resend dashboard 2. Check send.lasprezz.com domain status shows "Verified" 3. Send test email to Gmail, check headers for SPF=pass, DKIM=pass |
| Magic link email delivery to Gmail/Outlook/Yahoo | INFRA-08 | End-to-end email delivery requires real mailboxes | 1. Trigger magic link for a test client 2. Verify email arrives in Gmail, Outlook, Yahoo inboxes 3. Check email renders correctly (HTML template, branding) |
| Old PURL redirect to login page | AUTH-05 | Requires deployed site with existing portal tokens | 1. Visit /portal/[existing-token] 2. Verify redirect to /portal/login with upgrade message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
