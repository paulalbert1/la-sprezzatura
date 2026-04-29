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
// Narrow by design (46.1 D-1): case-sensitive "Hi", optional `,` or `!`, >=1
// trailing newline. Does NOT match "Hello", "Dear", "Hey", or lowercase "hi".
// Does NOT iterate -- strips ONE leading match only. Does NOT match
// mid-paragraph occurrences (anchored at start).
//
// 46.1 D-19 WR-01/WR-02 (round-2 carryover): captures the post-"Hi" word so
// the function can verify it equals the recipient's clientFirstName before
// stripping. Tightening prevents two failure modes:
//   WR-01: hyphenated/apostrophe firstNames (Mary-Anne, O'Brien) used to escape
//          the strip when \w+ alone limited the char class. Widened to [\w'-]+.
//   WR-02: generic salutations like "Hi all," "Hi everyone," "Hi team," used to
//          be silently elided when the clientFirstName was something else
//          (e.g. "Sarah"). Now the function only strips when the captured
//          firstName matches clientFirstName case-insensitively.
const LEADING_GREETING_RE = /^Hi\s+([\w'-]+)[,!]?\s*\n+/;

export function stripLeadingGreeting(personalNote: string, clientFirstName: string): string {
  return personalNote.replace(LEADING_GREETING_RE, (match, capturedFirstName: string) => {
    // Only strip when the captured word equals clientFirstName (case-insensitive).
    // Narrows the strip to the exact double-greeting case CONTEXT.md D-1 describes;
    // preserves intentional "Hi all," when recipient firstName is something else.
    if (capturedFirstName.toLowerCase() === clientFirstName.toLowerCase()) {
      return "";
    }
    return match;
  });
}

export interface BodyProps {
  personalNote: string;
  clientFirstName: string;
}

export function Body({ personalNote, clientFirstName }: BodyProps) {
  if (!personalNote.trim()) return null;
  const stripped = stripLeadingGreeting(personalNote, clientFirstName);
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
