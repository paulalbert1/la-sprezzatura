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

export interface BodyProps {
  personalNote: string;
}

export function Body({ personalNote }: BodyProps) {
  if (!personalNote.trim()) return null;
  const nodes = parsePersonalNote(personalNote);
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
