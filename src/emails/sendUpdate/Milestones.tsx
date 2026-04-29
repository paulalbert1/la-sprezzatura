// src/emails/sendUpdate/Milestones.tsx
// Phase 46-04 -- Milestones section with completed/upcoming state (D-10, D-11).
//
// Completed: filled stone square + strikethrough title + "Complete" pill.
// Upcoming: outlined square (1px border, transparent fill) + "Upcoming" pill.
// The unicode open-circle glyph (U+25CB) is forbidden -- every indicator
// is a styled <span> with explicit pixel width/height. (D-11)
//
// Pill source text uses sentence-case "Complete"/"Upcoming" -- the visual
// uppercase rendering is a CSS treatment via text-transform: uppercase.
// This is a load-bearing accessibility constraint: screen readers read
// literal source text, so "COMPLETE" gets spelled out C-O-M-P-L-E-T-E
// while "Complete" with text-transform: uppercase reads naturally as
// "complete" while still rendering visually uppercase.

import { Column, Row, Section, Text } from "@react-email/components";

export type MilestoneState = "completed" | "upcoming";

export interface MilestoneRow {
  label: string;
  date: string;            // formatted upstream by SendUpdate.tsx via formatDate()
  state: MilestoneState;
}

export interface MilestonesProps {
  milestones: MilestoneRow[];
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

const ROW_STYLE = {
  borderBottom: "0.5px solid #E8DDD0",
  paddingTop: 12,
  paddingBottom: 12,
  verticalAlign: "middle" as const,
};

const SQUARE_BASE = {
  display: "inline-block",
  width: 7,
  height: 7,
  marginRight: 12,
  verticalAlign: "middle" as const,
  boxSizing: "border-box" as const,
};

const SQUARE_COMPLETED = { ...SQUARE_BASE, backgroundColor: "#D4C9BC" };
const SQUARE_UPCOMING = {
  ...SQUARE_BASE,
  border: "1px solid #D4C9BC",
  backgroundColor: "transparent",
};

const TITLE_COMPLETED = {
  fontSize: 14,
  color: "#8A8478",
  textDecoration: "line-through" as const,
};

const TITLE_UPCOMING = {
  fontSize: 14,
  color: "#2C2926",
};

const STATE_PILL_STYLE = {
  fontSize: 11,
  color: "#8A8478",
  marginLeft: 8,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
};

const DATE_STYLE = {
  fontSize: 13,
  color: "#8A8478",
  letterSpacing: "0.02em",
} as const;

export function Milestones({ milestones }: MilestonesProps) {
  if (!milestones.length) return null;
  return (
    <Section style={{ paddingLeft: 40, paddingRight: 40, paddingBottom: 24 }}>
      <Text style={EYEBROW_STYLE}>Milestones</Text>
      {milestones.map((m, i) => {
        const squareStyle = m.state === "completed" ? SQUARE_COMPLETED : SQUARE_UPCOMING;
        const titleStyle = m.state === "completed" ? TITLE_COMPLETED : TITLE_UPCOMING;
        // Sentence-case source strings + textTransform: uppercase styling --
        // accessibility-driven (see header comment).
        const pillLabel = m.state === "completed" ? "Complete" : "Upcoming";
        const isLast = i === milestones.length - 1;
        const rowStyle = isLast ? { ...ROW_STYLE, borderBottom: "none" } : ROW_STYLE;
        return (
          <Row key={`m-${i}`} style={rowStyle}>
            <Column style={{ verticalAlign: "middle" }}>
              <span style={squareStyle} />
              <span style={titleStyle}>{m.label}</span>
              <span style={STATE_PILL_STYLE}>{pillLabel}</span>
            </Column>
            <Column align="left" style={{ verticalAlign: "middle" }}>
              <span style={DATE_STYLE}>{m.date}</span>
            </Column>
          </Row>
        );
      })}
    </Section>
  );
}
