// src/emails/sendUpdate/Procurement.tsx
// Phase 46 -- Procurement table (Item / Status / ETA), table-safe via
// react-email <Row>/<Column>.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-1)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (Procurement.tsx)
//   src/lib/sendUpdate/emailTemplate.ts lines 256-291 (legacy <table>; mechanical port)
//
// The legacy template is already a <table>; this is a mechanical port to
// react-email primitives. Status color comes from getStatusColor() (re-exported
// from SendUpdate.tsx); same fixed STATUS_COLOR map -- T-46-02-05 mitigated.

import { Column, Row, Section, Text } from "@react-email/components";
import {
  formatDate,
  formatStatusText,
  getStatusColor,
  type SendUpdateProcurementItem,
} from "./SendUpdate";

export interface ProcurementProps {
  items: SendUpdateProcurementItem[];
}

export function Procurement({ items }: ProcurementProps) {
  return (
    <Section className="px-[40px] pb-[24px]">
      <Text className="text-[10px] tracking-[0.14em] text-stone uppercase font-body m-0 mb-[12px]">
        Procurement
      </Text>
      <Row className="border-b-[0.5px] border-stone-light">
        <Column
          className="text-[10px] tracking-[0.1em] text-stone-light uppercase py-[10px]"
          style={{ width: "50%" }}
        >
          Item
        </Column>
        <Column
          align="center"
          className="text-[10px] tracking-[0.1em] text-stone-light uppercase py-[10px]"
        >
          Status
        </Column>
        <Column
          align="right"
          className="text-[10px] tracking-[0.1em] text-stone-light uppercase py-[10px]"
        >
          ETA
        </Column>
      </Row>
      {items.map((item, idx) => {
        const status = item.status ?? "pending";
        const eta = item.expectedDeliveryDate ?? item.installDate;
        return (
          <Row
            key={item._key ?? idx}
            className="border-b-[0.5px] border-cream-dark"
          >
            <Column className="text-[13px] text-charcoal py-[10px]">
              {item.name ?? "Untitled"}
            </Column>
            <Column
              align="center"
              className="text-[12px] py-[10px]"
              style={{ color: getStatusColor(status) }}
            >
              {formatStatusText(status)}
            </Column>
            <Column
              align="right"
              className="text-[12px] text-stone py-[10px]"
            >
              {eta ? formatDate(eta) : ""}
            </Column>
          </Row>
        );
      })}
    </Section>
  );
}
