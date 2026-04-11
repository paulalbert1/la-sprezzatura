// src/pages/api/admin/upload-sanity-image.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 02 (foundation-primitives). Each pending
// stub becomes an active test when the Sanity asset upload route lands.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-09 revised (Path A); threat T-34-02

import { describe, it } from "vitest";

describe("POST /api/admin/upload-sanity-image (Phase 34 Plan 02)", () => {
  it.todo("POST rejects unauthenticated request with 401 (T-34-02)");
  it.todo("POST rejects non-admin session with 401");
  it.todo("POST rejects MIME not in image/jpeg|png|webp|heic|heif allowlist");
  it.todo("POST calls sanityWriteClient.assets.upload('image', file, { filename, contentType })");
  it.todo("POST returns the full asset document with _id and url fields");
  it.todo("POST returns 400 when no file field in multipart body");
});
