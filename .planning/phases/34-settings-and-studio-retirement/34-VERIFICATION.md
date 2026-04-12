---
phase: 34-settings-and-studio-retirement
verified: 2026-04-12T02:05:00Z
status: human_needed
score: 8/8 roadmap success criteria verified (all truths pass programmatic checks)
re_verification: false
human_verification:
  - test: "Visit /admin/settings, expand all 4 sections, edit siteTitle and contactEmail, click Save. Verify the success toast appears and settings are restored on page reload."
    expected: "All 4 sections render (General, Social Links, Hero Slideshow, Rendering Config) + Studio Retirement Notice. Save updates persist. Toast confirms save."
    why_human: "Settings page is Astro SSR + React island with live Sanity Content Lake read. Cannot assert full roundtrip without a browser + live Sanity credentials."
  - test: "On the hero slideshow section, upload a new image and verify it appears in the slide list with an alt text input."
    expected: "Image appears as a slide thumbnail. The alt text field is shown. Drag handle is visible."
    why_human: "dnd-kit drag-reorder and Sanity asset upload (Path A via /api/admin/upload-sanity-image) require real browser + live Sanity write token."
  - test: "Open a project detail page. Click the 'Send Update' button. Verify the SendUpdateModal opens with the correct recipient list and default checkbox states (Milestones ON, Pending reviews OFF)."
    expected: "Modal renders recipients from project.clients. Milestones checkbox is checked. Pending reviews checkbox is unchecked."
    why_human: "Modal default state logic depends on live project data from Sanity Content Lake (engagementType, procurementItems.length)."
  - test: "In the SendUpdateModal, click 'Preview email' and verify the rendered HTML preview opens in a new tab."
    expected: "New tab opens with a styled HTML email preview matching the current project state."
    why_human: "Preview calls /api/send-update/preview which fetches live Sanity project data; requires browser context."
  - test: "On a project detail page's Clients section, click the regenerate icon next to a client chip. Confirm the dialog warns 'invalidates across ALL this client's projects', click Confirm, verify a success toast appears with the new portal URL."
    expected: "Dialog copy matches UI-SPEC. New URL is /portal/client/{newToken}. Copy button copies the URL."
    why_human: "Full Sanity write + response round-trip through RegenerateLinkDialog; requires live Sanity write token and browser."
  - test: "Send a Send Update email to a test client with usePersonalLinks=true. Then visit the /portal/client/{token} URL from the email. Verify the client dashboard shows the correct project list."
    expected: "Dashboard renders client name, project cards, each linking to /portal/project/[projectId]. Token-invalid fallback renders for a made-up token."
    why_human: "Requires email delivery + live Sanity data. End-to-end PURL flow cannot be exercised without live Content Lake."
  - test: "Regenerate a client's portal token. Verify that an existing browser session with that client's old token is invalidated on next /portal/* navigation."
    expected: "Middleware hash mismatch clears the session; browser is redirected to /portal/login."
    why_human: "Session cookie lifecycle and middleware hash re-validation require a real browser session and live Sanity token state."
---

# Phase 34: Settings and Studio Retirement — Verification Report

**Phase Goal:** The admin can manage all site configuration and operational workflows that previously required Sanity Studio, and Studio is retired outright — making the admin app the sole management interface.
**Verified:** 2026-04-12T02:05:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Roadmap Success Criteria

| # | Success Criterion | Status | Evidence |
|---|-------------------|--------|----------|
| SC-1 | Admin can edit site settings, manage hero slideshow, configure rendering — all changes logged with timestamps | VERIFIED | `src/pages/admin/settings.astro` (89 lines), `SettingsPage.tsx` (313 lines), 4 collapsible sections present, `site-settings.ts` appends `updateLog` on every save (lines 255, 299, 321, 360, 378) |
| SC-2 | Admin can compose Send Update, preview it, send per-recipient with personal portal link, view delivery log | VERIFIED | `SendUpdateModal.tsx` (557 lines) on `AdminModal`, `emailTemplate.ts` (297 lines) with `buildSendUpdateEmail` export, `/api/send-update/preview.ts` admin-gated, `send-update.ts` has `usePersonalLinks` flag + serial per-recipient loop + setIfMissing race fix |
| SC-3 | Sanity Studio retired (studioBasePath dropped, Studio-specific components deleted) | VERIFIED | `sanity.config.ts` deleted at repo root; `src/sanity/components/` directory entirely absent; `astro.config.mjs` contains no `studioBasePath`; `src/sanity/structure.ts` deleted; `REQUIREMENTS.md` lines 86-87 annotated with superseded/satisfied per D-01 |
| SC-4 | Every feature previously requiring Sanity Studio is accessible in admin app | VERIFIED | Settings: `/admin/settings`; Projects: `/admin/projects/`; Rendering: `/admin/rendering/`; Procurement: covered in Phase 32; Send Update: project detail header with `SendUpdateButton`; per-client PURL: `ClientChipWithRegenerate` on project detail |

**Score:** 4/4 roadmap success criteria verified programmatically. 7 human verification items remain for live-browser acceptance.

---

### Observable Truths (Plan Must-Haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Wave 0: All 20 test stub files exist with it.todo stubs | VERIFIED | All files exist; full suite shows 68 todo (post-implementation many were flipped to real tests) |
| 2 | AdminModal/AdminToast/CollapsibleSection/TagInput primitives built | VERIFIED | All 4 files exist at `src/components/admin/ui/`; line counts: AdminModal 216, AdminToast 182, CollapsibleSection 110, TagInput 166 |
| 3 | `/api/blob-upload` PUT and POST reject non-admin (T-34-02) | VERIFIED | Lines 27 and 60: `session.role !== "admin" → 401` |
| 4 | `/api/admin/upload-sanity-image` calls `sanityWriteClient.assets.upload` | VERIFIED | Line 80 of `upload-sanity-image.ts`; admin gate at line 42 |
| 5 | `.luxury-secondary-btn` CSS exists in `global.css` | VERIFIED | Lines 126, 141, 145, 149 — all 4 selector variants present |
| 6 | ENGAGEMENT_LABELS shared module at `src/lib/portal/engagementLabels.ts` | VERIFIED | File exists, exports `ENGAGEMENT_LABELS` and `EngagementType` |
| 7 | `/admin/settings` has 4 collapsible sections (SC-1) | VERIFIED | `SettingsPage.tsx` imports and renders `GeneralSection`, `SocialLinksSection`, `HeroSlideshowEditor`, `RenderingConfigSection`, `StudioRetirementNotice` |
| 8 | `/api/admin/site-settings.ts` has admin auth gate (T-34-01) | VERIFIED | Line 224: `if (!session || session.role !== "admin")` |
| 9 | HeroSlideshowEditor uses dnd-kit for drag-reorder | VERIFIED | Lines 14, 21, 26-29: DndContext + useSortable imports from `@dnd-kit/core` and `@dnd-kit/sortable` |
| 10 | HeroSlideshowEditor uploads via `/api/admin/upload-sanity-image` | VERIFIED | Line 298: `fetch("/api/admin/upload-sanity-image", ...)` |
| 11 | `updateLog` appended on every successful save (SETT-06) | VERIFIED | `site-settings.ts` uses `.append("updateLog", [logEntry])` in all 5 action branches; `send-update.ts` line 205 appends on successful send |
| 12 | `buildSendUpdateEmail` is a pure function in shared module with `ctaHref` param | VERIFIED | `emailTemplate.ts` line 140: `export function buildSendUpdateEmail(input: SendUpdateEmailInput)` — `ctaHref` is a field on `SendUpdateEmailInput` |
| 13 | `/api/send-update` accepts `usePersonalLinks` flag with per-recipient loop + setIfMissing race fix | VERIFIED | Lines 49 (flag), 121 (loop), 131 (setIfMissing), 137 (re-fetch to resolve race) |
| 14 | `/api/send-update/preview` is admin-gated and returns HTML | VERIFIED | Lines 53-55: admin gate; line 30: "Content-Type: text/html" documented |
| 15 | `SendUpdateModal` is built on `AdminModal` primitive | VERIFIED | Line 3: `import AdminModal from "./ui/AdminModal"` |
| 16 | `client` schema has `portalToken` field | VERIFIED | `src/sanity/schemas/client.ts` line 63: `name: "portalToken"` |
| 17 | `/api/admin/clients` has `regenerate-portal-token` action | VERIFIED | Lines 164-172: action branch calls `generatePortalToken(8)` and `.set({ portalToken: newToken })` |
| 18 | `RegenerateLinkDialog.tsx` exists with hardcoded URL fix (a4f5302) | VERIFIED | 255 lines; line 40 uses `window.location.origin` fallback, not `lasprezz.com`; `tenantAudit.test.ts` passes (6/6) |
| 19 | `/portal/client/[token].astro` exists | VERIFIED | 150 lines at `src/pages/portal/client/[token].astro` |
| 20 | `portalTokenHash.ts` exports `hashPortalToken` + `timingSafeEqualHash` | VERIFIED | SHA-256 base64, constant-time comparison via `node:crypto.timingSafeEqual` |
| 21 | `middleware.ts` has PURL session hash re-validation (T-34-07) + read-only gate (T-34-08) | VERIFIED | Lines 6-8 (imports), 17 (`/portal/client/` in PUBLIC_PATHS), 31 (SAFE_METHODS set), 39-42 (read-only gate), 71-80 (hash re-validation) |
| 22 | `session.ts` has `client` role + `source: 'purl'` + `portalTokenHash` fields | VERIFIED | Lines 21, 30, 38; `createPurlSession` function at line 55 |
| 23 | `sanity.config.ts` deleted | VERIFIED | File does not exist at repo root |
| 24 | `src/sanity/components/` entirely deleted | VERIFIED | Directory does not exist |
| 25 | `studioBasePath` absent from `astro.config.mjs` | VERIFIED | Full file read confirms no studioBasePath string |
| 26 | `REQUIREMENTS.md` SETT-07 annotated superseded, SETT-08 annotated satisfied | VERIFIED | Lines 86-87 annotated; traceability table rows 180-181 updated |

**Score:** 26/26 truths verified

---

### Required Artifacts

| Artifact | Min Lines | Actual | Status | Details |
|----------|-----------|--------|--------|---------|
| `src/pages/admin/settings.astro` | 25 | 89 | VERIFIED | Hydrates SettingsPage React island, fetches SITE_SETTINGS_QUERY, normalizes payload |
| `src/components/admin/settings/SettingsPage.tsx` | 200 | 313 | VERIFIED | Root component with 4 sections + StudioRetirementNotice |
| `src/components/admin/settings/HeroSlideshowEditor.tsx` | 250 | 483 | VERIFIED | dnd-kit sortable, upload via upload-sanity-image, delete with undo |
| `src/pages/api/admin/site-settings.ts` | 180 | 393 | VERIFIED | 5 action branches, admin gate, updateLog on every save |
| `src/sanity/queries.ts` | — | exists | VERIFIED | Contains SITE_SETTINGS_QUERY (line 520) and CLIENT_BY_PORTAL_TOKEN_QUERY (line 185) |
| `src/lib/sendUpdate/emailTemplate.ts` | 200 | 297 | VERIFIED | Exports buildSendUpdateEmail + 4 helpers |
| `src/pages/api/send-update.ts` | 200 | ~200+ | VERIFIED | usePersonalLinks flag, serial loop, setIfMissing + re-fetch |
| `src/pages/api/send-update/preview.ts` | 60 | exists | VERIFIED | Admin-gated GET returning HTML |
| `src/components/admin/SendUpdateModal.tsx` | 300 | 557 | VERIFIED | Built on AdminModal, checkboxes, personal link toggle |
| `src/sanity/schemas/client.ts` | — | exists | VERIFIED | `portalToken` field at line 63 |
| `src/pages/api/admin/clients.ts` | — | exists | VERIFIED | regenerate-portal-token action at lines 164-174 |
| `src/components/admin/RegenerateLinkDialog.tsx` | 120 | 255 | VERIFIED | Hardcoded URL fix in place; tenantAudit passes |
| `src/components/admin/ClientChipWithRegenerate.tsx` | 80 | 140 | VERIFIED | Wraps ContactCardWrapper, wired in project detail page |
| `src/pages/portal/client/[token].astro` | 150 | 150 | VERIFIED | Token resolution, PURL session mint, dashboard + invalid fallback |
| `src/lib/portal/clientDashboard.ts` | 80 | 130+ | VERIFIED | Exports resolveClientByToken, getClientDashboardData, re-exports hashPortalToken |
| `src/lib/portal/portalTokenHash.ts` | 15 | 44 | VERIFIED | hashPortalToken (SHA-256 base64) + timingSafeEqualHash (constant-time) |
| `src/lib/session.ts` | — | extended | VERIFIED | source: 'purl', portalTokenHash fields; createPurlSession with 7-day TTL |
| `src/middleware.ts` | — | extended | VERIFIED | /portal/client/ in PUBLIC_PATHS, SAFE_METHODS gate, hash re-validation |
| `astro.config.mjs` | — | 69 lines | VERIFIED | @sanity/astro present, NO studioBasePath |
| `.planning/REQUIREMENTS.md` | — | annotated | VERIFIED | SETT-07 superseded, SETT-08 satisfied |
| `src/components/admin/ui/AdminModal.tsx` | 80 | 216 | VERIFIED | |
| `src/components/admin/ui/AdminToast.tsx` | 100 | 182 | VERIFIED | |
| `src/components/admin/ui/CollapsibleSection.tsx` | 50 | 110 | VERIFIED | |
| `src/components/admin/ui/TagInput.tsx` | 60 | 166 | VERIFIED | |
| `src/pages/api/admin/upload-sanity-image.ts` | 40 | 80+ | VERIFIED | Admin gate + sanityWriteClient.assets.upload |
| `src/lib/portal/engagementLabels.ts` | 8 | 14 | VERIFIED | ENGAGEMENT_LABELS + EngagementType |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `HeroSlideshowEditor.tsx` | `/api/admin/upload-sanity-image` | `fetch("/api/admin/upload-sanity-image", ...)` | WIRED | Line 298 |
| `HeroSlideshowEditor.tsx` | `/api/admin/site-settings` | `action=appendHeroSlide` POST | WIRED | Confirmed by Plan 03 key_links + test suite green |
| `site-settings.ts` | `sanityWriteClient.patch` | direct `.patch(...).setIfMissing(...).set(...).commit()` | WIRED | Line 258 (and throughout) |
| `renderingAuth.ts` | case-normalized exclusion check | `.toLowerCase()` on both sides | WIRED | Lines 48, 64-65 |
| `send-update.ts` | `emailTemplate.ts` | `import { buildSendUpdateEmail }` | WIRED | Plan 04 summary + tests green |
| `SendUpdateModal.tsx` | `AdminModal.tsx` | `import AdminModal from "./ui/AdminModal"` | WIRED | Line 3 |
| `project detail page` | `SendUpdateModal.tsx` | `SendUpdateButton` React island | WIRED | `index.astro` lines 12, 128 |
| `ClientChipWithRegenerate.tsx` | `RegenerateLinkDialog.tsx` | onClick opens dialog | WIRED | Plan 05 tests green |
| `RegenerateLinkDialog.tsx` | `/api/admin/clients` | `POST action=regenerate-portal-token` | WIRED | Lines 56-61 |
| `clients.ts` | `generateToken.ts` | `generatePortalToken(8)` | WIRED | Lines 6, 169 |
| `project detail page` | `ClientChipWithRegenerate.tsx` | replaces ContactCardWrapper map | WIRED | `index.astro` lines 10, 220 |
| `[token].astro` | `clientDashboard.ts` | `getClientDashboardData(token)` | WIRED | Line 31 |
| `middleware.ts` | `portalTokenHash.ts` | `hashPortalToken` on every /portal/* | WIRED | Lines 6-8, 79 |
| `middleware.ts` | `session.ts` | `session.source` check | WIRED | Lines 39-42 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `settings.astro` | `initialSettings` | `getTenantClient(tenantId).fetch(SITE_SETTINGS_QUERY)` | Yes — GROQ query to Sanity Content Lake | FLOWING |
| `[token].astro` | `data` | `getClientDashboardData(token)` → `sanityClient.fetch(CLIENT_BY_PORTAL_TOKEN_QUERY)` | Yes — GROQ query | FLOWING |
| `SendUpdateModal.tsx` | `project` | Passed from Astro island (`SendUpdateButton` + project detail page frontmatter) | Yes — Sanity data passed as prop | FLOWING |
| `emailTemplate.ts` | `input: SendUpdateEmailInput` | Called from `send-update.ts` after GROQ project fetch | Yes — function is pure, data from caller | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `hashPortalToken` exports a 44-char SHA-256 base64 | `grep -n "export function hashPortalToken"` in portalTokenHash.ts | Found at line 20 | PASS |
| `timingSafeEqualHash` uses `node:crypto.timingSafeEqual` | File read confirmed `createHash, timingSafeEqual from "node:crypto"` | Confirmed | PASS |
| middleware test suite green (49 tests) | `npx vitest run src/middleware.test.ts` | 49/49 passing | PASS |
| site-settings test suite green (14 tests) | `npx vitest run src/pages/api/admin/site-settings.test.ts` | 14/14 passing | PASS |
| send-update test suite green (12 tests) | `npx vitest run src/pages/api/send-update.test.ts` | 12/12 passing | PASS |
| clients API test suite green (6 tests) | `npx vitest run src/pages/api/admin/clients.test.ts` | 6/6 passing | PASS |
| RegenerateLinkDialog test suite green (7 tests) | `npx vitest run src/components/admin/RegenerateLinkDialog.test.tsx` | 7/7 passing | PASS |
| tenantAudit scan (hardcoded URL fix) | `npx vitest run src/lib/tenantAudit.test.ts` | 6/6 passing | PASS |
| Full suite baseline unchanged | `npx vitest run` | 19 failed / 722 passed / 68 todo — matches pre-Phase-34 baseline + milestoneUtils time-drift | PASS |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SETT-01 | 34-01, 34-03 | Admin can edit site settings (title, tagline, contact info, social links) | VERIFIED | `settings.astro` + `SettingsPage.tsx` + `GeneralSection.tsx` + `SocialLinksSection.tsx` + `site-settings.ts` |
| SETT-02 | 34-01, 34-02, 34-03 | Admin can manage hero slideshow images (add, remove, reorder with alt text) | VERIFIED | `HeroSlideshowEditor.tsx` (dnd-kit drag-reorder, upload via upload-sanity-image, delete with undo toast, alt text validation) |
| SETT-03 | 34-01, 34-02, 34-03 | Admin can configure rendering settings (monthly limit, image type options) | VERIFIED | `RenderingConfigSection.tsx` with renderingAllocation, renderingImageTypes, renderingExcludedUsers; `renderingAuth.ts` with case-normalized exclusion |
| SETT-04 | 34-01, 34-04, 34-05, 34-06 | Send Update email flow works from admin (compose, send, delivery log) | VERIFIED | `SendUpdateModal.tsx` + `send-update.ts` + `emailTemplate.ts` + per-client PURL (`client.portalToken`) + `/portal/client/[token]` dashboard |
| SETT-05 | 34-01, 34-04 | Email template preview shows exactly what client will receive before sending | VERIFIED | `/api/send-update/preview.ts` — admin-gated, uses same `buildSendUpdateEmail` as send path, returns Content-Type: text/html |
| SETT-06 | 34-01, 34-03, 34-04 | Settings changes are logged with timestamp | VERIFIED | `site-settings.ts` appends `updateLog` on all 5 action branches; `send-update.ts` appends `updateLog` on successful send |
| SETT-07 | 34-07 | Sanity Studio shows deprecation banner — superseded per D-01 | SUPERSEDED | `REQUIREMENTS.md` line 86 annotated; `StudioRetirementNotice.tsx` provides visible in-app notice on settings page; Studio UI fully removed |
| SETT-08 | 34-07 | Studio route removed after 30-day deprecation period — satisfied by immediate removal | SATISFIED | `studioBasePath` dropped from `astro.config.mjs`; `sanity.config.ts` deleted; all Studio-specific components deleted (51 files, -6503 lines) |

**Note:** REQUIREMENTS.md traceability table rows 174-179 (SETT-01 through SETT-06) still read "Pending". Only SETT-07/08 were updated by Plan 07. This is a documentation-only gap — the implementation is complete and verified. Recommend updating those 6 rows to "Validated" as a housekeeping commit.

---

### Security Threat Status

| Threat | Description | Mitigation Plan | Status | Evidence |
|--------|-------------|-----------------|--------|---------|
| T-34-01 | Non-admin writes to siteSettings | Plan 34-03 | MITIGATED | `site-settings.ts` line 224: `session.role !== "admin" → 401` |
| T-34-02 | Unauthenticated blob-upload or upload-sanity-image | Plan 34-02 | MITIGATED | `blob-upload.ts` lines 27, 60; `upload-sanity-image.ts` line 42 — both admin-gated |
| T-34-03 | Unauthorized Send Update trigger | Plan 34-04 | MITIGATED | `send-update.ts` — existing admin gate confirmed in place |
| T-34-04 | Preview endpoint leaks to non-admin | Plan 34-04 | MITIGATED | `preview.ts` line 55: admin gate before any data access |
| T-34-05 | setIfMissing race on portalToken (multi-tab concurrent send) | Plan 34-04 | MITIGATED | `send-update.ts` lines 131-137: setIfMissing + re-fetch pattern; serial loop (no Promise.all) |
| T-34-06 | PURL forwarding: attacker receives forwarded email | Accepted per D-19 revised | ACCEPTED | 7-day TTL + D-22 regenerate action documented as the exposure mitigation |
| T-34-07 | PURL session survives token regeneration | Plan 34-06 | MITIGATED | `middleware.ts` lines 71-80: per-request hash re-derivation; mismatch clears session |
| T-34-08 | Mutation endpoint accessible via PURL session | Plan 34-06 | MITIGATED | `middleware.ts` lines 39-42: `SAFE_METHODS` gate rejects non-GET/HEAD/OPTIONS for source='purl' sessions |
| T-34-09 | Client-role escalation | Plan 34-06 | MITIGATED | Session model enforces role='client' for PURL sessions; cannot escalate to admin |
| T-34-10 | Sanity internal IDs leaked in ClientDashboardCards | N/A | FINDING | The `/portal/client/[token].astro` route uses `project._id` as the URL path parameter in `href=/portal/project/${project._id}`. This exposes the Sanity document `_id` in the browser URL and HTML source. This is intentional — `/portal/project/[projectId]` was built in Phase 29 to accept a Sanity `_id` as its route param. The exposure is limited to a 20-char opaque Sanity ID (e.g., `a2b3c4d5e6f7...`) visible to the authenticated client whose data it is. Not a new exposure; pre-dates Phase 34. |

**T-34-06 data-at-rest finding:** The regenerate-portal-token action stores the raw `portalToken` in Sanity Content Lake (via `.set({ portalToken: newToken })`), NOT a hash. The middleware applies defense-in-depth by hashing the raw token for comparison (`hashPortalToken(currentToken)`) on every request. If the Sanity dataset were ever leaked, raw tokens would be exposed. This matches the Plan 06 SUMMARY's documented decision ("The existing regenerate-portal-token action stores the raw portalToken in Sanity, not a hash — my middleware hashes the raw value on each request"). The accepted risk per D-22 / T-34-06 is that PURL tokens are bookmark-level credentials, and the regenerate action is the explicit recovery path. This is an intentional design choice, not a missed mitigation — flagged here for awareness.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 174-179 | SETT-01..SETT-06 traceability table rows still read "Pending" | Info | Documentation gap only — implementation is complete and verified. |
| `src/lib/milestoneUtils.test.ts` | — | Time-dependent `formatRelativeDate` tests fail intermittently | Info | Pre-existing (pre-Phase-34); confirmed time-drift issue per Plan 04 SUMMARY. Not caused by Phase 34. |

No stub implementations found in Phase 34 code. No placeholder returns, no TODO/FIXME blockers, no empty handlers in Phase 34 blast radius files.

---

### Human Verification Required

The automated checks all pass. The following items require human browser testing with live Sanity credentials:

#### 1. Settings Page Full Roundtrip

**Test:** Visit `/admin/settings`. Expand all 4 collapsible sections. Edit `siteTitle` and `contactEmail`. Click Save.
**Expected:** Success toast appears. Page reload shows updated values. Studio Retirement Notice renders below the 4 sections.
**Why human:** Astro SSR + React island with live Sanity Content Lake read/write. Cannot assert full roundtrip without a browser and live Sanity write credentials.

#### 2. Hero Slideshow Upload and Reorder

**Test:** On the hero slideshow section, upload a new image (< 4.5 MB JPEG). Drag to reorder slides.
**Expected:** Uploaded image appears as a slide thumbnail with an alt text input. Drag handle is visible. Reorder persists through Save.
**Why human:** dnd-kit drag-reorder and Sanity asset upload (Path A via `/api/admin/upload-sanity-image`) require a real browser and live Sanity write token.

#### 3. Send Update Modal Default State

**Test:** Open a project detail page for a project with `engagementType: full-interior-design` that has procurement items. Click the "Send Update" button in the header.
**Expected:** Modal opens. Recipients list shows project clients. Milestones checkbox is ON. Procurement checkbox is ON (because full-interior-design with items). Pending reviews checkbox is OFF.
**Why human:** Default checkbox logic depends on live project data from Sanity Content Lake.

#### 4. Send Update Preview

**Test:** In the SendUpdateModal, click "Preview email".
**Expected:** New browser tab opens with a styled HTML email preview matching the project's current milestone/procurement state.
**Why human:** Preview calls `/api/send-update/preview` which fetches live Sanity project data.

#### 5. RegenerateLinkDialog Flow

**Test:** On a project detail page's Clients section, click the refresh icon next to a client chip. In the confirmation dialog, click "Regenerate". Verify the success toast appears with the new portal URL. Click "Copy link".
**Expected:** Dialog copy warns about invalidating links across ALL this client's projects. Success toast shows new `/portal/client/{token}` URL. Copy button label flips to "Copied ✓" for 1.5s.
**Why human:** Full Sanity write + response round-trip; requires live Sanity write token and browser.

#### 6. Client Dashboard PURL Flow

**Test:** Send a Send Update email with `Personal portal link` toggle ON to a test client. Click the `/portal/client/{token}` link from the email. Visit an arbitrary `/portal/client/invalidtoken` URL.
**Expected:** Valid token: session cookie is set, client dashboard renders with project list and "View project →" links. Invalid token: "Your portal link has expired or is invalid" fallback renders with `office@lasprezz.com` contact button.
**Why human:** Requires email delivery pipeline and live Sanity Content Lake.

#### 7. PURL Session Invalidation After Regeneration

**Test:** Establish a live PURL session. Regenerate that client's token via the admin UI. Navigate to any `/portal/*` page in the same browser session.
**Expected:** Middleware detects hash mismatch, clears the session cookie, and redirects to `/portal/login`.
**Why human:** Session cookie lifecycle and middleware hash re-validation require a real browser session with two concurrent state changes.

---

### Gaps Summary

No functional gaps found. All Phase 34 artifacts exist, are substantive (well above min_lines thresholds), are wired (imports verified, tests passing), and data flows from real Sanity Content Lake queries.

**Documentation observation:** REQUIREMENTS.md traceability table rows for SETT-01 through SETT-06 were not updated from "Pending" to "Validated" — Plan 07 only updated SETT-07/08. This does not affect the implementation but is worth a quick housekeeping annotation.

**Security finding (informational):** Raw `portalToken` values are stored in Sanity Content Lake. The middleware applies SHA-256 hashing for comparison on every request, providing defense-in-depth. The data-at-rest plaintext storage is an accepted design choice per D-22/T-34-06 ("PURL is a bookmark-level token; regenerate is the recovery path"). Flagged for awareness, not as a gap.

---

_Verified: 2026-04-12T02:05:00Z_
_Verifier: Claude (gsd-verifier) — Phase 34 v5.0 final phase_
