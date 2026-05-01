---
gsd_state_version: 1.0
milestone: v5.3
milestone_name: Third-Party Views & Outbound Email Polish
status: executing
stopped_at: Phase 47 UI-SPEC approved
last_updated: "2026-05-01T00:22:26.997Z"
last_activity: 2026-05-01
progress:
  total_phases: 11
  completed_phases: 5
  total_plans: 47
  completed_plans: 44
  percent: 94
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-23)

**Core value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work
**Current focus:** Phase 47 — portal-layout-hoist

## Current Position

Phase: 47 (portal-layout-hoist) — EXECUTING
Plan: 3 of 5
Parent: —
Plans: 10 of 10 complete (49-01 913f149/a3d04f9/48bdc7f session schema; 49-02 4169c68/64c8e10/e85c1cc impersonationAudit; 49-03 691d207/6e59f87/b3268bc auth lib; 49-04 20cb2df/a995d88 mint endpoint; 49-05 3d7b8f9/c4d2ec2 redeem route; 49-06 60f56ab/c9442fa/9ebe2f0/7e272b0 exit+admin-logout; 49-07 fc5bd6e/6b5bc62/a94a033/a2808a6 middleware gates; 49-08 b78a3db/0431b13/af3b6be/4674fdd Resend 403; 49-09 89d3161/5d4937d D-21 CI tests; 49-10 5f4b46f env doc + 59a0eea phase-close summary; gap-closure rename f3228ef).
Status: Ready to execute
Next: Phase 50 (Impersonation UI — IMPER-01, IMPER-05). Phase 47 (Portal Layout Hoist) and Phase 48 (smaller transactional emails) also unblocked.
Last activity: 2026-05-01

## v5.3 Phase Map

| Phase | Name | Reqs | Plans (est.) | Status |
|-------|------|------|--------------|--------|
| 45 | Email Foundations | 4 (EMAIL-08..11) | 5 | **Complete** (5/5 plans, EMAIL-08..11 satisfied) — closed 2026-04-26 |
| 45.5 | Linha → Sprezza Hub Platform Rename | 0 (architectural rebrand) | 2 | **Complete** (2/2 plans, verifier PASS 8/8) — closed 2026-04-27 |
| 46 | Send Update + Work Order Migration | 5 (EMAIL-01, 02, 03, 06, 07) | 4 | **Complete** — cutover at `6fcd666`, gap closure via 46.1, round-5 visual UAT APPROVED 2026-04-30 (`46-UAT.md` verdict APPROVED). |
| 46.1 | Merge-Gate Gap Closure | 0 (gap closure of 46 UAT) | 10 | **Complete** (10/10 plans) — round-5 code-fix at a7bd104, code review clean at dd30667, Liz visual UAT approved 2026-04-30 per D-21 / D-22 (`46.1-HUMAN-UAT.md` status passed). |
| 47 | Portal Layout Hoist | 1 (PORTAL-05) | TBD | Not started |
| 48 | Smaller Transactional Emails | 2 (EMAIL-04, 05) | TBD | Not started |
| 49 | Impersonation Architecture | 6 (IMPER-02, 03, 04, 06, 07, 08) | 10 | **Complete** (10/10 plans, verifier PASS 6/6) — closed 2026-04-30 with gap-closure rename of redeem route (Astro v6 `_*` exclusion). All IMPER reqs satisfied; D-21 canonical CI tests in place. |
| 50 | Impersonation UI | 2 (IMPER-01, 05) | TBD | Not started |
| 51 | Portal Visual + Voice Pass | 6 (PORTAL-01, 02, 03, 06, AUTH-01, 02) | TBD | Not started |
| 52 | Cross-Cutting QA / UAT | 1 (PORTAL-04) | TBD | Not started |

**Total:** 27 requirements across 8 phases.

**Track structure:**

- Email track: 45 → 46 → 48
- Portal/Impersonation track: 47 (parallel) and 49 (parallel) → 50 (depends on 47 + 49)
- Convergence: 51 (depends on 47, 50, 45) → 52 (UAT)

Email track and Portal/Impersonation track share zero files (other than possibly `brand-tokens.ts`) and CAN run in parallel.

## Resolved Decisions (v5.3)

- **D-1**: Adopt `react-email` this milestone (Position B). Future-proof for v6.0 per-tenant theming; Outlook safety via Litmus harness; single shared `brand-tokens.ts` source of truth.
- **D-2**: Impersonation audit log lives in a dedicated Sanity `impersonationAudit` document type per tenant.
- **D-3**: `/workorder/*` and `/building/*` get the impersonation banner only in v5.3 via the self-gating component dropped into existing page bodies. Full layout migration of those routes deferred to v5.4.
- **D-4** (Phase 45-01): `@vitejs/plugin-react` pinned at `^5.2.0` (not RESEARCH.md's `^6.0.1`). `^6` requires `vite@^8` peer; the entire tree (Astro 6.0.4, Vitest 3.2.4, Sanity 5.16, `@tailwindcss/vite` 4.2.2) resolves `vite@7.3.1`. `^5.2.0` matches the version already deduped in the tree as a transitive of `@astrojs/react@5.0.0` and satisfies Pitfall 1 fix (transitive → direct) without forcing a vite-8 cascade. Reconsider when Astro 7 / Vitest 4 land.
- **D-5** (Phase 45-02): `src/lib/brand-tokens.ts` is the typed source of truth (23 colors, 4 fonts, 2 spacing tokens). `scripts/generate-theme-css.ts` exports a pure `buildThemeCss(tokens)` plus a CLI entry that writes `src/styles/_generated-theme.css` byte-idempotently. `global.css` `@import`s the generated file; out-of-scope tokens (`--container-text`, `--animate-fade-in-up`, `@keyframes`, `@theme inline` font bridge) stay CSS-only per D-07. CI freshness gate: `npm run theme:gen && git diff --exit-code src/styles/_generated-theme.css`. EMAIL-08 satisfied.
- **D-6** (Phase 45-02): Test co-location confirmed for `src/lib/brand-tokens.test.ts` (NOT `src/lib/__tests__/brand-tokens.test.ts`) — every other `*.test.ts` in `src/lib/` is co-located. Same convention applies to forthcoming `src/emails/scaffold.test.ts` in 45-04.

## Accumulated Context

### Decisions

Carried from v5.1 / v5.2 / Phase 44 boundary. Full history:

- `.planning/MILESTONES.md` (v5.0 section)
- `.planning/PROJECT.md` (Key Decisions table)

**v5.1 carryover decisions (still relevant):**

- Phase 36: Per-island ToastContainer provider pattern (React context does not cross Astro island boundaries)
- Phase 36: vercel.ts as canonical Vercel config via @vercel/config@0.1.1
- Phase 37: Inline modal render (not createPortal) so jsdom container queries reach inputs
- Phase 38: Send Update pipeline reads siteSettings.defaultFromEmail / defaultCcEmail at send time
- Phase 39: Work Order is a separate Sanity document (not inline on project)
- Phase 39: projectDocuments[] is separate from artifacts[] array
- Phase 40: trades string[] on siteSettings; TradesCatalogSection fully controlled component
- Phase 40: Address block shared between clients and contractors via EntityDetailForm
- Phase 40: Trade pill labels use formatTrade() from lib/trades.ts

**v5.2 decisions (still relevant for v5.3):**

- Phase 41-43 trades model and document-checklist patterns are the baseline for the Trades-side recipient picker in Phase 50
- Phase 42 Plan 02: Sanity _type stays 'contractor'; relationship field carries UI meaning — recipient picker for contractors uses the same field
- Phase 43 Plan 02: TradeChecklist DOM patterns (shared hidden file input + activeLabelRef) inform any portal-side document upload UX in Phase 51

**Phase 44 (Workflow Engine, in progress):**

- Workflow Engine ships before v5.3 portal polish — portal "What's next?" card in Phase 51 may consume workflow-derived signal once Phase 44 lands
- engine.ts is server-only; client-side derivePhaseStatus is pure function — same boundary applies if v5.3 portal polish reads workflow state

**v5.3 starting decisions (architectural, derived from research):**

- Wrapped admin session for impersonation: `session.role` stays `admin` and `session.tenantId` intact; sibling field `session.impersonatedBy` carries admin identity. Never role-swap. (Pitfall 1 mitigation)
- Reuse existing PURL `source` discriminator on session for the read-only middleware gate; impersonation gets `source: "impersonation"` (Pitfall 1)
- One-shot mint→redeem token via Redis GETDEL (TTL=120s) for the cross-tab hop; matches existing `magic:` work-order token pattern
- Impersonation cookie scope `Path=/` (not `/portal`) so designer can navigate back to admin without clearing cookies (Pitfall 2)
- Recipient picker is a tenant-scoped GROQ query, never free-text input (Pitfall 3)
- Impersonation `start` endpoint must verify `recipient.tenantId === session.tenantId` before minting (Pitfall 3); middleware re-checks defense-in-depth
- Impersonation hard TTL = 30 minutes; UI banner persists across navigation; explicit "Exit preview" form button (Pitfall 4)
- Defense-in-depth on Resend send endpoints: every endpoint that calls `resend.emails.send` adds an explicit `if (session.source === "impersonation") return 403` (IMPER-03 belt-and-braces)
- `src/lib/brand-tokens.ts` is the single source of truth for color, typography, spacing — consumed by both Tailwind config (portal) and email theme (`@react-email/tailwind`). Email theme MIRRORS values, not imports — email clients can't load CSS variables (Pitfall: brand-token drift)
- Email images host on cookie-less subdomain (`email-assets.lasprezz.com` recommended); never on the same host as session cookies (Pitfall 8)
- Golden HTML snapshots of `buildSendUpdateEmail` + `buildWorkOrderEmail` captured in Phase 45 BEFORE any react-email migration in Phase 46 (Pitfall 5)
- Litmus / Email on Acid screenshot in Outlook 2016 + 2019 + 365 attached to every template phase summary (Pitfall 4)
- `<ImpersonationBanner/>` is self-gating: returns null when `Astro.locals.impersonatedBy` is unset; safe to drop into any layout body, including `/workorder/*` and `/building/*` which retain their existing layouts in v5.3 (D-3)
- DKIM/SPF/DMARC verification for `lasprezz.com` is a hard prerequisite before any external send in Phase 46 — flagged Active in PROJECT.md v3.0 and resolved in Phase 45
- Tenant-scoped `getTenantClient(tenantId)` used by impersonated reads — same Sanity client whether requester is the live recipient or impersonating admin, by design (pixel-identical rendering)
- New dependencies: `react-email@^6.0.0`, `@react-email/render`, `@react-email/tailwind`, `@axe-core/playwright@^4.11.2`, `@playwright/test@latest` (a11y harness manual-only, no CI gate)
- **D-7** (Phase 45-04): `@react-email/tailwind@^2.0.7` normalizes hex colors to `rgb(r,g,b)` during inlining; brand-token round-trip assertions in email tests must accept either hex OR rgb form. `containsTokenColor()` helper in `src/emails/scaffold.test.ts` is the canonical pattern for Phase 46+ template tests. Update 45-RESEARCH.md Pitfall 7 to reflect this when convenient.
- [Phase ?]: D-8 (Phase 45-05): Playwright 1.59 ships its own react/jsx-runtime that breaks renderToString when JSX components are imported from spec files; the workaround is a two-process globalSetup that shells out to vite-node + vitest.config.ts so @vitejs/plugin-react's react-jsx automatic transform is in effect. Phase 46 spec files MUST follow this pattern (pre-render in scripts/render-email-fixtures-impl.ts, read via readFileSync in the spec).
- [Phase ?]: 46.1-07: Locked Procurement column widths to 60/22/18 via Column width attribute + verticalAlign:top on body-row Columns + outer Section paddingTop:16 wrapper. Closes UAT gap-6.
- [Phase ?]: 46.1-08: applied chosen combination (a) <table bgcolor> body wrapper + (b) @media (prefers-color-scheme: dark) + (d) inline body-attribute paint per 46.1-SPIKE-OUTLOOK-MAC.md, ADDITIVE on top of the existing 46.1-04 lock. (c) class-hook selectors REJECTED -- shares failing <style>-block delivery vehicle. Closes parent UAT 46-UAT.md gap-7 code-fix half (round-4 Liz visual re-test is the human gate).
- [Phase ?]: 46.1-09 (round 4): CR-R3-01 BLOCKER closed by binding literal class strings (pill-${status} on Procurement.tsx pill <span>; cta-${variant} on EmailButton.tsx Button) so the [data-ogsc]/[data-ogsb] lock rules actually fire on rendered elements. Verified at HARD task-1 gate: snapshot regen produces 4 class="pill-*" matches + 5 class="cta-*" matches. EmailShell.tsx CSS refactored to module-load-time generation from STATUS_PILL_STYLES via buildPillRules() (D-18 IN-R3-02 -- single source of truth; ~40 lines of mirrored CSS eliminated). Dead [data-ogsc] .text-* + .border-cream-dark + universal-selector catch-all rules deleted (D-16/D-17). WR-01/02 stripLeadingGreeting tightened (clientFirstName param + case-insensitive exact-match; preserves "Hi all," when firstName!=match; handles Mary-Anne, O'Brien). WR-03 MAX_LEN exported + textarea maxLength + character counter wired (PersonalNoteParseError unreachable from admin UI). WR-05 MSO conditional out of <div>-in-<head> into sibling <style>. WR-06 pill borderRadius deleted (Phase 46 D-3 reserves border-radius for CTA only).
- [Phase 47]: 47-01: Sign-out remains a GET anchor (UI-SPEC line 134 overrides CONTEXT D-4 form-post wording); CSRF refactor explicitly deferred to a future security task.
- [Phase 47]: 47-01: Role sub-label map and logout endpoint map both live inside PortalHeader.astro as the single source of truth — pages must NOT duplicate them.
- [Phase 47]: 47-02: PortalLayout banner-slot wrapper carries no sticky/z-index classes — UI-SPEC line 60-62 assigns sticky positioning to eventual real banner content (Phase 50), not the slot wrapper. Wrapper is plain layout glue with role=region/aria-label=Notifications a11y landmark.
- [Phase 47]: 47-02: PortalLayout body composition order locked: banner-slot wrapper → legacy ?preview=1 block (preserved byte-equivalent) → PortalHeader → page <slot/> → PortalFooter. CONTEXT D-3 explicit — Phase 50 removes the ?preview=1 block; Phase 47 preserves it.

### Pending Todos

Carried forward:

- DNS record audit needed for all 4 domains before cutover (v3.0 Phase 12)
- Pre-existing test failures (14 tests) need cleanup
- Phase 34 APIs (site-settings, upload-sanity-image, send-update) should migrate to getTenantClient (v6.0)
- Phase 39 work-orders/[id]/send.ts also uses sanityWriteClient — same v6.0 migration target
- tenantAudit allowlist extension needed for Phase-38 + Phase-39 plan-mandated lasprezz.com defaults (separate maintenance PR)
- Phase 44 Workflow Engine still in progress — should land before Phase 51 portal polish if "What's next?" card consumes workflow state

### Blockers/Concerns

- Resend sandbox only delivers to account owner until domain verified — DKIM/SPF/DMARC alignment is a hard prerequisite for Phase 46 external sends and is the gate-bearing deliverable in Phase 45 (EMAIL-11)
- Phase 49 architecture must land cross-tenant CI test before Phase 50 UI exposes the feature — tenant-leak is the highest-severity v5.3 pitfall

## Session Continuity

Last session: 2026-05-01T00:22:26.991Z
Stopped at: Phase 47 UI-SPEC approved
Resume file: None
Next action: /gsd-code-review 46.1 (round-5 review) -- must report findings.blocker == 0 against round-3 file set + new files (SendUpdateModal.tsx, personalNoteMarkdown.ts, Body.tsx). On clean review, notify Liz to schedule round-5 visual UAT on Outlook for Mac dark + Outlook for Windows dark + Outlook web dark + light-mode regression check per D-21. On `approved`, parent UAT 46-UAT.md replays for round-5 close-out; Phase 46 closes for real and v5.3 unblocks. Hard exclusion per D-21: no new spike (the 46.1-06 spike + round-3 SPIKE.md findings are sufficient).
