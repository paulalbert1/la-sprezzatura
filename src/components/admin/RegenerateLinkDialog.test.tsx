// src/components/admin/RegenerateLinkDialog.test.tsx
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 05 (per-client-purl). Each pending
// stub becomes an active test when the corresponding component is built.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Regenerate link dialog

import { describe, it } from "vitest";

describe("RegenerateLinkDialog (Phase 34 Plan 05)", () => {
  it.todo("renders title 'Regenerate personal link for {clientName}?'");
  it.todo("body contains 'invalidates the current link across ALL this client's projects'");
  it.todo("cancel button dismisses dialog without API call");
  it.todo("confirm button posts { action: 'regenerate-portal-token', clientId } to /api/admin/clients");
  it.todo("success response triggers toast with full URL and Copy link button");
  it.todo("Copy link click flips button label to 'Copied ✓' for 1.5s");
});
