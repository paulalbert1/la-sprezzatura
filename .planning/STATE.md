---
gsd_state_version: 1.0
milestone: v5.3
milestone_name: Third-Party Views & Outbound Email Polish
status: planning
stopped_at: "Phase 46.1 round-3 re-test (Liz, Outlook for Mac, 2026-04-29) surfaced 2 new gaps: gap-6 (procurement layout regression -- ETA cells not horizontally aligned across rows because Item column too narrow + uneven row heights) and gap-7 (Outlook-for-Mac dark-mode persists despite 46.1-04 lock -- the [data-ogsc]/[data-ogsb] hooks target classic Outlook-for-Windows engine, not New Outlook for Mac). Round-3 plan needed. Tests 1, 2, 5 (gap-1, gap-2, items-not-issues regression) all visually confirmed PASSED."
last_updated: "2026-04-29T13:05:00.000Z"
last_activity: 2026-04-29 -- Phase 46.1 re-opened for round-3 (gap-6 + gap-7)
progress:
  total_phases: 11
  completed_phases: 4
  total_plans: 27
  completed_plans: 27
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-23)

**Core value:** A visually stunning portfolio site that makes La Sprezzatura look as polished and intentional as Liz's design work
**Current focus:** Phase 46.1 — merge-gate-gap-closure

## Current Position

Phase: 46.1 (merge-gate-gap-closure) — RE-OPENED FOR ROUND 3
Parent: Phase 46, plan 46-03 (Tasks 1–7 complete at `6fcd666`; Task 8 Outlook desktop merge-gate REJECTED)
Plans: 5 of 5 complete in code (round 1: 46.1-01 eaea038, 46.1-02 9b5cb08, 46.1-03 889477e; round 2: 46.1-04 f867da6, 46.1-05 14dabb9). Round-3 plans TBD.
Status: Round-3 re-test (Liz, Outlook for Mac, 2026-04-29) found gap-1, gap-2, gap-5-light-mode, items-not-issues all visually fixed; gap-4 (Outlook-Mac dark-mode) and gap-5 (procurement table layout) require round-3 follow-up. New gap-6 (procurement layout) and gap-7 (Outlook-Mac dark-mode) added to parent UAT 46-UAT.md. Routing to /gsd-plan-phase 46.1 --gaps.
Next: /gsd-plan-phase 46.1 --gaps -- read 46-UAT.md gap-6 + gap-7 entries and the open questions Q1-Q6 inline; produce one or two new fix plans (TBD slugs) and re-discuss as needed before executing.
Last activity: 2026-04-29 -- Phase 46.1 re-opened for round-3

## v5.3 Phase Map

| Phase | Name | Reqs | Plans (est.) | Status |
|-------|------|------|--------------|--------|
| 45 | Email Foundations | 4 (EMAIL-08..11) | 5 | **Complete** (5/5 plans, EMAIL-08..11 satisfied) — closed 2026-04-26 |
| 45.5 | Linha → Sprezza Hub Platform Rename | 0 (architectural rebrand) | 2 | **Complete** (2/2 plans, verifier PASS 8/8) — closed 2026-04-27 |
| 46 | Send Update + Work Order Migration | 5 (EMAIL-01, 02, 03, 06, 07) | 4 | 46-01 ✓, 46-02 superseded, 46-04 ✓, 46-03 cutover landed at `6fcd666` but **merge-gate REJECTED** — see 46-UAT.md; closure gates on 46.1 |
| 46.1 | Merge-Gate Gap Closure | 0 (gap closure of 46 UAT) | 5 | **All plans complete** — Wave 1 ✓ (46.1-01 eaea038, 46.1-02 9b5cb08, 46.1-03 889477e); Wave 2 ✓ (46.1-04 f867da6 -- gap-4 Outlook auto-darken lock; 46.1-05 14dabb9 -- gap-5 left-align cells). Awaiting gap-closure-finalization + round-3 Liz Outlook re-test |
| 47 | Portal Layout Hoist | 1 (PORTAL-05) | TBD | Not started |
| 48 | Smaller Transactional Emails | 2 (EMAIL-04, 05) | TBD | Not started |
| 49 | Impersonation Architecture | 6 (IMPER-02, 03, 04, 06, 07, 08) | TBD | Not started |
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

Last session: 2026-04-29T01:01:41.363Z
Stopped at: Phase 46 Plan 03 Task 1 complete -- D-16 diff harness refreshed against 46-04 SendUpdate output. Adapter shim (`adaptSendUpdateLegacy()`) added to `scripts/_phase46-diff-old-vs-new.ts` re-projecting 46-04 fixture shape (label/state/eta/personalActionItems/showReviewItems/vendor/spec/tenant/preheader) onto legacy `SendUpdateEmailInput`. Re-ran via vite-node; 14 HTML pairs (5 SU + 2 WO) at `tests/email-snapshots/.phase46-diff/` (gitignored). `46-MIGRATION-DIFF.md` rewritten end-to-end with refreshed byte-count table, expected-deltas section split into Phase 46 originals (D-1..D-7) and 46-04 redesign deltas (D-2..D-29), and per-fixture spot checks. Conclusion: GO.
Resume file: None
Next action: Checkpoint 1 hand-review. User reads `.planning/phases/46-send-update-work-order-migration/46-MIGRATION-DIFF.md` and replies `approve` / `approve-rgb` / `hold`. On approve, a continuation agent resumes Plan 46-03 from Task 3 (rewire send-update.ts both branches + List-Unsubscribe + plainText render) through Task 8 (Outlook merge-gate screenshot).
