// @vitest-environment jsdom
// Phase 39 Plan 04 Task 3 — WorkOrderView tests.
//
// Verifies mode-switched render (admin vs portal), missing-item fallback,
// customField preset ordering, lastSentAt formatting, XSS escaping.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import WorkOrderView from "./WorkOrderView";

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

type Props = React.ComponentProps<typeof WorkOrderView>;

function makeWorkOrder(
  overrides: Partial<Props["workOrder"]> = {},
): Props["workOrder"] {
  return {
    _id: "WO-1",
    project: {
      _id: "P1",
      title: "Acme Home",
      procurementItems: [
        { _key: "it-1", itemName: "Sconce", roomOrLocation: "Foyer", quantity: 2, unit: "ea" },
        { _key: "it-2", itemName: "Wallpaper", roomOrLocation: "Hall" },
      ],
    },
    contractor: {
      _id: "C1",
      name: "Marco DeLuca",
      email: "marco@deluca.com",
    },
    selectedItemKeys: ["it-1"],
    specialInstructions: "Access via the service entrance.",
    customFields: [
      { key: "Notes", value: "ad-hoc note", preset: false },
      { key: "Due date", value: "2026-05-01", preset: true },
    ],
    lastSentAt: null,
    ...overrides,
  };
}

describe("WorkOrderView — mode admin vs portal", () => {
  it("renders Edit / Delete / Send again buttons in admin mode", () => {
    const { container } = render(
      <WorkOrderView workOrder={makeWorkOrder()} mode="admin" />,
    );
    const buttonText = container.textContent ?? "";
    expect(buttonText).toContain("Edit");
    expect(buttonText).toContain("Delete");
    expect(buttonText).toContain("Send again");
    expect(container.querySelector('a[href="/workorder/dashboard"]')).toBeNull();
  });

  it("renders 'Back to all work orders' link in portal mode and no admin actions", () => {
    const { container } = render(
      <WorkOrderView workOrder={makeWorkOrder()} mode="portal" />,
    );
    const text = container.textContent ?? "";
    expect(text).not.toContain("Send again");
    expect(text).not.toContain("Delete");
    const back = container.querySelector('a[href="/workorder/dashboard"]');
    expect(back).not.toBeNull();
    expect(back!.textContent).toContain("Back to all work orders");
  });
});

describe("WorkOrderView — items resolution", () => {
  it("renders 'Item removed from project' when selectedItemKey not in procurementItems", () => {
    const wo = makeWorkOrder({
      selectedItemKeys: ["missing-key", "it-1"],
    });
    const { container } = render(<WorkOrderView workOrder={wo} mode="admin" />);
    expect(container.textContent).toContain("Item removed from project");
    expect(container.textContent).toContain("Sconce");
  });
});

describe("WorkOrderView — customFields preset ordering", () => {
  it("renders preset=true entries before preset=false entries", () => {
    const wo = makeWorkOrder({
      customFields: [
        { key: "Adhoc-A", value: "a", preset: false },
        { key: "Preset-X", value: "x", preset: true },
        { key: "Adhoc-B", value: "b", preset: false },
        { key: "Preset-Y", value: "y", preset: true },
      ],
    });
    const { container } = render(<WorkOrderView workOrder={wo} mode="admin" />);
    const text = container.textContent ?? "";
    const idxPresetX = text.indexOf("Preset-X");
    const idxPresetY = text.indexOf("Preset-Y");
    const idxAdhocA = text.indexOf("Adhoc-A");
    const idxAdhocB = text.indexOf("Adhoc-B");
    expect(idxPresetX).toBeGreaterThan(-1);
    expect(idxAdhocA).toBeGreaterThan(idxPresetX);
    expect(idxAdhocA).toBeGreaterThan(idxPresetY);
    expect(idxAdhocB).toBeGreaterThan(idxPresetY);
  });
});

describe("WorkOrderView — sent indicator", () => {
  it("renders 'Not yet sent' when lastSentAt is null", () => {
    const { container } = render(
      <WorkOrderView workOrder={makeWorkOrder({ lastSentAt: null })} mode="admin" />,
    );
    expect(container.textContent).toContain("Not yet sent");
  });

  it("renders 'Sent Apr 12' when lastSentAt is 2026-04-12", () => {
    const { container } = render(
      <WorkOrderView
        workOrder={makeWorkOrder({ lastSentAt: "2026-04-12T15:14:00Z" })}
        mode="admin"
      />,
    );
    expect(container.textContent).toMatch(/Sent\s+Apr\s+12/);
  });
});

describe("WorkOrderView — XSS protection", () => {
  it("renders specialInstructions as text (no raw <script>)", () => {
    const { container } = render(
      <WorkOrderView
        workOrder={makeWorkOrder({
          specialInstructions: "<script>alert('x')</script>",
        })}
        mode="portal"
      />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>alert('x')</script>");
  });
});
