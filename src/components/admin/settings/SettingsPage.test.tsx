// src/components/admin/settings/SettingsPage.test.tsx
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 03 (settings-surface). Each pending
// stub becomes an active test when the corresponding component is built.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Settings page layout

import { describe, it } from "vitest";

describe("SettingsPage (Phase 34 Plan 03)", () => {
  it.todo("renders four CollapsibleSection children (General, Social Links, Hero Slideshow, Rendering Configuration)");
  it.todo("General section is expanded by default; others collapsed");
  it.todo("sticky footer bar contains Save settings button");
  it.todo("dirty state indicator appears in footer left slot when form is modified");
  it.todo("saving state replaces button label with Saving... and Loader2 icon");
  it.todo("error banner appears in left slot when save returns 4xx/5xx");
});
