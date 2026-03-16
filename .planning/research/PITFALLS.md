# Pitfalls Research

**Domain:** CRM-like client portal features added to existing Astro 6 + Sanity interior design site
**Researched:** 2026-03-15
**Confidence:** HIGH (pitfalls drawn from codebase inspection, official docs, and documented failure patterns)

## Critical Pitfalls

### Pitfall 1: Sanity Schema Becomes a Monolith by Cramming CRM Data into Project Document

**What goes wrong:**
The existing `project` schema type already holds portfolio content AND portal fields (pipelineStage, portalToken, clientName, portalEnabled). Adding milestones, procurement items, budget proposals, client contact info, email logs, and address data to this same document type creates a monster: a single document with 30+ fields, deeply nested arrays of objects, and two completely different audiences (Liz managing portfolio content vs. Liz managing client operations). The Sanity Studio editing experience degrades -- scrolling through a wall of fields, saving takes longer because the entire document is patched, and GROQ queries become brittle projections that must cherry-pick from a bloated shape.

**Why it happens:**
The existing `project` document already has a "portal" field group, so extending it feels natural. Creating new document types (like `client` or `budgetProposal`) feels like over-engineering for ~5 active projects. The developer thinks "it's all related to one project, so it belongs on one document." But a Sanity document is not a relational database row -- it is a JSON blob that gets loaded and saved as a whole. More fields means slower Studio editing, larger payloads, and higher risk of merge conflicts if two browser tabs edit the same document.

**How to avoid:**
1. Create separate document types: `client` (contact info, address, preferred contact method), `budgetProposal` (versioned artifact, references project), `emailLog` (delivery records). Keep `project` as the hub with references.
2. Use Sanity references (`type: 'reference', to: [{type: 'client'}]`) to connect them. This keeps documents small and independently editable.
3. Milestones and procurement items can stay as arrays on the project (they are tightly coupled and always viewed together), but budget proposals and email logs must be separate documents because they grow unboundedly over time.
4. Use Sanity's Structure Builder to create custom desk views: "Active Projects" shows project + referenced client + linked proposals. Liz sees one coherent view without one document holding everything.

**Warning signs:**
- Project document JSON exceeds 50KB
- Saving a project in Studio takes more than 2 seconds
- GROQ query for portal page requires projections deeper than 3 levels
- Liz scrolls past portfolio fields to reach portal fields (or vice versa)

**Phase to address:**
Phase 1 of v2.0 (Schema & Data Model) -- this decision shapes everything downstream. Wrong here means migration later.

---

### Pitfall 2: Financial Data Stored as Floating-Point Numbers Produces Rounding Errors

**What goes wrong:**
Procurement items have cost, retail price, and savings fields. Budget proposals have tiered pricing (Best/Better/Good) with line items. Sanity's number type uses IEEE 754 double-precision floats. This means `3499.99 + 1250.50` can produce `4750.490000000001`, not `4750.49`. When the portal displays a budget total that is one cent off from what QuickBooks shows, or when a "savings" column doesn't add up to the total minus cost, Liz loses credibility with clients spending $50K-200K on interiors.

**Why it happens:**
Sanity documents store numbers as JSON numbers, which are IEEE 754 doubles. This is fine for most CMS use cases but toxic for financial calculations. The Sanity number type does support a `precision()` validation rule (e.g., `rule.precision(2)`) which restricts INPUT precision in the Studio form, but it does not change how the number is STORED or how GROQ arithmetic operates on it. GROQ explicitly warns: "floating-point arithmetic is fundamentally imprecise" and gives the example `3.14 + 1 = 4.140000000000001`.

**How to avoid:**
1. Store all financial values as integers representing cents. `$3,499.99` becomes `349999`. This eliminates float rounding entirely.
2. Add `description` hints on every financial field in the schema: "Enter amount in cents (e.g., 349999 for $3,499.99)." Since Liz enters these values, the field description must make this crystal clear.
3. Better yet: use a custom Sanity input component that shows a dollar-formatted display but stores cents internally. This is 20 lines of React in a custom input component.
4. Perform ALL arithmetic (totals, savings calculations, tax) in the frontend rendering layer using integer math, never in GROQ queries.
5. Add validation: `rule.integer().min(0)` on every financial field. No negative cents, no decimals.
6. Format for display using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` which handles cents-to-dollars conversion and locale-appropriate formatting.

**Warning signs:**
- A budget proposal total differs from the sum of its line items by 1 cent
- Financial comparisons between portal and QuickBooks don't match
- GROQ computed fields return values with long decimal tails

**Phase to address:**
Phase 1 of v2.0 (Schema & Data Model) -- must be decided before any financial field is created. Retrofitting cents-based storage on existing float data requires migration of every document.

---

### Pitfall 3: PII Stored in Sanity Without Access Controls or Deletion Strategy

**What goes wrong:**
The v2.0 client data model adds phone numbers, email addresses, physical addresses, and preferred contact methods to Sanity. Sanity is SOC 2 Type II certified and GDPR-compliant as infrastructure, but access controls on the free tier are coarse: anyone with Studio access can see every document. If a second editor or contractor is added to the Sanity project later, they see every client's home address and phone number. There is also no data retention policy: when a project is completed and the client relationship ends, their PII sits in Sanity indefinitely with no mechanism to purge it.

**Why it happens:**
Sanity is marketed as a content platform, and developers treat it like a database. For portfolio content, this works. For PII, the absence of field-level access controls on the free/Growth plans creates blind spots. The developer adds client fields to the schema, the data works fine in queries, and nobody thinks about who else might eventually access the Studio or what happens to the data in 3 years.

**How to avoid:**
1. Accept that Sanity will hold PII and plan accordingly. Sanity on Google Cloud Platform with SOC 2 Type II is adequate infrastructure for interior design client data (this is not healthcare or banking).
2. Document which fields contain PII in a simple data map: `client.phone`, `client.email`, `client.address`. This is your CCPA/privacy response checklist.
3. Use Sanity's role-based access control: create a custom role for any future editors that excludes the `client` document type. On the free tier (3 users), this is manageable manually; on Growth ($15/user/mo), custom roles are available.
4. Build a "project closeout" workflow that archives client data: when a project reaches "closeout" stage and stays there for 90 days, flag for PII review. The portal can be disabled, but the portfolio content (photos, descriptions) stays.
5. Never store PII in Sanity that is better kept in the email provider or QuickBooks. Client email? Resend already has it. Client billing address? QuickBooks already has it. Only store in Sanity what the portal actively needs to render.
6. Add a privacy notice to the portal: "Your contact information is stored securely and used only for project communication."

**Warning signs:**
- More than 3 users have Sanity Studio access with no role restrictions
- Client data exists for projects completed 12+ months ago with no review process
- A client asks "who can see my information?" and there is no documented answer

**Phase to address:**
Phase 1 of v2.0 (Schema & Data Model) -- define PII boundaries before creating client schema fields. Phase 3 (Closeout/Polish) -- implement data retention review workflow.

---

### Pitfall 4: In-Memory Rate Limiter is Ineffective on Vercel Serverless

**What goes wrong:**
The existing codebase has TWO in-memory rate limiters: one in `src/actions/index.ts` (for the contact form) and one in `src/lib/rateLimit.ts` (for the portal). Both use a `Map<string, {count, resetAt}>` stored in module-level scope. On Vercel serverless, each function invocation may run on a different Lambda instance. The rate limit map exists only in the memory of one instance and is invisible to all others. A determined attacker sending requests that hit different instances bypasses the limit entirely. Additionally, each new cold start creates a fresh empty map, so the limit resets whenever Vercel spins up a new instance.

**Why it happens:**
In-memory rate limiting works perfectly in development (single Node process) and even in simple VPS deployments. The code is correct as a rate limiter -- it just operates in an environment that violates its fundamental assumption of shared state. The developer tests locally, sees it working, deploys, and never validates that it works under distributed conditions because the attack scenario doesn't occur organically.

**How to avoid:**
1. For v2.0 scope: keep the in-memory rate limiter but understand its actual protection level. With Vercel Fluid compute (the current default), instances are reused more aggressively, so the limiter provides better protection than classic serverless -- but still not reliable protection against a targeted attacker.
2. For portal routes specifically (which now contain financial data): add Vercel's Edge Middleware with rate limiting at the edge layer BEFORE the serverless function. This is a single middleware file that runs on Cloudflare's edge network and has shared state across invocations.
3. Alternatively, use Upstash Redis with `@upstash/ratelimit` -- a single Redis call per request with no cold start state loss. The free tier supports 10,000 commands/day which is more than adequate. This is the industry standard for serverless rate limiting.
4. Remove the duplicate rate limiter from `src/actions/index.ts` and use the shared `src/lib/rateLimit.ts` module. Having two separate implementations with different behavior (one throws `ActionError`, one throws plain `Error`) is a maintenance hazard.
5. Rate limit by token, not just by IP. An attacker probing for valid portal tokens should be limited per-token as well (e.g., 3 invalid lookups per token per hour).

**Warning signs:**
- Rate limit tests pass locally but abuse attempts succeed in production
- Portal access logs show 100+ requests from one IP in a minute without triggering the limit
- Two different rate limit implementations exist in the codebase (they already do)

**Phase to address:**
Phase 2 of v2.0 (Portal Enhancement) -- upgrade to Upstash or Edge Middleware rate limiting when financial data is exposed through the portal. The duplicate rate limiter code should be consolidated in Phase 1.

---

### Pitfall 5: Budget Proposals Treated as Mutable Documents Instead of Versioned Artifacts

**What goes wrong:**
A budget proposal is sent to a client showing "Best: $85,000, Better: $62,000, Good: $45,000." The client discusses with their partner, then returns two weeks later. In the meantime, Liz updated the proposal in Sanity because a vendor changed pricing. The client says "we want the $62,000 option" but the current $62,000 option has different line items than what they saw. There is no record of what was presented. This creates disputes and erodes trust -- exactly the scenario this portal feature is meant to prevent.

**Why it happens:**
Sanity documents are living, mutable objects. Editing a budget proposal document changes it in place. Sanity does have a document history feature, but it requires navigating the Studio revision timeline and is not something Liz would do naturally. There is no concept of "version 1 sent on March 1" vs. "version 2 sent on March 15" unless you explicitly build it. The developer builds a budget proposal as a regular editable document because that is how Sanity works, not realizing that proposals need snapshot semantics.

**How to avoid:**
1. Model budget proposals with explicit versioning: each proposal is a separate Sanity document with a `version` number, `createdAt` timestamp, and `sentAt` date. When Liz wants to revise, she duplicates the document (Sanity has a built-in duplicate action), edits the copy, and the old version is preserved as-is.
2. Add a `status` field to proposals: `draft`, `sent`, `accepted`, `superseded`. Once status is `sent`, make all financial fields read-only (Sanity supports conditional `readOnly` rules). Liz must create a new version to change pricing.
3. Link the "Send Update" email feature to a specific proposal version. The email template includes the version number and date. The client can always refer back to "Proposal v2 from March 15."
4. On the portal, show the latest `sent` proposal by default but provide a "Previous versions" accordion for transparency.
5. Do NOT rely on Sanity's built-in revision history for this. Revisions are an implementation detail, not a user-facing feature. And on the free plan, history retention is limited (days, not months).

**Warning signs:**
- Liz edits a proposal that was already shared with a client
- Client and Liz disagree on what was proposed
- No way to answer "what did the client see on [date]?"
- Proposal documents have no version number or sent date

**Phase to address:**
Phase 2 of v2.0 (Budget Proposals) -- build versioning into the schema design from the start. This cannot be added after proposals have been sent.

---

### Pitfall 6: Email Delivery Fails Silently Due to Sandbox and Domain Authentication Gaps

**What goes wrong:**
The "Send Update" feature sends a beautifully formatted email to the client with their portal snapshot. But the email arrives from `onboarding@resend.dev` (the sandbox sender), lands in spam, or doesn't arrive at all -- and no one knows because there is no delivery logging. Liz clicks "Send Update" in Sanity, thinks the client received it, and the client never sees it. Meanwhile, Gmail and Outlook have tightened authentication enforcement throughout 2025-2026: messages without proper SPF/DKIM/DMARC alignment are now REJECTED at the SMTP level, not just routed to spam.

**Why it happens:**
The existing contact form already uses `onboarding@resend.dev` as the sender. This works for sending to Liz's own email (the account owner) because Resend's sandbox allows delivery to the verified account email. But sending to arbitrary client email addresses requires a verified custom domain. The developer tests the Send Update feature by sending to their own email, sees it arrive, and assumes it works universally. Additionally, `lasprezz.com` will need MX records for Microsoft 365 (email hosting) AND SPF/DKIM records for Resend (transactional email) on the same domain, which requires careful DNS record merging.

**How to avoid:**
1. Verify `lasprezz.com` (or a subdomain like `mail.lasprezz.com`) in Resend BEFORE building any Send Update features. Without this, you cannot test email delivery to clients at all.
2. Use a dedicated subdomain for transactional email: `send.lasprezz.com` or `mail.lasprezz.com`. This keeps Microsoft 365's SPF/DKIM on the root domain clean and isolates transactional email reputation.
3. SPF record merging: the root domain SPF must include BOTH `include:spf.protection.outlook.com` (for M365) and Resend's SPF include. SPF allows only one TXT record per domain, so these must be in one record: `v=spf1 include:spf.protection.outlook.com include:_spf.resend.com ~all`. Using a subdomain avoids this entirely.
4. Build delivery logging from day one. Every email sent via the "Send Update" action should write a log entry to Sanity (or a separate document): `{to, subject, sentAt, resendId, status}`. Resend returns a message ID on success that can be used to check delivery status via their API.
5. Implement error handling that surfaces failures to Liz: if the Resend API returns an error, show it in the Studio, don't swallow it.
6. Test email delivery to Gmail, Outlook/Hotmail, and Yahoo addresses specifically. These three have the strictest authentication enforcement in 2026.

**Warning signs:**
- Emails sending from `onboarding@resend.dev` instead of `@lasprezz.com`
- Client says "I never got that update" after Liz sent one
- No delivery log exists -- impossible to verify what was sent and when
- SPF record contains two separate TXT records (only first is honored)

**Phase to address:**
Phase 1 of v2.0 (Email Infrastructure) -- domain verification and DNS records must be set up before any Send Update code is written. Phase 2 (Send Update Feature) -- delivery logging is part of the feature, not an afterthought.

---

### Pitfall 7: Fantastical Openings Has No Embeddable Widget Like Cal.com

**What goes wrong:**
The roadmap calls for replacing the Cal.com booking embed with Fantastical Openings. Cal.com provides `@calcom/embed-react`, a React component that renders an inline booking widget directly in the page. Fantastical Openings does NOT provide an embed component, an iframe embed, or a JavaScript widget. It provides a link that opens a standalone Fantastical scheduling page. The replacement is a link, not an embed -- which means the carefully designed inline booking experience on the contact page will regress to a "click here to book" external redirect.

**Why it happens:**
The decision to use Fantastical was driven by a real UX concern: Liz uses Fantastical as her daily calendar, so managing availability in Cal.com requires maintaining two calendars. This is a valid concern. But the solution (Fantastical Openings) trades a developer-friendly embed for a link-based flow. The developer may not discover this until implementation, after Cal.com has been removed.

**How to avoid:**
1. Accept the tradeoff: Fantastical Openings will be a styled link/button, not an inline embed. Design the contact page accordingly -- a prominent "Book a Consultation" CTA that opens the Fantastical scheduling page in a new tab.
2. Alternatively: embed the Fantastical Openings page in an iframe. This is not officially supported but works because the page is a standard web page. Style the iframe to match the site. Test that it works on mobile (iframes on mobile Safari are notoriously finicky).
3. If the iframe approach is too fragile: keep Cal.com for booking and have it sync to Fantastical via iCal subscription. This preserves the embed UX while giving Liz one calendar view. Cal.com supports Google Calendar and Outlook calendar sync natively.
4. The contact form auto-response email already contains a Fantastical booking link (`https://fantastical.app/design-b1eD/...`). Consider whether the booking embed on the contact page is even necessary if the primary booking flow is email-driven.

**Warning signs:**
- Contact page booking section is a bare link instead of an inline widget
- Mobile users tapping the booking link lose context (new tab opens Fantastical's site)
- Booking conversion rate drops after Cal.com removal

**Phase to address:**
Phase 2 of v2.0 (Contact Page Update) -- prototype the Fantastical integration before removing Cal.com. Keep Cal.com active until the replacement is validated.

---

### Pitfall 8: PortalUrlDisplay Hardcodes Domain, Breaks in Staging/Preview

**What goes wrong:**
The existing `PortalUrlDisplay.tsx` component in Sanity Studio hardcodes `const SITE_URL = "https://lasprezz.com"`. When Liz copies a portal URL from the Studio, it always points to production. During development, preview deploys, or staging, the portal link goes to production (which may not have the latest schema/features) or to a domain that doesn't exist yet (pre-DNS-cutover). This also means if the domain ever changes, or if you want to test on a Vercel preview URL, the copy-to-clipboard feature gives wrong URLs.

**Why it happens:**
Sanity Studio runs as a React application in the browser. It does not have access to `import.meta.env` from the Astro build. Environment variables in Sanity Studio must be explicitly passed through the Sanity configuration or read from the Studio's own environment. The developer hardcoded the URL as a pragmatic shortcut during v1.0, and it works for production. But v2.0 adds more portal features, meaning more testing against preview URLs, and the hardcoded domain becomes a constant friction point.

**How to avoid:**
1. Use Sanity Studio's environment API: in `sanity.config.ts`, pass the site URL as a config value that varies by environment. Sanity Studio supports `process.env` at build time (it builds with Vite).
2. Alternatively, make the URL domain configurable in the `siteSettings` singleton document. PortalUrlDisplay reads it from there via `useFormValue` or a Studio context hook. This lets Liz (or Paul) change it without code deploys.
3. For v2.0 specifically: add a "Copy Portal Link" button that constructs the URL from the environment, and a "Open Portal" button that opens it in a new tab for quick testing.
4. Display a warning badge when the URL points to production while Studio is connected to a development dataset.

**Warning signs:**
- Portal links copied from Studio 404 on preview deploys
- Liz shares a portal link before DNS cutover and the client sees a broken page
- Testing requires mentally replacing the domain every time

**Phase to address:**
Phase 1 of v2.0 (Schema & Studio Polish) -- fix before adding more portal features that need testing.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing financial data as floats (Sanity default) | No custom input component needed, natural number entry | Rounding errors in totals, penny discrepancies between portal and QuickBooks | Never for financial data. Always use integer cents. |
| Duplicate rate limiter code in actions/index.ts and lib/rateLimit.ts | Each module is self-contained | Bug fixes must be applied twice, behavior diverges (ActionError vs. plain Error), cognitive overhead | Fix immediately in v2.0 Phase 1. Extract to single shared module. |
| Budget proposals as mutable documents | Simpler schema, fewer document types | No audit trail of what was sent to client, disputes over pricing, trust damage | Never once proposals are shared with clients. |
| All client data as fields on `project` document | Fewer document types, simpler queries | Bloated documents, slow Studio editing, tight coupling between portfolio and CRM concerns | Only acceptable for clientName and portalToken (existing fields). New CRM data needs separate types. |
| Email logs stored in Sanity | Single data store, simple GROQ queries | Sanity free tier storage fills faster, email logs are append-only data better suited to a log store | Acceptable for v2.0 scale (~5 clients, ~50 emails). Revisit if email volume grows. |
| Skipping Upstash for rate limiting | No new service dependency, free | In-memory rate limiter ineffective on serverless, financial data exposed to brute force | Acceptable in v2.0 if the portal has low traffic. Not acceptable once the portal shows financial data to paying clients. |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Resend on same domain as Microsoft 365 | Adding Resend's SPF include to root domain SPF record, creating a record over 255 characters or conflicting with M365 DKIM selectors | Use a subdomain for Resend (e.g., `send.lasprezz.com`). Separate transactional email authentication from corporate email. Avoids SPF record conflicts entirely. |
| Resend sandbox (onboarding@resend.dev) | Testing Send Update by emailing yourself (account owner) and assuming it works for all recipients | Sandbox only delivers to verified account emails. You MUST verify a custom domain to send to client addresses. Test with a non-account email before considering the feature "working." |
| Fantastical Openings replacing Cal.com | Assuming Fantastical provides an embeddable widget like @calcom/embed-react | Fantastical Openings is link-based only. No official embed component, no iframe embed code, no JavaScript SDK. Plan the UX around a link/button, or use an iframe (unsupported but functional). |
| Sanity document references for client data | Creating a `client` document type but fetching it with separate GROQ queries instead of dereferencing | Use GROQ reference expansion: `client->{name, email, phone}` in the project query. One query, one round trip. Separate queries multiply API usage against the free tier limits. |
| Sanity number fields for currency | Using `precision(2)` validation thinking it prevents float storage | `precision(2)` only validates input in Studio forms. The stored value is still IEEE 754 float. Arithmetic in GROQ still produces float results. Store as integer cents instead. |
| Sanity webhook for email triggers | Triggering "Send Update" email via a Sanity webhook when a field changes | Webhooks fire on ANY document save, including autosaves. Use an explicit action button in Sanity Studio (custom document action) or a dedicated API endpoint that Liz triggers intentionally. Accidental emails to clients are worse than no emails. |
| Resend React Email templates with Tailwind 4 | Using Tailwind utility classes in React Email templates assuming they compile like the site | React Email has its own Tailwind integration (@react-email/tailwind) which compiles to inline CSS. It supports Tailwind 4 as of React Email 5.0, but the class subset is limited. Test email rendering in multiple clients (Gmail clips emails over 102KB). |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full project document (with all milestones, procurement items, proposal references) for every portal page load | Portal loads in 500ms with 5 items | Use GROQ projections to fetch only what the portal page displays. Separate "overview" query (milestones + status) from "detail" queries (procurement items, proposal documents). | 20+ procurement items and 3+ proposal versions per project. |
| Sanity API requests for portal page views without CDN | Each portal visit makes an uncached API call; 100 visits = 100 API requests against the 50K/month free tier | Use `useCdn: true` for portal data that doesn't change per-request. Portal content changes infrequently (Liz updates manually). A 60-second CDN TTL is fine for this use case. | 50+ portal visits per day across all clients. At that rate, portal traffic alone uses 1,500 API requests/month. |
| Loading all email log entries when viewing project in Studio | Studio performance fine with 3 log entries | Paginate email logs in the Studio desk structure (show last 10 with "load more"). Don't embed logs as an array on the project document -- use a separate `emailLog` document type with a reference to the project. | 30+ emails sent for one project over its lifecycle. |
| Budget proposal with 50+ line items rendered as Sanity array items | Studio form scrollable but usable with 10 items | Group line items by category (furniture, materials, labor) using nested objects. Consider a tabbed interface in the Studio for proposals with many items. On the portal, use collapsible sections. | Proposal with 50+ individually priced items across multiple rooms (realistic for a full-home project). |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Portal PURL token is only 8 characters (current: `generatePortalToken(length = 8)`) | 8 alphanumeric characters = 62^8 = ~218 trillion combinations, which is mathematically adequate. But with financial data now behind the token, defense-in-depth demands more. An 8-char token looks guessable to security-conscious clients and may not meet compliance requirements if the business grows. | Increase token length to 24+ characters. Current `generatePortalToken` already supports custom length. Cost: zero. Benefit: perception and actual security improvement. Regenerate existing tokens during v2.0 migration. |
| Financial data (costs, retail prices, savings) visible to anyone with the PURL | A forwarded portal link exposes the client's project budget. For luxury interior design clients ($50K-200K projects), this is a significant privacy concern. | Tier the portal: project status and milestones visible via PURL. Financial data (procurement costs, budget proposals) requires an additional verification step -- email OTP or magic link for the session. |
| "Send Update" email contains portal PURL link | If the email is forwarded, the recipient gets full portal access including financial data. Email forwarding is extremely common ("honey, check what the designer sent"). | The portal link in emails should be a time-limited session link, not the permanent PURL. Or: the email contains a summary snapshot (no link to financial data), and the PURL accesses the full portal. |
| Sanity Studio API token in client-side code | Portal queries use the Sanity client. If the token has write permissions and is exposed in client-side JavaScript, anyone can modify project data via the API. | Use `useCdn: true` with the public project ID for read-only portal queries. Never expose a write-capable token. For "Send Update" (write operation), use a server-side API endpoint with the token in environment variables. |
| No access logging on portal visits | Cannot detect if a PURL was compromised or being probed | Log every portal access: `{token, ip, timestamp, userAgent}`. Alert on unusual patterns (>10 unique IPs accessing one token in 24 hours). Store logs in Sanity as `portalAccessLog` documents or in a lightweight external store. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Overwhelming Liz's Studio with CRM fields alongside portfolio content | Liz opens a project to update gallery photos and has to scroll past 15 client operations fields she doesn't need right now. She makes mistakes because the form is too long. | Use Sanity field groups extensively: "Portfolio" (default view), "Client Portal", "Budget & Procurement", "Communications". Only one group visible at a time. |
| Portal shows raw financial data without context | Client sees a procurement table with "Cost: $2,400" and "Retail: $3,200" without understanding what cost/retail means, or that the "savings" column represents La Sprezzatura's negotiated discount. | Label everything in client-friendly language. "Our Price" not "Cost." "Retail Value" not "Retail." "Your Savings" with a brief explanation: "The difference between retail value and what we've negotiated for your project." |
| Sending generic email updates that clients don't read | "Your project has been updated" with a portal link. Client ignores it because it's vague. | Include the substance in the email body: specific milestones reached, items ordered, what's coming next. The portal link is for details, but the email itself should be informative and personal. Liz's optional note field is the most important part. |
| Budget proposal with three tiers but no guidance | Client receives Best/Better/Good options with price tags but no explanation of what changes between tiers. Analysis paralysis ensues. | Each tier should have: a name that describes the experience (not just "Good"), what's DIFFERENT from adjacent tiers (not what's the same), and a recommendation from Liz ("I recommend Better because..."). |
| "Send Update" button with no preview | Liz clicks "Send Update" in Studio and an email goes to the client immediately. She can't see what it will look like or catch errors. | Show an email preview in a modal BEFORE sending. Include the client's name, the current portal state, and the optional note. Confirm button: "Send to [Client Name] at [email]." Cancel button prominent. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Client data model:** Often missing `preferredContactMethod` enforcement -- verify that if a client's preference is "text," the Send Update feature doesn't only send email
- [ ] **Procurement tracker:** Often missing a "no items yet" state -- verify the portal renders gracefully when a project has zero procurement items, not a broken empty table
- [ ] **Budget proposals:** Often missing version immutability -- verify that a `sent` proposal cannot be edited in Studio (readOnly conditional rule active)
- [ ] **Send Update email:** Often missing the "actually test with a non-account email" step -- verify email delivery to a Gmail, Outlook, and Yahoo address, not just the Resend account owner
- [ ] **Financial totals:** Often missing a reconciliation check -- verify that the sum of procurement item costs displayed on the portal matches the budget proposal total (integer cents arithmetic, not float)
- [ ] **Portal rate limiting:** Often missing production validation -- verify rate limiting works on Vercel by sending 20 rapid requests and confirming the limiter triggers (it may not if requests hit different instances)
- [ ] **PURL token length:** Often assumed "long enough" -- verify tokens are 24+ characters after v2.0 migration, not the v1.0 default of 8 characters
- [ ] **Resend domain verification:** Often done last -- verify `lasprezz.com` or subdomain is verified in Resend and all DNS records are propagated BEFORE building Send Update feature
- [ ] **Email delivery logging:** Often skipped -- verify every Send Update creates a log entry in Sanity with the Resend message ID, timestamp, recipient, and status
- [ ] **Fantastical booking link:** Often assumed to work like Cal.com -- verify the booking flow on mobile Safari, confirm it opens correctly, and test the return-to-site experience after booking

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Schema monolith (all data on project doc) | HIGH | Requires Sanity content migration: create new document types, write migration scripts to extract data into new documents, update all GROQ queries and frontend components. Budget 2-3 days. Must test with production data export. |
| Float financial data | MEDIUM | Write a migration script to convert all float values to integer cents: `value * 100`, round, store as integer. Update all display logic. Budget 1 day for migration + 1 day for frontend updates. |
| PII exposure via Studio access | MEDIUM | Remove excess user access immediately. Audit who accessed what (Sanity has access logs on paid plans). Notify affected clients. Create custom roles. Budget 1 day for access control + client notification. |
| Rate limiter bypass | LOW | Deploy Upstash Redis rate limiter as a drop-in replacement. Budget 2-4 hours including account setup and testing. |
| Budget proposal edited after sending | HIGH (reputational) | Cannot undo what the client saw vs. what exists now. Must reconstruct from Sanity revision history (if retained), acknowledge the discrepancy to the client, and implement versioning going forward. Trust damage takes weeks to repair. |
| Email delivery silent failure | MEDIUM | Resend provides webhook callbacks for delivery status. Implement delivery status tracking retroactively. For immediate recovery: check Resend dashboard for bounce/complaint logs, contact clients who didn't receive updates. Budget 1 day. |
| Fantastical embed doesn't work | LOW | Keep Cal.com as fallback. The existing Cal.com embed code and subscription are still available. Re-enable in 30 minutes. Long-term: decide between Cal.com embed or Fantastical link. |
| PortalUrlDisplay domain mismatch | LOW | Update the hardcoded URL or implement environment-based URL. 30-minute fix. But any portal links Liz already shared with wrong domain need manual correction. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Schema monolith | v2.0 Phase 1 (Schema Design) | `client`, `budgetProposal`, `emailLog` exist as separate document types. `project` document under 20 fields. Structure Builder provides unified editing views. |
| Float financial data | v2.0 Phase 1 (Schema Design) | All financial fields use `integer()` validation. Custom Studio input component shows dollar formatting. Portal displays formatted correctly (no penny errors). |
| PII without controls | v2.0 Phase 1 (Schema Design) | PII data map documented. Sanity roles reviewed. Privacy notice on portal. Only necessary PII in Sanity (not duplicating QuickBooks/Resend data). |
| In-memory rate limiter | v2.0 Phase 2 (Portal Enhancement) | Duplicate rate limiter code consolidated. Upstash or Edge Middleware rate limiting deployed. Verified effective under multi-instance conditions. |
| Mutable budget proposals | v2.0 Phase 2 (Budget Proposals) | Proposals have `version` and `status` fields. `sent` proposals are read-only. Duplicate action creates new versions. Portal shows version history. |
| Email delivery failures | v2.0 Phase 1 (Email Infrastructure) | Custom domain verified in Resend. SPF/DKIM records correct (subdomain or merged). Delivery logging active. Tested with external Gmail/Outlook/Yahoo addresses. |
| Fantastical embed gap | v2.0 Phase 2 (Contact Page) | Prototype completed before Cal.com removal. Decision documented: link vs. iframe vs. keep Cal.com. Mobile Safari tested. |
| PortalUrlDisplay hardcoding | v2.0 Phase 1 (Studio Polish) | URL derived from environment or siteSettings. Warning shown when URL doesn't match current Studio environment. |
| PURL token length | v2.0 Phase 1 (Schema Migration) | Token length increased to 24+. Existing tokens regenerated. Liz notified to reshare updated links. |
| Duplicate rate limiter code | v2.0 Phase 1 (Code Cleanup) | Single `checkRateLimit` function in `src/lib/rateLimit.ts`. Used by both actions and portal pages. Consistent error handling. |

## Sources

- [Sanity: Array type documentation -- cannot nest arrays directly](https://www.sanity.io/docs/studio/array-type) (HIGH confidence)
- [Sanity: Number type -- precision validation and IEEE 754 storage](https://www.sanity.io/docs/number-type) (HIGH confidence)
- [Sanity: GROQ data types -- float arithmetic imprecision warning](https://www.sanity.io/docs/specifications/groq-data-types) (HIGH confidence)
- [Sanity: Number input incorrectly validates floating point numbers (Issue #3132)](https://github.com/sanity-io/sanity/issues/3132) (HIGH confidence)
- [Sanity: Security & compliance -- SOC 2 Type II, GDPR, data storage](https://www.sanity.io/security) (HIGH confidence)
- [Sanity: History experience and retention per plan](https://www.sanity.io/docs/user-guides/history-experience) (HIGH confidence)
- [Sanity: Content migration cheat sheet -- immutable _id and _type](https://www.sanity.io/docs/content-lake/content-migration-cheatsheet) (HIGH confidence)
- [Sanity: Schema design best practices -- modular schemas](https://www.halo-lab.com/blog/creating-schema-in-sanity) (MEDIUM confidence)
- [Resend: Domain verification and DNS requirements](https://resend.com/docs/dashboard/domains/introduction) (HIGH confidence)
- [Resend: Email authentication developer guide -- SPF/DKIM/DMARC](https://resend.com/blog/email-authentication-a-developers-guide) (HIGH confidence)
- [Microsoft 365: SPF and DKIM configuration](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dkim-configure) (HIGH confidence)
- [Microsoft 365: Use subdomain for third-party email services](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-about) (HIGH confidence)
- [Vercel: Serverless function cold starts and state loss](https://vercel.com/kb/guide/how-can-i-improve-serverless-function-lambda-cold-start-performance-on-vercel) (HIGH confidence)
- [Vercel: Fluid compute -- shared instances reduce cold start impact](https://vercel.com/blog/scale-to-one-how-fluid-solves-cold-starts) (HIGH confidence)
- [Upstash: Edge rate limiting for serverless](https://upstash.com/blog/edge-rate-limiting) (MEDIUM confidence)
- [Rate limiting serverless without database -- LRU approach](https://tomichen.com/blog/posts/20210602-rate-limiting-serverless-without-database/) (MEDIUM confidence)
- [Fantastical: Openings documentation -- link-based scheduling, no embed SDK](https://flexibits.com/fantastical/help/openings) (HIGH confidence)
- [Fantastical: Openings account help -- meeting templates and customization](https://flexibits.com/account/help/openings) (HIGH confidence)
- [Astro on Vercel: Server islands known 404 issue (GitHub #12803)](https://github.com/withastro/astro/issues/12803) (HIGH confidence)
- [OWASP: Brute force attacks -- token length and CSPRNG requirements](https://owasp.org/www-community/attacks/Brute_force_attack) (HIGH confidence)
- [OWASP: Information exposure through URL query strings](https://owasp.org/www-community/vulnerabilities/Information_exposure_through_query_strings_in_url) (HIGH confidence)
- [Gmail 2025-2026: Rejecting non-authenticated messages at SMTP level](https://www.getmailbird.com/email-authentication-crisis-fix-spam-deliverability/) (MEDIUM confidence)
- [Email deliverability 2026: SPF/DKIM/DMARC enforcement tightening](https://www.egenconsulting.com/blog/email-deliverability-2026.html) (MEDIUM confidence)
- Codebase inspection: `src/actions/index.ts`, `src/lib/rateLimit.ts`, `src/sanity/schemas/project.ts`, `src/sanity/components/PortalUrlDisplay.tsx`, `src/lib/generateToken.ts`, `src/pages/portal/[token].astro` (HIGH confidence -- direct code review)

---
*Pitfalls research for: Adding CRM-like features, financial data, and email notifications to existing Astro 6 + Sanity interior design studio site*
*Researched: 2026-03-15*
