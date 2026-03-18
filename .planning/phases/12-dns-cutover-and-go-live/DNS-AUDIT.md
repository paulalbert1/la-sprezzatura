# DNS Audit - Pre-Cutover State

**Captured:** 2026-03-18
**Purpose:** Rollback reference -- restore these records if any cutover step breaks email or site availability

---

## lasprezz.com

**Registrar:** Wix.com Ltd. (IANA ID: 3817)
**Created:** 2024-01-27
**Expires:** 2028-01-27
**Nameservers:** ns8.wixdns.net, ns9.wixdns.net

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.230.63.186 | 3600 |
| A | @ | 185.230.63.107 | 3600 |
| A | @ | 185.230.63.171 | 3600 |
| CNAME | www | cdn1.wixdns.net | 3600 |
| MX | @ | 10 aspmx.l.google.com | 3600 |
| MX | @ | 20 alt1.aspmx.l.google.com | 3600 |
| MX | @ | 30 alt2.aspmx.l.google.com | 3600 |
| MX | @ | 40 alt3.aspmx.l.google.com | 3600 |
| MX | @ | 50 alt4.aspmx.l.google.com | 3600 |
| TXT | @ | v=spf1 include:_spf.google.com ~all | 3600 |
| TXT | @ | google-site-verification=NUFAzzBa1IgR69zE-MXMWewrs9O4Nsnp9Gy34jwpe-o | 3600 |
| CNAME | autodiscover | *(not set)* | -- |
| CNAME | selector1._domainkey | *(not set)* | -- |
| CNAME | selector2._domainkey | *(not set)* | -- |
| TXT | _dmarc | *(not set)* | -- |
| DS | @ | *(not set -- DNSSEC disabled)* | -- |

**SOA:** ns8.wixdns.net. support.wix.com. 2024012718 10800 3600 1209600 3600

---

## lasprezzaturany.com

**Registrar:** GoDaddy.com, LLC (IANA ID: 146)
**Created:** 2019-01-21
**Expires:** 2035-01-21
**Nameservers:** nicole.ns.cloudflare.com, trace.ns.cloudflare.com

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 185.230.63.107 | 300 |
| A | @ | 185.230.63.186 | 300 |
| A | @ | 185.230.63.171 | 300 |
| CNAME | www | cdn1.wixdns.net | 300 |
| MX | @ | 0 lasprezzaturany-com.mail.protection.outlook.com | 300 |
| TXT | @ | v=spf1 include:spf.protection.outlook.com -all | 300 |
| CNAME | autodiscover | autodiscover.outlook.com | 300 |
| CNAME | selector1._domainkey | selector1-lasprezzaturany-com._domainkey.netorgft20352105.onmicrosoft.com | 300 |
| CNAME | selector2._domainkey | selector2-lasprezzaturany-com._domainkey.netorgft20352105.onmicrosoft.com | 300 |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:dmarc_agg@vali.email | 300 |
| DS | @ | *(not set -- DNSSEC disabled)* | -- |

**SOA:** nicole.ns.cloudflare.com. dns.cloudflare.com. 2396793717 10000 2400 604800 1800
**M365 Tenant:** netorgft20352105.onmicrosoft.com (visible in DKIM selectors)

---

## lasprezzny.com

**Registrar:** GoDaddy.com, LLC (IANA ID: 146)
**Created:** 2026-02-12
**Expires:** 2029-02-12
**Nameservers:** ns67.domaincontrol.com, ns68.domaincontrol.com

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 15.197.225.128 | 3600 |
| A | @ | 3.33.251.168 | 3600 |
| CNAME | www | lasprezzny.com | 3600 |
| MX | @ | 0 lasprezzny-com.mail.protection.outlook.com | 3600 |
| TXT | @ | v=spf1 include:secureserver.net -all | 3600 |
| TXT | @ | NETORGFT20352105.onmicrosoft.com | 3600 |
| CNAME | autodiscover | autodiscover.outlook.com | 3600 |
| CNAME | selector1._domainkey | *(not set)* | -- |
| CNAME | selector2._domainkey | *(not set)* | -- |
| TXT | _dmarc | v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net; | 3600 |
| DS | @ | *(not set -- DNSSEC disabled)* | -- |

**SOA:** ns67.domaincontrol.com. dns.jomax.net. 2026021104 28800 7200 604800 600
**M365 Tenant verification TXT:** NETORGFT20352105.onmicrosoft.com (same tenant as lasprezzaturany.com)

---

## casadeolivier.com

**Registrar:** GoDaddy.com, LLC (IANA ID: 146)
**Created:** 2023-09-08
**Expires:** 2026-09-08
**Nameservers:** ns61.domaincontrol.com, ns62.domaincontrol.com

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 3.33.130.190 | 600 |
| A | @ | 15.197.148.33 | 600 |
| CNAME | www | casadeolivier.com | 3600 |
| MX | @ | 0 casadeolivier-com.mail.protection.outlook.com | 3600 |
| TXT | @ | v=spf1 include:secureserver.net -all | 3600 |
| TXT | @ | NETORGFT14517654.onmicrosoft.com | 3600 |
| CNAME | autodiscover | autodiscover.outlook.com | 3600 |
| CNAME | selector1._domainkey | *(not set)* | -- |
| CNAME | selector2._domainkey | *(not set)* | -- |
| TXT | _dmarc | *(not set)* | -- |
| DS | @ | *(not set -- DNSSEC disabled)* | -- |

**SOA:** ns61.domaincontrol.com. dns.jomax.net. 2023092000 28800 7200 604800 600
**M365 Tenant verification TXT:** NETORGFT14517654.onmicrosoft.com (different tenant from lasprezzaturany/lasprezzny)

---

## Key Observations

### Nameserver Summary

| Domain | Nameservers | Provider |
|--------|-------------|----------|
| lasprezz.com | ns8/ns9.wixdns.net | Wix DNS |
| lasprezzaturany.com | nicole/trace.ns.cloudflare.com | **Cloudflare** (already migrated) |
| lasprezzny.com | ns67/ns68.domaincontrol.com | GoDaddy DNS |
| casadeolivier.com | ns61/ns62.domaincontrol.com | GoDaddy DNS |

### Active Email (MX Records)

| Domain | MX Target | Provider | Status |
|--------|-----------|----------|--------|
| lasprezz.com | aspmx.l.google.com (Google Workspace) | Google | **Likely broken** -- context says M365 is the target, but MX still points to Google. SPF also only includes Google. |
| lasprezzaturany.com | lasprezzaturany-com.mail.protection.outlook.com | Microsoft 365 (GoDaddy-managed) | Active -- full M365 setup with DKIM and DMARC |
| lasprezzny.com | lasprezzny-com.mail.protection.outlook.com | Microsoft 365 (GoDaddy-managed) | Active -- has MX and autodiscover but no DKIM selectors |
| casadeolivier.com | casadeolivier-com.mail.protection.outlook.com | Microsoft 365 (GoDaddy-managed) | Active -- has MX and autodiscover but no DKIM selectors, no DMARC |

### M365 Tenant IDs

- **lasprezzaturany.com and lasprezzny.com** share the same M365 tenant: `NETORGFT20352105.onmicrosoft.com`
- **casadeolivier.com** is on a different M365 tenant: `NETORGFT14517654.onmicrosoft.com`
- **lasprezz.com** has no M365 records -- currently on Google Workspace MX

### DNSSEC Status

None of the 4 domains have DNSSEC (DS records) enabled. This simplifies domain transfers -- no need to disable DNSSEC before changing nameservers.

### DKIM Status

| Domain | DKIM Configured | Selectors |
|--------|----------------|-----------|
| lasprezz.com | No | -- |
| lasprezzaturany.com | **Yes** | selector1/selector2 pointing to netorgft20352105.onmicrosoft.com |
| lasprezzny.com | No | SPF uses secureserver.net (GoDaddy) not M365 |
| casadeolivier.com | No | SPF uses secureserver.net (GoDaddy) not M365 |

### DMARC Status

| Domain | DMARC Policy | Notes |
|--------|-------------|-------|
| lasprezz.com | None | No DMARC record |
| lasprezzaturany.com | p=none | Monitoring mode, reports to vali.email |
| lasprezzny.com | p=quarantine | Strictest policy of any domain, reports to GoDaddy |
| casadeolivier.com | None | No DMARC record |

### Website Hosting

| Domain | A Record IPs | Likely Host |
|--------|-------------|-------------|
| lasprezz.com | 185.230.63.* | Wix (active Wix site) |
| lasprezzaturany.com | 185.230.63.* | Wix (via Cloudflare DNS, same IPs as lasprezz.com) |
| lasprezzny.com | 15.197.225.128, 3.33.251.168 | GoDaddy Websites + Marketing (AWS Global Accelerator IPs) |
| casadeolivier.com | 3.33.130.190, 15.197.148.33 | GoDaddy Websites + Marketing (AWS Global Accelerator IPs) |

### Domain Expiry Timeline

| Domain | Expires | Urgency |
|--------|---------|---------|
| casadeolivier.com | 2026-09-08 | **6 months -- transfer before expiry** |
| lasprezz.com | 2028-01-27 | No urgency |
| lasprezzny.com | 2029-02-12 | No urgency |
| lasprezzaturany.com | 2035-01-21 | No urgency |

### Broken/Stale Records

1. **lasprezz.com MX points to Google** -- context says the target is M365. Current Google MX may be serving a defunct/inactive Google Workspace. This means email to @lasprezz.com currently goes to Google, not Microsoft.
2. **lasprezzaturany.com A records point to Wix** (185.230.63.*) even though nameservers are on Cloudflare -- appears to be an intentional proxy to the existing Wix site.
3. **lasprezzny.com and casadeolivier.com SPF includes `secureserver.net`** (GoDaddy) but MX points to M365 -- SPF mismatch may cause delivery issues when sending FROM these domains through M365.
4. **casadeolivier.com has no DMARC record** -- emails from this domain have no spoofing protection.

### Migration Implications

1. **lasprezzaturany.com is already on Cloudflare nameservers** -- only needs registration transfer to Cloudflare (not nameserver change).
2. **Two separate M365 tenants exist** -- the migration plan should account for whether both tenants get consolidated or if casadeolivier.com moves to the same tenant.
3. **No DNSSEC on any domain** -- transfers can proceed without DNSSEC removal step.
4. **casadeolivier.com expires in ~6 months** -- ensure transfer completes well before September 2026.
5. **lasprezz.com has no M365 infrastructure at all** -- fresh M365 domain setup required (not migration from existing M365 records).

---

*Audit performed: 2026-03-18 via dig queries from local resolver*
*All TTL values reflect observed cache at query time*
