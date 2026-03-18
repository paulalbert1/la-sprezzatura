# Phase 12: DNS Cutover and Go-Live - Research

**Researched:** 2026-03-18
**Domain:** DNS migration, domain transfers, email consolidation, Cloudflare, Vercel, Microsoft 365
**Confidence:** HIGH

## Summary

Phase 12 is an infrastructure-only phase with no application code changes. It consolidates 4 domains onto Cloudflare Registrar, migrates Microsoft 365 email from GoDaddy-managed to Microsoft-direct, configures DNS for Vercel hosting, sets up domain redirects, verifies Resend transactional email, and tears down Wix + GoDaddy services. The primary risk is email disruption during the DNS cutover -- all decisions and sequencing are designed to mitigate this.

The critical finding is that transferring lasprezz.com from Wix Registrar to Cloudflare Registrar requires an intermediate registrar step (GoDaddy or Namecheap) with a 60-day waiting period between transfers. This means full domain consolidation cannot happen in a single cutover session. However, the site can go live on Vercel by pointing Cloudflare nameservers at the Wix registrar level (or intermediate registrar) while the registration transfer waits out the 60-day ICANN lock. The plan must account for this multi-week timeline.

**Primary recommendation:** Structure the phase as a sequential checklist of manual operations with verification gates between each step. This is not a coding phase -- it is an operations runbook. The plan should be a single detailed document with step-by-step instructions, expected outcomes, and rollback procedures for each step.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Liz picks the cutover date -- happens after she is satisfied with content and design on the staging site
- M365 email migration happens FIRST (before any DNS/domain changes)
- Domain transfers happen sequentially: GoDaddy secondary domains first (lasprezzny.com, casadeolivier.com), then lasprezzaturany.com, then lasprezz.com (Wix) last
- Pre-cutover: full DNS record audit documenting every record on every domain before making changes
- Post-cutover: 1-hour go-live checklist where Liz verifies email send/receive on all 3 addresses, browses the live site, and checks redirects from secondary domains
- Transfer ALL 4 domain registrations to Cloudflare Registrar (not just nameservers)
- lasprezz.com is currently registered at Wix with active subscription -- requires unlock + EPP auth code + Wix domain transfer process
- lasprezzaturany.com is on GoDaddy (already using Cloudflare nameservers) -- transfer registration to Cloudflare
- lasprezzny.com and casadeolivier.com are on GoDaddy with Full Protection plans -- unlock, get auth codes, transfer
- GoDaddy Full Protection plans replaced by Cloudflare's free WHOIS privacy
- Sequential transfers: verify each domain works before starting the next
- lasprezz.com not yet added as custom domain in Vercel -- configure during cutover
- CNAME to cname.vercel-dns.com via Cloudflare (CNAME flattening for apex domain)
- Vercel handles SSL automatically
- Current state: M365 managed entirely through GoDaddy -- no direct Microsoft admin center access
- Target: Microsoft direct M365 account with lasprezz.com as primary domain
- 3 mailboxes: liz@lasprezz.com, paul@lasprezz.com, office@lasprezz.com
- Full email history migration from all existing mailboxes (PST export/import or IMAP migration)
- Plan includes detailed step-by-step instructions for GoDaddy-to-Microsoft M365 migration
- Liz uses Outlook mobile app + webmail -- plan includes account reconfiguration steps
- Alias mapping (old to new): design@lasprezz.com -> liz@, team@lasprezzaturany.com -> liz@, liz@lasprezzny.com -> liz@, hi@casadeolivier.com -> office@, office@lasprezzny.com -> office@
- Google Workspace for lasprezz.com exists -- cancel after M365 migration, design@ becomes alias
- Forwarding from old addresses stays active indefinitely
- MX: Microsoft 365 (replacing broken Google MX)
- SPF: include both M365 and Resend
- DKIM: M365 CNAME selectors + Resend DKIM
- DMARC: p=none initially -- tighten after 1 week of clean reports
- CNAME: lasprezz.com -> cname.vercel-dns.com (Cloudflare CNAME flattening)
- CNAME: send.lasprezz.com -> Resend verification records
- Set up send.lasprezz.com CNAME records on Cloudflare during cutover (was blocked by Wix DNS)
- All 3 secondary domains 301 redirect to lasprezz.com (homepage only, no path preservation)
- Redirects configured via Cloudflare Page Rules or Bulk Redirects
- Minimal SEO handling -- 301 redirects transfer the (small) SEO signal
- Submit new sitemap to Google Search Console
- Document all current DNS records before any changes (pre-cutover audit)
- If email breaks: revert DNS records to pre-cutover values
- Cancel Wix subscription AFTER lasprezz.com domain transfer completes and is verified
- Take screenshots of existing Wix pages before canceling
- Do NOT cancel before domain transfer -- Wix may complicate transfer if subscription is canceled first
- Cancel ALL GoDaddy services after all transfers verified and email working
- Liz needs to notify clients of the email address change

### Claude's Discretion
- Cloudflare DNS record TTL values
- Exact Cloudflare Page Rules vs Bulk Redirects for secondary domain redirects
- Cloudflare SSL/TLS mode (Full vs Full Strict)
- Specific Cloudflare security settings (HSTS, TLS version, etc.)
- Google Search Console submission timing

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | DNS consolidation -- all 4 domains to Cloudflare | Cloudflare Registrar transfer process documented; Wix intermediate registrar requirement identified; GoDaddy transfer process confirmed |
| INFRA-02 | Email consolidation to @lasprezz.com on Microsoft 365 with SPF/DKIM/DMARC | GoDaddy-to-Microsoft tenant migration process documented; M365 DNS records for Cloudflare confirmed; SPF coexistence pattern for M365 + Resend verified |
| INFRA-03 | Professional email addresses: liz@, info@, paul@lasprezz.com | M365 mailbox creation process documented; alias mapping confirmed feasible via M365 admin |
| INFRA-04 | Redirect consolidation -- secondary domains redirect to lasprezz.com | Cloudflare Redirect Rules recommended over Page Rules; DNS proxy requirement confirmed |
| INFRA-06 | Cloudflare DNS with SSL for all domains | SSL/TLS Full (Strict) mode recommended; Vercel handles SSL cert generation; Cloudflare CNAME flattening for apex confirmed |
</phase_requirements>

## Standard Stack

This phase has no application code. The "stack" is a set of service configurations.

### Services
| Service | Purpose | Why Standard |
|---------|---------|--------------|
| Cloudflare Registrar | Domain registration for all 4 domains | At-cost pricing ($10.44/yr for .com), free WHOIS privacy, fastest authoritative DNS |
| Cloudflare DNS | Authoritative DNS for all 4 domains | Already hosting lasprezzaturany.com; CNAME flattening enables apex CNAME to Vercel |
| Cloudflare Redirect Rules | 301 redirects from secondary domains | Free plan includes 10 redirect rules (more than enough for 3 domains); replaces deprecated Page Rules |
| Vercel | Hosting for lasprezz.com | Already deployed; add custom domain in project settings |
| Microsoft 365 (Direct) | Email for @lasprezz.com | Migration from GoDaddy-managed; full admin center access |
| Resend | Transactional email via send.lasprezz.com | Already integrated in codebase; DNS records were blocked by Wix |
| Google Search Console | Sitemap submission | Standard SEO practice |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare Redirect Rules | Cloudflare Page Rules | Page Rules are being deprecated; Redirect Rules are the modern replacement with more flexibility |
| Cloudflare Redirect Rules | Cloudflare Bulk Redirects | Bulk Redirects are for large-scale URL lists (thousands); overkill for 3 simple domain redirects |
| Cloudflare DNS (proxied) for Vercel | Vercel DNS (nameservers) | Vercel recommends their own DNS, but Cloudflare is locked decision; use DNS-only mode for Vercel CNAME |
| IMAP migration for email | PST export/import | PST is more manual but captures more data; IMAP only transfers emails (no calendars/contacts) |
| IMAP migration for email | GoDaddy tenant handoff | Handoff gives the existing tenant directly; may be simpler if GoDaddy supports it |

## Architecture Patterns

### Pattern 1: Operations Runbook (Not Code)
**What:** This phase is entirely manual operations -- no code changes, no deployments. The "plan" is an ordered checklist of DNS changes, service configurations, and verification steps.
**When to use:** Infrastructure migrations with multiple service dependencies.
**Structure:**
```
Phase execution is a linear checklist:
1. Pre-cutover audit (document current state)
2. M365 migration (GoDaddy -> Microsoft direct)
3. GoDaddy domain transfers (secondary domains)
4. Wix domain transfer (lasprezz.com -- requires intermediate step)
5. DNS configuration (Vercel, email, Resend)
6. Redirect setup (secondary domains)
7. Verification (email, site, redirects)
8. Service teardown (Wix, GoDaddy, Google Workspace)
```

### Pattern 2: Cloudflare DNS Record Configuration for lasprezz.com
**What:** Target DNS zone file for lasprezz.com on Cloudflare
**Example:**
```
; lasprezz.com DNS Records (Cloudflare)
; =========================================

; SITE: Vercel hosting (CNAME flattening at apex)
@       CNAME   cname.vercel-dns.com      ; Proxy: OFF (DNS only)
www     CNAME   cname.vercel-dns.com      ; Proxy: OFF (DNS only)

; EMAIL: Microsoft 365
@       MX      <domain-key>.mail.protection.outlook.com  ; Priority: 0

; EMAIL AUTH: SPF (single TXT record with both M365 and Resend)
@       TXT     "v=spf1 include:spf.protection.outlook.com include:amazonses.com -all"

; EMAIL AUTH: DKIM for M365
selector1._domainkey  CNAME  selector1-lasprezz-com._domainkey.<tenant>.onmicrosoft.com
selector2._domainkey  CNAME  selector2-lasprezz-com._domainkey.<tenant>.onmicrosoft.com

; EMAIL AUTH: DMARC (monitoring mode initially)
_dmarc  TXT     "v=DMARC1; p=none; rua=mailto:paul@lasprezz.com"

; AUTODISCOVER: M365 Outlook configuration
autodiscover  CNAME  autodiscover.outlook.com

; TRANSACTIONAL EMAIL: Resend (send.lasprezz.com subdomain)
; Exact records provided by Resend dashboard after adding domain
send            TXT     [Resend SPF value from dashboard]
send            MX      [Resend MX value from dashboard]       ; Priority: 10
resend._domainkey.send  CNAME  [Resend DKIM CNAME from dashboard]

; VERIFICATION: Domain ownership (temporary, can delete after verified)
@       TXT     "MS=ms[XXXXXXXX]"   ; Microsoft 365 domain verification
```

**Critical notes:**
- Vercel CNAME records MUST be DNS-only (gray cloud, not proxied) for SSL cert generation
- M365 DKIM CNAMEs must be DNS-only (not proxied) for Microsoft validation
- Exact DKIM selector values come from M365 admin center or PowerShell: `Get-DkimSigningConfig -Identity lasprezz.com`
- Resend record values come from the Resend dashboard after adding send.lasprezz.com
- SPF Resend include value: check Resend dashboard (likely `include:amazonses.com` since Resend uses AWS SES)
- Only ONE SPF TXT record allowed per domain -- combine M365 and Resend includes in a single record
- SPF DNS lookup limit: max 10 lookups total across all includes

### Pattern 3: Secondary Domain Redirect via Cloudflare Redirect Rules
**What:** Each secondary domain needs a proxied DNS record and a redirect rule
**Setup per domain (e.g., lasprezzny.com):**
```
DNS Records:
  @     A    192.0.2.1    ; Proxy: ON (orange cloud) -- dummy IP, traffic never reaches it
  www   A    192.0.2.1    ; Proxy: ON (orange cloud)

Redirect Rule:
  Name: "Redirect lasprezzny.com to lasprezz.com"
  When: Hostname equals "lasprezzny.com" OR Hostname equals "www.lasprezzny.com"
  Then: Dynamic redirect to https://lasprezz.com
  Status: 301 (Permanent)
  Preserve query string: No (homepage only per decision)
```

### Pattern 4: Vercel Custom Domain Setup
**What:** Add lasprezz.com as production domain in Vercel
**Steps:**
1. Vercel Dashboard -> Project Settings -> Domains -> Add Domain
2. Enter `lasprezz.com` (Vercel will suggest adding www redirect too)
3. Vercel shows required DNS records (A record IP or CNAME)
4. Use CNAME `cname.vercel-dns.com` in Cloudflare (CNAME flattening handles apex)
5. Set Cloudflare proxy to OFF (DNS only) for the Vercel CNAME records
6. Vercel automatically provisions SSL certificate once DNS propagates
7. Set Cloudflare SSL/TLS mode to "Full (Strict)" to avoid redirect loops

### Anti-Patterns to Avoid
- **Proxying Vercel through Cloudflare (orange cloud):** Vercel explicitly recommends against this. It breaks Vercel's bot protection, firewall visibility, and can cause redirect loops or SSL errors. Use DNS-only mode.
- **Multiple SPF TXT records:** Having two SPF records causes email delivery failures. Always combine includes into a single record.
- **Canceling Wix before domain transfer:** Wix may complicate or block the transfer if the subscription is canceled first. Always transfer first, cancel after.
- **Changing all DNS at once:** Make one change at a time and verify before proceeding. Batch changes make rollback impossible.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Domain redirects | Vercel middleware or rewrites | Cloudflare Redirect Rules | Handles HTTPS, works at DNS level before traffic hits Vercel, zero code |
| Email forwarding/aliases | Custom mail routing | M365 distribution groups or mail flow rules | Built-in feature, reliable, no maintenance |
| SSL certificates | Manual cert management | Vercel auto-SSL + Cloudflare SSL | Both services handle certs automatically |
| DNS record management | Manual zone file editing | Cloudflare dashboard | Version history, easy rollback, API access if needed |
| Email authentication testing | Manual header inspection | mail-tester.com or MXToolbox | Validates SPF/DKIM/DMARC in one test |

## Common Pitfalls

### Pitfall 1: Wix Domain Transfer Requires Intermediate Registrar
**What goes wrong:** Cloudflare requires nameservers to point to Cloudflare BEFORE initiating a transfer. Wix does not allow nameserver changes while the domain is registered with them. This means lasprezz.com cannot transfer directly from Wix to Cloudflare.
**Why it happens:** Wix acts as both host and registrar, locking nameservers to their platform.
**How to avoid:** Transfer lasprezz.com from Wix to an intermediate registrar (GoDaddy is ideal since the other domains are already there), change nameservers to Cloudflare at the intermediate registrar, wait for Cloudflare zone to go Active, then transfer registration to Cloudflare. ICANN requires a 60-day wait between transfers.
**Warning signs:** Transfer stuck in "pending" at Cloudflare; domain not appearing in Cloudflare transfer panel.
**Impact on timeline:** The full registration transfer to Cloudflare for lasprezz.com will take 60+ days after the initial Wix transfer. However, the site can go live on Vercel as soon as nameservers point to Cloudflare (even while registration is at the intermediate registrar). This does NOT block go-live.

### Pitfall 2: Cloudflare Proxy Breaks Vercel SSL
**What goes wrong:** If Cloudflare proxy is enabled (orange cloud) for Vercel CNAME records, Vercel cannot verify domain ownership or provision SSL certificates. Can also cause "too many redirects" errors.
**Why it happens:** Cloudflare intercepts traffic and presents its own certificate; Vercel's ACME challenge cannot reach the domain.
**How to avoid:** Set Vercel-related DNS records to DNS-only (gray cloud). Set Cloudflare SSL/TLS mode to "Full (Strict)" to encrypt traffic between Cloudflare and Vercel.
**Warning signs:** Vercel domain status shows "Failed to Generate Cert"; browser shows ERR_TOO_MANY_REDIRECTS.

### Pitfall 3: SPF Record Conflicts
**What goes wrong:** Creating a second SPF TXT record instead of combining includes into one record causes both M365 and Resend emails to fail SPF checks.
**Why it happens:** DNS returns both TXT records; SPF spec says multiple SPF records are invalid (permerror).
**How to avoid:** Single TXT record: `v=spf1 include:spf.protection.outlook.com include:amazonses.com -all`
**Warning signs:** SPF check shows "permerror" or "multiple SPF records found."

### Pitfall 4: DNSSEC Blocks Domain Transfer
**What goes wrong:** If DNSSEC is enabled at the current registrar and you change nameservers without removing DNSSEC first, DNS resolution fails completely (site down, email bounces).
**Why it happens:** DNSSEC signatures no longer match after nameserver change.
**How to avoid:** Always remove DNSSEC/DS records FIRST, wait 24 hours, THEN change nameservers.
**Warning signs:** Complete DNS resolution failure after nameserver change.

### Pitfall 5: GoDaddy M365 Tenant Lock-In
**What goes wrong:** GoDaddy-managed M365 does not give full admin access. You cannot add custom domains, configure DKIM, or manage mail flow rules directly.
**Why it happens:** GoDaddy acts as a "delegated admin partner" for Microsoft.
**How to avoid:** Two options: (1) Request GoDaddy "tenant handoff" where they relinquish admin control of the existing tenant, or (2) Create a new Microsoft direct tenant and migrate mailbox data via IMAP or PST. Option 1 is simpler if GoDaddy supports it for the account type.
**Warning signs:** Cannot access admin.microsoft.com; "you don't have permission" errors.

### Pitfall 6: Email Downtime During MX Record Change
**What goes wrong:** Emails sent during the window between old MX removal and new MX propagation may bounce or be delayed.
**Why it happens:** DNS propagation takes minutes to hours; during this time, different servers see different MX records.
**How to avoid:** Set low TTL (5 minutes) on MX records 24 hours BEFORE the cutover. During cutover, change MX records and verify with `dig MX lasprezz.com` from multiple locations. The old lasprezz.com MX currently points to Google (broken), so there is actually minimal risk of disrupting working email.
**Warning signs:** `dig MX lasprezz.com` returns old/stale records.

### Pitfall 7: Authorization Code Expiry
**What goes wrong:** EPP auth codes expire within 5-14 days. If the transfer is not initiated promptly, the code expires and must be re-requested.
**Why it happens:** Security measure to prevent stale codes from being used for unauthorized transfers.
**How to avoid:** Request the EPP code and initiate the transfer the same day. Do not batch-request codes for all domains.
**Warning signs:** Transfer rejected with "invalid authorization code."

## Code Examples

No application code changes in this phase. The "code" is DNS records and service configurations documented in the Architecture Patterns section above.

### Verification Commands

```bash
# Check nameservers for a domain
dig NS lasprezz.com +short

# Check MX records
dig MX lasprezz.com +short

# Check SPF record
dig TXT lasprezz.com +short | grep spf

# Check DKIM
dig CNAME selector1._domainkey.lasprezz.com +short

# Check DMARC
dig TXT _dmarc.lasprezz.com +short

# Check CNAME flattening (should return A record, not CNAME)
dig A lasprezz.com +short

# Check redirect (should return 301)
curl -I https://lasprezzny.com

# WHOIS check for registrar
whois lasprezz.com | grep -i registrar

# Full email authentication test
# Use https://www.mail-tester.com/ -- send a test email to the provided address
# Or use https://mxtoolbox.com/SuperTool.aspx
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloudflare Page Rules for redirects | Cloudflare Redirect Rules (dynamic) | 2023-2024 | Page Rules being deprecated; Redirect Rules are more flexible with 10 free rules |
| A record for Vercel apex domain | CNAME with Cloudflare CNAME flattening | Ongoing | CNAME flattening resolves the CNAME to A records automatically; Vercel prefers CNAME |
| M365 DKIM old format | M365 DKIM new format (May 2025) | May 2025 | New CNAME format for custom domains; check which format the tenant uses |
| Cloudflare proxy for everything | DNS-only for Vercel records | Ongoing | Vercel explicitly recommends against Cloudflare proxy; use DNS-only |

**Deprecated/outdated:**
- Cloudflare Page Rules: Being replaced by Redirect Rules, Cache Rules, Origin Rules, and Config Rules. Still functional but new projects should use Redirect Rules.
- Google Domains as intermediate registrar: Google Domains was sold to Squarespace; use Namecheap or GoDaddy instead.

## Discretion Recommendations

### Cloudflare DNS Record TTL Values
**Recommendation:** Set TTL to 5 minutes (300 seconds) for all records during the cutover period. After 1 week of stable operation, increase to Auto (which Cloudflare sets to 5 minutes for proxied records and 1 hour for DNS-only records). The low initial TTL ensures fast propagation if rollback is needed.
**Confidence:** HIGH

### Redirect Method: Cloudflare Redirect Rules (not Page Rules or Bulk Redirects)
**Recommendation:** Use Cloudflare Redirect Rules (the modern replacement for Page Rules). Free plan includes 10 rules -- sufficient for 3 domain redirects. Each secondary domain gets one rule with a wildcard hostname match. Redirect Rules are the current Cloudflare best practice and will be maintained going forward.
**Confidence:** HIGH

### Cloudflare SSL/TLS Mode: Full (Strict)
**Recommendation:** Set SSL/TLS encryption mode to "Full (Strict)" on lasprezz.com. Vercel provisions a valid certificate from Let's Encrypt, so Full (Strict) works and provides the highest security. For secondary domains (redirect-only), "Full" is sufficient since traffic never reaches an origin server.
**Confidence:** HIGH

### Cloudflare Security Settings
**Recommendation:**
- Enable HSTS on lasprezz.com with max-age 6 months, includeSubDomains, and preload
- Minimum TLS version: 1.2
- Always Use HTTPS: enabled
- Automatic HTTPS Rewrites: enabled
- These are free features and align with modern web security standards.
**Confidence:** HIGH

### Google Search Console Timing
**Recommendation:** Submit the new sitemap to Google Search Console within 24 hours of go-live. Add both lasprezz.com (HTTPS) and www.lasprezz.com properties. The 301 redirects from secondary domains will transfer SEO signal automatically -- no manual action needed beyond sitemap submission.
**Confidence:** HIGH

## Open Questions

1. **GoDaddy Tenant Handoff Availability**
   - What we know: GoDaddy offers a tenant handoff feature where they relinquish admin control of the existing M365 tenant. This is simpler than creating a new tenant and migrating data.
   - What is unclear: Whether this is available for Liz's specific GoDaddy account/plan type. Some community reports suggest it requires contacting GoDaddy US support.
   - Recommendation: Try GoDaddy tenant handoff FIRST. If unavailable, fall back to new tenant + IMAP migration.

2. **Resend SPF Include Value**
   - What we know: Resend uses AWS SES infrastructure. The SPF include is likely `include:amazonses.com` but the exact value comes from the Resend dashboard when adding send.lasprezz.com.
   - What is unclear: Exact include value until the domain is added in Resend.
   - Recommendation: Add domain in Resend dashboard first, then use the exact SPF include they provide.

3. **Wix-to-Cloudflare Transfer Timeline**
   - What we know: Direct transfer is impossible due to nameserver restriction. Requires intermediate registrar with 60-day ICANN lock between transfers.
   - What is unclear: Whether Wix has updated their transfer process to allow nameserver changes (community reports as of 2025 suggest they have not).
   - Recommendation: Plan for the 60-day delay. Go-live can proceed with nameservers pointing to Cloudflare while registration remains at intermediate registrar. The registration transfer to Cloudflare happens later and has no functional impact on the live site.

4. **Existing Mailbox Data Volume**
   - What we know: Need to migrate email history from existing mailboxes.
   - What is unclear: How much email data exists and whether IMAP migration (email only) or PST (email + calendar + contacts) is more appropriate.
   - Recommendation: If GoDaddy tenant handoff works, no data migration needed (existing data stays in place). Otherwise, use PST export for the fullest data transfer.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual verification (no automated tests -- infrastructure phase) |
| Config file | N/A |
| Quick run command | `dig MX lasprezz.com +short && dig TXT lasprezz.com +short && curl -sI https://lasprezz.com` |
| Full suite command | See verification commands in Code Examples section |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | All 4 domains use Cloudflare nameservers | manual | `dig NS lasprezz.com +short` (repeat for all 4) | N/A |
| INFRA-02 | Email works at @lasprezz.com with SPF/DKIM/DMARC | manual | Send test email, check headers + mail-tester.com | N/A |
| INFRA-03 | 3 professional email addresses functional | manual | Send/receive test on each address | N/A |
| INFRA-04 | Secondary domains redirect to lasprezz.com | manual | `curl -I https://lasprezzny.com` (repeat for all 3) | N/A |
| INFRA-06 | SSL working on all domains | manual | `curl -vI https://lasprezz.com 2>&1 \| grep "SSL certificate"` | N/A |
| INFRA-08 | Resend domain verified for send.lasprezz.com | manual | Check Resend dashboard status; send test transactional email | N/A |

### Sampling Rate
- **Per step:** Verify with dig/curl before proceeding to next step
- **Post-cutover:** 1-hour Liz verification checklist (email send/receive, site browsing, redirect testing)
- **Phase gate:** All 5 success criteria must be TRUE

### Wave 0 Gaps
None -- this phase has no test infrastructure requirements. All verification is manual DNS/HTTP checks.

## Sources

### Primary (HIGH confidence)
- [Cloudflare Registrar: Transfer domain to Cloudflare](https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/) -- Complete transfer process, prerequisites, fees, special case for website builders like Wix
- [Microsoft Learn: Connect DNS records at Cloudflare to Microsoft 365](https://learn.microsoft.com/en-us/microsoft-365/admin/dns/create-dns-records-at-cloudflare?view=o365-worldwide) -- Exact MX, SPF, DKIM, CNAME records for M365 at Cloudflare (updated Feb 2026)
- [Wix Support: Transferring your domain away from Wix](https://support.wix.com/en/article/transferring-your-wix-domain-away-from-wix-2477749) -- EPP code process, 60-day ICANN lock, transfer timeline
- [Vercel Docs: Adding & Configuring a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain) -- A record vs CNAME setup, apex domain configuration
- [Cloudflare DNS: CNAME flattening](https://developers.cloudflare.com/dns/cname-flattening/) -- How CNAME flattening works for apex domains
- [Cloudflare: Redirect domain](https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/) -- Official redirect setup with Redirect Rules, proxied A record to 192.0.2.1
- [Cloudflare Rules: URL forwarding](https://developers.cloudflare.com/rules/url-forwarding/) -- Redirect Rules vs Page Rules vs Bulk Redirects comparison
- [Resend: Managing Domains](https://resend.com/docs/dashboard/domains/introduction) -- Domain verification process, DNS record types

### Secondary (MEDIUM confidence)
- [Vercel KB: Should I use Cloudflare in front of Vercel?](https://vercel.com/kb/guide/cloudflare-with-vercel) -- Vercel recommends against Cloudflare proxy; DNS-only is correct
- [GitHub Gist: Add Cloudflare Custom Domain to Vercel](https://gist.github.com/nivethan-me/a56f18b3ffbad04bf5f35085972ceb4d) -- Step-by-step DNS configuration with proxy off and Full SSL
- [Nerd Rangers: Moving from GoDaddy to your own Microsoft Tenant](https://nerdrangers.com/blog/moving-from-godaddy-to-your-own-microsoft-tenant/) -- GoDaddy tenant handoff process and migration methods
- [Microsoft Q&A: GoDaddy to Microsoft 365 migration](https://learn.microsoft.com/en-us/answers/questions/5616121/migrating-from-godaddy-microsoft-365-to-direct-mic) -- Migration timeline, IMAP vs third-party tools
- [Microsoft Learn: DKIM for custom domains](https://learn.microsoft.com/en-us/defender-office-365/email-authentication-dkim-configure) -- DKIM CNAME selector format, new vs old format

### Tertiary (LOW confidence)
- SPF include value for Resend (`include:amazonses.com`) -- inferred from Resend's AWS SES infrastructure; needs verification from Resend dashboard

## Metadata

**Confidence breakdown:**
- DNS/Cloudflare configuration: HIGH -- verified against official Cloudflare docs (2026)
- Vercel domain setup: HIGH -- verified against official Vercel docs
- Microsoft 365 DNS records: HIGH -- verified against official Microsoft docs (updated Feb 2026)
- M365 migration from GoDaddy: MEDIUM -- multiple approaches documented; GoDaddy tenant handoff availability unconfirmed for this specific account
- Resend DNS records: MEDIUM -- record types confirmed; exact values are per-account from dashboard
- Wix transfer restriction: HIGH -- confirmed across multiple sources including Cloudflare official docs

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (30 days -- stable infrastructure domain, unlikely to change)
