---
phase: 34
slug: settings-and-studio-retirement
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
updated: 2026-04-11
---

# Phase 34 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from `34-RESEARCH.md` § 8 (Validation Architecture). Vitest-only coverage — no Playwright / E2E framework installed, acceptance documented as a Phase 34 tradeoff (KR-10). `nyquist_compliant: true` is set because every task in every plan points to a real (or stub) test file; `wave_0_complete` flips to true after Plan 01 (Wave 0) commits the stubs.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (version per `package.json devDependencies`) |
| **Config file** | `vitest.config.ts` — existing; aliases `sanity:client` → `src/__mocks__/sanity-client.ts` so integration tests get a fixture-driven Sanity stub. Include glob covers `*.test.ts` + `*.test.tsx` (Phase 33 fix `d8d6301`). |
| **Quick run command** | `npx vitest run <path-glob>` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15–30 seconds for the full suite (57 existing files + Phase 34 additions); < 5 seconds for file-level reruns |
| **E2E framework** | **NOT installed.** No `playwright.config.ts`, no `/tests` directory. Phase 34 ships with Vitest unit + integration coverage ONLY. Manual UAT covers real-browser flows (Send Update modal, drag-reorder, client dashboard navigation). |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <file-glob>` for the file(s) just touched. Target: < 5 seconds.
- **After every plan wave:** Run the Phase 34 subset:
  ```bash
  npx vitest run \
    src/lib/sendUpdate \
    src/lib/portal \
    src/pages/api/send-update \
    src/pages/api/admin/clients \
    src/pages/api/admin/site-settings \
    src/pages/api/admin/upload-sanity-image \
    src/pages/api/blob-upload.test.ts \
    src/components/admin/settings \
    src/components/admin/SendUpdateModal.test.tsx \
    src/components/admin/RegenerateLinkDialog.test.tsx \
    src/components/admin/ui \
    src/middleware.test.ts \
    src/sanity/schemas/client.test.ts
  ```
- **Before `/gsd-verify-work`:** Full suite `npx vitest run` must be green. All 57 existing tests + Phase 34 additions pass.
- **Max feedback latency:** 30 seconds (full suite). File-level: 5 seconds.

---

## Per-Task Verification Map

> Rows map each Phase 34 task to the Vitest file that verifies it. Status column is marked `⬜ pending` until execution lands; flips to `✅ green` as tasks commit. Secure Behavior column cites the threat model entry; `—` means not security-critical.
>
> **Plan slug conventions:** `wave0` = Plan 01 (wave0-test-stubs), `primitives` = Plan 02 (foundation-primitives), `settings` = Plan 03 (settings-surface), `send-update` = Plan 04 (send-update-surface), `purl` = Plan 05 (per-client-purl), `dashboard` = Plan 06 (client-dashboard), `studio` = Plan 07 (studio-removal).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 34-01-01 | wave0 | 0 | SETT-01..06 | — | Creates 8 React component test stubs | stub | `npx vitest run src/components/admin/ui src/components/admin/settings src/components/admin/SendUpdateModal.test.tsx src/components/admin/RegenerateLinkDialog.test.tsx` | ⬜ created by plan | ⬜ pending |
| 34-01-02 | wave0 | 0 | SETT-01..06 | — | Creates 11 API/lib/middleware/schema stubs + rewrites VALIDATION.md task IDs | stub | `npx vitest run src/lib/sendUpdate src/pages/api/send-update src/pages/api/admin src/pages/api/blob-upload.test.ts src/lib/portal src/middleware.test.ts src/sanity/schemas/client.test.ts src/lib/renderingAuth.test.ts src/lib/generateToken.test.ts` | ⬜ created by plan | ⬜ pending |
| 34-01-03 | wave0 | 0 | — | — | Full-suite green check (no regressions) | stub | `npx vitest run` | ✅ infra exists | ⬜ pending |
| 34-02-01 | primitives | 1 | (primitive) | — | AdminModal focus-trap, overlay dismiss, disableDismiss | unit | `npx vitest run src/components/admin/ui/AdminModal.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-02-01 | primitives | 1 | (primitive) | — | AdminToast auto-dismiss, variants, action callback | unit | `npx vitest run src/components/admin/ui/AdminToast.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-02-01 | primitives | 1 | (primitive) | — | CollapsibleSection toggle + chevron rotation + conditional body | unit | `npx vitest run src/components/admin/ui/CollapsibleSection.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-02-01 | primitives | 1 | (primitive) | — | TagInput add/remove/duplicate/empty/email validation | unit | `npx vitest run src/components/admin/ui/TagInput.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-02-02 | primitives | 1 | SETT-02 | T-34-02 | /api/blob-upload admin gate backfill (PUT + POST) | integration | `npx vitest run src/pages/api/blob-upload.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-02-02 | primitives | 1 | SETT-02 | T-34-02 | /api/admin/upload-sanity-image admin gate + MIME allowlist + Sanity asset upload | integration | `npx vitest run src/pages/api/admin/upload-sanity-image.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-02-03 | primitives | 1 | — | — | ENGAGEMENT_LABELS extraction (no test — grep + astro check) | manual grep | `grep -c "const ENGAGEMENT_LABELS" src/components/portal/ProjectHeader.astro src/pages/portal/dashboard.astro` (expected 0) | ✅ infra | ⬜ pending |
| 34-03-01 | settings | 2 | SETT-01, SETT-03, SETT-06 | T-34-01 | site-settings API admin gate + update/heroSlideshow/reorder/remove actions + updateLog append | integration | `npx vitest run src/pages/api/admin/site-settings.test.ts src/lib/renderingAuth.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-03-02 | settings | 2 | SETT-02 | — | HeroSlideshowEditor arrayMove + alt required + Sanity asset upload (NOT blob pathname) | unit | `npx vitest run src/components/admin/settings/HeroSlideshowEditor.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-03-03 | settings | 2 | SETT-01..03 | — | SettingsPage 4 collapsible sections + sticky footer + dirty tracking | unit | `npx vitest run src/components/admin/settings/SettingsPage.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-04-01 | send-update | 2 | SETT-04, SETT-05 | — | buildSendUpdateEmail extraction — pure renderer with ctaHref param (no hardcoded /portal/dashboard) | unit | `npx vitest run src/lib/sendUpdate/emailTemplate.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-04-02 | send-update | 2 | SETT-04, SETT-06 | T-34-03, T-34-05 | /api/send-update usePersonalLinks serial loop + setIfMissing + re-fetch race resolution; /api/send-update/preview admin gate (T-34-04) | integration | `npx vitest run src/pages/api/send-update.test.ts src/pages/api/send-update/preview.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-04-03 | send-update | 2 | SETT-04 | — | SendUpdateModal default checkbox states (Pending reviews OFF per D-15) + Preview new tab + Send flow | unit | `npx vitest run src/components/admin/SendUpdateModal.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-05-01 | purl | 3 | SETT-04 | — | client schema has portalToken field (string, readOnly, no initialValue — lazy per D-18) + regenerate-portal-token action in /api/admin/clients | integration | `npx vitest run src/sanity/schemas/client.test.ts src/pages/api/admin/clients.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-05-02 | purl | 3 | SETT-04 | — | RegenerateLinkDialog confirm → POST → success toast with URL + Copy link button | unit | `npx vitest run src/components/admin/RegenerateLinkDialog.test.tsx` | ⬜ Wave 0 | ⬜ pending |
| 34-05-03 | purl | 3 | SETT-04 | — | ClientChipWithRegenerate wiring in project detail page (no test — grep + astro check) | manual grep | `grep -n "ClientChipWithRegenerate" src/pages/admin/projects/[projectId]/index.astro` (expected ≥1) | ✅ infra | ⬜ pending |
| 34-06-01 | dashboard | 3 | SETT-04 | T-34-07 | portalTokenHash helper + createPurlSession (7-day TTL) + clientDashboard resolver | integration | `npx vitest run src/lib/portal src/lib/session.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-06-02 | dashboard | 3 | SETT-04 | T-34-07, T-34-08 | Middleware PUBLIC_PATHS entry + PURL session hash re-validation + read-only gate on mutation endpoints | integration | `npx vitest run src/middleware.test.ts` | ⬜ Wave 0 | ⬜ pending |
| 34-06-03 | dashboard | 3 | SETT-04 | T-34-06 | /portal/client/[token] route renders dashboard on valid, fallback on invalid, creates PURL session | manual build | `npx astro check && npx astro build` | ✅ infra | ⬜ pending |
| 34-07-01 | studio | 3 | SETT-07, SETT-08 | — | Strip Studio schema imports + delete structure.ts | manual build | `grep -c "BlobFileInput\|PortalUrlDisplay\|ScheduleItemPicker\|DependencyPreview" src/sanity/schemas/project.ts` (expected 0) + `npx tsc --noEmit && npx astro check` | ✅ infra | ⬜ pending |
| 34-07-02 | studio | 3 | SETT-07, SETT-08 | — | Delete Studio component files + drop studioBasePath | manual build | `grep -n "studioBasePath" astro.config.mjs` (expected 0) + `npx astro build` | ✅ infra | ⬜ pending |
| 34-07-03 | studio | 3 | SETT-07, SETT-08 | — | Annotate REQUIREMENTS.md with reinterpretation | manual grep | `grep -n "SETT-07.*superseded\|SETT-08.*satisfied" .planning/REQUIREMENTS.md` (expected ≥2) | ✅ infra | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Total tasks:** 24 (Wave 0 = 3, Wave 1 = 5, Wave 2 = 6, Wave 3 = 10)

**Duplicated task IDs note:** Plan 02 (primitives) has Task 1 building 4 primitives that each have their own test file — the single task verifies via 4 separate `npx vitest run` commands, so the rows duplicate the `34-02-01` ID across 4 test files. This is intentional: a single task covers multiple primitives in one TDD pass. Plan 03 primitives similarly share IDs across sections built in one task.

---

## Wave 0 Requirements

Before any implementation wave starts, these files must exist as `it.todo` stubs so Nyquist verifier can see the sampling grid. Plan 01 (Wave 0) creates every file below.

- [ ] `src/lib/sendUpdate/emailTemplate.test.ts` — buildSendUpdateEmail branches (personal note on/off, each section combo, usePersonalLinks CTA, procurement hidden for non-full-interior-design, empty-state, snapshot against legacy)
- [ ] `src/pages/api/send-update.test.ts` — multi-client lazy-gen, serial recipient loop, re-fetch on setIfMissing race, `usePersonalLinks: false` fallback
- [ ] `src/pages/api/send-update/preview.test.ts` — new endpoint: HTML Content-Type, admin gate (T-34-04), no write side effects, per-client CTA preview
- [ ] `src/pages/api/admin/site-settings.test.ts` — POST actions: update, appendHeroSlide, updateHeroSlide, reorderHeroSlideshow, removeHeroSlide, renderingAllocation min/max, alt required, admin gate (T-34-01)
- [ ] `src/pages/api/admin/upload-sanity-image.test.ts` — admin gate (T-34-02), MIME allowlist, asset document shape returned
- [ ] `src/pages/api/admin/clients.test.ts` — extend existing (grep first): add `regenerate-portal-token` action; reject missing clientId; reject non-admin
- [ ] `src/pages/api/blob-upload.test.ts` — PUT/POST admin gates (backfill security for existing endpoint, T-34-02)
- [ ] `src/lib/portal/clientDashboard.test.ts` — resolver extracted from `[token].astro` so it's unit-testable: valid/invalid/empty-projects/hashPortalToken
- [ ] `src/middleware.test.ts` — PURL session creation, `PUBLIC_PATHS` match, hash re-validation on every request, read-only gate on `session.source === "purl"`
- [ ] `src/sanity/schemas/client.test.ts` — portalToken field presence + shape (type string, readOnly, no initialValue)
- [ ] `src/components/admin/settings/SettingsPage.test.tsx` — root page renders 4 collapsible sections + sticky footer
- [ ] `src/components/admin/settings/HeroSlideshowEditor.test.tsx` — arrayMove, alt required, upload callback receives Sanity asset
- [ ] `src/components/admin/SendUpdateModal.test.tsx` — default checkbox states (D-15: Pending reviews OFF), action routing, Preview new-tab
- [ ] `src/components/admin/RegenerateLinkDialog.test.tsx` — confirm flow, copy-link toast with 1.5s flip
- [ ] `src/components/admin/ui/CollapsibleSection.test.tsx` — toggle/rotation/conditional body
- [ ] `src/components/admin/ui/TagInput.test.tsx` — add/remove/duplicate/empty/email validation
- [ ] `src/components/admin/ui/AdminModal.test.tsx` — focus trap, dismiss paths, size variant
- [ ] `src/components/admin/ui/AdminToast.test.tsx` — auto-dismiss, variant colors, action button
- [ ] `src/lib/renderingAuth.test.ts` — EXTEND existing file: edge cases in `buildUsageDocId` (plus-alias, case-normalization, unicode) + case-normalized exclusion comparison
- [ ] `src/lib/generateToken.test.ts` — EXTEND existing file: `generatePortalToken(8)` returns exactly 8 chars from the 62-char alphabet

**Framework install:** none needed — Vitest is already set up. Wave 0 ONLY creates `it.todo` stubs that fail loudly when the implementation lands without the test.

**Expected stub counts (grep acceptance):**
- AdminModal: 10 it.todo
- AdminToast: 8 it.todo
- CollapsibleSection: 6 it.todo
- TagInput: 8 it.todo
- SettingsPage: 6 it.todo
- HeroSlideshowEditor: 8 it.todo
- SendUpdateModal: 12 it.todo
- RegenerateLinkDialog: 6 it.todo
- emailTemplate: 10 it.todo
- send-update API: 12 it.todo
- send-update/preview: 8 it.todo
- site-settings: 14 it.todo
- upload-sanity-image: 6 it.todo
- blob-upload: 6 it.todo
- clients (new regenerate-portal-token describe): 6 it.todo
- clientDashboard: 8 it.todo
- middleware: 14 it.todo
- client schema: 4 it.todo
- renderingAuth (EXTENDED): +5 it.todo
- generateToken (EXTENDED): +2 it.todo

**Total new it.todo entries added by Wave 0: ~149**

---

## Manual-Only Verifications

> Behaviors that cannot be automated without Playwright / a real browser. Phase 34 accepts this as a tradeoff (KR-10). Each is tracked in the phase UAT (`.planning/phases/34-settings-and-studio-retirement/34-UAT.md` — to be created during execution).

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Hero slideshow drag-to-reorder via mouse + keyboard (dnd-kit keyboard sensor) | SETT-02 | dnd-kit DOM events require a real browser; JSDOM doesn't simulate pointer move/drop reliably | 1) Open `/admin/settings`, expand Hero Slideshow. 2) Grab first row by drag handle, drop at position 3. 3) Save. Reload page, verify order persists. 4) Repeat with keyboard: Tab to handle, Space, ArrowDown×2, Space, Save. |
| Modal overlay click vs. internal click discrimination | SETT-04 | `document.elementFromPoint` timing differs in JSDOM | 1) Open Send Update modal. 2) Click inside the personal note textarea — modal stays open. 3) Click on the dark overlay — modal dismisses. 4) Open modal, press Escape — dismisses. |
| Send Update email actually renders in a real email client | SETT-04, SETT-05 | Email client CSS differs from browser CSS | 1) Open modal, click Preview — opens new tab with rendered HTML. 2) Send update to a test client. 3) Open resulting email in Gmail (web), Gmail (iOS), Apple Mail. Verify logo, hero image (if any), section blocks, CTA button render correctly. |
| Client dashboard session expiry (7-day) | D-19 | TTL behavior is time-dependent | 1) Send Update to test client with `usePersonalLinks: true`. 2) Open received email in a private window; click link. 3) Verify dashboard loads. 4) Click "View project" → project detail loads. 5) Manually adjust system clock or inspect cookie expiry; re-open the link after 8 days; verify redirect to `/portal/login`. |
| Token regeneration kills active PURL session (T-34-07) | D-22 | Requires two browser sessions + Sanity write timing | 1) Open PURL link in browser A — dashboard loads. 2) In browser B, Liz regenerates Sarah's link via admin. 3) In browser A, navigate to any project card — verify redirect to `/portal/login` (middleware hash mismatch). |
| Vercel Blob upload size cap for hero slideshow (>4.5MB) | SETT-02 | Client-side rejection check | 1) Prepare a 6MB image. 2) Open Hero Slideshow editor, attempt upload. 3) Verify inline error "Image exceeds 4.5MB limit". 4) Upload a 3MB image; verify it persists as Sanity asset and renders on public homepage via `@sanity/image-url`. |
| Studio removal — no orphan imports survive `astro build` | SETT-07, SETT-08 | `tsc --noEmit` is automated, but `astro build` is the ground-truth build | 1) After Studio removal plan merges, run `npx astro build` locally. 2) Verify build succeeds, no missing-module errors. 3) Deploy preview. 4) Navigate to `/admin` (old Studio URL) — verify it serves the new admin dashboard (redirects to /admin/dashboard per Phase 33 `fecc1d5`), not a 500. |
| AdminToast stacking + manual dismiss | (primitive) | Timing + animation | 1) Trigger three consecutive toasts. 2) Verify they stack bottom-up. 3) Hover one — timer pauses. 4) Click X on middle toast — top/bottom reflow correctly. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (manual-only flagged above)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (the `it.todo` stubs satisfy this)
- [x] Wave 0 covers all MISSING references listed above
- [x] No watch-mode flags (`vitest run`, not `vitest watch`)
- [x] Feedback latency < 30s for full suite, < 5s for file-level
- [x] `nyquist_compliant: true` set in frontmatter — every task row points to a real test file (stubs pending Wave 0)
- [x] `wave_0_complete` — flipped true by Plan 01 (Wave 0) 2026-04-11 after all 20 stub files committed

**Approval:** planning-complete 2026-04-11; execution pending.

---

## Threat Model Cross-Reference

| Threat ID | Mitigation Plan | Task(s) |
|-----------|-----------------|---------|
| T-34-01 — Non-admin writes siteSettings | settings | 34-03-01 |
| T-34-02 — Unauthenticated upload | primitives | 34-02-02 |
| T-34-03 — Unauthorized Send Update trigger | send-update | 34-04-02 |
| T-34-04 — Preview leaks project details to non-admin | send-update | 34-04-02 |
| T-34-05 — Lazy-gen setIfMissing race leaks wrong token | send-update | 34-04-02 |
| T-34-06 — PURL forwarding (accepted — 7-day TTL + regen kill) | dashboard | (residual — documented in 34-PLAN-client-dashboard.md threat_model) |
| T-34-07 — PURL session survives token regeneration | dashboard | 34-06-02 |
| T-34-08 — PURL session used to mutate data | dashboard | 34-06-02 |
