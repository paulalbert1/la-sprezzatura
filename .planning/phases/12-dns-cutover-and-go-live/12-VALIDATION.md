---
phase: 12
slug: dns-cutover-and-go-live
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification (infrastructure phase — no automated test suite) |
| **Config file** | N/A |
| **Quick run command** | `dig MX lasprezz.com +short && dig TXT lasprezz.com +short && curl -sI https://lasprezz.com` |
| **Full suite command** | See Per-Task Verification Map commands below |
| **Estimated runtime** | ~30 seconds (DNS queries + HTTP checks) |

---

## Sampling Rate

- **After every task commit:** Run quick run command to verify DNS propagation
- **After every plan wave:** Run full verification commands for all completed steps
- **Before `/gsd:verify-work`:** All 5 success criteria must be TRUE
- **Max feedback latency:** 60 seconds (DNS propagation may add delay)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | INFRA-01 | manual | `dig NS lasprezz.com +short` | N/A | ⬜ pending |
| 12-01-02 | 01 | 1 | INFRA-01 | manual | `dig NS lasprezzaturany.com +short` | N/A | ⬜ pending |
| 12-01-03 | 01 | 1 | INFRA-01 | manual | `dig NS lasprezzny.com +short` | N/A | ⬜ pending |
| 12-01-04 | 01 | 1 | INFRA-01 | manual | `dig NS casadeolivier.com +short` | N/A | ⬜ pending |
| 12-02-01 | 02 | 1 | INFRA-06 | manual | `curl -vI https://lasprezz.com 2>&1 \| grep "SSL certificate"` | N/A | ⬜ pending |
| 12-02-02 | 02 | 1 | INFRA-02 | manual | `dig MX lasprezz.com +short` | N/A | ⬜ pending |
| 12-02-03 | 02 | 1 | INFRA-02 | manual | `dig TXT lasprezz.com +short` (SPF check) | N/A | ⬜ pending |
| 12-02-04 | 02 | 1 | INFRA-03 | manual | Send/receive test on liz@, info@, paul@lasprezz.com | N/A | ⬜ pending |
| 12-03-01 | 03 | 2 | INFRA-04 | manual | `curl -I https://lasprezzaturany.com` | N/A | ⬜ pending |
| 12-03-02 | 03 | 2 | INFRA-04 | manual | `curl -I https://lasprezzny.com` | N/A | ⬜ pending |
| 12-03-03 | 03 | 2 | INFRA-04 | manual | `curl -I https://casadeolivier.com` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — all verification uses standard CLI tools (dig, curl, whois).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cloudflare nameservers active | INFRA-01 | DNS propagation timing varies | Run `dig NS lasprezz.com +short` — expect Cloudflare NS records |
| Email delivery to M365 | INFRA-02 | Requires real email send/receive | Send email to liz@lasprezz.com, verify delivery + check headers for SPF/DKIM/DMARC pass |
| All 3 mailboxes functional | INFRA-03 | Requires human confirmation | Liz sends/receives on liz@, info@, paul@lasprezz.com within 1 hour |
| Domain redirects working | INFRA-04 | Requires HTTP request verification | Visit lasprezzaturany.com, lasprezzny.com, casadeolivier.com — all should 301 to lasprezz.com |
| SSL valid on all domains | INFRA-06 | Certificate provisioning timing | `curl -vI https://lasprezz.com 2>&1 \| grep "SSL certificate"` on all 4 domains |
| Resend domain verified | INFRA-08 | Dashboard verification required | Check Resend dashboard for send.lasprezz.com status; send test transactional email |

---

## Validation Sign-Off

- [ ] All tasks have manual verify commands or Liz confirmation steps
- [ ] Sampling continuity: verification after each DNS change before proceeding
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
