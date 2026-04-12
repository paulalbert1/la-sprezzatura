---
status: partial
phase: 34-settings-and-studio-retirement
source: [34-VERIFICATION.md]
started: 2026-04-12T02:10:00Z
updated: 2026-04-12T02:10:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. /admin/settings full roundtrip
expected: All 4 sections render (General, Social Links, Hero Slideshow, Rendering Config) + Studio Retirement Notice. Edit siteTitle and contactEmail, click Save. Toast confirms save. Settings persist on page reload.
why_human: Astro SSR + React island with live Sanity Content Lake read/write — requires live credentials.
result: [pending]

### 2. Hero slideshow upload + drag-reorder
expected: Upload a new image on the hero slideshow section. Image appears as a slide thumbnail with alt text field and drag handle visible. Drag-reorder works.
why_human: dnd-kit drag-reorder and Sanity asset upload via Path A (/api/admin/upload-sanity-image) require real browser + live Sanity write token.
result: [pending]

### 3. SendUpdateModal default state
expected: On project detail page, click the Send Update button. Modal renders recipients from project.clients. Milestones checkbox is checked (default ON). Pending reviews checkbox is unchecked (default OFF per D-15).
why_human: Default state depends on live project data from Sanity Content Lake (engagementType, procurementItems.length).
result: [pending]

### 4. Send Update email preview
expected: In the SendUpdateModal, click "Preview email". New tab opens with styled HTML email preview matching current project state.
why_human: Preview endpoint fetches live Sanity project data; requires browser context + admin session.
result: [pending]

### 5. RegenerateLinkDialog full round-trip
expected: On project detail Clients section, click the regenerate icon. Dialog warns "invalidates across ALL this client's projects". Click Confirm. Success toast appears with a new portal URL of form `/portal/client/{newToken}`. Copy button copies the URL.
why_human: Full Sanity write + response round-trip; requires live write token and real browser.
result: [pending]

### 6. /portal/client/[token] end-to-end
expected: Send a Send Update email with usePersonalLinks=true. Visit the `/portal/client/{token}` URL from the email. Dashboard renders client name + project cards, each linking to `/portal/project/[projectId]`. Made-up token redirects to `/portal/login` (404 — do not leak existence).
why_human: Requires email delivery via Resend + live Sanity data. End-to-end PURL flow cannot be exercised without live Content Lake.
result: [pending]

### 7. Session invalidation on regenerate
expected: Regenerate a client's portal token. An existing browser session with that client's old token is invalidated on next `/portal/*` navigation — middleware hash mismatch clears session, redirects to `/portal/login`.
why_human: Session cookie lifecycle + middleware hash re-validation require real browser session and live Sanity token state.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
