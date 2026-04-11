// src/lib/sendUpdate/emailTemplate.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 04 (send-update-surface). Each pending
// stub becomes an active test when buildSendUpdateEmail is extracted.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-RESEARCH.md § 8 Validation Architecture

import { describe, it } from "vitest";

describe("buildSendUpdateEmail (Phase 34 Plan 04)", () => {
  it.todo("renders full HTML with personalNote at the top when provided");
  it.todo("omits personalNote block entirely when note is empty string");
  it.todo("includes Milestones section when showMilestones=true and project.milestones is non-empty");
  it.todo("omits Milestones section when showMilestones=false");
  it.todo("includes Procurement section when showProcurement=true AND engagementType='full-interior-design'");
  it.todo("omits Procurement section when engagementType !== 'full-interior-design' regardless of showProcurement");
  it.todo("includes Pending Reviews section when showArtifacts=true and pendingArtifacts.length > 0");
  it.todo("CTA href uses ctaHref param verbatim (not hardcoded /portal/dashboard)");
  it.todo("default ctaLabel is 'View in Your Portal' when not provided");
  it.todo("matches existing send-update.ts snapshot when called with the fixture input");
});
