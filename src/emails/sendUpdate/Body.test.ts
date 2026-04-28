// src/emails/sendUpdate/Body.test.ts
// Phase 46.1 Plan 01 -- gap-1 fix: stripLeadingGreeting prevents the double
// "Hi Victoria," that surfaced in the Phase 46 Outlook merge-gate UAT.
//
// Source of truth:
//   .planning/phases/46.1-merge-gate-gap-closure/46.1-CONTEXT.md (D-1 lock --
//   regex shape, narrow-by-design rationale, the five negative cases that
//   MUST remain unstripped: Hello/Dear/lowercase-hi/Hey/multi-word).
//
// Convention: mirrors src/emails/sendUpdate/SendUpdate.test.ts -- plain .ts
// (no JSX), individual it() blocks (no parameterized loops), createElement
// for the integration smoke test.

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { render } from "@react-email/render";
import { stripLeadingGreeting } from "./Body";
import { SendUpdate } from "./SendUpdate";
import { baseInput } from "./fixtures";

describe("stripLeadingGreeting (46.1 D-1 -- gap-1 fix)", () => {
  // ========================================================================
  // Positive cases -- the strip MUST fire on the exact shape the structural
  // Greeting component would have emitted.
  // ========================================================================

  it("strips 'Hi Victoria,' followed by blank line + body (canonical case)", () => {
    expect(
      stripLeadingGreeting("Hi Victoria,\n\nJust an update on your project..."),
    ).toBe("Just an update on your project...");
  });

  it("strips 'Hi Sarah!' (exclamation variant) followed by single newline + body", () => {
    expect(stripLeadingGreeting("Hi Sarah!\nBody.")).toBe("Body.");
  });

  it("strips 'Hi Marco' (no punctuation) followed by single newline + body", () => {
    expect(stripLeadingGreeting("Hi Marco\nBody.")).toBe("Body.");
  });

  // ========================================================================
  // Negative cases -- each rejected pattern is its own it() block per D-1.
  // The strip is INTENTIONALLY narrow; misfires here would be content elision.
  // ========================================================================

  it("does NOT strip 'hi victoria,' (lowercase -- case-sensitive)", () => {
    const input = "hi victoria,\n\nBody.";
    expect(stripLeadingGreeting(input)).toBe(input);
  });

  it("does NOT strip 'Hello Victoria,' (different greeting word)", () => {
    const input = "Hello Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input)).toBe(input);
  });

  it("does NOT strip 'Dear Victoria,'", () => {
    const input = "Dear Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input)).toBe(input);
  });

  it("does NOT strip 'Hey Victoria,'", () => {
    const input = "Hey Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input)).toBe(input);
  });

  it("does NOT strip 'Hi everyone, this is the body' (multi-word, no trailing newline)", () => {
    const input = "Hi everyone, this is the body";
    expect(stripLeadingGreeting(input)).toBe(input);
  });

  it("does NOT strip mid-paragraph 'Hi Victoria,' (anchored at start only)", () => {
    const input = "Update.\n\nHi Victoria, just to clarify...";
    expect(stripLeadingGreeting(input)).toBe(input);
  });

  // ========================================================================
  // Idempotence / boundary cases.
  // ========================================================================

  it("strips ONLY the first leading occurrence (non-iterative)", () => {
    expect(
      stripLeadingGreeting("Hi Victoria,\nHi Victoria,\nBody."),
    ).toBe("Hi Victoria,\nBody.");
  });

  it("returns empty string unchanged", () => {
    expect(stripLeadingGreeting("")).toBe("");
  });

  it("returns whitespace-only input unchanged (no leading 'Hi')", () => {
    const input = "   \n  ";
    expect(stripLeadingGreeting(input)).toBe(input);
  });
});

describe("Body integration: double-greeting fix (gap-1)", () => {
  it("renders 'Hi Victoria,' exactly once when personalNote also starts with the greeting", async () => {
    const html = await render(
      createElement(
        SendUpdate,
        baseInput({
          personalNote: "Hi Victoria,\n\nJust an update on your project...",
          clientFirstName: "Victoria",
        }),
      ),
    );
    const matches = html.match(/Hi Victoria,/g) || [];
    expect(matches.length).toBe(1);
    expect(html).toContain("Just an update on your project...");
  });
});
