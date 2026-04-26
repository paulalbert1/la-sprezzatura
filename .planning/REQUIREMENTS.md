# Requirements: La Sprezzatura — v5.3 Third-Party Views & Outbound Email Polish

**Defined:** 2026-04-26
**Core Value:** Make every recipient-facing surface (clients, contractors, building managers) read with the same care as Liz's design work. Outbound email is the studio's most visible artifact — it must render reliably across Outlook desktop, Gmail, and Apple Mail, carry the studio's voice, and stay maintainable as new templates and per-tenant theming arrive in v6.0.

## v5.3 Requirements

### Email Template Foundations & Refresh (EMAIL)

- [ ] **EMAIL-01**: Every outbound email renders correctly in Outlook desktop (2016 / 2019 / 365), Gmail web, Gmail iOS, Apple Mail macOS, and Apple Mail iOS
- [ ] **EMAIL-02**: Every outbound email ships a plain-text alternative for screen readers and image-blocked clients
- [ ] **EMAIL-03**: Every outbound email includes preheader text that explains the message in the recipient's inbox preview
- [ ] **EMAIL-04**: Every transactional invitation email includes a visible "or paste this link" fallback for the primary CTA
- [ ] **EMAIL-05**: Every transactional invitation email includes copy stating how long the link remains valid
- [ ] **EMAIL-06**: The Send Update weekly digest includes a List-Unsubscribe header (Gmail/Yahoo bulk-sender requirement)
- [ ] **EMAIL-07**: The Send Update digest layout uses Outlook-safe `<table>` markup (no flex / grid / rem / `border-radius` shorthand)
- [ ] **EMAIL-08**: Brand colors, typography, and spacing in emails are sourced from a single shared brand-tokens module also consumed by Tailwind
- [ ] **EMAIL-09**: All five email templates (Send Update, Work Order, artifact-ready, contractor access, building access) carry golden HTML snapshots that gate future regressions
- [ ] **EMAIL-10**: Email assets (logo, etc.) are hosted on a stable, image-CDN endpoint with proper caching headers
- [ ] **EMAIL-11**: DKIM, SPF, and DMARC are aligned and verified for the production sender domain

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

To be filled by `/gsd-roadmap-create`. Each requirement maps to exactly one phase.

| Requirement | Phase | Notes |
|---|---|---|
| EMAIL-01..11 | TBD | |
| IMPER-01..08 | TBD | |
| PORTAL-01..06 | TBD | |
| AUTH-01..02 | TBD | |
