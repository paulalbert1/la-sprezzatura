// src/emails/shell/EmailShell.tsx
// Phase 46 -- shared layout shell for v5.3 react-email templates.
// Phase 46-04 -- adds closed-enum signoffStyle register (D-29).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-5, D-6, D-7)
//   .planning/phases/46-send-update-work-order-migration/46-04-CONTEXT.md (D-29)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (EmailShell.tsx)
//
// Composition: <Html> + <Head> + <Tailwind config={emailTailwindConfig}> + <Body>
// + <Container> with three slots:
//   1. Wordmark header row (tenant.wordmark, all-caps tracked).
//   2. children (body sections supplied by the template).
//   3. Footer row: signoff name + location + "Sent via Sprezza Hub" attribution
//      (Phase 45.5 D-2 carryover).
//
// D-6: tenant prop is the v5.3 forward-looking shape; constant injected at
// call site from src/lib/email/tenantBrand.ts. v6.0 multi-tenant work swaps
// in a real per-tenant lookup with zero shell changes.
// D-7: cta is optional so Phase 48's invite-style emails can render their own
// button inside children if needed; v5.3 templates always pass it.
// D-29 (46-04): signoffStyle resolves which TenantBrand register renders in
// the footer. Closed enum -- adding a register requires a schema addition in
// tenantBrand.ts; do not widen with a string cast.

import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { emailTailwindConfig } from "../_theme";
import type { TenantBrand } from "../../lib/email/tenantBrand";
import { EmailButton } from "./EmailButton";
import { Preheader } from "./Preheader";

export type SignoffStyle = "formal" | "casual";

export interface EmailShellProps {
  tenant: TenantBrand;
  preheader: string;
  /**
   * Signature register -- controls which TenantBrand field renders in the footer signature line.
   * "formal" -> tenant.signoffNameFormal (e.g. "Elizabeth Lewis"; SendUpdate uses this).
   * "casual" -> tenant.signoffNameCasual (e.g. "Elizabeth"; WorkOrder uses this).
   * Defaults to "casual" so existing templates (WorkOrder) get byte-identical output without opting in.
   * Closed enum per 46-04-CONTEXT D-29 -- adding a register requires schema additions; do not widen by string cast.
   */
  signoffStyle?: SignoffStyle;
  cta?: { href: string; label: string };
  children: ReactNode;
}

export function EmailShell({
  tenant,
  preheader,
  signoffStyle = "casual",
  cta,
  children,
}: EmailShellProps) {
  const signoffName =
    signoffStyle === "formal" ? tenant.signoffNameFormal : tenant.signoffNameCasual;

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="light" />
        {/* Outlook desktop auto-darken lock (46.1 D-6 -- gap-4).
            [data-ogsc] / [data-ogsb] are Outlook desktop's text/bg color hooks.
            They override Outlook's auto-darken pass for any rule the author
            has explicitly locked through them. !important is required because
            auto-darken specificity outranks unmarked declarations.
            Color values MUST stay byte-identical to their source-of-truth files
            (statusPills.ts, EmailButton.tsx, section component inline styles).
            Do NOT introduce a parallel palette. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Backgrounds */
              [data-ogsb] body, [data-ogsb] .bg-cream { background-color: #FAF8F5 !important; }
              /* CTA backgrounds */
              [data-ogsb] .cta-terracotta { background-color: #C4836A !important; }
              [data-ogsb] .cta-gold { background-color: #9A7B4B !important; }
              /* Procurement pill backgrounds (statusPills.ts STATUS_PILL_STYLES.*.bg) */
              [data-ogsb] .pill-scheduled { background-color: #F3EFE9 !important; }
              [data-ogsb] .pill-warehouse { background-color: #F3EDE3 !important; }
              [data-ogsb] .pill-in-transit { background-color: #FBF2E2 !important; }
              [data-ogsb] .pill-ordered { background-color: #E8F0F9 !important; }
              [data-ogsb] .pill-pending { background-color: #FDEEE6 !important; }
              [data-ogsb] .pill-delivered { background-color: #EDF5E8 !important; }
              [data-ogsb] .pill-installed { background-color: #EDF5E8 !important; }

              /* Text colors */
              [data-ogsc] .text-stone { color: #8A8478 !important; }
              [data-ogsc] .text-stone-light { color: #B8AFA4 !important; }
              [data-ogsc] .text-charcoal,
              [data-ogsc] .text-dark { color: #2C2926 !important; }
              [data-ogsc] .text-mid { color: #4A4540 !important; }
              [data-ogsc] .text-cream { color: #FAF8F5 !important; }
              [data-ogsc] .text-cream-ivory { color: #FAF7F2 !important; }
              /* Procurement pill text (statusPills.ts STATUS_PILL_STYLES.*.text) */
              [data-ogsc] .pill-scheduled,
              [data-ogsc] .pill-warehouse { color: #6B5E52 !important; }
              [data-ogsc] .pill-in-transit { color: #8A5E1A !important; }
              [data-ogsc] .pill-ordered { color: #2A5485 !important; }
              [data-ogsc] .pill-pending { color: #9B3A2A !important; }
              [data-ogsc] .pill-delivered,
              [data-ogsc] .pill-installed { color: #3A6620 !important; }
              /* All elements: catch-all auto-darken cancellation -- targets the
                 Outlook desktop preserving-light-text-on-darkened-bg half-inversion
                 that Liz observed. Without this rule, ANY non-classed inline-styled
                 text gets auto-darkened against the now-locked light background. */
              [data-ogsc] * { color: inherit !important; }

              /* Borders -- Outlook auto-darken treats border as text-adjacent, so
                 [data-ogsc] is the correct hook (not [data-ogsb]). */
              [data-ogsc] .border-cream-dark { border-color: #E8DDD0 !important; }
              [data-ogsc] .pill-scheduled { border-color: #E0D5C5 !important; }
              [data-ogsc] .pill-warehouse { border-color: #D4C8B8 !important; }
              [data-ogsc] .pill-in-transit { border-color: #E8CFA0 !important; }
              [data-ogsc] .pill-ordered { border-color: #B0CAE8 !important; }
              [data-ogsc] .pill-pending { border-color: #F2C9B8 !important; }
              [data-ogsc] .pill-delivered { border-color: #C4DBA8 !important; }
              [data-ogsc] .pill-installed { border-color: #A8C98C !important; }

              /* gap-7 (46.1 D-10/D-11) -- candidate (b) prefers-color-scheme media query
                 per .planning/phases/46.1-merge-gate-gap-closure/46.1-SPIKE-OUTLOOK-MAC.md
                 Recommendation. ADDITIVE on top of the [data-ogsc]/[data-ogsb] block above.
                 Re-pins the locked light palette so any Outlook variant honoring
                 prefers-color-scheme keeps cream bg + dark text in dark mode. Color values
                 byte-identical to the [data-ogsc]/[data-ogsb] rules above (no parallel
                 palette). !important is required for source-order specificity tie-resolution
                 against any Outlook-Mac-injected dark-mode rule. */
              @media (prefers-color-scheme: dark) {
                body, .bg-cream { background-color: #FAF8F5 !important; }
                .cta-terracotta { background-color: #C4836A !important; }
                .cta-gold { background-color: #9A7B4B !important; }
                .pill-scheduled { background-color: #F3EFE9 !important; }
                .pill-warehouse { background-color: #F3EDE3 !important; }
                .pill-in-transit { background-color: #FBF2E2 !important; }
                .pill-ordered { background-color: #E8F0F9 !important; }
                .pill-pending { background-color: #FDEEE6 !important; }
                .pill-delivered { background-color: #EDF5E8 !important; }
                .pill-installed { background-color: #EDF5E8 !important; }
                .text-stone { color: #8A8478 !important; }
                .text-stone-light { color: #B8AFA4 !important; }
                .text-charcoal, .text-dark { color: #2C2926 !important; }
                .text-mid { color: #4A4540 !important; }
                .text-cream { color: #FAF8F5 !important; }
                .text-cream-ivory { color: #FAF7F2 !important; }
                .pill-scheduled, .pill-warehouse { color: #6B5E52 !important; }
                .pill-in-transit { color: #8A5E1A !important; }
                .pill-ordered { color: #2A5485 !important; }
                .pill-pending { color: #9B3A2A !important; }
                .pill-delivered, .pill-installed { color: #3A6620 !important; }
                .border-cream-dark { border-color: #E8DDD0 !important; }
                .pill-scheduled { border-color: #E0D5C5 !important; }
                .pill-warehouse { border-color: #D4C8B8 !important; }
                .pill-in-transit { border-color: #E8CFA0 !important; }
                .pill-ordered { border-color: #B0CAE8 !important; }
                .pill-pending { border-color: #F2C9B8 !important; }
                .pill-delivered { border-color: #C4DBA8 !important; }
                .pill-installed { border-color: #A8C98C !important; }
              }
            `,
          }}
        />
        {/* MSO conditional -- older Outlook desktop builds where [data-ogs*] doesn't reach.
            Cannot be authored as JSX (cannot emit raw HTML comments containing endif tokens),
            so use dangerouslySetInnerHTML on a wrapper element with an MSO-only payload that
            Outlook itself processes as a conditional comment in the rendered output. */}
        <div
          style={{ display: "none" }}
          dangerouslySetInnerHTML={{
            __html: `<!--[if mso]><style type="text/css">body { mso-color-scheme: light !important; }</style><![endif]-->`,
          }}
        />
      </Head>
      <Tailwind config={emailTailwindConfig}>
        {/* gap-7 (46.1 D-10/D-11) -- candidate (d) inline body-attribute paint per
            .planning/phases/46.1-merge-gate-gap-closure/46.1-SPIKE-OUTLOOK-MAC.md
            Recommendation. ADDITIVE on top of the existing className="bg-cream"
            (which stays for Tailwind compilation + [data-ogsb] selector matching).
            The inline style attribute has higher specificity than <style>-block
            rules and survives Outlook-for-Mac <style>-block stripping. Color
            byte-identical to the [data-ogsb] body bg rule above. */}
        <Body className="bg-cream font-body" style={{ backgroundColor: "#FAF8F5" }}>
          <Preheader>{preheader}</Preheader>
          {/* gap-7 (46.1 D-10/D-11) -- candidate (a) <table bgcolor> body wrapper per
              .planning/phases/46.1-merge-gate-gap-closure/46.1-SPIKE-OUTLOOK-MAC.md
              Recommendation. Wraps the existing <Container> in a top-level <table>
              that delivers the cream paint via the HTML `bgcolor` attribute (not a
              CSS rule). Survives Outlook-for-Mac <style>-block stripping. Paint-only
              wrapper -- carries no align= attribute, so per HTML attribute
              precedence (MDN <td> deprecated align), inner <td align="left"> cells
              from gap-5 (46.1-05) and gap-6 (46.1-07) keep their alignment.
              Color byte-identical to [data-ogsb] body bg rule. */}
          <table
            bgcolor="#FAF8F5"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            border={0}
            role="presentation"
            style={{ backgroundColor: "#FAF8F5" }}
          >
            <tbody>
              <tr>
                <td align="center" valign="top" style={{ backgroundColor: "#FAF8F5" }}>
                  <Container className="mx-auto max-w-[580px]">
                    <Section className="px-[40px] pt-[32px] pb-[24px]">
                      <Text className="text-[11.5px] tracking-[0.14em] text-stone uppercase font-semibold m-0">
                        {tenant.wordmark}
                      </Text>
                    </Section>
                    {children}
                    {cta && (
                      <Section className="px-[40px] py-[24px]">
                        <EmailButton href={cta.href}>{cta.label}</EmailButton>
                      </Section>
                    )}
                    <Hr className="border-cream-dark m-0" />
                    <Section className="px-[40px] py-[16px] text-center">
                      <Text className="text-[10px] text-stone-light tracking-[0.06em] m-0">
                        {signoffName} {"·"} {tenant.signoffLocation}
                      </Text>
                      <Text className="text-[10px] text-stone-light tracking-[0.06em] m-0 mt-[8px]">
                        Sent via Sprezza Hub
                      </Text>
                    </Section>
                  </Container>
                </td>
              </tr>
            </tbody>
          </table>
        </Body>
      </Tailwind>
    </Html>
  );
}
