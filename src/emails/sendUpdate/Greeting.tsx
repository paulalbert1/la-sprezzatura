// src/emails/sendUpdate/Greeting.tsx
// Phase 46 -- header + h1 + project sub-line + greeting + personalNote.
//
// Source of truth:
//   .planning/phases/46-send-update-work-order-migration/46-CONTEXT.md (D-1)
//   .planning/phases/46-send-update-work-order-migration/46-PATTERNS.md (Greeting.tsx)
//   src/lib/sendUpdate/emailTemplate.ts lines 322-339 (legacy markup)
//
// JSX auto-escapes children, so the legacy esc() helper is not used here.
// The personalNote splitter mirrors lines 312-320 of the legacy template:
// split on \n{2,} for paragraphs, single \n becomes <br>.

import React from "react";
import { Heading, Section, Text } from "@react-email/components";
import {
  formatLongDate,
  type SendUpdateProject,
} from "./SendUpdate";

export interface GreetingProps {
  clientFirstName?: string;
  project: SendUpdateProject;
  personalNote: string;
}

export function Greeting({ clientFirstName, project, personalNote }: GreetingProps) {
  const dateStr = formatLongDate(new Date().toISOString());
  const greetingName = clientFirstName ?? "there";

  return (
    <Section className="px-[40px] pt-[8px] pb-[12px]">
      <Heading
        as="h1"
        className="text-[22px] font-heading text-charcoal m-0 mb-[6px]"
      >
        Project Update
      </Heading>
      <Text className="text-[13px] text-stone m-0 mb-[28px] tracking-[0.04em]">
        {project.title} {"·"} {dateStr}
      </Text>
      <Text className="text-[15px] leading-[28px] text-charcoal-light m-0 mb-[14px]">
        {`Hi ${greetingName},`}
      </Text>
      {personalNote &&
        personalNote.split(/\n{2,}/).map((para, idx) => (
          <Text
            key={idx}
            className="text-[15px] leading-[28px] text-charcoal-light m-0 mb-[14px]"
          >
            {para.split("\n").map((line, i, arr) => (
              <React.Fragment key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Text>
        ))}
    </Section>
  );
}
