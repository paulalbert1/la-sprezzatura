---
phase: 8
slug: contractor-portal-building-manager-and-client-visibility
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^3.2.4 |
| **Config file** | vitest.config.ts |
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
| 08-01-01 | 01 | 1 | CONTR-03 | unit | `npx vitest run src/sanity/queries.test.ts -t "work order detail"` | Extend existing | ⬜ pending |
| 08-01-02 | 01 | 1 | CONTR-04 | unit | `npx vitest run src/sanity/queries.test.ts -t "client contact excluded"` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | BLDG-02 | unit | `npx vitest run src/pages/api/send-building-access.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | BLDG-03 | unit | `npx vitest run src/sanity/queries.test.ts -t "building manager"` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | BLDG-04 | unit | `npx vitest run src/lib/coiUtils.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-06 | 01 | 1 | BLDG-05 | unit | `npx vitest run src/sanity/queries.test.ts -t "legal docs"` | ❌ W0 | ⬜ pending |
| 08-01-07 | 01 | 1 | BLDG-06 | unit | `npx vitest run src/sanity/queries.test.ts -t "contractor info"` | ❌ W0 | ⬜ pending |
| 08-01-08 | 01 | 1 | CVIS-01 | unit | `npx vitest run src/sanity/queries.test.ts -t "contractor visibility"` | ❌ W0 | ⬜ pending |
| 08-CROSS-01 | -- | 1 | CROSS | unit | `npx vitest run src/middleware.test.ts -t "building"` | Extend existing | ⬜ pending |
| 08-CROSS-02 | -- | 1 | CROSS | unit | `npx vitest run src/actions/portalActions.test.ts -t "contractor note"` | Extend existing | ⬜ pending |
| 08-CROSS-03 | -- | 1 | CROSS | unit | `npx vitest run src/sanity/schemas/project.test.ts` | Extend existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/coiUtils.ts` + `src/lib/coiUtils.test.ts` — COI expiration badge logic and tests
- [ ] Tests for building manager GROQ queries in `src/sanity/queries.test.ts`
- [ ] Tests for contractor note submission in `src/actions/portalActions.test.ts`
- [ ] Tests for information boundary enforcement in GROQ queries (CONTR-04, CVIS-01 note exclusion)
- [ ] Tests for middleware /building/* route handling in `src/middleware.test.ts`

*Existing vitest infrastructure covers framework/config. Wave 0 adds test stubs for Phase 8 requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Magic link email arrives with correct portal URL | BLDG-02 | Requires Resend email delivery | Trigger "Send Building Access" in Studio, verify email content |
| Floor plan preview renders correctly for images | CONTR-03 | Visual rendering | Open contractor work order, verify image inline preview |
| COI expiration badges show correct colors | BLDG-04 | Visual color verification | View building manager page with valid/expiring/expired COIs |
| Mobile responsive layout for all three portals | CROSS | Visual breakpoint testing | Resize browser through 640px/768px/1024px breakpoints |
| Contractor sees "Contact Liz" instead of client email/phone | CONTR-04 | End-to-end info boundary | Log in as contractor, verify no client contact info visible |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
