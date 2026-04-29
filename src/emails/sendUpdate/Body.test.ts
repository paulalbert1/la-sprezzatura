// src/emails/sendUpdate/Body.test.ts
// Phase 46.1 Plan 01 -- gap-1 fix: stripLeadingGreeting prevents the double
// "Hi Victoria," that surfaced in the Phase 46 Outlook merge-gate UAT.
//
// Phase 46.1 Plan 09 -- D-19 WR-01/WR-02 (round-2 carryover): tightened
// regex char class to [\w'-]+ for hyphenated/apostrophe firstNames + added
// clientFirstName parameter for exact-match check (case-insensitive).
//
// Source of truth:
//   .planning/phases/46.1-merge-gate-gap-closure/46.1-CONTEXT.md (D-1, D-19)
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
  // Greeting component would have emitted, AND the captured firstName must
  // match clientFirstName (case-insensitive) per 46.1 D-19 WR-02.
  // ========================================================================

  it("strips 'Hi Victoria,' followed by blank line + body (canonical case)", () => {
    expect(
      stripLeadingGreeting("Hi Victoria,\n\nJust an update on your project...", "Victoria"),
    ).toBe("Just an update on your project...");
  });

  it("strips 'Hi Sarah!' (exclamation variant) followed by single newline + body", () => {
    expect(stripLeadingGreeting("Hi Sarah!\nBody.", "Sarah")).toBe("Body.");
  });

  it("strips 'Hi Marco' (no punctuation) followed by single newline + body", () => {
    expect(stripLeadingGreeting("Hi Marco\nBody.", "Marco")).toBe("Body.");
  });

  // ========================================================================
  // Negative cases -- each rejected pattern is its own it() block per D-1.
  // The strip is INTENTIONALLY narrow; misfires here would be content elision.
  // ========================================================================

  it("does NOT strip 'hi victoria,' (lowercase greeting -- regex case-sensitive on 'Hi')", () => {
    const input = "hi victoria,\n\nBody.";
    expect(stripLeadingGreeting(input, "Victoria")).toBe(input);
  });

  it("does NOT strip 'Hello Victoria,' (different greeting word)", () => {
    const input = "Hello Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input, "Victoria")).toBe(input);
  });

  it("does NOT strip 'Dear Victoria,'", () => {
    const input = "Dear Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input, "Victoria")).toBe(input);
  });

  it("does NOT strip 'Hey Victoria,'", () => {
    const input = "Hey Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input, "Victoria")).toBe(input);
  });

  it("does NOT strip 'Hi everyone, this is the body' (multi-word, no trailing newline)", () => {
    const input = "Hi everyone, this is the body";
    expect(stripLeadingGreeting(input, "Victoria")).toBe(input);
  });

  it("does NOT strip mid-paragraph 'Hi Victoria,' (anchored at start only)", () => {
    const input = "Update.\n\nHi Victoria, just to clarify...";
    expect(stripLeadingGreeting(input, "Victoria")).toBe(input);
  });

  // ========================================================================
  // Idempotence / boundary cases.
  // ========================================================================

  it("strips ONLY the first leading occurrence (non-iterative)", () => {
    expect(
      stripLeadingGreeting("Hi Victoria,\nHi Victoria,\nBody.", "Victoria"),
    ).toBe("Hi Victoria,\nBody.");
  });

  it("returns empty string unchanged", () => {
    expect(stripLeadingGreeting("", "")).toBe("");
  });

  it("returns whitespace-only input unchanged (no leading 'Hi')", () => {
    const input = "   \n  ";
    expect(stripLeadingGreeting(input, "")).toBe(input);
  });

  // ========================================================================
  // 46.1 D-19 WR-01/WR-02 (round-2 carryover) -- new tests.
  // Hyphenated/apostrophe firstName positives + generic-salutation negatives.
  // ========================================================================

  it("strips 'Hi Mary-Anne,' when clientFirstName='Mary-Anne' (hyphenated firstName, exact match -- WR-01)", () => {
    expect(stripLeadingGreeting("Hi Mary-Anne,\n\nBody.", "Mary-Anne")).toBe("Body.");
  });

  it("strips 'Hi O'Brien,' when clientFirstName=\"O'Brien\" (apostrophe firstName, exact match -- WR-01)", () => {
    expect(stripLeadingGreeting("Hi O'Brien,\n\nBody.", "O'Brien")).toBe("Body.");
  });

  it("does NOT strip 'Hi all,' when clientFirstName='Sarah' (intentional generic salutation, mismatch -- WR-02)", () => {
    const input = "Hi all,\n\nBody.";
    expect(stripLeadingGreeting(input, "Sarah")).toBe(input);
  });

  it("does NOT strip 'Hi everyone,' when clientFirstName='Sarah' (intentional generic salutation, mismatch -- WR-02)", () => {
    const input = "Hi everyone,\n\nBody.";
    expect(stripLeadingGreeting(input, "Sarah")).toBe(input);
  });

  it("does NOT strip 'Hi Victoria,' when clientFirstName='' (empty firstName disables strip per coercion at SendUpdate boundary -- IN-R4-02 / WR-R4-02)", () => {
    // Regression guard for WR-R4-02: SendUpdate.tsx:173 coerces undefined
    // clientFirstName to "" before passing to <Body>. With clientFirstName="",
    // the captured firstName from the regex (always at least one [\w'-] char)
    // never equals "", so the strip is a no-op. This test pins the no-op so a
    // future caller that drops the ?? "" coercion upstream cannot silently
    // regress gap-1 for clients without a firstName field.
    const input = "Hi Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input, "")).toBe(input);
  });

  it("strips 'Hi sarah,' when clientFirstName='Sarah' (case-insensitive firstName match -- WR-02)", () => {
    // Greeting word stays "Hi" capital (regex case-sensitive on greeting).
    // Only firstName comparison is case-insensitive.
    expect(stripLeadingGreeting("Hi sarah,\n\nBody.", "Sarah")).toBe("Body.");
  });

  it("does NOT strip 'Hi Victoria,' when clientFirstName='Sarah' (different firstName -- WR-02 mismatch)", () => {
    const input = "Hi Victoria,\n\nBody.";
    expect(stripLeadingGreeting(input, "Sarah")).toBe(input);
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
