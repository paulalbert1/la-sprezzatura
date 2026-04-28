# Requirements: La Sprezzatura — v5.3 Third-Party Views & Outbound Email Polish

**Defined:** 2026-04-26
**Core Value:** Make every recipient-facing surface (clients, contractors, building managers) read with the same care as Liz's design work. Outbound email is the studio's most visible artifact — it must render reliably across Outlook desktop, Gmail, and Apple Mail, carry the studio's voice, and stay maintainable as new templates and per-tenant theming arrive in v6.0.

## v5.3 Requirements

### Email Template Foundations & Refresh (EMAIL)

- [x] **EMAIL-01**: Every outbound email renders correctly in Outlook desktop (2016 / 2019 / 365), Gmail web, Gmail iOS, Apple Mail macOS, and Apple Mail iOS
- [x] **EMAIL-02**: Every outbound email ships a plain-text alternative for screen readers and image-blocked clients
- [x] **EMAIL-03**: Every outbound email includes preheader text that explains the message in the recipient's inbox preview
- [ ] **EMAIL-04**: Every transactional invitation email includes a visible "or paste this link" fallback for the primary CTA
- [ ] **EMAIL-05**: Every transactional invitation email includes copy stating how long the link remains valid
- [ ] **EMAIL-06**: The Send Update weekly digest includes a List-Unsubscribe header (Gmail/Yahoo bulk-sender requirement)
- [ ] **EMAIL-07**: The Send Update digest layout uses Outlook-safe `<table>` markup (no flex / grid / rem / `border-radius` shorthand)
- [x] **EMAIL-08**: Brand colors, typography, and spacing in emails are sourced from a single shared brand-tokens module also consumed by Tailwind
- [x] **EMAIL-09**: All five email templates (Send Update, Work Order, artifact-ready, contractor access, building access) carry golden HTML snapshots that gate future regressions
- [x] **EMAIL-10**: Email assets (logo, etc.) are hosted on a stable, image-CDN endpoint with proper caching headers
- [x] **EMAIL-11**: DKIM, SPF, and DMARC are aligned and verified for the production sender domain

### Designer Impersonation (IMPER)

- [ ] **IMPER-01**: Designer can preview the portal "as" any client, contractor, or building manager from the admin app via a recipient picker
- [ ] **IMPER-02**: During impersonation, the designer cannot perform any write actions (server-side read-only enforcement on every mutation endpoint)
- [ ] **IMPER-03**: During impersonation, the system does not send any real outbound email (Resend calls return 403)
- [ ] **IMPER-04**: Impersonation sessions are time-bound (auto-expire after a fixed window) and scoped to one (recipient, project) pair
- [ ] **IMPER-05**: A persistent banner shows during impersonation displaying the admin's identity, the target recipient, and a one-click exit
- [ ] **IMPER-06**: Every impersonation start, end, and timeout is recorded in an append-only audit log with admin identity, target identity, tenant, project, and timestamps
- [ ] **IMPER-07**: Designer cannot impersonate across tenant boundaries (rejection verified by CI test on every PR)
- [ ] **IMPER-08**: Impersonation start requires fresh admin authentication (re-prompt if session is older than a configured threshold)

### Recipient Portal Polish (PORTAL)

- [ ] **PORTAL-01**: Client landing on `/portal/project/[id]` sees a "What's next?" card at the top of the page identifying their immediate action or expected next event
- [ ] **PORTAL-02**: Each major section of the project portal shows when it was last updated (last-activity timestamp)
- [ ] **PORTAL-03**: All portal pages render correctly at 375×667 mobile viewport — no horizontal scroll, readable body text, tap targets ≥44pt
- [ ] **PORTAL-04**: Representative portal routes (project, dashboard, login, verify) pass WCAG 2.1 AA assertions via @axe-core/playwright
- [ ] **PORTAL-05**: Portal header and footer chrome is consistent across every portal page, sourced from a single layout shell (PortalLayout + extracted components)
- [ ] **PORTAL-06**: Portal voice and visual rhythm match the admin's card-header band system (`.card-header`, brand tokens, sentence-case-via-CSS-uppercase)

### Portal Auth Flows (AUTH)

- [ ] **AUTH-01**: A recipient arriving with an expired or regenerated token sees distinct copy explaining what happened and how to recover, not a generic login screen
- [ ] **AUTH-02**: Login, verify, and role-select pages render in the polished portal shell with consistent typography and spacing

## Future Requirements (deferred)

These were considered for v5.3 but moved to a future milestone:

- Notification preferences UI — recipient opt-out of weekly digest, frequency control (deferred — substantial schema + UI work)
- Reply-to-designer form on the project portal (deferred — content/voice exercise, lower priority)
- Invoice / payment summary on the portal (deferred — needs procurement pricing visibility decision, currently excluded per Phase 37 D-13/D-14)
- Quick-switch impersonation (impersonate next recipient without exit) — deferred as anti-feature for MVP; revisit if usage data justifies it
- Accept / decline directly from work order email (deferred — needs API surface)
- Migration of `/workorder/*` and `/building/*` routes to PortalLayout (deferred to v5.4 — banner-only in v5.3)

## Out of Scope

Explicitly excluded with reasoning:

- **Public website (lasprezz.com Astro front end)** — separate scope and surface
- **Multi-tenant capability gating for front-end-bound settings** — already parked under v6.0 Linha Platform (PROJECT.md "Planned" section)
- **Embedded procurement pricing in client portal** — reaffirms Phase 37 D-13/D-14 (designer privacy)
- **Chat / messaging UI on portal** — already excluded in PROJECT.md "Out of Scope"
- **Public sharing of portal pages** — already excluded
- **Gamification / progress badges on portal** — already excluded
- **Migrating to a different email service provider** — Resend is staying; framework adoption is purely client-side
- **Email link tracking / engagement analytics** — not a v5.3 deliverable

## Traceability

Each requirement maps to exactly one phase. Phase numbering continues from Phase 44 (last shipped phase preceding v5.3).

| Requirement | Phase | Notes |
|---|---|---|
| EMAIL-01 | Phase 46 | Outlook/Gmail/Apple Mail rendering — Work Order satisfied by 46-01; Send Update satisfied by 46-04 (supersedes 46-02). Pattern inherited by Phase 48 via shared shell. |
| EMAIL-02 | Phase 46 | Plain-text alternative — `render(component, { plainText: true })` is the only source. Work Order via 46-01; Send Update via 46-04 compose helper. Phase 48 inherits. |
| EMAIL-03 | Phase 46 | Preheader text — pattern established on Work Order (46-01) and Send Update (46-04). Inherited by Phase 48. |
| EMAIL-04 | Phase 48 | "Or paste this link" fallback — fully exercised across the three smaller invitation emails; Work Order in Phase 46 conforms to the same pattern |
| EMAIL-05 | Phase 48 | Link-expiry copy — same scope as EMAIL-04 |
| EMAIL-06 | Phase 46 | List-Unsubscribe header — Send Update only. **Header wiring deferred to Plan 46-03** (parked at Checkpoint 1; pending re-sequencing per 46-04-CONTEXT D-28). **Preference store** (data model, HMAC tokens, `POST /api/unsubscribe` endpoint, `/portal/preferences` page, send-time gating) **deferred to a future phase** — out of v5.3 scope per 46-04-CONTEXT § Scope boundary. |
| EMAIL-07 | Phase 46 | Outlook-safe `<table>` markup — Work Order already conformed (46-01); Send Update satisfied by 46-04 redesign (table-safe `<Row>/<Column>` markup throughout; no `display:flex`, no `gap`, no `rem`, no shorthand `border-radius`). |
| EMAIL-08 | Phase 45 | Shared `brand-tokens.ts` module — foundation prerequisite |
| EMAIL-09 | Phase 45 | Golden HTML snapshots + Litmus harness — foundation prerequisite |
| EMAIL-10 | Phase 45 | Email asset CDN host — foundation prerequisite |
| EMAIL-11 | Phase 45 | DKIM / SPF / DMARC alignment — foundation prerequisite |
| IMPER-01 | Phase 50 | Recipient picker UI — depends on Phase 49 architecture |
| IMPER-02 | Phase 49 | Read-only enforcement — middleware gate, CI-tested |
| IMPER-03 | Phase 49 | Resend 403 from impersonated context — CI-tested |
| IMPER-04 | Phase 49 | Time-bound + (recipient, project) scoped — wrapped session schema |
| IMPER-05 | Phase 50 | Persistent banner — depends on Phase 47 layout slot + Phase 49 server state |
| IMPER-06 | Phase 49 | Audit log on `impersonationAudit` doc — D-2 |
| IMPER-07 | Phase 49 | Cross-tenant rejection — CI-tested on every PR |
| IMPER-08 | Phase 49 | Fresh admin auth required — mint endpoint check |
| PORTAL-01 | Phase 51 | "What's next?" card — depends on Phase 47 layout |
| PORTAL-02 | Phase 51 | Last-activity timestamps per section |
| PORTAL-03 | Phase 51 | Mobile 375×667 rendering |
| PORTAL-04 | Phase 52 | WCAG 2.1 AA via @axe-core/playwright — UAT phase |
| PORTAL-05 | Phase 47 | Portal Layout Hoist — PortalLayout + PortalHeader + PortalFooter |
| PORTAL-06 | Phase 51 | Card-header band parity with admin — depends on Phase 45 brand tokens |
| AUTH-01 | Phase 51 | Reason-coded login copy |
| AUTH-02 | Phase 51 | Login/verify/role-select in polished portal shell — depends on Phase 47 `bare` prop |

**Coverage:** 27/27 requirements mapped to exactly one phase. No orphans, no duplicates.
