---
phase: 47-portal-layout-hoist
verified: 2026-04-30T22:11:00Z
status: passed
score: 18/18 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visual smoke — change wordmark in portalBrand.ts and confirm propagation"
    expected: "Editing DEFAULT_PORTAL_BRAND.wordmark to a test string and visiting /portal/dashboard, /portal/login, /workorder/dashboard, /workorder/login, /building/dashboard, /building/login, /portal/project/{id}, /workorder/project/{id}, /building/project/{id} shows the test string everywhere; revert restores production"
    why_human: "ROADMAP SC#1 'change wordmark in one place updates every page' is the explicit deliverable; only a live render across 9+ routes can prove the prop chain end-to-end"
  - test: "Bare-mode visual on login/role-select pages"
    expected: "/portal/login, /portal/role-select, /workorder/login, /building/login render wordmark centered at top, no role sub-label, no Sign Out anchor, login form below"
    why_human: "Visual centering and absence of sub-label/sign-out is asserted at code level but only visible at render time"
  - test: "Default-mode visual on dashboards and project pages"
    expected: "/portal/dashboard, /workorder/dashboard, /building/dashboard show wordmark + role-specific sub-label LEFT (Client portal | Trade portal | Building portal) and Sign Out RIGHT; no duplicate wordmark in page body"
    why_human: "Role-aware sub-label depends on Astro.locals.role hydration which only happens at request time; visual match to UI-SPEC layout cannot be grep-verified"
  - test: "Banner slot empty-state has zero rendered height"
    expected: "DOM inspection on any portal page shows the <div role='region'> wrapper with the hidden ImpersonationBannerStub div; no visible space above PortalHeader"
    why_human: "Pixel verification of UI-SPEC § Spacing line 62 'When slot is empty: zero rendered height, no layout shift'"
deferred_items:
  - file: src/pages/portal/client/[token].astro
    issue: "Inlined wordmark <p> block remains"
    documented_at: ".planning/phases/47-portal-layout-hoist/deferred-items.md"
    why_deferred: "Plan 03 explicitly excludes /portal/client/* (line 52). Out-of-scope discovery, not a phase-47 deliverable."
---

# Phase 47: Portal Layout Hoist — Verification Report

**Phase Goal:** Portal chrome (header, footer, banner slot) is hoisted into a single `PortalLayout.astro` shell with extracted `PortalHeader` and `PortalFooter` components, so every recipient-facing page in `/portal/*` shares one source of truth for brand mark, role-aware sub-label, sign-out, and the layout slot that the impersonation banner will occupy in Phase 50.

**Verified:** 2026-04-30T22:11:00Z
**Status:** passed (with human visual verification recommended)
**Re-verification:** No — initial verification.

---

## Goal Achievement

### ROADMAP Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| SC-1 | Single `PortalLayout.astro` shell renders same chrome on every `/portal/*` page; `bare` prop covers login/role-select/verify; changing brand-mark in one component updates every page | VERIFIED | `src/components/portal/PortalLayout.astro:90` mounts `<PortalHeader tenant={tenant} bare={bare} />`. All 11 in-scope pages now invoke `<PortalLayout ... tenant={tenant}>` (login pages add `bare`). `tenant.wordmark` is the sole render path inside `PortalHeader.astro:46,66`; no recipient page renders the wordmark string directly. (verify.astro pages are server-side redirects per CONTEXT D-6 and don't render UI.) |
| SC-2 | `PortalHeader.astro` and `PortalFooter.astro` extracted as standalone components; no recipient page inlines its own brand mark or footer | VERIFIED | `src/components/portal/PortalHeader.astro` and `PortalFooter.astro` exist as standalone Astro components. `grep -rE '<footer' src/pages/portal/ src/pages/workorder/ src/pages/building/` returns 0 matches. `grep -rE 'tracking-\[0.2em\] uppercase font-body mb-8' src/pages/portal/ src/pages/workorder/ src/pages/building/` returns ONLY `src/pages/portal/client/[token].astro` (out-of-scope per Plan 03 line 52, logged in `deferred-items.md`). |
| SC-3 | `PortalLayout.astro` exposes layout slot for impersonation banner; renders nothing today; renders sticky banner once Phase 50 lands; verified by stub mounted in this phase | VERIFIED | `PortalLayout.astro:59` declares `<slot name="banner">` with `<ImpersonationBannerStub />` fallback at line 60. `ImpersonationBannerStub.astro` renders only `<div data-testid="banner-slot-mounted" hidden></div>` (zero rendered height). PortalHeader.test.ts § "PortalLayout.astro -- banner slot wiring" describe-block passes (2/2). |

**Score: 3/3 ROADMAP success criteria verified.**

### Observable Truths (from PLAN frontmatter must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PortalHeader.astro exists as standalone Astro component with `bare` prop | VERIFIED | File exists (2183 bytes); `interface Props { tenant?: PortalBrand; bare?: boolean; }` at lines 7-10. |
| 2 | PortalFooter.astro exists as standalone Astro component | VERIFIED | File exists (588 bytes); renders `<footer>` with `tenant.contactEmail` mailto. |
| 3 | ImpersonationBannerStub.astro exists and renders an invisible test-id div | VERIFIED | File exists (465 bytes); body is single line `<div data-testid="banner-slot-mounted" hidden></div>`. |
| 4 | PortalHeader test asserts the chrome contract via source-text grep | VERIFIED | `PortalHeader.test.ts` exists; 10 tests across 3 describe blocks; 10/10 PASS. |
| 5 | PortalLayout exposes a named slot 'banner' rendered above PortalHeader | VERIFIED | `<slot name="banner">` at PortalLayout.astro:59, inside `<div role="region">` wrapper at line 58, ABOVE `<PortalHeader>` at line 90. |
| 6 | PortalLayout mounts PortalHeader (with tenant + bare props) above page slot | VERIFIED | Line 90: `<PortalHeader tenant={tenant} bare={bare} />` precedes default `<slot />` at line 92. |
| 7 | PortalLayout mounts PortalFooter (with tenant prop) below page slot, replacing inlined footer | VERIFIED | Line 94: `<PortalFooter tenant={tenant} />` follows default `<slot />`. No inlined `<footer>` markup remains in PortalLayout.astro. |
| 8 | PortalLayout accepts new `bare?: boolean` prop and forwards it to PortalHeader | VERIFIED | `bare?: boolean` declared at PortalLayout.astro:26; defaulted at line 29; forwarded at line 90. |
| 9 | Existing `?preview=1` cosmetic banner block stays as-is | VERIFIED | `previewMode` const (line 41), `id="preview-banner"` block (lines 64-88), inline script for URL strip (lines 73-87) all preserved. |
| 10 | All 13 pages currently using PortalLayout continue to render | VERIFIED | `npm run build` exits 0 (Server built in 9.25s, all pages compile, no Astro errors). |
| 11 | /portal/dashboard renders wordmark exactly ONCE (no inlined `<p>`) | VERIFIED | dashboard.astro grep returns ZERO inlined wordmark patterns and ZERO inlined sign-out. |
| 12 | /portal/dashboard renders Sign Out exactly ONCE (no inlined `<a href="/portal/logout">`) | VERIFIED | No `/portal/logout` href in dashboard.astro; PortalHeader is the sole renderer. |
| 13 | /portal/project/[projectId] renders wordmark and Sign Out exactly ONCE each | VERIFIED | project/[projectId].astro grep clean; "Back to Dashboard" page-level link preserved. |
| 14 | /portal/[token] (PURL upgrade landing) no longer inlines wordmark | VERIFIED | [token].astro grep clean; passes `tenant={tenant}` to PortalLayout (NOT bare — correct per UI-SPEC). |
| 15 | /portal/login passes bare={true} and removes inlined wordmark | VERIFIED | Line 19: `<PortalLayout title=... tenant={tenant} bare>`. No inlined wordmark. |
| 16 | /portal/role-select passes bare={true} and removes inlined wordmark | VERIFIED | Line 43: `<PortalLayout title=... tenant={tenant} bare>`. No inlined wordmark. |
| 17 | /workorder/* (3 pages) — add tenant fetch, strip inlined chrome, replace "Contractor Portal" with role-derived "Trade portal", login adds bare | VERIFIED | All 3 pages: `getPortalBrand` import + `await getPortalBrand(sanityClient)` + `tenant={tenant}` pass-through. No `Contractor Portal` literal remains. login.astro adds `bare`. No inlined `/workorder/logout` hrefs. No inlined wordmark patterns. No hardcoded `>La Sprezzatura<` literals. |
| 18 | /building/* (3 pages) — same migration as /workorder/*, "Building Manager Portal" → "Building portal" | VERIFIED | All 3 pages: `getPortalBrand` import + fetch + pass-through. No `Building Manager Portal` literal remains. login.astro adds `bare`. No inlined `/building/logout` hrefs. No inlined wordmark patterns. No hardcoded literals. |

**Score: 18/18 must-have truths verified.**

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `src/components/portal/PortalHeader.astro` | Wordmark + role sub-label + sign-out (default); wordmark-only centered (bare) | VERIFIED | All 14 acceptance grep patterns from 47-01 PLAN match: `bare?: boolean`, three sub-labels, `Astro.locals.role`, three logout hrefs, `>Sign Out<`, no `role="banner"` / no `border` / no `bg-` / no `<form>`, padding token present in BOTH default and bare wrappers (count = 2). |
| `src/components/portal/PortalFooter.astro` | Lift-and-shift of inlined footer (displayName + contactEmail mailto) | VERIFIED | Body contains `&bull;` (HTML entity preserved verbatim from prior inlined version), `tenant.contactEmail` reference, no explicit `role` attribute. |
| `src/components/portal/ImpersonationBannerStub.astro` | Empty stub rendering only test-id hidden div | VERIFIED | Body is the single `<div data-testid="banner-slot-mounted" hidden></div>` line; no `<script>`, no `<style>`, no `aria-hidden`. |
| `src/components/portal/PortalHeader.test.ts` | String-grep contract assertions on Header/Stub/Layout | VERIFIED | 3 describe blocks; 10 tests; 10/10 PASS (post-Plan-02 the previously-RED PortalLayout block is now GREEN). |
| `src/components/portal/PortalLayout.astro` | Single layout shell mounting Header + Footer + banner slot | VERIFIED | Imports all 3 sibling components, declares `bare?: boolean` Prop, mounts PortalHeader/PortalFooter, exposes named slot, preserves preview banner block byte-equivalent. |

### Page Migration Artifacts (11 pages)

| Page | tenant Pass-through | Inlined Wordmark Removed | Inlined Sign-Out Removed | Bare Prop | Status |
|------|---------------------|--------------------------|---------------------------|-----------|--------|
| src/pages/portal/dashboard.astro | YES | YES | YES | n/a (default) | VERIFIED |
| src/pages/portal/project/[projectId].astro | YES | YES | YES | n/a (default) | VERIFIED |
| src/pages/portal/[token].astro | YES | YES | n/a | NO (correct) | VERIFIED |
| src/pages/portal/login.astro | YES | YES | n/a | YES | VERIFIED |
| src/pages/portal/role-select.astro | YES | YES | n/a | YES | VERIFIED |
| src/pages/workorder/dashboard.astro | YES (NEW) | YES | YES | n/a | VERIFIED |
| src/pages/workorder/project/[projectId].astro | YES (NEW) | YES | YES | n/a | VERIFIED |
| src/pages/workorder/login.astro | YES (NEW) | YES | n/a | YES | VERIFIED |
| src/pages/building/dashboard.astro | YES (NEW) | YES | YES | n/a | VERIFIED |
| src/pages/building/project/[projectId].astro | YES (NEW) | YES | YES | n/a | VERIFIED |
| src/pages/building/login.astro | YES (NEW) | YES | n/a | YES | VERIFIED |

---

### Key Link Verification

| From | To | Via | Status | Detail |
|------|-----|-----|--------|--------|
| PortalHeader.astro | `Astro.locals.role` | role-aware sub-label + logout endpoint | WIRED | Line 23 `const role = Astro.locals.role`; lines 24,34 derive subLabel and logoutHref from the role; rendered conditionally in markup. |
| PortalHeader.astro | `src/lib/portal/portalBrand.ts` | tenant prop fallback to DEFAULT_PORTAL_BRAND | WIRED | Lines 2-5 import `DEFAULT_PORTAL_BRAND, type PortalBrand`; line 12 destructure `{ tenant = DEFAULT_PORTAL_BRAND, bare = false }`. |
| PortalLayout.astro | PortalHeader.astro | import + invocation with bare and tenant | WIRED | Line 8 import; line 90 `<PortalHeader tenant={tenant} bare={bare} />`. |
| PortalLayout.astro | PortalFooter.astro | import + invocation with tenant prop (replaces inlined footer) | WIRED | Line 9 import; line 94 `<PortalFooter tenant={tenant} />`; no surviving inlined `<footer>` block. |
| PortalLayout.astro | ImpersonationBannerStub.astro | fallback content for `<slot name="banner">` | WIRED | Line 10 import; line 60 `<ImpersonationBannerStub />` is the slot fallback. |
| 11 page templates | PortalLayout.astro | invocation with `tenant={tenant}` (and optional `bare`) | WIRED | All 11 pages confirmed via grep: each contains `<PortalLayout title=... tenant={tenant}` (login pages append `bare`). |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| PortalHeader.astro | `tenant.wordmark`, `tenant.displayName` | `Astro.props.tenant` (default `DEFAULT_PORTAL_BRAND` from portalBrand.ts) | YES — DEFAULT_PORTAL_BRAND defined as `{ wordmark: "LA SPREZZATURA", displayName: "La Sprezzatura", contactEmail: "info@lasprezz.com" }`; pages additionally pass live `getPortalBrand(sanityClient)` results | FLOWING |
| PortalHeader.astro | `Astro.locals.role` | middleware (Phase 49 closure, env.d.ts:10) | YES — middleware sets at 4 branches (env.d.ts type narrows to one of `client \| contractor \| building_manager \| admin \| undefined`) | FLOWING |
| PortalFooter.astro | `tenant.contactEmail` | `Astro.props.tenant` fallback to DEFAULT | YES — same source chain as Header | FLOWING |
| ImpersonationBannerStub.astro | n/a (no data) | n/a | n/a (intentional empty render per UI-SPEC) | n/a |
| PortalLayout.astro | `bare` prop | passthrough from page to PortalHeader | YES — value surfaces from page invocation (5 login/role-select pages set `bare`; 6 dashboard/project pages omit it → defaults `false`) | FLOWING |
| /workorder/dashboard.astro | `tenant` const | NEW `getPortalBrand(sanityClient)` server-side fetch | YES — Sanity client hydrates from siteSettings; falls back to DEFAULT internally | FLOWING |
| /building/dashboard.astro | `tenant` const | NEW `getPortalBrand(sanityClient)` fetch | YES — same source | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| PortalHeader test suite passes | `npx vitest run src/components/portal/PortalHeader.test.ts` | `Test Files 1 passed (1) / Tests 10 passed (10)` | PASS |
| Astro build compiles all 11 migrated pages | `npm run build` | `Server built in 9.25s / build Complete!` (exit 0) | PASS |
| No inlined sign-out anchors in /portal/, /workorder/, /building/ | `grep -rE 'href="/(portal\|workorder\|building)/logout"' src/pages/portal/ src/pages/workorder/ src/pages/building/` | EXIT 1 (no matches) | PASS |
| No legacy "Client/Contractor/Building Manager Portal" sub-labels remain in pages | `grep -rE '"Client Portal"\|"Contractor Portal"\|"Building Manager Portal"\|>Client Portal<\|>Contractor Portal<\|>Building Manager Portal<' src/pages/` | EXIT 1 (no matches) | PASS |
| No hardcoded `>La Sprezzatura<` literals in recipient pages | `grep -rEn '>\s*La Sprezzatura\s*<' src/pages/portal/ src/pages/workorder/ src/pages/building/` | EXIT 1 (no matches) | PASS |
| Sub-label literals exist ONLY in PortalHeader.astro and its test | `grep -rl '"Trade portal"' src/` | Returns only PortalHeader.astro and PortalHeader.test.ts | PASS |
| No surviving inlined `<footer>` in recipient pages | `grep -rEn '<footer' src/pages/portal/ src/pages/workorder/ src/pages/building/` | EXIT 1 (no matches) | PASS |
| Banner slot present in PortalLayout | `grep -nE '<slot\s+name="banner"' src/components/portal/PortalLayout.astro` | line 59 match | PASS |
| ImpersonationBannerStub mounted as fallback | `grep -nE 'ImpersonationBannerStub' src/components/portal/PortalLayout.astro` | line 10 import + line 60 mount | PASS |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|-------------|--------|----------|
| PORTAL-05 | 47-01, 47-02, 47-03, 47-04, 47-05 | Portal header and footer chrome is consistent across every portal page, sourced from a single layout shell (PortalLayout + extracted components) | SATISFIED | Single PortalLayout.astro shell mounts standalone PortalHeader + PortalFooter; verified by 18/18 must-haves and 3/3 ROADMAP success criteria above. |

REQUIREMENTS.md confirms PORTAL-05 maps to Phase 47 only. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/pages/portal/client/[token].astro | 60-62, 82-84 | Inlined wordmark `<p>` block (out-of-scope) | Info | Documented in `deferred-items.md`; explicitly excluded by Plan 03 line 52. Not a regression of the chrome-hoist pattern; this route was never enumerated in the phase scope. Recommended follow-up: small migration plan in v5.3 or v6.0. |
| src/components/portal/PortalLayout.astro | 58-62 | Empty `<div role="region" aria-label="Notifications">` landmark when stub is the slot content | Warning | Surfaced by code review (47-REVIEW.md WR-01). Screen-reader anti-pattern: phantom landmark on every portal page until Phase 50 lands. NOT a phase 47 blocker per phase scope (banner slot wiring is the only requirement); a follow-up fix is recommended before Phase 50 builds on the slot. |
| src/components/portal/PortalHeader.astro | 18-34 | Role maps don't cover `'admin'` branch of `App.Locals.role` | Warning | 47-REVIEW.md WR-02. If admin role somehow reaches the portal layout (currently gated by middleware), header silently collapses to wordmark-only. Acceptable for now; revisit with Phase 49/50. |
| src/components/portal/PortalHeader.test.ts | 16, 30 | Uses `__dirname` (CommonJS global) instead of `import.meta.url` | Info | 47-REVIEW.md WR-04. Tests pass under current vitest config; portability concern for ESM-strict configs. |

**No blocker-grade anti-patterns. All warnings are advisory and tracked in 47-REVIEW.md.**

---

### Pre-Existing Test Debt (Not Caused by Phase 47)

Per context notes, unrelated pre-existing test failures exist in:
- WorkOrderComposeModal (Phase 34 area)
- send-update (Phase 35/46 area)
- react-email work-order (Phase 46)
- WorkflowTemplateEditor (Phase ?)
- generate.ts api (Phase ?)

None of these reference Phase 47 files. Verified by absence of Phase 47 component / page paths in any failing test stack. Not blocking.

---

### Human Verification Required

Phase 47 ships a layout-shell consolidation. Programmatic checks confirm wiring and contract conformance, but the final acceptance for ROADMAP SC#1 ("changing brand-mark wording in one component updates every page") and the visual contract require live render verification. Recommended human checks:

1. **Wordmark propagation smoke test (the SC#1 deliverable):**
   - Edit `src/lib/portal/portalBrand.ts` `DEFAULT_PORTAL_BRAND.wordmark` from `"LA SPREZZATURA"` to `"TEST WORDMARK"`.
   - Run `npm run dev` (port 4321).
   - Visit /portal/dashboard, /portal/login, /workorder/dashboard, /workorder/login, /building/dashboard, /building/login, /portal/project/{id}, /workorder/project/{id}, /building/project/{id}.
   - Expected: `TEST WORDMARK` appears at top of every page.
   - Revert the file edit before committing.

2. **Bare-mode header on login + role-select pages:**
   - Visit /portal/login, /portal/role-select, /workorder/login, /building/login.
   - Expected: wordmark CENTERED at top, no role sub-label, no Sign Out anchor; login form below.

3. **Default-mode header on dashboards + project pages:**
   - Authenticate as client → visit /portal/dashboard. Expected: wordmark + "Client portal" sub-label LEFT, "Sign Out" RIGHT.
   - Authenticate as contractor → visit /workorder/dashboard. Expected: wordmark + "Trade portal" sub-label LEFT, "Sign Out" RIGHT.
   - Authenticate as building manager → visit /building/dashboard. Expected: wordmark + "Building portal" sub-label LEFT, "Sign Out" RIGHT.
   - Confirm NO duplicate wordmark in page body on any of these.

4. **Banner slot zero-height empty state:**
   - On any portal page, open DevTools and inspect the `<body>` first child. Expected: `<div role="region" aria-label="Notifications">` containing `<div data-testid="banner-slot-mounted" hidden></div>`. The hidden attribute should produce zero rendered height (no whitespace gap above PortalHeader). [Note: code review WR-01 flags the empty-region accessibility concern as advisory; this human check is for layout impact, not the a11y debate.]

---

### Gaps Summary

**No gaps. Phase goal is achieved.**

All 11 in-scope recipient pages now consume `PortalLayout` and source chrome from `PortalHeader`/`PortalFooter`. `tenant.wordmark` is the sole render path for the brand mark across the surface. The `<slot name="banner">` is wired with the `ImpersonationBannerStub` fallback, ready for Phase 50.

The single residual inlined wordmark in `src/pages/portal/client/[token].astro` is **explicitly out of scope** per Plan 03 line 52 and is logged in `deferred-items.md`. It does not affect any Phase 47 success criterion or must-have.

Code review (47-REVIEW.md) surfaced 6 advisory warnings (0 blockers). The most material — empty `<region>` landmark with hidden stub content — is a followup item before Phase 50 builds on the slot; it does not gate Phase 47 closure.

Pre-existing test failures in other areas (Phases 34/35/46) are not Phase 47 regressions and are flagged in context notes; they do not block this phase.

**Recommendation:** Status passes. Recommend running the human visual checks (esp. SC#1 wordmark propagation smoke) before declaring milestone done. Recommend creating a tiny followup item to address WR-01 (empty region landmark) before Phase 50 lands the real ImpersonationBanner.

---

_Verified: 2026-04-30T22:11:00Z_
_Verifier: Claude (gsd-verifier)_
