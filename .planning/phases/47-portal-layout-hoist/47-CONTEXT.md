---
phase: 47
phase_name: portal-layout-hoist
milestone: v5.3
requirements: [PORTAL-05]
created: 2026-04-30
status: ready-for-research
---

# Phase 47 Context — Portal Layout Hoist

## Goal (from ROADMAP.md, locked)

Portal chrome (header, footer, banner slot) is hoisted into a single `PortalLayout.astro` shell with extracted `PortalHeader` and `PortalFooter` components, so every recipient-facing page in `/portal/*` shares one source of truth for brand mark, role-aware sub-label, sign-out, and the layout slot that the impersonation banner will occupy in Phase 50.

**Requirement:** PORTAL-05 — single layout shell with consistent header + footer chrome across all portal pages.

**Phase 50 depends on:** the banner slot defined here.

## Prior Art (do not duplicate)

- `src/components/portal/PortalLayout.astro` — already exists, 82 lines, used by 13 of 17 portal/workorder/building pages. Already handles: `tenant.wordmark` brand mark, footer (`displayName • Interior Design` + contactEmail), font preload (`--font-heading`, `--font-body`), `<meta robots="noindex">`, and a cosmetic `?preview=1` "Preview — viewing as a client" banner.
- 4 pages do NOT use PortalLayout: `src/pages/portal/verify.astro`, `src/pages/workorder/verify.astro`, `src/pages/building/verify.astro`, `src/pages/portal/enter-impersonation.astro`. **All four are server-side redirect handlers with zero rendered UI** — they consume tokens and `Astro.redirect(...)`. No migration needed; flag this in research so the planner doesn't bake migration tasks for them.
- Sign-out is currently inlined per dashboard/project page (7 pages: `portal/dashboard`, `portal/project/[projectId]`, `portal/[token]`, `workorder/dashboard`, `workorder/project/[projectId]`, `workorder/project/[projectId]/orders/[workOrderId]`, `building/dashboard`, `building/project/[projectId]`).
- `PortalHeader.astro` does NOT exist yet — must be created. `PortalFooter.astro` does NOT exist yet — currently inlined inside PortalLayout.
- `src/lib/portal/portalBrand.ts` provides `DEFAULT_PORTAL_BRAND` and `PortalBrand` type — already used by PortalLayout.
- Phase 49 closed 2026-04-30 — middleware (`src/middleware.ts`) sets `Astro.locals.impersonating` (Phase 49 Plan 07) when an impersonated session is active. Phase 47's banner slot will read this in Phase 50.

## Locked Decisions

### D-1 — PortalHeader composition: minimal, top-aligned, no background band

**Layout:**
- Wordmark on the left (`tenant.wordmark`, tiny letter-spaced uppercase — matches existing portal aesthetic)
- Role-aware sub-label below the wordmark (`Client portal` / `Trade portal` / `Building portal`)
- Sign-out form on the right, top-aligned with the wordmark
- No background band, no border, no border-bottom

**Why:** Matches the existing portal restraint (cream background, generous whitespace, no admin-style chrome bands). The admin AdminNav band would feel intrusive on the recipient side.

**Role-aware sub-label source of truth:**
- `client` → "Client portal"
- `contractor` → "Trade portal"
- `building_manager` → "Building portal"
- The role comes from `Astro.locals.role` (set by middleware after `getSession`) — NOT from the URL prefix. Reason: the impersonation flow rewrites `Astro.locals` to the viewer's role (Phase 49 Plan 07 Pitfall F), and the header should reflect what the viewer is seeing, not the original admin's role.

**This locks Q4 (sign-out extraction):** sign-out moves into PortalHeader. Per-page inlined sign-out forms get deleted from the 7 dashboard/project pages.

### D-2 — `bare` prop renders wordmark-only header

**Behavior:**
- `<PortalLayout bare>` — header shows only the wordmark, centered. No role sub-label, no sign-out.
- Default (no `bare`) — full header per D-1.

**Pages that use `bare`:** `/portal/login`, `/portal/role-select`, and the equivalent `/workorder/login`, `/building/login`. Verify pages do NOT migrate (server-side redirect-only — no UI to render).

**Why wordmark-only and not no-header-at-all:** brand consistency from first impression. Login pages should look like they're part of the same product as the post-auth pages, not a different system.

**Footer renders identically in both modes** (bare and full).

### D-3 — Single `<slot name="banner"/>` in PortalLayout, sticky top

**Phase 47 (this phase):**
- PortalLayout exposes a named slot `banner` rendered sticky to the top of the body, above the page slot.
- A stub `<ImpersonationBannerStub/>` (or similar empty component) renders **nothing** — verifies the slot wiring works without shipping the real banner UI.
- The existing `?preview=1` cosmetic banner stays in PortalLayout as-is for now (so admins can keep using "Open portal as client" until Phase 50 ships).

**Phase 50 (downstream — for awareness, not in scope here):**
- Phase 50 fills the banner slot with the real `ImpersonationBanner` driven by `Astro.locals.impersonating` (set in Phase 49 Plan 07).
- Phase 50 removes the existing `?preview=1` cosmetic banner code from PortalLayout AND the "Open portal as client" button copy in admin UI, because real designer impersonation (Phase 49 + 50) supersedes the query-param preview path.

**Phase 47 verification of slot wiring:** mount a stub component that renders a single `<div data-testid="banner-slot-mounted">` (or asserts via Astro test harness) so the planner can require an integration test that proves the slot is reachable from PortalLayout consumers.

### D-4 — Sign-out renders for any authenticated session, including PURL landings

**Behavior:** PortalHeader renders the sign-out form whenever `Astro.locals.session` (or equivalent) is set, regardless of whether the session is a real long-lived session or a PURL one-shot.

**Why:** consistency; gives the user explicit control over ending their session even though PURLs expire on TTL anyway.

**Implementation hook:** the sign-out form posts to the existing endpoints — `/api/portal/logout` for portal/client/PURL, `/api/workorder/logout` for workorder, `/api/building/logout` for building (researcher to confirm exact endpoint names). The form already exists inlined on dashboard/project pages — extracting it to PortalHeader is mechanical.

## Implicit Decisions (locked by default — not asked, document so research/plan don't re-litigate)

### D-5 — PortalFooter content stays as-is

The current footer (`displayName • Interior Design` + contactEmail mailto link) is fine; this phase extracts it into a standalone `PortalFooter.astro` component without changing what it renders.

### D-6 — Verify pages NOT migrated this phase

`portal/verify.astro`, `workorder/verify.astro`, `building/verify.astro` are server-side redirect handlers — they consume a token, mint a session, and `Astro.redirect()`. They never render UI. Leave them alone. Same for `enter-impersonation.astro`.

### D-7 — `/workorder/*` and `/building/*` consume PortalLayout (already do)

ROADMAP D-3 said `/workorder/*` and `/building/*` get the impersonation banner only via "self-gating component drops into existing page bodies" in v5.3 — but in fact those routes already use PortalLayout (13/17 page count includes them). Since they share the same layout, they automatically get the banner slot from this phase, and the "self-gating component" workaround D-3 anticipated is no longer needed. Researcher should confirm this matches reality before phase 50 plans against it.

### D-8 — `tenant` prop continues to flow per-page

PortalLayout currently takes `tenant?: PortalBrand` and falls back to `DEFAULT_PORTAL_BRAND`. Pages that fetch brand data via `getPortalBrand()` pass it through. This pattern stays — extraction does not change how brand data flows.

## Gray Areas Resolved by Discussion

| ID | Topic | Resolution |
|----|-------|------------|
| D-1 | PortalHeader composition | Minimal, top-aligned, wordmark + role sub-label + sign-out, no band |
| D-2 | `bare` prop semantics | Wordmark-only header on login + role-select; footer unchanged; verify pages skip |
| D-3 | Banner slot | Single named slot, sticky top; stub in 47, real banner in 50 |
| D-4 | Sign-out scope | Renders for any authenticated session including PURL |

## Open Questions for the Researcher

1. **Sign-out endpoints — exact paths.** Confirm `/api/portal/logout`, `/api/workorder/logout`, `/api/building/logout` exist and accept POST. If naming diverges per route prefix, header needs to derive the endpoint from `Astro.locals.role` or accept a prop.
2. **Role sub-label hardcode vs i18n.** Repo doesn't appear to use i18n yet. Hard-coded English strings in PortalHeader is fine, but flag if there's any contrary convention.
3. **`bare` prop name collision.** Confirm no existing Astro layout in the repo uses `bare` as a prop name. If so, pick a different name (e.g. `chrome="minimal"`).
4. **`Astro.locals.role` shape post-Phase-49.** Phase 49 Plan 07 hydrates `Astro.locals` from viewer identity in 4 branches. Confirm `locals.role` is reliably set on every authenticated path that reaches PortalLayout.
5. **Stub banner test harness.** Researcher to recommend the right way to verify the slot is reachable — Astro `getViteConfig` test, Playwright integration test, or a simpler page-level assertion.

## Locked Constraints (do not re-research)

- `PortalLayout.astro` already exists at `src/components/portal/PortalLayout.astro` — extend, don't replace.
- `PortalBrand` type and `DEFAULT_PORTAL_BRAND` already exist at `src/lib/portal/portalBrand.ts`.
- Phase 50 banner is **not in scope** for this phase. Phase 47 ships only the slot + stub.
- Existing `?preview=1` banner stays; Phase 50 removes it.
- 13 pages already use PortalLayout — re-extraction must not regress them.
- v5.3 D-1 (react-email) and D-7 (color hex/rgb mirroring) are unrelated to this phase.
- Phase 49 closure already landed (mid/redeem/exit endpoints + middleware gates) — sign-out endpoints from 49-06 (`/api/admin/impersonate/exit`, `/api/admin/logout`) are admin-side and NOT consumed by PortalHeader.

## Deferred Ideas (not this phase)

- Per-tenant brand customization beyond `tenant.wordmark` + `tenant.contactEmail` + `tenant.displayName` (e.g. logo image, custom colors per tenant) — v6.0 multi-tenant work.
- Polished portal voice + visual rhythm (card-header band parity with admin) — Phase 51 (PORTAL-06).
- Reason-coded login copy — Phase 51 (AUTH-01).
- Login/verify/role-select polish in the new shell — Phase 51 (AUTH-02).

## Downstream Hooks

- **gsd-phase-researcher** investigates: open questions 1–5 above, plus any pre-existing test patterns for Astro slot mounting.
- **gsd-planner** plans tasks: PortalHeader.astro extraction, PortalFooter.astro extraction, banner slot wiring + stub, `bare` prop wiring, sign-out hoisting from 7 pages, regression tests across 13 currently-using pages, and verification that the 4 redirect-only pages stay untouched.
- **Phase 50** consumes: the banner slot exposed by D-3.
