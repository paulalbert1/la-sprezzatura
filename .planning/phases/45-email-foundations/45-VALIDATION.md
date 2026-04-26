---
phase: 45
slug: email-foundations
status: planned
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-26
updated: 2026-04-26
---

# Phase 45 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.2.4 (existing) + Playwright 1.59.x (NEW — 45-PLAN-foundation Task 3 install) |
| **Config file** | `vitest.config.ts` (existing); `playwright.config.ts` (45-PLAN-snapshot-harness Task 2) |
| **Quick run command** | `vitest run src/lib/sendUpdate src/lib/workOrder` |
| **Full suite command** | `npm run test && npm run test:visual` |
| **Estimated runtime** | ~15s Vitest scoped, ~45s with Playwright snapshots |

---

## Plan → Task ID Map

| Plan File | Task IDs |
|-----------|----------|
| 45-PLAN-foundation.md | 45-foundation-T1 (deps), 45-foundation-T2 (npm scripts), 45-foundation-T3 (chromium install) |
| 45-PLAN-tokens.md | 45-tokens-T1 (brand-tokens.ts + shape test), 45-tokens-T2 (generator + global.css swap + round-trip test) |
| 45-PLAN-react-email-scaffold.md | 45-scaffold-T1 (_theme.ts), 45-scaffold-T2 (__scaffold.tsx + scaffold.test.ts) |
| 45-PLAN-snapshot-harness.md | 45-snaps-T1 (Send Update permutations + Work Order baseline Vitest snaps), 45-snaps-T2 (playwright.config.ts + scaffold.spec.ts + PNG baselines) |
| 45-PLAN-asset-host-and-dns.md | 45-assets-T1 (Vercel asset host + curl smoke), 45-assets-T2 (Cloudflare SPF edit + Resend dashboard verify), 45-assets-T3 (docs/email-merge-gate.md), 45-assets-T4 (Outlook desktop scaffold screenshot) |

---

## Sampling Rate

- **After every task commit:** Run `vitest run src/lib/sendUpdate src/lib/workOrder` (golden HTML snaps stay green)
- **After every plan wave:** Run `npm run test && npm run test:visual` (Vitest + Playwright)
- **Before `/gsd-verify-work`:** Full suite must be green AND manual gates captured (curl headers for asset host, Resend dashboard screenshot for DKIM/SPF/DMARC, Outlook desktop screenshot from `liz@lasprezz.com`)
- **Max feedback latency:** ~45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 45-tokens-T2 | tokens | 1 | EMAIL-08 | T-V14-TOK-01 | typed token round-trip; CSS regen deterministic | unit + ci-check | `npm run theme:gen && git diff --exit-code src/styles/_generated-theme.css` | ❌ W0 | ⬜ pending |
| 45-tokens-T2 | tokens | 1 | EMAIL-08 | — | both Tailwind portal and `@react-email/tailwind` resolve same token to same value | unit | `vitest run src/lib/brand-tokens.test.ts` | ❌ W0 | ⬜ pending |
| 45-scaffold-T2 | react-email-scaffold | 2 | EMAIL-08 | T-V5-01 (JSX auto-escape) | `__scaffold.tsx` renders deterministic HTML; values flow from `brand-tokens.ts` | unit | `vitest run src/emails/scaffold.test.ts` | ❌ W0 | ⬜ pending |
| 45-snaps-T1 | snapshot-harness | 2 | EMAIL-09 | — | Send Update golden snaps cover ≥4 section-toggle permutations + baseline | unit (Vitest snapshot) | `vitest run src/lib/sendUpdate` | ⚠️ partial — 1 snap exists | ⬜ pending |
| 45-snaps-T1 | snapshot-harness | 2 | EMAIL-09 | — | Work Order golden baseline snap exists | unit (Vitest snapshot) | `vitest run src/lib/workOrder` | ❌ W0 | ⬜ pending |
| 45-snaps-T2 | snapshot-harness | 2 | EMAIL-09 | — | Playwright harness produces deterministic PNGs at 3 viewports against scaffold | integration (Playwright) | `playwright test tests/email-snapshots/scaffold.spec.ts` | ❌ W0 | ⬜ pending |
| 45-snaps-T2 | snapshot-harness | 2 | EMAIL-09 | — | `--update-snapshots` flow documented and works locally | manual | `playwright test --update-snapshots && git status` | doc | ⬜ pending |
| 45-assets-T1 | asset-host-and-dns | 1 | EMAIL-10 | T-V14-03 | `email-assets.lasprezz.com/wordmark.png` returns 200 | manual (curl smoke) | `curl -sI https://email-assets.lasprezz.com/wordmark.png \| grep '^HTTP'` | manual | ⬜ pending |
| 45-assets-T1 | asset-host-and-dns | 1 | EMAIL-10 | T-V14-03 | response carries `Cache-Control: public, max-age=31536000, immutable` | manual (curl smoke) | `curl -sI https://email-assets.lasprezz.com/wordmark.png \| grep -i cache-control` | manual | ⬜ pending |
| 45-assets-T1 | asset-host-and-dns | 1 | EMAIL-10 | T-V14-03 | response has NO `Set-Cookie` header (cookie-less) | manual (curl smoke) | `curl -sI https://email-assets.lasprezz.com/wordmark.png \| grep -ic set-cookie  # expect 0` | manual | ⬜ pending |
| 45-assets-T1 | asset-host-and-dns | 1 | EMAIL-10 | T-V14-PROXY-01 | Cloudflare CNAME for email-assets is DNS-only / grey cloud (no double-CDN) | manual (dig) | `dig +short CNAME email-assets.lasprezz.com \| grep -ic vercel` | manual | ⬜ pending |
| 45-assets-T2 | asset-host-and-dns | 1 | EMAIL-11 | T-V14-01 (spoofing) | SPF includes `amazonses.com` | manual (dig) | `dig +short TXT lasprezz.com \| grep -i amazonses` | live blocker | ⬜ pending |
| 45-assets-T2 | asset-host-and-dns | 1 | EMAIL-11 | T-V14-DUPSPF-01 | exactly one SPF record at apex (no duplicates / PermError) | manual (dig) | `dig +short TXT lasprezz.com \| grep -c '^"v=spf1'  # expect 1` | manual | ⬜ pending |
| 45-assets-T2 | asset-host-and-dns | 1 | EMAIL-11 | T-V14-02 | DKIM `resend._domainkey.lasprezz.com` resolves and matches Resend public key | manual (dig + dashboard) | `dig +short TXT resend._domainkey.lasprezz.com` + screenshot | manual | ⬜ pending |
| 45-assets-T2 | asset-host-and-dns | 1 | EMAIL-11 | T-V14-04 | DMARC `_dmarc.lasprezz.com` exists with at minimum `p=none` and an `rua=mailto:` reporting address | manual (dig) | `dig +short TXT _dmarc.lasprezz.com` | partial — exists | ⬜ pending |
| 45-assets-T2 | asset-host-and-dns | 1 | EMAIL-11 | T-V14-01..04 | Resend dashboard shows green for DKIM, SPF, DMARC for `lasprezz.com` | manual (screenshot) | screenshot in phase summary | manual | ⬜ pending |
| 45-assets-T3 | asset-host-and-dns | 1 | EMAIL-09 (procedural) | — | `docs/email-merge-gate.md` documents Outlook desktop manual procedure for Phase 46+ | doc | `test -f docs/email-merge-gate.md && grep -c '^# Email Merge Gate' docs/email-merge-gate.md` | ❌ W0 | ⬜ pending |
| 45-assets-T4 | asset-host-and-dns | 1 | EMAIL-09 (procedural) | — | Outlook desktop scaffold screenshot captured + checklist passes | manual (screenshot + checklist) | screenshot path recorded in summary | manual | ⬜ pending |
| 45-foundation-T1 | foundation | 0 | EMAIL-08 + EMAIL-09 (enabling) | — | All Phase 45 deps direct (not transitive); existing tests still pass | unit | `npm test` | ❌ W0 | ⬜ pending |
| 45-foundation-T2 | foundation | 0 | EMAIL-08 (enabling) | — | npm scripts wired exactly: theme:gen, prebuild, predev, test:email, test:visual, test:visual:update | shape-check | grep on package.json scripts block (see plan) | ❌ W0 | ⬜ pending |
| 45-foundation-T3 | foundation | 0 | EMAIL-09 (enabling) | — | Playwright Chromium binary installed locally | shape-check | `npx playwright --version \| grep -E '^Version 1.59'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] (45-foundation-T1) Add `@vitejs/plugin-react@^6.0.1` to `package.json` devDependencies (pre-existing config bug — currently transitive only)
- [ ] (45-foundation-T1) Add `@playwright/test@^1.59.1` devDep + run `npx playwright install chromium`
- [ ] (45-foundation-T1) Add `tsx`, `react-email@^6.0.0`, `@react-email/components@^1.0.12`, `@react-email/render@^2.0.7`, `@react-email/tailwind@^2.0.7`
- [ ] (45-foundation-T2) Add npm scripts: `theme:gen`, `prebuild` (chains `theme:gen`), `predev` (chains `theme:gen`), `test:email`, `test:visual`, `test:visual:update`
- [ ] (45-foundation-T3) `npx playwright install chromium`
- [ ] (45-tokens-T1) Create `src/lib/brand-tokens.ts` (tokens extracted from current `global.css`)
- [ ] (45-tokens-T1) Create `src/lib/brand-tokens.test.ts` (shape assertions; co-located, not under `__tests__/`)
- [ ] (45-tokens-T2) Create `scripts/generate-theme-css.ts` and run once to write `src/styles/_generated-theme.css`
- [ ] (45-tokens-T2) Edit `src/styles/global.css` to `@import "./_generated-theme.css"` instead of inlining migrated tokens (keep animations + container-text + @theme inline font bridge)
- [ ] (45-tokens-T2) Append round-trip + freshness assertions to `src/lib/brand-tokens.test.ts`
- [ ] (45-scaffold-T1) Create `src/emails/_theme.ts` (mirrors `brand-tokens.ts` into a `@react-email/tailwind` config object; pixelBasedPreset present)
- [ ] (45-scaffold-T2) Create `src/emails/__scaffold.tsx` placeholder component
- [ ] (45-scaffold-T2) Create `src/emails/scaffold.test.ts` (co-located, not under `__tests__/`)
- [ ] (45-snaps-T1) Add 4 permutation snapshot tests to `src/lib/sendUpdate/emailTemplate.test.ts` (no-procurement, no-artifacts, no-milestones, with personal note)
- [ ] (45-snaps-T1) Add 2 snapshot tests to `src/lib/workOrder/emailTemplate.test.ts` (baseline + escaped title) — NEW `__snapshots__/` directory
- [ ] (45-snaps-T2) Create `playwright.config.ts` at repo root
- [ ] (45-snaps-T2) Create `tests/email-snapshots/` directory + `scaffold.spec.ts` first spec
- [ ] (45-snaps-T2) Generate + commit baseline PNGs at three viewport widths
- [ ] (45-assets-T3) Create `docs/email-merge-gate.md` (Outlook desktop manual procedure for Phase 46+)
- [ ] (45-assets-T1) Create `~/Dropbox/GitHub/la-sprezzatura-email-assets/` repo (separate Vercel project) with `vercel.json`, `public/wordmark.png`, `public/brand-mark.png`, `README.md`
- [ ] (45-tokens-T2) CI: add `theme:gen` freshness check (regenerate, then `git diff --exit-code`) — surface in phase summary even if a separate phase wires the CI workflow

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `email-assets.lasprezz.com` is reachable, has correct cache headers, and is cookie-less | EMAIL-10 | DNS / CDN propagation is environment-dependent; first verification happens after the standalone Vercel project is provisioned and the Cloudflare CNAME (DNS-only / grey cloud) is in place. | Run `curl -sI https://email-assets.lasprezz.com/wordmark.png`. Confirm: status `200`, `Cache-Control: public, max-age=31536000, immutable`, no `Set-Cookie` header. Capture output in phase summary. |
| Resend dashboard shows DKIM, SPF, DMARC green for `lasprezz.com` | EMAIL-11 | Verification UI is Resend's, not ours. No public API surface required this phase. | Log in to Resend → Domains → `lasprezz.com`. Screenshot. Attach to phase summary. |
| Outlook desktop renders the `__scaffold` component without layout collapse (proof-of-pipeline) | EMAIL-09 | DIY harness covers Chromium-based clients only; Outlook's Word-render engine is out of scope for Playwright. Procedural per CONTEXT D-10. | Send the scaffold render to `liz@lasprezz.com`, screenshot in Outlook desktop, attach to phase summary. Document this as the canonical merge-gate procedure in `docs/email-merge-gate.md` for Phase 46+ to inherit. |
| SPF includes `amazonses.com` after Cloudflare DNS edit | EMAIL-11 | DNS edit is Cloudflare-side and propagation is asynchronous. | Edit SPF in Cloudflare DNS to `v=spf1 include:spf.protection.outlook.com include:amazonses.com -all`. Wait for propagation. Verify: `dig +short TXT lasprezz.com \| grep amazonses`. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (manual gates flagged explicitly for the asset-host + DNS tasks; rest are automated)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (foundation/tokens/scaffold/snapshot-harness Vitest tasks form a continuous automated chain)
- [x] Wave 0 covers all MISSING references (Playwright install, react-email packages, brand-tokens.ts, generated theme, scaffold, asset repo)
- [x] No watch-mode flags (all `vitest run`, all `playwright test` — no `vitest`/`playwright test --ui`)
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (planner) — 2026-04-26
