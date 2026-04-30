---
phase: 47
type: discussion-log
created: 2026-04-30
---

# Phase 47 Discussion Log

## Gray areas presented (4 selected, 0 deferred)

User selected all four gray areas surfaced from the codebase scout:

1. PortalHeader composition
2. `bare` prop semantics
3. Preview vs impersonation banner relationship
4. Sign-out extraction

## Q1 — PortalHeader composition

**Options presented:**
- Minimal: wordmark + role label + sign-out, top-aligned, no band ✓ selected
- Branded band: cream-bg header strip + bottom border
- Centered wordmark only, no role label, no sign-out
- Wordmark + role label only, sign-out stays per-page

**Decision (D-1):** minimal, top-aligned, no background band.

**Rationale:** Matches existing portal restraint. Consolidates Q4 (sign-out) into the header at the same time.

## Q2 — `bare` prop semantics

**Options presented:**
- Bare = wordmark-only header. Login + role-select use it. ✓ selected
- Bare = no header at all. Login + role-select use it.
- Bare = wordmark-only. Login only.
- No bare prop — single header for all pages

**Decision (D-2):** wordmark-only header on login + role-select. Verify pages skip migration (server-side redirect-only).

**Rationale:** Brand consistency from first impression while removing irrelevant chrome (no session to sign out of yet).

## Q3 — Preview vs impersonation banner

**Options presented:**
- One slot, replace ?preview=1 with impersonation banner in Phase 50 ✓ selected
- Two slots: keep ?preview=1 + add separate impersonation slot
- Remove ?preview=1 entirely in Phase 47, banner slot is impersonation-only

**Decision (D-3):** Single named banner slot (sticky top). Phase 47 ships empty stub. Phase 50 fills it AND removes the ?preview=1 cosmetic banner. ?preview=1 stays working in the interim.

**Rationale:** Clean end state — real impersonation supersedes the cosmetic preview path. Avoids dual-banner code paths.

## Q4 — Sign-out scope on PURL landings

**Options presented:**
- Yes — always show Sign out for any authenticated session ✓ selected
- No — PURL landings show no sign-out
- Yes for impersonated PURL, no for real PURL

**Decision (D-4):** Sign-out renders for any authenticated session, real or PURL.

**Rationale:** Consistency; explicit user control over session ending.

## Outcome

CONTEXT.md written with 4 explicit decisions (D-1..D-4) plus 4 implicit ones (D-5..D-8) capturing locked constraints. 5 open questions surfaced for the researcher.
