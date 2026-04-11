// src/pages/api/send-update.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 04 (send-update-surface). Each pending
// stub becomes an active test when usePersonalLinks wiring lands.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-17, D-18

import { describe, it } from "vitest";

describe("POST /api/send-update (Phase 34 Plan 04)", () => {
  it.todo("POST rejects non-admin session with 401");
  it.todo("POST with usePersonalLinks=false uses ${baseUrl}/portal/dashboard as CTA for all recipients");
  it.todo("POST with usePersonalLinks=true looks up client.portalToken for each recipient");
  it.todo("POST with usePersonalLinks=true calls patch(clientId).setIfMissing({ portalToken: newToken }) when client has no token");
  it.todo("POST with usePersonalLinks=true does NOT call setIfMissing when client already has a portalToken");
  it.todo("POST serially awaits per-recipient resend.emails.send (no Promise.all race)");
  it.todo("POST re-fetches client.portalToken after setIfMissing to resolve concurrent-tab race");
  it.todo("POST skips clients with no email (does not patch, does not send)");
  it.todo("POST writes updateLog entry with _key, sentAt ISO, recipientEmails, note, sectionsIncluded");
  it.todo("POST explicit sections.artifacts=false honors false regardless of pendingArtifacts.length (D-15)");
  it.todo("POST Milestones defaults ON when sections.milestones is undefined (backward compat)");
  it.todo("Multi-client project: Sarah no-token, Mike has-token, Jenny no-token — patch called for Sarah and Jenny only, 3 emails sent with 3 different CTAs");
});
