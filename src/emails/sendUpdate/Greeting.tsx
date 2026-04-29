// src/emails/sendUpdate/Greeting.tsx
// Phase 46-04 -- Greeting section. H1 + project sub-line + greeting line only.
//
// Personal-note rendering moved to Body.tsx (D-5). Greeting no longer accepts
// the body prop -- the field is omitted from the GreetingProps interface
// to make the deletion structural, not nominal.
//
// sentDate is pre-formatted upstream by SendUpdate.tsx via formatLongDate().

import { Heading, Section, Text } from "@react-email/components";
import type { SendUpdateProject } from "./SendUpdate";

export interface GreetingProps {
  project: SendUpdateProject;
  firstName?: string;
  sentDate: string;        // pre-formatted upstream
}

const HEADING_STYLE = {
  fontSize: 22,
  fontFamily: '"Cormorant Garamond","Georgia",serif',
  color: "#2C2926",
  margin: 0,
  marginBottom: 6,
  fontWeight: 600,
  letterSpacing: "-0.005em",
} as const;

const SUBLINE_STYLE = {
  fontSize: 13,
  lineHeight: "24px",
  color: "#8A8478",
  margin: 0,
  marginBottom: 24,
  letterSpacing: "0.04em",
} as const;

const GREETING_STYLE = {
  fontSize: 15,
  lineHeight: "28px",
  color: "#4A4540",
  margin: 0,
  marginBottom: 0,
} as const;

const SECTION_STYLE = {
  paddingLeft: 40,
  paddingRight: 40,
  paddingTop: 8,
  paddingBottom: 4,
} as const;

export function Greeting({ project, firstName, sentDate }: GreetingProps) {
  const greetingName = firstName ?? "there";
  return (
    <Section style={SECTION_STYLE}>
      <Heading as="h1" style={HEADING_STYLE}>Project Update</Heading>
      <Text style={SUBLINE_STYLE}>{project.title} {"·"} {sentDate}</Text>
      <Text style={GREETING_STYLE}>{`Hi ${greetingName},`}</Text>
    </Section>
  );
}
