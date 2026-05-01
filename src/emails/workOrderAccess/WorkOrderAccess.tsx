// src/emails/workOrderAccess/WorkOrderAccess.tsx
// Phase 48 -- WorkOrderAccess react-email template (D-01 mechanical port).
// Casual-register contractor invitation (D-10).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-02, D-04..D-07, D-10, D-13, D-15)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (workOrderAccess/WorkOrderAccess.tsx)
//   src/pages/api/send-workorder-access.ts (legacy inline-HTML body — port verbatim)
//
// EMAIL-04: visible "or paste this link" fallback (Section after greeting/body
//           inside children — appears above the EmailShell-rendered CTA but
//           still pairs the URL with the action; per 48-PATTERNS.md JSX port).
// EMAIL-05: expiry copy derived from formatExpiryCopy(props.expiresInSeconds).
//           NEVER import the TTL constant here — templates take expiresInSeconds as a prop only (Pitfall 2).

import { Heading, Section, Text } from "@react-email/components";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";
import { EmailShell } from "../shell/EmailShell";
import { formatExpiryCopy } from "../../lib/portal/tokenTtl";
import type { WorkOrderAccessEmailInput } from "./fixtures";

export type { WorkOrderAccessEmailInput };

export function WorkOrderAccess(props: WorkOrderAccessEmailInput) {
  const {
    contractor,
    projectNames,
    magicLink,
    expiresInSeconds,
    preheader,
    tenant,
  } = props;
  const firstName = contractor.name?.split(" ")[0] ?? "there";
  const computedPreheader =
    preheader ?? `Your work-order portal access — link expires soon`;

  return (
    <EmailShell
      tenant={tenant ?? LA_SPREZZATURA_TENANT}
      preheader={computedPreheader}
      signoffStyle="casual"
      cta={{ href: magicLink, label: "ACCESS YOUR WORK ORDERS" }}
    >
      <Section className="px-[40px] py-[24px]">
        <Heading
          as="h1"
          className="text-[22px] font-heading text-charcoal m-0 mb-[12px]"
        >
          Your Work Order Access
        </Heading>
      </Section>
      <Section className="px-[40px] pb-[16px]">
        <Text className="text-[13px] leading-[20.8px] m-0 mb-[16px]">
          {`${firstName},`}
        </Text>
        <Text className="text-[13px] leading-[20.8px] m-0">
          Use the link below to access your work orders.
        </Text>
        {projectNames.length > 0 && (
          <Text className="text-[12px] italic text-stone m-0 mt-[12px]">
            You have work orders for: {projectNames.join(", ")}
          </Text>
        )}
      </Section>
      {/* EMAIL-04: link-fallback paragraph (per 48-PATTERNS.md §EMAIL-04 block) */}
      <Section className="px-[40px] pb-[8px]">
        <Text className="text-[12px] leading-[18px] text-stone m-0 mb-[6px] text-center">
          If the button doesn't work, copy and paste this link:
        </Text>
        <Text className="text-[11px] leading-[16px] text-stone m-0 break-all text-center">
          {magicLink}
        </Text>
      </Section>
      {/* EMAIL-05: expiry copy derived from expiresInSeconds prop */}
      <Section className="px-[40px] pb-[24px]">
        <Text className="text-[12px] leading-[18px] text-stone m-0 text-center">
          {formatExpiryCopy(expiresInSeconds)}
        </Text>
      </Section>
    </EmailShell>
  );
}
