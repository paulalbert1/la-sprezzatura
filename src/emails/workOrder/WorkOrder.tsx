// src/emails/workOrder/WorkOrder.tsx
// Phase 46 -- WorkOrder react-email template (D-4 mechanical port).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-4, D-13)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (WorkOrder.tsx)
//   src/lib/workOrder/emailTemplate.ts (legacy template; this is the 1:1 port)
//
// D-4: the legacy Work Order template is already table-safe; this is a
// mechanical translation of its HTML structure into <EmailShell> + JSX.
// JSX auto-escapes children, so no escapeHtml() helper is ported (T-46-01-01).
// D-13: the call site MUST pass `preheader` explicitly; the template-level
// fallback is included only as a defensive default.

import { Heading, Section, Text } from "@react-email/components";
import { LA_SPREZZATURA_TENANT } from "../../lib/email/tenantBrand";
import { EmailShell } from "../shell/EmailShell";
import type { WorkOrderEmailInput } from "./fixtures";

export type { WorkOrderEmailInput };

export function WorkOrder(props: WorkOrderEmailInput) {
  const { project, contractor, workOrderId, baseUrl, verifyUrl, preheader } = props;
  const firstName = contractor.name?.split(" ")[0] ?? "there";
  const ctaHref =
    verifyUrl ?? `${baseUrl}/workorder/project/${project._id}/orders/${workOrderId}`;
  const sentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const computedPreheader =
    preheader ?? `Work order ready for ${project.title} — view your latest version`;

  return (
    <EmailShell
      tenant={LA_SPREZZATURA_TENANT}
      preheader={computedPreheader}
      cta={{ href: ctaHref, label: "VIEW WORK ORDER" }}
    >
      <Section className="px-[40px] py-[24px]">
        <Heading
          as="h1"
          className="text-[22px] font-heading text-charcoal m-0 mb-[12px]"
        >
          Work order ready for review
        </Heading>
        <Text className="text-[13px] text-stone-dark m-0">
          {project.title} {"·"} {sentDate}
        </Text>
      </Section>
      <Section className="px-[40px] pb-[24px]">
        <Text className="text-[13px] leading-[20.8px] m-0 mb-[16px]">
          {`${firstName},`}
        </Text>
        <Text className="text-[13px] leading-[20.8px] m-0">
          Your work order for {project.title} is ready. Use the link below to view the latest version — it always reflects our most recent edits.
        </Text>
      </Section>
    </EmailShell>
  );
}
