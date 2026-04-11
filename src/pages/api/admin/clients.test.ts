// src/pages/api/admin/clients.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 05 (per-client-purl). Each pending
// stub becomes an active test when the regenerate-portal-token action lands.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-22

import { describe, it } from "vitest";

describe("regenerate-portal-token action (Phase 34 Plan 05)", () => {
  it.todo("POST action='regenerate-portal-token' rejects non-admin session with 401");
  it.todo("POST action='regenerate-portal-token' rejects missing clientId with 400");
  it.todo("POST action='regenerate-portal-token' generates a new 8-char token via generatePortalToken(8)");
  it.todo("POST action='regenerate-portal-token' calls patch(clientId).set({ portalToken: newToken }).commit()");
  it.todo("POST action='regenerate-portal-token' returns { success: true, portalToken: newToken }");
  it.todo("new token differs from any prior token (idempotency check)");
});
