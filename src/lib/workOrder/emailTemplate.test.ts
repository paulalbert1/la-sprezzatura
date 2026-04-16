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
