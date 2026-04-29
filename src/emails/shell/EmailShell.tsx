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
import { STATUS_PILL_STYLES } from "../../lib/procurement/statusPills";

export type SignoffStyle = "formal" | "casual";

/**
 * Build a string of pill-class CSS rules from STATUS_PILL_STYLES.
 * Generates the [data-ogsc]/[data-ogsb] dark-mode lock palette + the
 * @media (prefers-color-scheme: dark) parallel block at module-load time
 * (no build step). Single source of truth across admin UI + email render +
 * dark-mode lock; drift is structurally impossible.
 *
 * 46.1 D-18 IN-R3-02 -- replaces ~40 lines of hand-mirrored CSS that
 * previously duplicated STATUS_PILL_STYLES values across two adjacent blocks.
 *
 * @param prefix -- selector prefix ("[data-ogsc]", "[data-ogsb]", or "" for @media block)
 * @param scope  -- which color property the rule emits ("bg" | "text" | "border" | "all")
 */
function buildPillRules(prefix: string, scope: "bg" | "text" | "border" | "all"): string {
  const rules: string[] = [];
  for (const status of Object.keys(STATUS_PILL_STYLES) as Array<keyof typeof STATUS_PILL_STYLES>) {
    const p = STATUS_PILL_STYLES[status];
    const sel = prefix ? `${prefix} .pill-${status}` : `.pill-${status}`;
    const decls: string[] = [];
    if (scope === "bg" || scope === "all") decls.push(`background-color: ${p.bg} !important`);
    if (scope === "text" || scope === "all") decls.push(`color: ${p.text} !important`);
    if (scope === "border" || scope === "all") decls.push(`border-color: ${p.border} !important`);
    rules.push(`${sel} { ${decls.join("; ")}; }`);
  }
  return rules.join("\n              ");
}

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

  // Module-load-time CSS generation per D-18 IN-R3-02 -- single source of truth
  // is statusPills.ts STATUS_PILL_STYLES; drift between [data-ogsb]/[data-ogsc]
  // lock and @media (prefers-color-scheme: dark) block is structurally impossible.
  const ogsbPillBgRules = buildPillRules("[data-ogsb]", "bg");
  const ogscPillTextRules = buildPillRules("[data-ogsc]", "text");
  const ogscPillBorderRules = buildPillRules("[data-ogsc]", "border");
  const mediaPillRules = buildPillRules("", "all");

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
              /* Body bg + bg-cream class hook (body element selector + dead .bg-cream tail) */
              [data-ogsb] body, [data-ogsb] .bg-cream { background-color: #FAF8F5 !important; }

              /* CTA backgrounds (hand-written -- only 2 variants) */
              [data-ogsb] .cta-terracotta { background-color: #C4836A !important; }
              [data-ogsb] .cta-gold { background-color: #9A7B4B !important; }

              /* Procurement pill backgrounds -- generated from STATUS_PILL_STYLES (D-18 IN-R3-02) */
              ${ogsbPillBgRules}

              /* Procurement pill text -- generated from STATUS_PILL_STYLES (D-18 IN-R3-02).
                 Bind via className on the pill <span> (D-15). Tailwind utility .text- and
                 .border-cream-dark rules previously here are DELETED per 46.1 D-16 -- they
                 targeted className hooks Tailwind compiles + strips, so they never bound.
                 The universal-selector catch-all is also DELETED per 46.1 D-17 -- it
                 actively cancelled every inline color in dark mode. */
              ${ogscPillTextRules}

              /* Procurement pill borders -- generated from STATUS_PILL_STYLES (D-18 IN-R3-02).
                 Outlook auto-darken treats border as text-adjacent, so [data-ogsc] is the
                 correct hook (not [data-ogsb]). */
              ${ogscPillBorderRules}

              /* gap-7 (46.1 D-10/D-11) -- candidate (b) prefers-color-scheme media query
                 per .planning/phases/46.1-merge-gate-gap-closure/46.1-SPIKE-OUTLOOK-MAC.md
                 Recommendation. ADDITIVE on top of the [data-ogsc]/[data-ogsb] block above.
                 Re-pins the locked light palette so any Outlook variant honoring
                 prefers-color-scheme keeps cream bg + dark text in dark mode. Pill rules
                 generated from STATUS_PILL_STYLES (single source of truth). !important is
                 required for source-order specificity tie-resolution against any
                 Outlook-Mac-injected dark-mode rule. */
              @media (prefers-color-scheme: dark) {
                body, .bg-cream { background-color: #FAF8F5 !important; }
                .cta-terracotta { background-color: #C4836A !important; }
                .cta-gold { background-color: #9A7B4B !important; }
                ${mediaPillRules}
              }
            `,
          }}
        />
        {/* MSO conditional -- older Outlook desktop builds where [data-ogs*] doesn't reach.
            46.1 D-19 WR-05 (round-2 carryover): moved out of a display-none div
            wrapper (invalid HTML5 in <head>) into a sibling <style dangerouslySetInnerHTML>
            element. The <!--[if mso]> + <![endif]--> + mso-color-scheme: light substrings
            still appear in the rendered HTML so existing test surface is preserved. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `<!--[if mso]>body { mso-color-scheme: light !important; }<![endif]-->`,
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
