// src/emails/buildingAccess/BuildingAccess.tsx
// Phase 48 -- BuildingAccess react-email template (D-01 mechanical port).
// Formal-register building-manager invitation (D-11).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-02, D-04..D-07, D-11, D-13, D-15)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (buildingAccess/BuildingAccess.tsx)
//   src/pages/api/send-building-access.ts (legacy inline-HTML body — port verbatim)
//
// EMAIL-04: visible "or paste this link" fallback paragraph (inside children,
//           per 48-PATTERNS.md JSX port; appears above EmailShell CTA).
// EMAIL-05: expiry copy derived from formatExpiryCopy(props.expiresInSeconds).
//           NEVER import the TTL constant here — templates take expiresInSeconds as a prop only (Pitfall 2).

import { Heading, Section, Text } from "@react-email/components";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";
import { EmailShell } from "../shell/EmailShell";
import { formatExpiryCopy } from "../../lib/portal/tokenTtl";
import type { BuildingAccessEmailInput } from "./fixtures";

export type { BuildingAccessEmailInput };

export function BuildingAccess(props: BuildingAccessEmailInput) {
  const {
    buildingManager,
    project,
    magicLink,
    expiresInSeconds,
    preheader,
    tenant,
  } = props;
  const firstName = buildingManager.name?.split(" ")[0];
  const computedPreheader =
    preheader ?? `Your building portal access — link expires soon`;

  return (
    <EmailShell
      tenant={tenant ?? LA_SPREZZATURA_TENANT}
      preheader={computedPreheader}
      signoffStyle="formal"
      cta={{ href: magicLink, label: "ACCESS BUILDING PORTAL" }}
    >
      <Section className="px-[40px] py-[24px]">
        <Heading
          as="h1"
          className="text-[22px] font-heading text-charcoal m-0 mb-[12px]"
        >
          Your Building Portal Access
        </Heading>
      </Section>
      <Section className="px-[40px] pb-[16px]">
        {firstName && (
          <Text className="text-[13px] leading-[20.8px] m-0 mb-[16px]">
            {`${firstName},`}
          </Text>
        )}
        <Text className="text-[13px] leading-[20.8px] m-0">
          Use the link below to access project documents for this building.
        </Text>
        <Text className="text-[12px] italic text-stone m-0 mt-[12px]">
          Project: {project.title}
        </Text>
      </Section>
      {/* EMAIL-04: link-fallback paragraph */}
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
