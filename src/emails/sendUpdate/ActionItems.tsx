// src/emails/sendUpdate/ActionItems.tsx
// Phase 46 -- "Action Items for You" section, table-safe (D-1) with 7x7
// terracotta-square status indicators (D-2).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-1, D-2)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (ActionItems.tsx)
//   src/lib/sendUpdate/emailTemplate.ts lines 222-254 (legacy, flex-rewrite source)
//
// D-1: legacy flex row -> <Row>/<Column>; D-2: 7x7 colored square (no border-radius).
// Terracotta indicator color #C17B5A is preserved verbatim from legacy line 239.
// Section header copy "Action Items for You" preserved verbatim from line 249.

import { Column, Row, Section, Text } from "@react-email/components";
import {
  formatDate,
  type SendUpdateClientActionItem,
} from "./SendUpdate";

export interface ActionItemsProps {
  items: SendUpdateClientActionItem[];
}

export function ActionItems({ items }: ActionItemsProps) {
  return (
    <Section className="px-[40px] pb-[24px]">
      <Text className="text-[10px] tracking-[0.14em] text-stone uppercase font-body m-0 mb-[12px]">
        Action Items for You
      </Text>
      {items.map((i, idx) => (
        <Row
          key={i._key ?? idx}
          className="border-b-[0.5px] border-cream-dark py-[10px]"
          style={{ verticalAlign: "middle" }}
        >
          <Column style={{ verticalAlign: "middle" }}>
            <span
              style={{
                display: "inline-block",
                width: "7px",
                height: "7px",
                backgroundColor: "#C17B5A",
                marginRight: "10px",
              }}
            />
            <span style={{ fontSize: "14px", color: "#2C2A26" }}>
              {i.description ?? "Action needed"}
            </span>
          </Column>
          <Column align="right" style={{ verticalAlign: "middle" }}>
            {i.dueDate && (
              <span style={{ fontSize: "13px", color: "#4A4540" }}>
                {formatDate(i.dueDate)}
              </span>
            )}
          </Column>
        </Row>
      ))}
    </Section>
  );
}
