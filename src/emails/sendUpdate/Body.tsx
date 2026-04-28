// src/emails/sendUpdate/Body.tsx
// Phase 46-04 -- multi-paragraph authored body for SendUpdate (D-5..D-8).
//
// personalNote is REQUIRED (D-6). Pass empty string to opt out of the section.
// Markdown rendering is delegated to parsePersonalNote -- see
// src/lib/email/personalNoteMarkdown.ts for the allowed token set + URL allowlist.
//
// The serializer throws PersonalNoteParseError on bad input (over-limit or
// non-https URL). Body lets the error propagate; the compose helper in Task 4
// is responsible for catching it and re-throwing with diagnostic context.

import { Section } from "@react-email/components";
import { parsePersonalNote } from "../../lib/email/personalNoteMarkdown";

// Strip a single leading "Hi {firstName}{,|!}?\n+" occurrence to prevent the
// double-greeting collision when admin types personalNote that starts with the
// same greeting the structural Greeting component already emits.
//
// Narrow by design (46.1 D-1): case-sensitive "Hi", single-word firstName,
// optional `,` or `!`, >=1 trailing newline. Does NOT match "Hello", "Dear",
// "Hey", or lowercase "hi". Does NOT iterate -- strips ONE leading match only.
// Does NOT match mid-paragraph occurrences (anchored at start).
const LEADING_GREETING_RE = /^Hi\s+\w+[,!]?\s*\n+/;

export function stripLeadingGreeting(personalNote: string): string {
  return personalNote.replace(LEADING_GREETING_RE, "");
}

export interface BodyProps {
  personalNote: string;
}

export function Body({ personalNote }: BodyProps) {
  if (!personalNote.trim()) return null;
  const stripped = stripLeadingGreeting(personalNote);
  if (!stripped.trim()) return null;
  const nodes = parsePersonalNote(stripped);
  if (nodes.length === 0) return null;
  return (
    <Section
      style={{
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 8,
        paddingBottom: 12,
      }}
    >
      {nodes}
    </Section>
  );
}
