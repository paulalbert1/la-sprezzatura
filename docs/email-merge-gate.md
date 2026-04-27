# Email Merge Gate -- Outlook Desktop Spot-Check

*Last updated: 2026-04-26*

## Overview

Sprezza Hub uses a self-hosted Playwright snapshot harness for email visual
regression. Playwright covers Chromium-equivalent clients (Gmail web, Apple
Mail macOS / iOS, web Outlook). It does NOT cover Outlook desktop -- Outlook
2016 / 2019 / 365 use Microsoft Word's render engine, which is too far from
Chromium for headless emulation. Per Phase 45 CONTEXT D-09 / D-10, the
Outlook desktop gate is procedural rather than automated.

Liz reads outbound mail in Outlook desktop. Any template change that ships
without a real-Outlook-desktop spot-check has shipped blind for the highest-
stakes recipient.

## When this gate applies

Every Phase 46+ pull request that:
- modifies a file under `src/emails/`
- modifies `src/lib/sendUpdate/emailTemplate.ts` or `src/lib/workOrder/emailTemplate.ts`
- modifies `src/emails/_theme.ts`
- modifies `src/lib/brand-tokens.ts` (changes a color / font / spacing token)
- introduces a new transactional email template

The gate does NOT apply to PRs that only change the Playwright harness, snapshots,
fixtures, or non-email code paths.

## Procedure

1. **Trigger a real send to `liz@lasprezz.com`.** Use the staging or production
   send endpoint with the modified template. Do NOT mock the send -- this is
   the only way to exercise Resend's actual rendering pipeline.

2. **Open the message in Outlook desktop.** Liz checks her Outlook 365
   desktop client; the implementer can request a screenshot via Slack / email.

3. **Capture screenshots:**
   - Full message view, default zoom.
   - Above-the-fold view (the inbox preview area).
   - At least one section with mixed content (CTA button + heading + body
     text -- whatever the template's most fragile combination is).

4. **Attach screenshots to the phase summary.** Path:
   `.planning/phases/<NN>-<slug>/<NN>-SUMMARY.md`. Include in the summary's
   "Outlook desktop verification" section.

5. **If the screenshot reveals a regression** (collapsed layout, missing
   images, oversize fonts, broken CTA), file a fix in the same phase before
   merging. Common Outlook regressions:
   - Body text rendered too large -> `pixelBasedPreset` missing in
     `src/emails/_theme.ts` (RESEARCH Pitfall 7).
   - Layout collapse -> CSS the template depends on uses `flex` / `grid`
     instead of `<table role="presentation">` (Phase 46 EMAIL-07).
   - Missing image -> asset URL not on `email-assets.sprezzahub.com` or
     the asset host returned a non-cached 404.

## Why this is procedural, not automated

Per Phase 45 CONTEXT D-09: paid services like Litmus or Email on Acid
(~$74/mo) WOULD give us automated Outlook desktop coverage, but the user
explicitly chose DIY-only. If Outlook regressions become a recurring problem
in Phase 46+, revisit this decision with a one-month EOA buy-in for the
high-risk migration phases. Until then, this manual gate is the contract.

## Inheritance

Every Phase 46+ phase summary that touches email rendering MUST include an
"Outlook desktop verification" section with the screenshots above. The
`/gsd-verify-work` checker will flag a phase as incomplete if the section is
absent.
