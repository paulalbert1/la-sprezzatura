// src/emails/artifactReady/ArtifactReady.tsx
// Phase 48 -- ArtifactReady react-email template (D-01 mechanical port).
// Casual-register notification for clients (D-12). NOTIFICATION, not invitation:
// no token, no expiry copy (D-08), no link-fallback paragraph (D-09).
//
// Source of truth:
//   .planning/phases/48-smaller-transactional-emails/48-CONTEXT.md (D-01, D-02, D-08, D-09, D-12, D-13, D-15)
//   .planning/phases/48-smaller-transactional-emails/48-PATTERNS.md (artifactReady/ArtifactReady.tsx)
//   src/pages/api/notify-artifact.ts (legacy inline-HTML body — port verbatim)

import { Heading, Section, Text } from "@react-email/components";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";
import { EmailShell } from "../shell/EmailShell";
import type { ArtifactReadyEmailInput } from "./fixtures";

export type { ArtifactReadyEmailInput };

export function ArtifactReady(props: ArtifactReadyEmailInput) {
  const { client, project, artifactLabel, portalHref, preheader, tenant } = props;
  const firstName = client.name?.split(" ")[0];
  const computedPreheader =
    preheader ?? `New ${artifactLabel} for ${project.title}`;
  const h1Copy = `New ${artifactLabel} Available`;
  const bodyCopy = `Liz has uploaded a new ${artifactLabel.toLowerCase()} for your review on ${project.title}.`;

  return (
    <EmailShell
      tenant={tenant ?? LA_SPREZZATURA_TENANT}
      preheader={computedPreheader}
      signoffStyle="casual"
      cta={{ href: portalHref, label: "VIEW IN YOUR PORTAL" }}
    >
      <Section className="px-[40px] py-[24px]">
        <Heading
          as="h1"
          className="text-[22px] font-heading text-charcoal m-0 mb-[12px]"
        >
          {h1Copy}
        </Heading>
      </Section>
      <Section className="px-[40px] pb-[24px]">
        {firstName && (
          <Text className="text-[13px] leading-[20.8px] m-0 mb-[16px]">
            {`${firstName},`}
          </Text>
        )}
        <Text className="text-[13px] leading-[20.8px] m-0">
          {bodyCopy}
        </Text>
      </Section>
      {/* D-08 + D-09: NO EMAIL-04 fallback section. NO EMAIL-05 expiry section. */}
    </EmailShell>
  );
}
