# Phase 46 Deferred Items

Out-of-scope discoveries logged during execution; not fixed in their discovery plan.

---

## D-pre-46 — `send-update.test.ts` mock-fetch ordering broken (pre-existing)

**Discovered during:** Plan 46-03 Task 3 verification (`npx vitest run src/pages/api/send-update.test.ts`).

**Symptom:** 3 of 12 tests fail in `src/pages/api/send-update.test.ts`:
- `POST re-fetches client.portalToken after setIfMissing to resolve concurrent-tab race`
- `Multi-client project: Sarah no-token, Mike has-token, Jenny no-token — patch called for Sarah and Jenny only, 3 emails sent with 3 different CTAs`
- One related multi-recipient assertion in the same suite.

**Root cause (read-only inference):** the route now performs THREE fetches per request when `usePersonalLinks=true` and a client has no token:
1. Project snapshot
2. siteSettings (Phase 38 sender resolver — `senderSettings` fetch in `src/pages/api/send-update.ts`)
3. Per-client portalToken re-fetch (post-setIfMissing race resolver)

The tests configure only two `mockFetch.mockResolvedValueOnce` calls — project + intended-as-refetch — so the siteSettings fetch silently consumes the value intended for the refetch, and the refetch returns `undefined`, falling back to `newToken`.

**Pre-existing:** confirmed by `git stash` + re-run on `3b1fc0f` (the baseline before Task 3). Three identical failures exist before any 46-03 Task 3 changes.

**Why deferred:** scope boundary rule — Task 3 only rewires the template invocation, it does not touch fetch ordering, sanity wiring, or the test mock setup. The fix is a test-file change (add a `mockResolvedValueOnce({ defaultFromEmail: "...", defaultCcEmail: "..." })` between the project and refetch values, or refactor the mock to be query-aware), which is out of scope for the cutover plan.

**Tracked for:** the next plan that touches `src/pages/api/send-update.test.ts` mock plumbing — likely a follow-up alongside the Phase 38 senderSettings refactor or a dedicated test-stability sweep.

**Recommended fix (not applied):**
```ts
// In each affected test, between project and refetch:
mockFetch.mockResolvedValueOnce({ defaultFromEmail: "office@lasprezz.com", defaultCcEmail: "" });
```

---

## D-pre-46-wo — `work-orders/[id]/send.test.ts` Upstash Redis url-mock missing (pre-existing)

**Discovered during:** Plan 46-03 post-cutover full-test reconciliation (orchestrator-level, after the executor's 6-failure disclosure was checked against `npm test` and found to be 13).

**Symptom:** 7 of 11 tests fail in `src/pages/api/admin/work-orders/[id]/send.test.ts`. Every failing test reaches the `await redis.set("magic:${magicToken}", ...)` call at `src/pages/api/admin/work-orders/[id]/send.ts:124`, which throws:

```
[Upstash Redis] Redis client was initialized without url or token. Failed to execute command.
[WorkOrder] Failed to send: TypeError: Failed to parse URL from /pipeline
```

The route returns 500; the assertion `expect(res.status).toBe(200)` (or similar success-path assertions) fails. Failing tests:
- `drops cc entirely when defaultCcEmail contains CRLF`
- `filters cc list to valid emails when defaultCcEmail is comma-separated mix`
- `falls back to RESEND_FROM env then 'office@lasprezz.com' when defaultFromEmail unset`
- `calls resend.emails.send with the resolved from/to/cc/subject/html/text`
- `on success, appends sendLog entry + sets lastSentAt + commits with autoGenerateArrayKeys:false`
- `returns { success: true, sentAt, resendId }`
- `when RESEND_API_KEY unset, skips resend.emails.send but still appends sendLog with empty resendId`

The 4 tests that pass don't reach line 124 (auth failures, 404 on workOrder fetch, 400 on bad email — all return early).

**Root cause (read-only inference):** `src/lib/redis.ts` initializes an Upstash client from `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env vars. The test file does not stub `redis` — so the real Upstash client is constructed at import time with `undefined` URL, then `redis.set()` attempts a fetch against `undefined + "/pipeline"` and throws `Invalid URL`.

**Pre-existing:** confirmed by `git checkout 3b1fc0f && npm test ...` — 7 identical failures at the baseline before Task 4 touched the file. The `redis.set` call at line 122 (baseline) / 124 (HEAD) is byte-identical pre/post-cutover. Task 4 only changed the template invocation lines (`buildWorkOrderEmail` → `render(<WorkOrder />)`), not the magic-link Redis store.

**Why deferred:** scope boundary rule — Task 4 only rewires the template invocation, it does not touch the magic-link Redis store, the test environment Redis configuration, or the test mock setup. The fix is a test-infrastructure change (add `vi.mock("../../../../../lib/redis", () => ({ redis: { set: vi.fn().mockResolvedValue("OK") } }))` to the test file's setup, or set fake Upstash env vars in `vitest.config.ts`), which is out of scope for the cutover plan.

**Why this wasn't surfaced earlier:** `redis.set` was added to this route during contractor magic-link work in an earlier phase. The test file was either written before that code path existed, or the test environment was once configured with real Upstash test creds and stopped being so. Either way, a pre-existing untestable production code path — not a regression.

**Tracked for:** the next plan that touches `src/pages/api/admin/work-orders/[id]/send.test.ts` setup — likely a dedicated test-stability sweep alongside the `D-pre-46` sweep, or a Phase 49 (Impersonation Architecture) audit if that phase touches the contractor magic-link flow.

**Recommended fix (not applied):**
```ts
// In src/pages/api/admin/work-orders/[id]/send.test.ts, top of file:
vi.mock("../../../../../lib/redis", () => ({
  redis: {
    set: vi.fn().mockResolvedValue("OK"),
    get: vi.fn().mockResolvedValue(null),
  },
}));
```

**Disclosure note:** the Plan 46-03 Task 7 executor disclosed 6 baseline failures (3 WorkOrder snapshot + 3 send-update mock-fetch). The actual baseline failure count is 13 — the additional 7 are these. Recorded here so the SUMMARY-writing agent has the full picture.
