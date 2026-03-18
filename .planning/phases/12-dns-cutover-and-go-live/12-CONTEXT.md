# Phase 12: DNS Cutover and Go-Live - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Consolidate all 4 domains (lasprezz.com, lasprezzaturany.com, lasprezzny.com, casadeolivier.com) to Cloudflare Registrar, migrate Microsoft 365 email from GoDaddy-managed to Microsoft direct, set up 3 primary mailboxes at @lasprezz.com, configure DNS to serve the new site from Vercel, set up domain redirects, verify Resend transactional email (send.lasprezz.com), and tear down Wix + GoDaddy services — replacing the old Wix site with minimal downtime and zero email disruption.

</domain>

<decisions>
## Implementation Decisions

### Cutover Timing & Sequence
- Liz picks the cutover date — happens after she's satisfied with content and design on the staging site
- M365 email migration happens FIRST (before any DNS/domain changes)
- Domain transfers happen sequentially: GoDaddy secondary domains first (lasprezzny.com, casadeolivier.com), then lasprezzaturany.com, then lasprezz.com (Wix) last
- Pre-cutover: full DNS record audit documenting every record on every domain before making changes
- Post-cutover: 1-hour go-live checklist where Liz verifies email send/receive on all 3 addresses, browses the live site, and checks redirects from secondary domains

### Registrar & Domain Strategy
- Transfer ALL 4 domain registrations to Cloudflare Registrar (not just nameservers)
- lasprezz.com is currently registered at Wix with active subscription — requires unlock + EPP auth code + Wix domain transfer process
- lasprezzaturany.com is on GoDaddy (already using Cloudflare nameservers) — transfer registration to Cloudflare
- lasprezzny.com and casadeolivier.com are on GoDaddy with Full Protection plans — unlock, get auth codes, transfer
- GoDaddy Full Protection plans replaced by Cloudflare's free WHOIS privacy
- Sequential transfers: verify each domain works before starting the next

### Vercel Domain Setup
- lasprezz.com not yet added as custom domain in Vercel — configure during cutover
- CNAME to cname.vercel-dns.com via Cloudflare (CNAME flattening for apex domain)
- Vercel handles SSL automatically

### Email Migration (GoDaddy M365 → Microsoft Direct)
- Current state: M365 managed entirely through GoDaddy — no direct Microsoft admin center access
- Target: Microsoft direct M365 account with lasprezz.com as primary domain
- 3 mailboxes: liz@lasprezz.com, paul@lasprezz.com, office@lasprezz.com
- Full email history migration from all existing mailboxes (PST export/import or IMAP migration)
- Plan includes detailed step-by-step instructions for GoDaddy-to-Microsoft M365 migration
- Liz uses Outlook mobile app + webmail — plan includes account reconfiguration steps

### Email Addresses & Alias Mapping
- **Current active addresses:** team@lasprezzaturany.com (M365 via GoDaddy), design@lasprezz.com (Google Workspace)
- **Google Workspace** for lasprezz.com exists (Paul has admin access) — cancel after M365 migration, design@ becomes alias
- Alias mapping (old → new):
  - design@lasprezz.com → liz@lasprezz.com
  - team@lasprezzaturany.com → liz@lasprezz.com
  - liz@lasprezzny.com → liz@lasprezz.com
  - hi@casadeolivier.com → office@lasprezz.com
  - office@lasprezzny.com → office@lasprezz.com
- Forwarding from old addresses stays active indefinitely — zero risk of missed email
- Liz needs to notify clients of the email address change

### DNS Records (lasprezz.com target state)
- MX: Microsoft 365 (replacing broken Google MX)
- SPF: include both M365 (spf.protection.outlook.com) and Resend
- DKIM: M365 CNAME selectors + Resend DKIM
- DMARC: p=none (monitoring mode) initially — tighten after 1 week of clean reports
- CNAME: lasprezz.com → cname.vercel-dns.com (Cloudflare CNAME flattening)
- CNAME: send.lasprezz.com → Resend verification records (resolves deferred INFRA-08)

### Resend Domain Verification
- Set up send.lasprezz.com CNAME records on Cloudflare during cutover (was blocked by Wix DNS)
- Verify domain in Resend dashboard
- Resolves INFRA-08 deferred from Phase 5 — unblocks production transactional email delivery

### Redirects
- All 3 secondary domains 301 redirect to lasprezz.com (homepage only, no path preservation)
- Old Wix URLs don't need path mapping — different URL structure, only 2 indexed pages
- Redirects configured via Cloudflare Page Rules or Bulk Redirects

### SEO
- Minimal handling — 301 redirects transfer the (small) SEO signal
- Submit new sitemap to Google Search Console
- Not worth full SEO migration for 2 indexed pages at 38% score

### Email Testing
- Test everything: all 3 new @lasprezz.com addresses (send + receive), verify forwarding from all old addresses, confirm SPF/DKIM/DMARC passing, test Resend send.lasprezz.com delivery

### Rollback Plan
- Document all current DNS records before any changes (pre-cutover audit)
- If email breaks: revert DNS records to pre-cutover values (Cloudflare propagation is fast)
- Email redirects from old domains must be in place before announcing new addresses

### Wix Teardown
- Cancel Wix subscription AFTER lasprezz.com domain transfer completes and is verified
- Take screenshots of existing Wix pages before canceling (historical reference)
- Do NOT cancel before domain transfer — Wix may complicate transfer if subscription is canceled first

### GoDaddy Teardown
- Cancel ALL GoDaddy services (hosting, protection plans, M365) after:
  1. All 3 domain transfers to Cloudflare are verified
  2. M365 is migrated to Microsoft direct
  3. All email is verified working on new setup
- GoDaddy Websites + Marketing Free, Conversations Inbox, InstantPage, Email Forwarding — all canceled

### Claude's Discretion
- Cloudflare DNS record TTL values
- Exact Cloudflare Page Rules vs Bulk Redirects for secondary domain redirects
- Cloudflare SSL/TLS mode (Full vs Full Strict)
- Specific Cloudflare security settings (HSTS, TLS version, etc.)
- Google Search Console submission timing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Infrastructure requirements
- `.planning/REQUIREMENTS.md` — INFRA-01 (DNS consolidation), INFRA-02 (email consolidation), INFRA-03 (email addresses), INFRA-04 (redirect consolidation), INFRA-06 (Cloudflare SSL), INFRA-08 (Resend domain verification, deferred from Phase 5)

### Prior email decisions
- `.planning/phases/05-data-foundation-auth-and-infrastructure/05-CONTEXT.md` — Email Infrastructure section: send.lasprezz.com subdomain for Resend, SPF/DKIM coexistence with M365, sender address noreply@send.lasprezz.com

### Project constraints
- `.planning/PROJECT.md` — Key Decisions table: "Microsoft 365 over Google Workspace" and "Cloudflare for DNS"

### Current state
- `.planning/STATE.md` — Blockers/Concerns section: DNS record audit needed, Resend sandbox limitation, Vercel Pro plan consideration

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `vercel.json`: Currently only has /admin rewrite — will need lasprezz.com added as custom domain in Vercel project settings (not in vercel.json)
- `.env.example`: Documents CONTACT_NOTIFY_EMAIL as liz@lasprezz.com — already configured for target domain
- Resend integration in `src/actions/index.ts` and email templates — ready to use once send.lasprezz.com is verified

### Established Patterns
- Transactional email via Resend with sender domain send.lasprezz.com (configured in Phase 5, DNS deferred)
- Portal auth via magic link email — depends on Resend domain verification for production delivery

### Integration Points
- Vercel deployment: currently on preview URL, needs lasprezz.com as production domain
- Resend: needs send.lasprezz.com DNS records for domain verification (INFRA-08)
- All email-sending routes (contact form, magic link, send-update, send-workorder-access, send-building-access) use CONTACT_NOTIFY_EMAIL env var

</code_context>

<specifics>
## Specific Ideas

- Liz prefers Cloudflare across the board and is willing to pay for appropriate services
- Screenshots of the Wix site should be taken before cancellation for historical reference
- Liz needs to notify clients of the email address change before old addresses stop being primary
- Old email forwarding stays active indefinitely — no cutoff date

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-dns-cutover-and-go-live*
*Context gathered: 2026-03-18*
