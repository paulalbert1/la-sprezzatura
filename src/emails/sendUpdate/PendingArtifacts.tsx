// src/emails/sendUpdate/PendingArtifacts.tsx
// Phase 46 -- "Awaiting Your Review" section (mechanical port).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-2)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (PendingArtifacts.tsx)
//   src/lib/sendUpdate/emailTemplate.ts lines 293-309 (legacy markup)
//
// Legacy used the open-circle Unicode glyph U+25CB ("○"); preserved verbatim.
// No flex, no border-radius -- the legacy was already linear.

import { Section, Text } from "@react-email/components";
import { getArtifactLabel, type PendingArtifact } from "./SendUpdate";

export interface PendingArtifactsProps {
  artifacts: PendingArtifact[];
}

export function PendingArtifacts({ artifacts }: PendingArtifactsProps) {
  return (
    <Section className="px-[40px] pb-[24px]">
      <Text className="text-[10px] tracking-[0.14em] text-stone uppercase font-body m-0 mb-[12px]">
        Awaiting Your Review
      </Text>
      {artifacts.map((a, idx) => (
        <Text
          key={a._key ?? idx}
          className="text-[14px] text-charcoal m-0 py-[10px] border-b-[0.5px] border-cream-dark"
        >
          {"○"} {getArtifactLabel(a.artifactType ?? "", a.customTypeName)}
        </Text>
      ))}
    </Section>
  );
}
