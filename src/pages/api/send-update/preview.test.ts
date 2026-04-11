// src/pages/api/send-update/preview.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 04 (send-update-surface). Each pending
// stub becomes an active test when the preview endpoint lands.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-16; threat T-34-04

import { describe, it } from "vitest";

describe("GET /api/send-update/preview (Phase 34 Plan 04)", () => {
  it.todo("GET rejects unauthenticated request with 401");
  it.todo("GET rejects non-admin session with 401 (T-34-04)");
  it.todo("GET with valid admin session returns 200 and Content-Type 'text/html; charset=utf-8'");
  it.todo("response body is full HTML from buildSendUpdateEmail (contains project.title)");
  it.todo("honors clientId query param for per-client CTA preview");
  it.todo("does NOT call sanityWriteClient.patch (read-only endpoint)");
  it.todo("does NOT lazy-generate portalToken when clientId has no token");
  it.todo("section flags are parsed from query string and passed to buildSendUpdateEmail");
});
