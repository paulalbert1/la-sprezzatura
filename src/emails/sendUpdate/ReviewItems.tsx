// src/emails/sendUpdate/ReviewItems.tsx
// Phase 46-04 -- merged "For your review" section (D-3, D-4).
//
// Designer-typed personalActionItems render first (intentional, dated, high-signal).
// Auto-derived pendingArtifacts render second (informational, undated, "by the way").
// Empty-both -> section omitted entirely (no empty state).
// No <a> wrappers in v1 -- per-section deep-links deferred (D-4).
//
// Ordering is load-bearing: the two .map calls are kept sequential rather
// than merged into a single array so the designer-first/artifact-second
// DOM order is explicit and obvious. Task 5 asserts this with a behavioral
// indexOf-based test against non-empty fixtures for both arrays.

import { Column, Row, Section, Text } from "@react-email/components";
import { getArtifactLabel, type PendingArtifact } from "./SendUpdate";

export interface PersonalActionItem {
  label: string;
  dueLabel?: string;
}

export interface ReviewItemsProps {
  personalActionItems: PersonalActionItem[];
  pendingArtifacts: PendingArtifact[];
}

const SQUARE_TERRACOTTA = "#C4836A";
const SQUARE_SIZE = 7;

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

const ROW_BORDER_STYLE = {
  borderBottom: "0.5px solid #E8DDD0",
  paddingTop: 12,
  paddingBottom: 12,
  verticalAlign: "middle" as const,
};

const SQUARE_STYLE = {
  display: "inline-block",
  width: SQUARE_SIZE,
  height: SQUARE_SIZE,
  backgroundColor: SQUARE_TERRACOTTA,
  marginRight: 12,
  verticalAlign: "middle" as const,
};

const LABEL_STYLE = {
  fontSize: 14,
  color: "#2C2926",
  verticalAlign: "middle" as const,
} as const;

const DUE_STYLE = {
  fontSize: 13,
  color: "#4A4540",
  letterSpacing: "0.02em",
} as const;

export function ReviewItems({ personalActionItems, pendingArtifacts }: ReviewItemsProps) {
  const hasDesigner = personalActionItems.length > 0;
  const hasArtifacts = pendingArtifacts.length > 0;
  if (!hasDesigner && !hasArtifacts) return null;

  return (
    <Section style={{ paddingLeft: 40, paddingRight: 40, paddingBottom: 24, paddingTop: 8 }}>
      <Text style={EYEBROW_STYLE}>For your review</Text>
      {personalActionItems.map((item, i) => (
        <Row key={`designer-${i}`} style={ROW_BORDER_STYLE}>
          <Column style={{ verticalAlign: "middle" }}>
            <span style={SQUARE_STYLE} />
            <span style={LABEL_STYLE}>{item.label}</span>
          </Column>
          <Column align="right" style={{ verticalAlign: "middle" }}>
            {item.dueLabel ? <span style={DUE_STYLE}>{item.dueLabel}</span> : null}
          </Column>
        </Row>
      ))}
      {pendingArtifacts.map((art, i) => (
        <Row key={`artifact-${art._key ?? i}`} style={ROW_BORDER_STYLE}>
          <Column style={{ verticalAlign: "middle" }}>
            <span style={SQUARE_STYLE} />
            <span style={LABEL_STYLE}>
              {getArtifactLabel(art.artifactType ?? "", art.customTypeName)}
            </span>
          </Column>
          <Column align="right" style={{ verticalAlign: "middle" }}>
            {/* Auto-derived rows: empty right column. NEVER synthesize "Pending review" placeholder. */}
          </Column>
        </Row>
      ))}
    </Section>
  );
}
