// src/pages/api/blob-upload.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 02 (foundation-primitives). Each pending
// stub becomes an active test when the admin-gate backfill lands.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md KR-3 (blob-upload auth); threat T-34-02

import { describe, it } from "vitest";

describe("blob-upload admin gate (Phase 34 Plan 02)", () => {
  it.todo("PUT rejects unauthenticated request with 401 (T-34-02 backfill)");
  it.todo("PUT rejects non-admin session with 401");
  it.todo("POST (token issuance) rejects unauthenticated request with 401");
  it.todo("POST (token issuance) rejects non-admin session with 401");
  it.todo("PUT rejects MIME not in allowlist (pdf|jpeg|png|webp|heic|heif)");
  it.todo("PUT with valid admin session returns { url, pathname } on success");
});
