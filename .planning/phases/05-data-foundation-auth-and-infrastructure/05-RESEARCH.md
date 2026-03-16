# Phase 5: Data Foundation, Auth, and Infrastructure - Research

**Researched:** 2026-03-16
**Domain:** Magic-link auth (Astro/Vercel), Sanity schema evolution, Upstash Redis, Resend domain DNS
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Magic Link Auth Flow**
- Login page: branded email entry form at `/portal/login` — luxury aesthetic matching public site
- Client enters email → receives magic link email → clicks link → gets cookie-based session
- Magic link expiry: 15 minutes from generation
- Session duration: 30 days (cookie-based, httpOnly, secure)
- Multi-device: each device gets its own session — no device limit, no session invalidation on new login
- Old PURL links (`/portal/[token]`): redirect to `/portal/login` with upgrade message
- Single-use magic links: link consumed on first click, cannot be reused
- Rate limit magic link requests per email address to prevent abuse

**Client Dashboard**
- After login, client lands on a project dashboard at `/portal/dashboard`
- Card grid: each card shows project name, current pipeline stage badge, and a visual indicator
- Auto-redirect: if client has exactly 1 project, skip dashboard and go straight to project detail
- Projects shown: active first, completed below with muted visual treatment
- Greeting: "Welcome back, {firstName}" with subtitle "{N} active project(s)"

**Client Data Model in Sanity**
- New `client` document type: name, email (unique), phone, preferred contact method, structured address
- Preferred contact method: Phone / Email / Text dropdown — Liz's internal operational note, NOT client-facing
- Structured address on client (home/billing): street, city, state, zip
- Structured address on project (location): street, city, state, zip + admin notes field
- Client-to-project linking: reference array field (`clients`) on project schema pointing to client documents
- Primary contact: toggle per client reference on the project
- A client can have multiple projects; a project can have multiple clients
- Existing `clientName` string field on project is replaced by client reference relationship

**Email Infrastructure**
- Sender domain: `send.lasprezz.com` (subdomain isolates from Microsoft 365 on lasprezz.com)
- Sender address: `noreply@send.lasprezz.com`
- Display name: "La Sprezzatura"
- Subject line: "Your La Sprezzatura Portal Access"
- Branded HTML email template — warm neutrals, logo, Cormorant Garamond heading, inline CSS tables
- SPF/DKIM on `send.lasprezz.com` configured to coexist with Microsoft 365 MX on lasprezz.com

**Rate Limiter Upgrade**
- Upgrade from in-memory Map to persistent storage (serverless-compatible)
- Per-email-address throttling for magic link requests (not just IP-based)
- Must survive Vercel serverless cold starts

**Financial Data Foundation**
- All financial values stored as integer cents (PROC-03)

### Claude's Discretion
- Auth library choice (custom implementation vs lucia vs oslo) — pick what works best with Astro + Vercel serverless
- Session token generation and storage mechanism
- Persistent rate limiter backing store (Vercel KV, Upstash Redis, or other)
- Exact login page design details (layout, animation, error states)
- Magic link token format and length
- How to handle "email not found" on login (reveal vs don't reveal whether email exists)
- Dashboard card design details (spacing, shadows, hover states)
- Address copy mechanism in Sanity Studio (custom action vs manual)
- Whether to add a logout button or let sessions expire naturally

### Deferred Ideas (OUT OF SCOPE)
- Project location admin notes could evolve into a richer "site details" section (gate codes, parking, key lockbox) — future enhancement
- Address autocomplete / geocoding for structured address fields
- Client profile photo or avatar
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | Client receives a magic link email to access the portal — no password or account creation | Magic link flow: Astro Action → Upstash token storage → Resend email send |
| AUTH-02 | Magic link grants a cookie-based session that persists across visits | `Astro.cookies.set()` with httpOnly, 30-day maxAge, secure flag |
| AUTH-03 | Authenticated client sees a dashboard of all their projects (active and historical) | GROQ query: `*[_type == "project" && references($clientId)]` with client reference schema |
| AUTH-04 | Approvals attributed to authenticated client identity; primary contact confirms on behalf of all parties | Client identity stored in session locals; pattern established but full approval UI is Phase 6 |
| AUTH-05 | Unauthenticated visitors see only branded login page — no project data exposed | Astro middleware: protect all `/portal/*` routes except `/portal/login` |
| CLNT-04 | Liz creates client records in Sanity: name, email, phone, address, preferred contact method | New `client` document type in Sanity schema |
| CLNT-05 | A client can have multiple projects; a project can have multiple clients; one designated primary | Array of objects on project: `{client: reference, isPrimary: boolean}` |
| PROC-03 | All financial values stored as integer cents to prevent rounding errors | Sanity number field with `.integer()` validation on procurement schema fields |
| INFRA-07 | Rate limiter upgraded from in-memory to persistent storage for serverless | `@upstash/ratelimit` with Upstash Redis — replaces in-memory Map |
| INFRA-08 | Resend domain verified for `send.lasprezz.com` with SPF/DKIM coexisting with Microsoft 365 | Resend dashboard DNS record generation; subdomain isolation safe from M365 MX |
</phase_requirements>

---

## Summary

Phase 5 is the foundation layer for the client portal. It has four distinct technical tracks that are largely independent of each other and can be executed in parallel: (1) Sanity schema additions for the `client` document type and updated `project` schema, (2) the magic-link authentication system built on Astro Actions, Upstash Redis token storage, and Astro middleware session guards, (3) the Resend subdomain DNS verification for `send.lasprezz.com`, and (4) the rate limiter upgrade from in-memory to Upstash Redis.

The authentication system does not require a third-party auth library. A custom implementation using `generateToken.ts` (already exists), `Astro.cookies.set()`, Upstash Redis for token + session storage, and `defineMiddleware()` for route protection is the right fit for this specific, simple flow: email → magic link → 30-day session. Introducing Lucia or Better Auth would add complexity with no benefit for this single-role, no-password use case.

Upstash Redis is the right backing store for both the magic link tokens and the rate limiter. Vercel KV is deprecated for new projects as of 2025. Upstash has a generous free tier (500K commands/month as of March 2025), integrates directly via Vercel Marketplace (auto-populates `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`), and powers the `@upstash/ratelimit` library that replaces the existing in-memory Map.

**Primary recommendation:** Custom magic-link auth with Upstash Redis for token + session + rate-limit storage. No auth library. Astro's built-in `Astro.cookies` API for session cookie (not the Astro Sessions API — see Standard Stack for rationale). Astro middleware for route protection.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/redis` | ^1.34 | Token storage, session lookups, rate limiting | HTTP-based (no TCP), works in Vercel serverless; free tier sufficient for this scale |
| `@upstash/ratelimit` | ^2.0 | Serverless-safe rate limiting | Only connectionless rate-limit library; sliding window algorithm; replaces existing in-memory Map |
| `astro:middleware` `defineMiddleware` | (built-in, Astro 6) | Session guard on `/portal/*` routes | No install needed; gets types from env.d.ts App.Locals |
| `resend` | ^6.4.2 (already installed) | Send magic link emails | Already in use; same client as contact form |
| `astro:actions` `defineAction` | (built-in, Astro 6) | Magic link request + verification endpoints | Follows existing pattern in `src/actions/index.ts` |

### Why NOT Astro Sessions API (built-in, astro@5.7+)

The Astro Sessions API (stable as of Astro 5.7) stores session data server-side with a session ID cookie. It would require configuring an Upstash Redis driver in `astro.config.mjs`, adds the `REDIS_URL` env var, and introduces an async `context.session.get()/set()` API. For this portal's auth use case, the simpler approach is to use Upstash Redis directly for token storage and set a single `httpOnly` cookie containing the session token. This keeps the auth flow transparent, avoids Astro Sessions API's requirement for a Redis `sessionDrivers.redis` config change, and keeps the pattern consistent with the existing `portalToken` cookie pattern. Use Astro Sessions if future phases need server-stored session data beyond a client ID; for Phase 5, direct cookie + Upstash is simpler.

### Why NOT auth libraries (Lucia, Better Auth, Clerk)

This portal has a single user type (client), no password, no OAuth, no roles. Lucia and Better Auth solve multi-role, multi-provider auth problems. They add schema dependencies (sessions tables, users tables, adapters) that conflict with Sanity as the data source. Clerk is SaaS and adds cost. Custom implementation using existing `generateToken.ts` + Upstash + `Astro.cookies` covers 100% of the requirements with less complexity.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `astro:schema` `z` | (built-in) | Input validation on Actions | Already used in `submitContact` — same pattern for `requestMagicLink` and `verifyMagicLink` |

### Installation
```bash
npm install @upstash/redis @upstash/ratelimit
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 5 additions)

```
src/
├── sanity/
│   ├── schemas/
│   │   ├── client.ts          # NEW: client document type
│   │   ├── project.ts         # EXTENDED: add clients[] array, structured address
│   │   └── index.ts           # UPDATED: register client schema
│   └── queries.ts             # EXTENDED: getClientByEmail(), getProjectsByClientId()
├── actions/
│   └── index.ts               # EXTENDED: requestMagicLink, verifyMagicLink actions
├── lib/
│   ├── rateLimit.ts            # REPLACED: upgrade to @upstash/ratelimit
│   ├── generateToken.ts        # REUSE as-is: used for magic link tokens
│   └── session.ts              # NEW: session helpers (getSession, clearSession)
├── middleware.ts               # NEW: protect /portal/* routes
└── pages/
    └── portal/
        ├── login.astro         # NEW: email entry form
        ├── verify.astro        # NEW: magic link landing page (consumes token)
        ├── dashboard.astro     # NEW: project card grid
        └── [token].astro       # MODIFIED: redirect to /portal/login with message
```

### Pattern 1: Magic Link Request Action

**What:** Client submits email → validate → check client exists in Sanity → generate token → store in Upstash with 15min TTL → send email via Resend
**When to use:** `/portal/login` form submission

```typescript
// src/actions/index.ts (addition)
// Source: Astro Actions docs + everythingcs.dev/blog/astro-js-passwordless-magic-link-authentication/
requestMagicLink: defineAction({
  accept: "form",
  input: z.object({ email: z.string().email() }),
  handler: async (input, context) => {
    // Rate limit by email (per-email, not just IP)
    const identifier = `magic-link:${input.email.toLowerCase()}`;
    const { success } = await ratelimit.limit(identifier);
    if (!success) throw new ActionError({ code: "TOO_MANY_REQUESTS", message: "..." });

    // Look up client in Sanity
    const client = await getClientByEmail(input.email);
    // Always respond "check your email" — don't reveal whether email exists (user enumeration prevention)

    if (client) {
      const token = generatePortalToken(32);
      await redis.set(`magic:${token}`, client._id, { ex: 900 }); // 15 min TTL
      await resend.emails.send({ from: "La Sprezzatura <noreply@send.lasprezz.com>", ... });
    }

    return { success: true }; // Always return success regardless
  },
}),
```

### Pattern 2: Magic Link Verification Page

**What:** Client clicks link at `/portal/verify?token=XXX` → validate token from Upstash → delete token (single-use) → set httpOnly session cookie → redirect to dashboard
**When to use:** The link target from the magic link email

```typescript
// src/pages/portal/verify.astro
// Source: Astro Cookies API (docs.astro.build/en/reference/api-reference/)
const token = Astro.url.searchParams.get("token");
const clientId = token ? await redis.getdel(`magic:${token}`) : null;
// getdel atomically gets and deletes — enforces single-use

if (!clientId) {
  return Astro.redirect("/portal/login?error=expired");
}

const sessionToken = generatePortalToken(32);
await redis.set(`session:${sessionToken}`, clientId, { ex: 60 * 60 * 24 * 30 }); // 30 days

Astro.cookies.set("portal_session", sessionToken, {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secure: import.meta.env.PROD,
});

return Astro.redirect("/portal/dashboard");
```

### Pattern 3: Middleware Session Guard

**What:** Every request to `/portal/*` (except `/portal/login` and `/portal/verify`) checks for valid session cookie → looks up in Upstash → injects client ID into `locals`
**When to use:** `src/middleware.ts`

```typescript
// src/middleware.ts
// Source: docs.astro.build/en/guides/middleware/
import { defineMiddleware } from "astro:middleware";

const PUBLIC_PORTAL_PATHS = ["/portal/login", "/portal/verify"];

export const onRequest = defineMiddleware(async (context, next) => {
  if (!context.url.pathname.startsWith("/portal")) return next();
  if (PUBLIC_PORTAL_PATHS.some(p => context.url.pathname.startsWith(p))) return next();

  const sessionToken = context.cookies.get("portal_session")?.value;
  if (!sessionToken) return context.redirect("/portal/login");

  const clientId = await redis.get(`session:${sessionToken}`);
  if (!clientId) {
    context.cookies.delete("portal_session");
    return context.redirect("/portal/login");
  }

  context.locals.clientId = clientId as string;
  return next();
});
```

```typescript
// src/env.d.ts (extend App.Locals)
declare namespace App {
  interface Locals {
    clientId: string | undefined;
  }
}
```

### Pattern 4: Upstash Rate Limiter (replaces in-memory)

**What:** `@upstash/ratelimit` with sliding window algorithm, keyed by email address for magic link requests
**When to use:** Upgrade `src/lib/rateLimit.ts`

```typescript
// src/lib/rateLimit.ts (replacement)
// Source: github.com/upstash/ratelimit-js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

// Magic link: 3 requests per 10 minutes per email
export const magicLinkRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "ratelimit:magic",
});

// Legacy IP-based for contact form (keep backward compatible)
export const contactRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  prefix: "ratelimit:contact",
});
```

### Pattern 5: Sanity Client Schema with Many-to-Many Reference

**What:** New `client` document, and `project` schema extended with an array of objects each containing a client reference + isPrimary boolean
**When to use:** `src/sanity/schemas/client.ts` (new) and `project.ts` (extended)

```typescript
// src/sanity/schemas/client.ts
// Source: sanity.io/docs/studio/reference-type
import { defineType, defineField, defineArrayMember } from "sanity";

export const client = defineType({
  name: "client",
  title: "Client",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Full Name", type: "string", validation: r => r.required() }),
    defineField({ name: "email", title: "Email Address", type: "string",
      validation: r => r.required().email() }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({
      name: "preferredContact", title: "Preferred Contact Method", type: "string",
      description: "How Liz prefers to reach this client — internal note only",
      options: { list: [
        { title: "Phone", value: "phone" },
        { title: "Email", value: "email" },
        { title: "Text", value: "text" },
      ]},
    }),
    defineField({
      name: "address", title: "Home / Billing Address", type: "object",
      fields: [
        defineField({ name: "street", type: "string" }),
        defineField({ name: "city", type: "string" }),
        defineField({ name: "state", type: "string" }),
        defineField({ name: "zip", type: "string" }),
      ],
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "email" },
  },
});
```

```typescript
// project.ts additions (Phase 5 portal group fields)
// Replace clientName string with:
defineField({
  name: "clients",
  title: "Clients",
  type: "array",
  group: "portal",
  of: [
    defineArrayMember({
      type: "object",
      fields: [
        defineField({ name: "client", type: "reference", to: [{ type: "client" }],
          validation: r => r.required() }),
        defineField({ name: "isPrimary", title: "Primary Contact", type: "boolean",
          initialValue: false }),
      ],
      preview: {
        select: { title: "client.name", subtitle: "isPrimary" },
        prepare: ({ title, subtitle }) => ({
          title, subtitle: subtitle ? "Primary Contact" : "Additional Client"
        }),
      },
    }),
  ],
}),
// Project location (structured)
defineField({
  name: "projectAddress", title: "Project Location", type: "object", group: "portal",
  fields: [
    defineField({ name: "street", type: "string" }),
    defineField({ name: "city", type: "string" }),
    defineField({ name: "state", type: "string" }),
    defineField({ name: "zip", type: "string" }),
    defineField({ name: "adminNotes", title: "Access Notes (Internal)",
      type: "text", rows: 2,
      description: "e.g., Gate code, entry instructions — never shown to clients" }),
  ],
}),
```

### Pattern 6: GROQ Queries for Auth

```groq
// Look up client by email for magic link request
// Source: sanity.io/docs/content-lake/query-cheat-sheet
*[_type == "client" && email == $email][0] { _id, name, email }

// Get all projects for an authenticated client
*[_type == "project" && portalEnabled == true && clients[].client._ref match $clientId] {
  _id, title, pipelineStage, clients
}

// Or using references() built-in function (preferred):
*[_type == "project" && portalEnabled == true && references($clientId)] {
  _id, title, pipelineStage,
  "isPrimary": clients[client._ref == $clientId][0].isPrimary
}
```

### Anti-Patterns to Avoid

- **Storing tokens in Astro Sessions API:** The Astro Sessions API stores data server-side but requires Redis config in `astro.config.mjs` and `sessionDrivers.redis`. For this use case, managing the cookie and Redis keys directly is simpler and more explicit.
- **Dual rate limiting for magic links (IP + email):** Only rate-limit by email. IP-based limits create false positives on shared IPs (offices, coffee shops) and NAT. Email-based is the correct identifier for magic link abuse.
- **Revealing "email not found":** Always return a generic "check your email" response regardless of whether the email matches a client. This prevents user enumeration attacks (OWASP).
- **`getdel` vs `get` + `del` for token consumption:** Use Redis `GETDEL` (atomic) to get-and-delete the magic link token in a single operation. Using `get` followed by `del` is a race condition.
- **Keeping `clientName` string field alongside client references:** Remove `clientName` from project schema in Phase 5. Migration: existing portal pages use the string, but `[token].astro` is being replaced with a redirect anyway.
- **Using Vercel KV:** Vercel KV is no longer available for new projects (deprecated 2025). Use Upstash Redis directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Serverless rate limiting | A persistent rate limit using Vercel Edge Config or KV manually | `@upstash/ratelimit` sliding window | Handles window reset, race conditions, multiple algorithms |
| Token atomic get-and-delete | `redis.get()` then `redis.del()` | `redis.getdel()` (Upstash Redis SDK) | Atomic; prevents race condition where two requests consume same token |
| Sanity email uniqueness | Custom validation checking all documents | Sanity `rule.unique()` or application-layer check on `getClientByEmail()` | Sanity's `rule.custom()` can async-query for uniqueness |

**Key insight:** The magic link token lifecycle (generate → store → email → verify → delete) is deceptively simple but has subtle race conditions. Using Redis `GETDEL` for single-use enforcement is the standard approach and is supported by the Upstash Redis SDK.

---

## Common Pitfalls

### Pitfall 1: In-Memory Rate Limiter Survives in Dev but Fails in Production

**What goes wrong:** The existing `src/lib/rateLimit.ts` uses a `Map` that lives in process memory. In Vercel's serverless environment, each cold start creates a new Map — the counter resets. A determined attacker can simply wait for a cold start and bypass the limit.
**Why it happens:** Vercel serverless functions don't persist in-memory state between invocations.
**How to avoid:** Replace the Map entirely with `@upstash/ratelimit`. The new module exports named instances (`magicLinkRatelimit`, `contactRatelimit`) so callers don't break.
**Warning signs:** Rate limit tests passing locally but not in production; console logs showing counter always starting at 1.

### Pitfall 2: Astro.cookies.set() Does Not Persist Through new Response()

**What goes wrong:** If middleware creates a `new Response(...)` directly (rather than calling `next()`), cookies set before that call are silently dropped in some Astro versions.
**Why it happens:** Astro GitHub issue #8242: cookies in middleware can be lost when middleware short-circuits with a new Response.
**How to avoid:** Use `context.redirect("/portal/login")` (which goes through Astro's response pipeline) rather than `return new Response(null, { headers: { Location: "/portal/login" } })`. Always test the middleware cookie path end-to-end.
**Warning signs:** Session cookie disappears after redirect in middleware.

### Pitfall 3: Sanity Reference Queries Require `_ref` Syntax

**What goes wrong:** Querying `clients[client == $clientId]` returns no results even though the data is correct.
**Why it happens:** Sanity reference fields store an object `{ _ref: "document-id", _type: "reference" }`. The filter must use `client._ref == $clientId` not `client == $clientId`.
**How to avoid:** Use `references($clientId)` built-in function which handles the `_ref` unwrapping automatically: `*[_type == "project" && references($clientId)]`.
**Warning signs:** Empty arrays returned from project queries for known clients.

### Pitfall 4: Resend `send.lasprezz.com` Subdomain DNS Propagation Takes Up to 48 Hours

**What goes wrong:** Resend dashboard shows "Pending" status; magic link emails fall back to `onboarding@resend.dev` sender (sandboxed, only delivers to account owner).
**Why it happens:** DNS TTL propagation. The existing Resend integration uses `from: "La Sprezzatura <onboarding@resend.dev>"` (sandbox). Switching to `noreply@send.lasprezz.com` requires domain verification first.
**How to avoid:** Add DNS records to the DNS provider at the start of Phase 5 implementation (Wave 0 or Wave 1), then verify at the end. Don't block other waves on DNS propagation.
**Warning signs:** Test emails only arriving to the Resend account owner email; Resend dashboard shows domain status as "Pending."

### Pitfall 5: `defineArrayMember` Required for Array Object Items

**What goes wrong:** TypeScript errors in Sanity Studio when array items use `defineField` instead of `defineArrayMember`.
**Why it happens:** Sanity enforces type-safe wrappers for array member items. `defineField` is for document-level or object-level fields; `defineArrayMember` is for items inside `of: []` arrays.
**How to avoid:** Use `defineArrayMember` for the client reference object inside the `clients` array on the project schema.
**Warning signs:** TypeScript errors like "Argument of type ... is not assignable" in schema files.

### Pitfall 6: Session Cookie maxAge vs expires

**What goes wrong:** Session cookie appears to work in dev but expires immediately in production.
**Why it happens:** Using `expires: new Date(...)` with a relative date created at module load time (not request time) can produce a past date if the server's clock differs. Using `maxAge` in seconds is clock-independent.
**How to avoid:** Always use `maxAge: 60 * 60 * 24 * 30` (30 days in seconds), not `expires`.

---

## Code Examples

### Upstash Redis Client Initialization

```typescript
// src/lib/redis.ts — shared singleton
// Source: github.com/upstash/ratelimit-js
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});
```

### Atomic Token Consumption (getdel)

```typescript
// Upstash Redis SDK supports getdel natively
const clientId = await redis.getdel(`magic:${token}`);
// Returns null if key doesn't exist (already consumed or expired)
// If non-null, token is simultaneously deleted — race-condition safe
```

### Session Cookie (30-day, httpOnly)

```typescript
// Source: everythingcs.dev/blog/astro-js-passwordless-magic-link-authentication/
Astro.cookies.set("portal_session", sessionToken, {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30,   // 30 days in seconds (not expires)
  secure: import.meta.env.PROD,
});
```

### GROQ: Lookup Client by Email

```groq
// Source: sanity.io/docs/content-lake/groq-introduction
*[_type == "client" && email == $email][0] {
  _id,
  name,
  email
}
```

### GROQ: Get Client's Projects (with dereferenced primary contact flag)

```groq
// Source: sanity.io/docs/studio/reference-type
*[_type == "project" && portalEnabled == true && references($clientId)] | order(pipelineStage asc) {
  _id,
  title,
  pipelineStage,
  "isPrimary": clients[client._ref == $clientId][0].isPrimary
}
```

### @upstash/ratelimit Sliding Window

```typescript
// Source: github.com/upstash/ratelimit-js
import { Ratelimit } from "@upstash/ratelimit";
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "10 m"),
  prefix: "ratelimit:magic",
});
const { success } = await ratelimit.limit(`magic-link:${email.toLowerCase()}`);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| In-memory Map rate limiter | `@upstash/ratelimit` with Redis | Serverless became standard ~2022 | In-memory breaks between cold starts |
| Vercel KV | Upstash Redis directly | Vercel deprecated KV for new projects March 2025 | No Vercel KV for new integrations |
| `experimental.sessions` in astro.config | Stable `session:` top-level config | Astro 5.7 (2025) | No experimental flag needed |
| Sanity `defineField` for array members | `defineArrayMember` for `of:[]` items | Sanity v3 | TypeScript type safety |
| Raw `from: "onboarding@resend.dev"` | Verified domain `noreply@send.lasprezz.com` | Phase 5 | Sandbox → production email delivery |

**Deprecated/outdated:**
- `clientName` string field on project: replaced by `clients` reference array in Phase 5
- `portalToken`-based access via `/portal/[token].astro`: replaced by magic link auth (page becomes redirect)
- In-memory `rateLimitMap` in `src/actions/index.ts` and `src/lib/rateLimit.ts`: replaced by `@upstash/ratelimit`

---

## Open Questions

1. **Whether `clientName` string field should be kept alongside the new `clients` reference array during transition**
   - What we know: `clientName` is used in `getProjectByPortalToken()` query and displayed in `[token].astro`. Both are being replaced/redirected in Phase 5.
   - What's unclear: Are there any other places in the codebase that read `clientName`?
   - Recommendation: Search codebase for `clientName` before removing. Since `[token].astro` becomes a redirect page, the field can be deprecated (kept in schema but hidden) without a migration.

2. **Upstash Redis single database for tokens + rate limits + sessions**
   - What we know: All three use cases (magic link tokens, rate limit counters, session lookups) can share one Upstash database with key prefix namespacing (`magic:`, `session:`, `ratelimit:`).
   - What's unclear: Free tier limit is 500K commands/month. For a studio with ~10 active clients, this is far more than sufficient.
   - Recommendation: One database, namespaced keys. No need for separate databases.

3. **Resend DNS record format for `send.lasprezz.com`**
   - What we know: Resend requires MX, SPF (TXT), and DKIM (TXT/CNAME) records. Using a subdomain (`send.lasprezz.com`) isolates from the Microsoft 365 MX records on the root (`lasprezz.com`). Resend generates the exact record values per-domain in its dashboard.
   - What's unclear: The exact DNS values are generated per-account in Resend's dashboard and cannot be documented in advance.
   - Recommendation: Implementation task must include "Log into Resend dashboard, navigate to Domains, add `send.lasprezz.com`, copy the generated DNS records, and add them to the DNS provider." Do this early in the phase to allow 24-48h propagation.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `/Users/paulalbert/Dropbox/GitHub/la-sprezzatura/vitest.config.ts` |
| Quick run command | `npm test` (from repo root) |
| Full suite command | `npm test` |

The test config is minimal: `{ test: { include: ["src/**/*.test.ts"] } }`. All test files live in `src/` alongside their implementation.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | `requestMagicLink` action validates email, stores token in Redis, sends email | unit | `npm test -- src/actions/magicLink.test.ts` | ❌ Wave 0 |
| AUTH-02 | Session cookie set with correct options (httpOnly, 30-day maxAge, secure) | unit | `npm test -- src/pages/portal/verify.test.ts` | ❌ Wave 0 |
| AUTH-03 | GROQ query returns correct projects for a given client ID | unit (query string test) | `npm test -- src/sanity/queries.test.ts` | ❌ Wave 0 |
| AUTH-04 | `context.locals.clientId` populated correctly by middleware for valid session | unit | `npm test -- src/middleware.test.ts` | ❌ Wave 0 |
| AUTH-05 | Middleware redirects unauthenticated requests to `/portal/login`, passes through public paths | unit | `npm test -- src/middleware.test.ts` | ❌ Wave 0 |
| CLNT-04 | Client schema has required fields: name, email, phone, address, preferredContact | unit | `npm test -- src/sanity/schemas/client.test.ts` | ❌ Wave 0 |
| CLNT-05 | Project schema `clients` field allows array of `{client: reference, isPrimary: boolean}` | unit | `npm test -- src/sanity/schemas/project.test.ts` | ❌ Wave 0 |
| PROC-03 | Financial fields pass integer validation, reject decimals | unit | `npm test -- src/sanity/schemas/client.test.ts` (or procurement) | ❌ Wave 0 |
| INFRA-07 | Rate limiter uses Upstash, not in-memory Map | unit (mock Redis) | `npm test -- src/lib/rateLimit.test.ts` | ❌ Wave 0 |
| INFRA-08 | `from` address in magic link email uses `noreply@send.lasprezz.com` | unit | `npm test -- src/actions/magicLink.test.ts` | ❌ Wave 0 |

Note: AUTH-04, AUTH-05 (middleware), and AUTH-02 (cookie setting via verify page) are integration-adjacent but can be tested with Vitest by mocking `context.cookies` and `context.locals`. The existing `generateToken.test.ts` and `portalStages.test.ts` provide the testing pattern.

### Sampling Rate
- **Per task commit:** `npm test` (full suite runs in < 5 seconds currently)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/rateLimit.test.ts` — covers INFRA-07 (mock @upstash/ratelimit, verify sliding window key)
- [ ] `src/middleware.test.ts` — covers AUTH-04, AUTH-05 (mock Redis, test redirect logic)
- [ ] `src/sanity/schemas/client.test.ts` — covers CLNT-04 (schema field presence)
- [ ] `src/sanity/schemas/project.test.ts` — covers CLNT-05 (clients array field structure)
- [ ] `src/actions/magicLink.test.ts` — covers AUTH-01, INFRA-08 (mock Redis + Resend, assert token stored, from address)

*(Existing `generateToken.test.ts` covers token generation reuse. No changes needed to existing tests.)*

---

## Sources

### Primary (HIGH confidence)
- `docs.astro.build/en/guides/middleware/` — defineMiddleware, locals, redirect, cookie patterns
- `docs.astro.build/en/guides/sessions/` — Sessions API (Astro 5.7 stable), Vercel Redis driver config
- `docs.astro.build/en/guides/authentication/` — Auth library options; confirms no official Astro auth
- `github.com/upstash/ratelimit-js` — @upstash/ratelimit sliding window API, `Ratelimit.limit()` response shape
- `sanity.io/docs/studio/reference-type` — Reference arrays with extra fields, GROQ `->` dereferencing
- `astro.build/blog/astro-570/` — Sessions stable in 5.7; Vercel uses Upstash/Redis minimal-config driver
- Existing codebase (`src/actions/index.ts`, `src/lib/rateLimit.ts`, `src/lib/generateToken.ts`, `src/sanity/schemas/project.ts`) — Direct read; confirmed current patterns

### Secondary (MEDIUM confidence)
- `everythingcs.dev/blog/astro-js-passwordless-magic-link-authentication/` — Complete magic link implementation pattern verified against Astro docs
- `upstash.com/blog/redis-new-pricing` (March 2025) — Free tier 500K commands/month confirmed
- `upstash.com/docs/redis/howto/vercelintegration` — Vercel Marketplace integration; `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` env var names
- Vercel marketplace announcement — Vercel KV deprecated for new projects (2025)

### Tertiary (LOW confidence — flag for validation)
- Resend exact DNS record format for `send.lasprezz.com`: dashboard generates per-account values; cannot be pre-documented. Needs hands-on Resend dashboard step during implementation.
- `GETDEL` availability in `@upstash/redis` SDK: confirmed from README examples but should be verified in SDK docs at implementation time. Fallback: `redis.get()` + `redis.del()` in try/finally if `getdel` unavailable.

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — Verified against official Astro docs, Upstash docs, existing codebase
- Architecture: HIGH — Patterns drawn from existing codebase conventions + official docs
- Sanity schema: HIGH — Verified reference array pattern + GROQ against Sanity docs
- Pitfalls: HIGH (middleware cookie issue, serverless rate limit) / MEDIUM (DNS propagation timing)
- Validation architecture: HIGH — Vitest already configured and in use

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable ecosystem; Astro, Upstash, Resend change slowly)
