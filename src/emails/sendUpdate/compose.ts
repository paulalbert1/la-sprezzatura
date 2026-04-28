// src/emails/sendUpdate/compose.ts
// Phase 46-04 -- single presentation seam for SendUpdate (D-16, D-17, D-18, D-39).
//
// Owns subject pattern + render + plain-text. Reply-To is never set explicitly.
// From-address resolution remains the API route's responsibility (D-18).
// Plan 46-03 wires this into src/pages/api/send-update.ts at cutover time.
//
// Subject pattern (D-16): `Project update — ${project.title || clientFullName || "your project"}`
//   - U+2014 em dash (NOT hyphen-minus)
//   - sentence-case "update" (NOT "Update")
//   - no cadence-prefix (Phase 46 D-16 explicitly drops the prior cadence wording)
//   - falls back to clientFullName when project.title missing/blank
//
// PersonalNoteParseError caught + re-thrown as ComposeError so the API route
// surfaces a usable diagnostic rather than an opaque 500.

import { render } from "@react-email/render";
import { createElement } from "react";
import { SendUpdate, type SendUpdateEmailInput } from "./SendUpdate";
import { PersonalNoteParseError } from "../../lib/email/personalNoteMarkdown";

export interface ComposeSendUpdateInput extends SendUpdateEmailInput {
  fromAddress: string;             // resolved upstream by API route (D-18)
  clientFullName?: string;         // for subject fallback only (D-16)
}

export interface ComposedSendUpdate {
  from: string;
  subject: string;
  html: string;
  text: string;
}

export class ComposeError extends Error {
  cause: unknown;
  constructor(message: string, cause: unknown) {
    super(message);
    this.name = "ComposeError";
    this.cause = cause;
  }
}

export async function composeSendUpdateEmail(
  input: ComposeSendUpdateInput,
): Promise<ComposedSendUpdate> {
  const subject = computeSubject(input);
  let html: string;
  let text: string;
  try {
    const element = createElement(SendUpdate, input);
    html = await render(element);
    text = await render(element, { plainText: true });
  } catch (err) {
    if (err instanceof PersonalNoteParseError) {
      throw new ComposeError(
        `Failed to compose SendUpdate: personalNote parse error (${err.code})`,
        err,
      );
    }
    throw err;
  }
  return { from: input.fromAddress, subject, html, text };
}

function computeSubject(input: ComposeSendUpdateInput): string {
  const projectTitle = input.project.title?.trim();
  const clientName = input.clientFullName?.trim();
  const name = projectTitle || clientName || "your project";
  return `Project update — ${name}`;     // U+2014 em dash, sentence-case "update"
}
