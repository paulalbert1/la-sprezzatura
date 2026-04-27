// src/emails/sendUpdate/Milestones.tsx
// Phase 46 -- Milestones section, table-safe (D-1) with 7x7 colored-square
// status indicators (D-2).
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-1, D-2)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (Milestones.tsx)
//   src/lib/sendUpdate/emailTemplate.ts lines 187-220 (legacy, flex-rewrite source)
//
// D-1: every legacy `display: flex` row is rewritten as <Row>/<Column> which
//      emits <table role="presentation"> -- Outlook-safe.
// D-2: status indicator is an inline-block 7x7 <span> with explicit pixel
//      width/height and no border-radius.
//
// Color values mirror legacy STATUS_COLOR map for completed (#7D9E6E green)
// vs pending (#D4C9BC neutral) per emailTemplate.ts lines 196 + 105-113.

import { Column, Row, Section, Text } from "@react-email/components";
import { formatDate, type SendUpdateMilestone } from "./SendUpdate";

export interface MilestonesProps {
  milestones: SendUpdateMilestone[];
}

export function Milestones({ milestones }: MilestonesProps) {
  return (
    <Section className="px-[40px] pb-[24px]">
      <Text className="text-[10px] tracking-[0.14em] text-stone uppercase font-body m-0 mb-[12px]">
        Milestones
      </Text>
      {milestones.map((m, idx) => (
        <Row
          key={m._key ?? idx}
          className="border-b-[0.5px] border-cream-dark py-[10px]"
          style={{ verticalAlign: "middle" }}
        >
          <Column style={{ verticalAlign: "middle" }}>
            <span
              style={{
                display: "inline-block",
                width: "7px",
                height: "7px",
                backgroundColor: m.completed ? "#7D9E6E" : "#D4C9BC",
                marginRight: "10px",
              }}
            />
            <span
              style={
                m.completed
                  ? {
                      fontSize: "14px",
                      color: "#9A8F82",
                      textDecoration: "line-through",
                    }
                  : { fontSize: "14px", color: "#2C2A26" }
              }
            >
              {m.name ?? "Untitled"}
            </span>
          </Column>
          <Column align="right" style={{ verticalAlign: "middle" }}>
            {m.date && (
              <span
                style={{
                  fontSize: "13px",
                  color: m.completed ? "#B8AFA4" : "#4A4540",
                }}
              >
                {formatDate(m.date)}
              </span>
            )}
          </Column>
        </Row>
      ))}
    </Section>
  );
}
