// src/emails/sendUpdate/Procurement.tsx
// Phase 46-04 -- Procurement section with canonical pill palette + sub-line (D-12..D-14).
//
// Pill palette imported from src/lib/procurement/statusPills.ts (single source of truth).
// Sub-line composition (D-14):
//   - vendor AND spec  -> `${vendor} · ${spec}`
//   - vendor OR spec   -> the present one alone
//   - neither          -> entire <span> wrapper omitted (no empty span, no nbsp placeholder)
//
// Mixed-mode rendering must look intentional row-by-row -- rows shorten without
// misalignment because the wrapper is conditional, not the content.

import type { CSSProperties } from "react";
import { Column, Row, Section, Text } from "@react-email/components";
import { STATUS_PILL_STYLES, STATUS_LABELS, type ProcurementStatus } from "../../lib/procurement/statusPills";

export interface ProcurementRow {
  name: string;
  vendor?: string;
  spec?: string;
  status: ProcurementStatus;
  eta: string;            // formatted upstream
}

export interface ProcurementProps {
  items: ProcurementRow[];
}

const EYEBROW_STYLE = {
  fontSize: 10,
  lineHeight: "24px",
  letterSpacing: "0.14em",
  color: "#8A8478",
  textTransform: "uppercase" as const,
  fontWeight: 600,
  margin: 0,
  marginBottom: 12,
} as const;

const HEADER_LABEL_STYLE = {
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#B8AFA4",
  paddingTop: 10,
  paddingBottom: 10,
} as const;

const ROW_STYLE = {
  borderBottom: "0.5px solid #E8DDD0",
  paddingTop: 12,
  paddingBottom: 12,
  verticalAlign: "middle" as const,
};

const ITEM_NAME_STYLE = {
  fontSize: 14,
  color: "#2C2926",
} as const;

const SUBLINE_STYLE = {
  display: "block" as const,
  fontSize: 11.5,
  color: "#8A8478",
  marginTop: 2,
  letterSpacing: "0.02em",
};

const ETA_STYLE = {
  fontSize: 13,
  color: "#4A4540",
  letterSpacing: "0.02em",
} as const;

function composeSubLine(vendor?: string, spec?: string): string | null {
  const v = vendor?.trim();
  const s = spec?.trim();
  if (v && s) return `${v} · ${s}`;
  return v || s || null;
}

function pillStyle(status: ProcurementStatus): CSSProperties {
  const palette = STATUS_PILL_STYLES[status];
  return {
    display: "inline-block",
    backgroundColor: palette.bg,
    color: palette.text,
    border: `0.5px solid ${palette.border}`,
    padding: "3px 10px",
    borderRadius: "2px",   // longhand only -- Phase 46 D-3
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  };
}

export function Procurement({ items }: ProcurementProps) {
  if (!items.length) return null;
  return (
    <Section style={{ paddingTop: 16 }}>
      <Section style={{ paddingLeft: 40, paddingRight: 40, paddingBottom: 24 }}>
        <Text style={EYEBROW_STYLE}>Procurement</Text>
        <Row style={{ borderBottom: "0.5px solid #E8DDD0" }}>
          <Column width="60%" style={HEADER_LABEL_STYLE}>Item</Column>
          <Column width="22%" align="left" style={HEADER_LABEL_STYLE}>Status</Column>
          <Column width="18%" align="left" style={HEADER_LABEL_STYLE}>ETA</Column>
        </Row>
        {items.map((it, i) => {
          const subLine = composeSubLine(it.vendor, it.spec);
          return (
            <Row key={`p-${i}`} style={ROW_STYLE}>
              <Column width="60%" style={{ verticalAlign: "top" }}>
                <span style={ITEM_NAME_STYLE}>{it.name}</span>
                {subLine && <span style={SUBLINE_STYLE}>{subLine}</span>}
              </Column>
              <Column width="22%" align="left" style={{ verticalAlign: "top" }}>
                <span style={pillStyle(it.status)}>{STATUS_LABELS[it.status]}</span>
              </Column>
              <Column width="18%" align="left" style={{ verticalAlign: "top" }}>
                <span style={ETA_STYLE}>{it.eta}</span>
              </Column>
            </Row>
          );
        })}
      </Section>
    </Section>
  );
}
