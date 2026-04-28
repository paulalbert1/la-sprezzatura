// src/lib/email/personalNoteMarkdown.test.ts
// Phase 46-04 -- parser unit tests (D-5..D-8).
//
// Behavioral coverage:
//   * length boundary (600 / 601)
//   * URL scheme allowlist: https only (rejects javascript/data/http/mailto/ftp)
//   * paragraph splits via blank lines (\n{2,})
//   * forward-migration: plain-text input wraps as one paragraph
//   * inline tokens: **bold**, _italic_, [label](https://...)
//   * escape: \** renders literal **
//   * malformed input renders as literal text (no throw)
//   * HTML-escape regression (react JSX escapes user-controlled label text)
//   * multi-blank-line collapse (no stacked empty <p>)
//
// JSX is created via React.createElement so this stays a plain .ts file
// (matches src/emails/scaffold.test.ts -- vite/esbuild rejects JSX in .ts).

import { describe, it, expect } from "vitest";
import { render } from "@react-email/render";
import { createElement, Fragment } from "react";
import { parsePersonalNote, PersonalNoteParseError } from "./personalNoteMarkdown";

async function renderNodes(text: string): Promise<string> {
  const nodes = parsePersonalNote(text);
  return await render(createElement(Fragment, null, ...nodes));
}

describe("parsePersonalNote (Phase 46-04 D-5..D-8)", () => {
  it("returns [] for empty input", () => {
    expect(parsePersonalNote("")).toEqual([]);
  });

  it("returns [] for whitespace-only input", () => {
    expect(parsePersonalNote("   \n\n   ")).toEqual([]);
  });

  it("plain-text without tokens renders as one paragraph (D-7 forward-migration)", async () => {
    const html = await renderNodes("Just one paragraph of plain text.");
    expect(html).toContain("Just one paragraph of plain text.");
    // Exactly one <p> in the output (react-email <Text> renders as <p>):
    expect((html.match(/<p\b/gi) || []).length).toBe(1);
  });

  it("blank-line splits paragraphs", async () => {
    const html = await renderNodes("First.\n\nSecond.\n\nThird.");
    expect((html.match(/<p\b/gi) || []).length).toBe(3);
  });

  it("collapses multiple blank lines into a single paragraph break (no stacked empty <p>)", async () => {
    const html = await renderNodes("First.\n\n\n\nSecond.");
    // exactly two <p>, no empty paragraphs between
    expect((html.match(/<p\b/gi) || []).length).toBe(2);
    // no consecutive </p><p> with empty content
    expect(html).not.toMatch(/<\/p>\s*<p[^>]*>\s*<\/p>/);
  });

  it("treats \\n\\n\\n the same as \\n\\n (single paragraph break)", async () => {
    const a = await renderNodes("A.\n\nB.");
    const b = await renderNodes("A.\n\n\nB.");
    // both produce 2 paragraphs
    expect((a.match(/<p\b/gi) || []).length).toBe(2);
    expect((b.match(/<p\b/gi) || []).length).toBe(2);
  });

  it("**bold** renders as <strong>", async () => {
    const html = await renderNodes("Hello **world**.");
    expect(html).toMatch(/<strong[^>]*>world<\/strong>/);
  });

  it("_italic_ renders as <em>", async () => {
    const html = await renderNodes("Hello _world_.");
    expect(html).toMatch(/<em[^>]*>world<\/em>/);
  });

  it("https link renders as <a href>", async () => {
    const html = await renderNodes("[click here](https://lasprezz.com)");
    expect(html).toMatch(/href="https:\/\/lasprezz\.com"/);
    expect(html).toContain("click here");
  });

  it("link wrapping bold parses correctly: [**bold link**](url)", async () => {
    const html = await renderNodes("[**Important**](https://lasprezz.com)");
    // The label "Important" appears inside an <a>; the bold token inside
    // the bracket is treated as part of the label, not separately re-parsed.
    expect(html).toMatch(/href="https:\/\/lasprezz\.com"/);
    expect(html).toContain("**Important**");
  });

  it("escaped \\** renders as literal **", async () => {
    const html = await renderNodes("not \\**bold\\**");
    expect(html).toContain("**bold**");
    expect(html).not.toMatch(/<strong/);
  });

  it("unclosed ** renders as literal text (does not throw)", async () => {
    const html = await renderNodes("hello **world");
    expect(html).toContain("**world");
    expect(html).not.toMatch(/<strong/);
  });

  it("incomplete link [label]( renders as literal text (does not throw)", async () => {
    const html = await renderNodes("see [label](");
    expect(html).toContain("[label](");
    expect(html).not.toMatch(/<a /);
  });

  it("rejects javascript: URL scheme with INVALID_URL_SCHEME", () => {
    expect(() => parsePersonalNote("[click](javascript:alert(1))")).toThrow(PersonalNoteParseError);
    try {
      parsePersonalNote("[click](javascript:alert(1))");
    } catch (e) {
      expect((e as PersonalNoteParseError).code).toBe("INVALID_URL_SCHEME");
    }
  });

  it("rejects data: URL scheme", () => {
    expect(() => parsePersonalNote("[x](data:text/html,<script>)")).toThrow(/INVALID_URL_SCHEME/);
  });

  it("rejects http: URL scheme (only https allowed)", () => {
    expect(() => parsePersonalNote("[x](http://example.com)")).toThrow(/INVALID_URL_SCHEME/);
  });

  it("rejects mailto: URL scheme", () => {
    expect(() => parsePersonalNote("[email me](mailto:liz@lasprezz.com)")).toThrow(/INVALID_URL_SCHEME/);
  });

  it("rejects ftp: URL scheme", () => {
    expect(() => parsePersonalNote("[file](ftp://example.com/x)")).toThrow(/INVALID_URL_SCHEME/);
  });

  it("accepts https: URL scheme without throwing", () => {
    expect(() => parsePersonalNote("[x](https://lasprezz.com)")).not.toThrow();
  });

  it("hard-caps at 600 chars exactly (601 throws OVER_LIMIT)", () => {
    const at600 = "a".repeat(600);
    expect(() => parsePersonalNote(at600)).not.toThrow();
    const at601 = "a".repeat(601);
    expect(() => parsePersonalNote(at601)).toThrow(PersonalNoteParseError);
    try {
      parsePersonalNote(at601);
    } catch (e) {
      expect((e as PersonalNoteParseError).code).toBe("OVER_LIMIT");
      expect((e as PersonalNoteParseError).details).toMatchObject({ length: 601, max: 600 });
    }
  });

  it("HTML-escapes user-controlled label and href via JSX (no injection)", async () => {
    const html = await renderNodes("[<script>alert(1)</script>](https://lasprezz.com)");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
