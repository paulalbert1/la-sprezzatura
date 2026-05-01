---
phase: 48-smaller-transactional-emails
reviewed: 2026-04-30T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/emails/artifactReady/ArtifactReady.tsx
  - src/emails/artifactReady/ArtifactReady.test.ts
  - src/emails/artifactReady/fixtures.ts
  - src/emails/buildingAccess/BuildingAccess.tsx
  - src/emails/buildingAccess/BuildingAccess.test.ts
  - src/emails/buildingAccess/fixtures.ts
  - src/emails/workOrderAccess/WorkOrderAccess.tsx
  - src/emails/workOrderAccess/WorkOrderAccess.test.ts
  - src/emails/workOrderAccess/fixtures.ts
  - src/emails/fixtures.shared.ts
  - src/emails/sendUpdate/SendUpdate.test.ts
  - src/lib/email/tenantBrand.ts
  - src/lib/email/tenantBrand.test.ts
  - src/lib/portal/tokenTtl.ts
  - src/lib/portal/tokenTtl.test.ts
  - src/pages/api/notify-artifact.ts
  - src/pages/api/send-building-access.ts
  - src/pages/api/send-workorder-access.ts
findings:
  critical: 3
  warning: 3
  info: 1
  total: 7
status: issues_found
---

# Phase 48: Code Review Report

**Reviewed:** 2026-04-30
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Phase 48 introduces three react-email templates (ArtifactReady, BuildingAccess, WorkOrderAccess) and rewires the three corresponding API routes to use them. The EMAIL-05 TTL invariant is correctly implemented — both sides import `MAGIC_LINK_ACCESS_TTL_SECONDS` from a single module, and the drift-guard tests in `tokenTtl.test.ts` prove it structurally.

Two critical security findings stand out: all three API routes are completely unauthenticated (no session check, no admin gate), and `notify-artifact.ts` interpolates an unvalidated caller-supplied `artifactKey` directly into a Sanity patch path string, bypassing the parameterized GROQ the same file uses for its fetch. A third critical issue is that `send-building-access.ts` and `send-workorder-access.ts` silently mint and store magic-link tokens in Redis even when `RESEND_API_KEY` is absent — the token is live and the email is never sent.

---

## Critical Issues

### CR-01: All three API routes are unauthenticated — any anonymous caller can trigger magic-link mints and email sends

**File:** `src/pages/api/notify-artifact.ts:1`, `src/pages/api/send-building-access.ts:1`, `src/pages/api/send-workorder-access.ts:1`

**Issue:** Every other admin-action route in this codebase checks `getSession(cookies)` and asserts `session.role === "admin"` before executing. The existing `send-update.ts` (Phase 34, T-34-03) does this correctly at line 120. The three new routes — `notify-artifact`, `send-building-access`, and `send-workorder-access` — perform no authentication check whatsoever. The Astro middleware covers `/api/admin/*` and the portal-path prefixes, but it does **not** protect `/api/notify-artifact`, `/api/send-building-access`, or `/api/send-workorder-access` — the middleware ends with `return next()` for all unmatched paths (middleware.ts line 249).

Consequence: any unauthenticated HTTP client (or a logged-in portal client or contractor) can POST to these routes and:
- Trigger email sends to arbitrary clients/contractors/building-managers using a valid Resend key.
- Mint live magic-link tokens (stored in Redis with full TTL) for any contractorId or projectId they supply.
- Enumerate project and contractor data via the 404 vs 200 difference.

**Fix:**
```typescript
// Add at the top of the POST handler, before any body parsing:
import { getSession } from "../../lib/session";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const session = await getSession(cookies);
    if (!session || session.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    // ... rest of handler
```

---

### CR-02: `artifactKey` is string-interpolated into a Sanity patch path without validation — GROQ path injection

**File:** `src/pages/api/notify-artifact.ts:104`

**Issue:** The GROQ fetch at line 28 correctly uses a parameterized query (`$artifactKey`), which Sanity escapes. However, the subsequent `.insert()` call at line 102–105 string-interpolates `artifactKey` directly into the selector path:

```typescript
`artifacts[_key == "${artifactKey}"].notificationLog[-1]`
```

`artifactKey` comes from the caller-supplied request body (`request.json()` at line 13) and is only checked for truthiness (line 15). A value containing `"` or `]` characters can break the intended path structure. For example, the value:

```
abc"]|anything[
```

produces the path:

```
artifacts[_key == "abc"]|anything["].notificationLog[-1]
```

The Sanity client's `insert()` takes the selector string and passes it to the server; behavior for malformed selectors is implementation-defined and could be exploited to target unintended document paths. This is a GROQ-path injection in the mutation layer, distinct from a parameterized-query injection in the fetch layer.

**Fix:** Validate `artifactKey` against a strict allowlist pattern before using it in the interpolated path:

```typescript
const SAFE_KEY_RE = /^[a-zA-Z0-9_-]{1,64}$/;
if (!SAFE_KEY_RE.test(artifactKey)) {
  return new Response(
    JSON.stringify({ error: "Invalid artifactKey format" }),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}
```

Alternatively, look up the `_key` from the already-fetched `artifact._key` (which was returned by the parameterized GROQ query) and use that trusted value in the patch, discarding the raw input:

```typescript
// After line 44: use artifact._key (already GROQ-resolved) instead of the raw input
const safeKey = artifact._key;  // trusted from Sanity response
// ...
`artifacts[_key == "${safeKey}"].notificationLog[-1]`
```

---

### CR-03: Magic-link tokens are minted and stored in Redis before `RESEND_API_KEY` is checked — orphaned live tokens when email is not sent

**File:** `src/pages/api/send-building-access.ts:48-65`, `src/pages/api/send-workorder-access.ts:52-66`

**Issue:** Both routes call `redis.set(magic:${token}, ..., { ex: MAGIC_LINK_ACCESS_TTL_SECONDS })` unconditionally at lines 59/64 (`send-building-access`) and 57/63 (`send-workorder-access`). The check `if (apiKey)` for sending the email occurs at line 72 (`send-building-access`) and line 74 (`send-workorder-access`) — **after** the token is already persisted. When `RESEND_API_KEY` is absent:

1. A valid, working magic-link token sits in Redis for 15 minutes.
2. The recipient never receives the email with the link.
3. The `console.log` at line 100 (`send-building-access`) leaks the plaintext token to server logs.
4. The route returns `{ success: true }` (line 104/109), giving the caller no indication that delivery failed.

The practical risk in production is low (the key would be set), but in staging/dev environments where `RESEND_API_KEY` is absent, the console.log at line 100 (`[SendBuildingAccess] No RESEND_API_KEY set. Magic link token: <token>`) exposes a live, redeemable token in logs.

**Fix:** Move the `apiKey` check before the token mint, or delete the token if the send path is skipped, and remove the token from the log statement:

```typescript
const apiKey = import.meta.env.RESEND_API_KEY;
if (!apiKey) {
  console.log("[SendBuildingAccess] No RESEND_API_KEY set — skipping send.");
  return new Response(JSON.stringify({ success: true, skipped: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}
// Only mint the token when we know we can send.
const token = generatePortalToken(32);
// ... redis.set, build magicLink, send email
```

---

## Warnings

### WR-01: Hardcoded `"15 minutes"` literal in preheader strings violates the EMAIL-05 invariant at the presentational layer

**File:** `src/pages/api/send-workorder-access.ts:90`, `src/pages/api/send-building-access.ts:85`

**Issue:** Both routes pass a hardcoded string `"link expires in 15 minutes"` as the `preheader` prop:

```typescript
preheader: `Your work-order portal access — link expires in 15 minutes`,
preheader: `Your building portal access — link expires in 15 minutes`,
```

`MAGIC_LINK_ACCESS_TTL_SECONDS` is 900 (15 minutes) today. If it changes, the in-body expiry copy (derived from `formatExpiryCopy(MAGIC_LINK_ACCESS_TTL_SECONDS)`) will update correctly, but the inbox preview text will silently lie to recipients. The test comment in `tokenTtl.test.ts` line 235 acknowledges this as "a separate issue from EMAIL-05 drift," but naming it separately does not make it harmless.

**Fix:** Derive the preheader from the same constant:

```typescript
import { MAGIC_LINK_ACCESS_TTL_SECONDS, formatExpiryCopy } from "../../lib/portal/tokenTtl";

// ...
const expiryPhrase = formatExpiryCopy(MAGIC_LINK_ACCESS_TTL_SECONDS)
  .replace("This link expires in ", "link expires in ")
  .replace(".", "");

preheader: `Your work-order portal access — ${expiryPhrase}`,
```

---

### WR-02: `getTenantBrand()` silently falls back to `LA_SPREZZATURA_TENANT` on Sanity error — misconfigured signoff name ships without operator notice

**File:** `src/lib/email/tenantBrand.ts:67-87`

**Issue:** `getTenantBrand()` swallows all Sanity fetch errors at line 73 (`catch { return LA_SPREZZATURA_TENANT; }`) and also silently falls back when `signoffName` is empty string after trimming (line 78: `row?.signoffName?.trim() ?? ""`). If Settings has never been configured, `signoff` is `""`, and both `signoffNameFormal` and `signoffNameCasual` are set to `""` — the email footer renders with an empty name. This is different from the hardcoded fallback (which at least has "Elizabeth Olivier") and the code comment acknowledges the error-swallow as intentional. However, an empty signoff name is worse than the fallback name: it renders a blank signature line rather than triggering a visible sentinel the operator would notice.

**Fix:** When `signoff` is empty after trim, use the fallback value rather than empty string:

```typescript
const signoff = row?.signoffName?.trim() || LA_SPREZZATURA_TENANT.signoffNameFormal;
const location = row?.studioLocation?.trim() || LA_SPREZZATURA_TENANT.signoffLocation;
```

This preserves the "send rather than 500" failure mode while ensuring the footer always renders a non-blank name.

---

### WR-03: `WorkOrderAccessEmailInput.contractor.name` is typed as required `string` but the GROQ query result can return `null` — type lie causes silent `"null,"` greeting

**File:** `src/emails/workOrderAccess/fixtures.ts:15`, `src/pages/api/send-workorder-access.ts:86`

**Issue:** `WorkOrderAccessEmailInput` declares `contractor: { name: string; email: string }` (line 15 of fixtures.ts — `name` is non-optional). The API route at send-workorder-access.ts:86 passes `contractor.name` which comes from a GROQ query result. Sanity fields can be null if not populated; the TypeScript type is a lie maintained by `as any`-style casts in the GROQ fetch path. If a contractor record in Sanity has no `name` field, `contractor.name` is `null` at runtime. The template's default fallback `?? "there"` (WorkOrderAccess.tsx:33) guards the first-name extraction, but the `WorkOrderAccessEmailInput` interface is passed directly from the API route without going through that guard — so if the API route passes `null` as `name`, TypeScript does not catch it.

Compare: `BuildingAccessEmailInput.buildingManager.name` is correctly typed as `name?: string` (optional), matching the real possibility of nullability.

**Fix:** Change the interface to mark `name` as optional, matching the Sanity field reality and the `BuildingAccess` pattern:

```typescript
// fixtures.ts line 15
contractor: { name?: string; email: string };
```

This makes the TypeScript type honest and allows the `?? "there"` fallback in `WorkOrderAccess.tsx` to be the correct runtime guard.

---

## Info

### IN-01: `error.message` exposed verbatim in 500 responses leaks internal details

**File:** `src/pages/api/notify-artifact.ts:121`, `src/pages/api/send-building-access.ts:110`, `src/pages/api/send-workorder-access.ts:115`

**Issue:** All three routes return `JSON.stringify({ error: error.message })` in their catch blocks. Internal error messages from Sanity, Redis, or Resend SDK can contain connection strings, internal IDs, Sanity dataset names, or stack fragments. This is consistent with the pre-existing `send-update.ts` catch block pattern, but it represents an information-disclosure opportunity that should be addressed uniformly.

**Fix:** Return a generic message in production responses and log the full error server-side (already done via `console.error`):

```typescript
return new Response(
  JSON.stringify({ error: "Internal server error" }),
  { status: 500, headers: { "Content-Type": "application/json" } },
);
```

---

_Reviewed: 2026-04-30_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
