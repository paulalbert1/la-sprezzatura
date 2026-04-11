// src/pages/api/admin/site-settings.test.ts
// Nyquist Wave 0 stub — Phase 34 Plan 01.
// Implementation lands in Plan 03 (settings-surface). Each pending
// stub becomes an active test when the site-settings POST handler lands.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-CONTEXT.md D-05..D-12; threat T-34-01

import { describe, it } from "vitest";

describe("POST /api/admin/site-settings (Phase 34 Plan 03)", () => {
  it.todo("POST rejects non-admin session with 401 (T-34-01)");
  it.todo("POST action='update' patches siteSettings doc with allowed fields only");
  it.todo("POST action='update' with renderingAllocation=0 returns 400");
  it.todo("POST action='update' with renderingAllocation=1 returns 200");
  it.todo("POST action='update' with renderingAllocation=50 returns 200");
  it.todo("POST action='appendHeroSlide' with empty alt returns 400");
  it.todo("POST action='appendHeroSlide' persists { _type: 'image', asset: { _type: 'reference', _ref: ... }, alt }");
  it.todo("POST action='appendHeroSlide' rejects payloads containing a blob pathname instead of asset ref");
  it.todo("POST action='reorderHeroSlideshow' uses arrayMove order from request");
  it.todo("POST action='removeHeroSlide' uses _key to target the row");
  it.todo("POST action='update' with contactEmail missing '@' returns 400");
  it.todo("POST action='update' with siteTitle > 60 chars returns 400");
  it.todo("uses singleton _id='siteSettings' convention for the target document");
  it.todo("writes an updateLog entry with timestamp on every successful save");
});
