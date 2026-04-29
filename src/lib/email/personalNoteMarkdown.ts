// src/lib/email/personalNoteMarkdown.ts
// Phase 46-04 -- constrained markdown serializer for SendUpdate Body (D-5..D-8).
//
// Allowed tokens:
//   **bold**             -> <strong>
//   _italic_             -> <em>
//   [label](https://...) -> <Link href> (body-copy styled, NOT terracotta-underlined)
//   blank-line           -> paragraph break (any run of >=2 \n collapses to one break)
//
// URL scheme allowlist: https only. javascript:/data:/http:/mailto:/ftp: throw.
// Hard cap: 600 chars at the parser. Compose UI MUST enforce a matching cap.
// Forward-migration: plain text without tokens or blank lines wraps as one paragraph.
//
// Pattern note (vs Tailwind): this serializer should not depend on a
// <Tailwind> context -- it returns react-email components rendered via inline
// `style` props. That keeps it usable from any composition root and matches
// the inline-style discipline 46-02's snapshots already enforce in
// Outlook-safe markup.

import { Link, Text } from "@react-email/components";
import { createElement, type ReactNode } from "react";

// 46.1 D-19 WR-03 (round-2 carryover): promoted to named export so the admin
// compose UI (SendUpdateModal.tsx) can apply maxLength={MAX_LEN} to the
// personalNote textarea and render a live character counter. Single source of
// truth -- changing the cap here changes both the parser cap AND the textarea
// enforcement.
export const MAX_LEN = 600;
const ALLOWED_SCHEME = /^https:\/\//i;

export type PersonalNoteParseErrorCode = "OVER_LIMIT" | "INVALID_URL_SCHEME";

export class PersonalNoteParseError extends Error {
  code: PersonalNoteParseErrorCode;
  details: Record<string, unknown>;
  constructor(code: PersonalNoteParseErrorCode, details: Record<string, unknown> = {}) {
    super(`PersonalNoteParseError(${code}): ${JSON.stringify(details)}`);
    this.name = "PersonalNoteParseError";
    this.code = code;
    this.details = details;
  }
}

interface InlineNode {
  type: "text" | "bold" | "italic" | "link";
  text: string;
  href?: string;
}

const PARAGRAPH_TEXT_STYLE = {
  fontSize: 15,
  lineHeight: "28px",
  color: "#4A4540",      // charcoal-light per design-language
  margin: 0,
  marginBottom: 14,
} as const;

const INLINE_LINK_STYLE = {
  color: "#4A4540",
  textDecoration: "underline",
} as const;

export function parsePersonalNote(text: string): ReactNode[] {
  // 1. Length validation FIRST (cheapest check; runs before scheme check so
  //    over-limit input fails fast even if it also contains a bad URL).
  if (text.length > MAX_LEN) {
    throw new PersonalNoteParseError("OVER_LIMIT", { length: text.length, max: MAX_LEN });
  }
  // 2. Empty / whitespace-only -> empty.
  if (!text.trim()) return [];

  // 3. Split on blank-line paragraph breaks. Two-or-more consecutive newlines
  //    collapse to a single break (no stacked empty <p>).
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  // 4. Per-paragraph inline parse, then emit <Text> elements.
  return paragraphs.map((para, i) => {
    const inlineNodes = parseInline(para);
    return createElement(
      Text,
      { key: `p${i}`, style: PARAGRAPH_TEXT_STYLE },
      ...inlineNodes.map(renderInline),
    );
  });
}

// Inline tokenizer: walk left-to-right, longest-match first.
// Order: escape -> link -> bold -> italic -> text.
function parseInline(input: string): InlineNode[] {
  const out: InlineNode[] = [];
  let i = 0;
  while (i < input.length) {
    // Escaped tokens: \X emits literal X (including \\ and \*).
    if (input[i] === "\\" && i + 1 < input.length) {
      out.push({ type: "text", text: input[i + 1] });
      i += 2;
      continue;
    }
    // Link: [label](url)
    const linkMatch = matchLink(input, i);
    if (linkMatch) {
      validateUrl(linkMatch.url);
      out.push({ type: "link", text: linkMatch.label, href: linkMatch.url });
      i += linkMatch.consumed;
      continue;
    }
    // Bold: **text**
    const boldMatch = matchPaired(input, i, "**");
    if (boldMatch) {
      out.push({ type: "bold", text: boldMatch.inner });
      i += boldMatch.consumed;
      continue;
    }
    // Italic: _text_
    const italicMatch = matchPaired(input, i, "_");
    if (italicMatch) {
      out.push({ type: "italic", text: italicMatch.inner });
      i += italicMatch.consumed;
      continue;
    }
    // Default: literal char.
    out.push({ type: "text", text: input[i] });
    i += 1;
  }
  return mergeAdjacentText(out);
}

function matchLink(input: string, i: number): { label: string; url: string; consumed: number } | null {
  if (input[i] !== "[") return null;
  const closeBracket = input.indexOf("]", i + 1);
  if (closeBracket === -1) return null;
  if (input[closeBracket + 1] !== "(") return null;
  const closeParen = input.indexOf(")", closeBracket + 2);
  if (closeParen === -1) return null;
  return {
    label: input.slice(i + 1, closeBracket),
    url: input.slice(closeBracket + 2, closeParen),
    consumed: closeParen - i + 1,
  };
}

function matchPaired(input: string, i: number, delim: string): { inner: string; consumed: number } | null {
  if (input.slice(i, i + delim.length) !== delim) return null;
  const close = input.indexOf(delim, i + delim.length);
  if (close === -1) return null;
  return {
    inner: input.slice(i + delim.length, close),
    consumed: close - i + delim.length,
  };
}

function validateUrl(url: string): void {
  if (!ALLOWED_SCHEME.test(url)) {
    throw new PersonalNoteParseError("INVALID_URL_SCHEME", { url });
  }
}

function mergeAdjacentText(nodes: InlineNode[]): InlineNode[] {
  const out: InlineNode[] = [];
  for (const n of nodes) {
    const last = out[out.length - 1];
    if (last && last.type === "text" && n.type === "text") {
      last.text += n.text;
    } else {
      out.push({ ...n });
    }
  }
  return out;
}

function renderInline(node: InlineNode, idx: number): ReactNode {
  switch (node.type) {
    case "text":
      return node.text;
    case "bold":
      return createElement(
        "strong",
        { key: idx, style: { fontWeight: 600, color: "#2C2926" } },
        node.text,
      );
    case "italic":
      return createElement("em", { key: idx }, node.text);
    case "link":
      return createElement(
        Link,
        { key: idx, href: node.href!, style: INLINE_LINK_STYLE },
        node.text,
      );
  }
}
