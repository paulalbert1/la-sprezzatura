// src/emails/shell/EmailShell.tsx
// Phase 46 -- shared layout shell for v5.3 react-email templates.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-5, D-6, D-7)
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

export interface EmailShellProps {
  tenant: TenantBrand;
  preheader: string;
  cta?: { href: string; label: string };
  children: ReactNode;
}

export function EmailShell({ tenant, preheader, cta, children }: EmailShellProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Tailwind config={emailTailwindConfig}>
        <Body className="bg-cream font-body">
          <Preheader>{preheader}</Preheader>
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
                {tenant.signoffName} {"·"} {tenant.signoffLocation}
              </Text>
              <Text className="text-[10px] text-stone-light tracking-[0.06em] m-0 mt-[8px]">
                Sent via Sprezza Hub
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
