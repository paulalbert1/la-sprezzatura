// src/components/admin/SendUpdateModal.test.tsx
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 04 (send-update-surface). Each pending
// stub becomes an active test when the corresponding component is built.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Send Update modal

import { describe, it } from "vitest";

describe("SendUpdateModal (Phase 34 Plan 04)", () => {
  it.todo("Milestones checkbox defaults to ON");
  it.todo("Procurement checkbox defaults to ON when engagementType='full-interior-design' AND procurementItems.length > 0");
  it.todo("Procurement row is hidden (not disabled) when engagementType !== 'full-interior-design'");
  it.todo("Pending reviews checkbox defaults to OFF (D-15 intentional)");
  it.todo("Personal link toggle defaults to ON (usePersonalLinks: true)");
  it.todo("Preview email button opens /api/send-update/preview in a new tab (target=_blank)");
  it.todo("Cancel button dismisses the modal");
  it.todo("Send button calls POST /api/send-update exactly once per click with sections object and usePersonalLinks flag");
  it.todo("sending state: button label becomes 'Sending...', bg #C4A97A, disabled");
  it.todo("success state: modal auto-closes; Update sent to N recipients toast appears");
  it.todo("error state: inline error banner appears above actions footer");
  it.todo("no-clients error: Send button disabled, message 'This project has no clients assigned…'");
});
