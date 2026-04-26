// Phase 39 Plan 04 Task 1 — Work Order email template tests.
//
// Verifies the static-output contract of buildWorkOrderEmail and
// buildWorkOrderPlainText. No external mocks needed — pure functions.

import { describe, it, expect } from "vitest";
import {
  buildWorkOrderEmail,
  buildWorkOrderPlainText,
  type WorkOrderEmailInput,
} from "./emailTemplate";

function baseInput(overrides: Partial<WorkOrderEmailInput> = {}): WorkOrderEmailInput {
  return {
    project: { _id: "P1", title: "Acme Home" },
    contractor: { _id: "C1", name: "Marco DeLuca", email: "marco@deluca.com" },
    workOrderId: "WO1",
    baseUrl: "https://example.com",
    fromDisplayName: "Liz Albert",
    ...overrides,
  };
}

describe("buildWorkOrderEmail", () => {
  it("contains the H1 copy 'Work order ready for review'", () => {
    const html = buildWorkOrderEmail(baseInput());
    expect(html).toContain("Work order ready for review");
  });

  it("contains the CTA href '/workorder/project/P1/orders/WO1' under the supplied baseUrl", () => {
    const html = buildWorkOrderEmail(baseInput());
    expect(html).toContain(
      "https://example.com/workorder/project/P1/orders/WO1",
    );
  });

  it("escapes HTML in interpolated user values (project.title)", () => {
    const html = buildWorkOrderEmail(
      baseInput({ project: { _id: "P1", title: "<script>alert(1)</script>" } }),
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("greets the contractor by first name only", () => {
    const html = buildWorkOrderEmail(baseInput());
    expect(html).toContain("Marco,");
    expect(html).not.toContain("Marco DeLuca,");
  });

  it("renders the uppercase 'VIEW WORK ORDER' CTA label", () => {
    const html = buildWorkOrderEmail(baseInput());
    expect(html).toContain("VIEW WORK ORDER");
  });

  it("does NOT render an item table or per-item rendering markers", () => {
    const html = buildWorkOrderEmail(baseInput());
    expect(html).not.toContain("procurementItems");
    // No table rows with item-level markers (the template only uses outer wrapper tables)
    expect(html).not.toMatch(/Item\s*<\/td>/i);
  });

  // ---------------------------------------------------------------------------
  // Phase 45 Plan 05 — EMAIL-09 regression baseline snapshots.
  //
  // Captured BEFORE Phase 46 migrates buildWorkOrderEmail to react-email so the
  // Phase-39 string-builder output is frozen as the regression baseline. The
  // canonical baseInput() snap is the primary baseline; the HTML-escaped title
  // permutation exercises the escapeHtml() code path with a different fixture
  // so a regression in escape handling fails this snap (not just the toContain
  // checks above).
  // ---------------------------------------------------------------------------

  it("snapshot: legacy buildWorkOrderEmail output for the canonical baseInput", () => {
    const html = buildWorkOrderEmail(baseInput());
    expect(html).toMatchSnapshot();
  });

  it("snapshot: legacy buildWorkOrderEmail output with HTML-escaped project title", () => {
    const html = buildWorkOrderEmail(
      baseInput({ project: { _id: "P1", title: "<script>alert(1)</script>" } }),
    );
    expect(html).toMatchSnapshot();
  });
});

describe("buildWorkOrderPlainText", () => {
  it("contains project title, CTA URL, and 'La Sprezzatura' brand line", () => {
    const text = buildWorkOrderPlainText(baseInput());
    expect(text).toContain("Acme Home");
    expect(text).toContain(
      "https://example.com/workorder/project/P1/orders/WO1",
    );
    expect(text).toContain("La Sprezzatura");
  });
});
