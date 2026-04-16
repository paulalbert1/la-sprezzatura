// @vitest-environment jsdom
// Phase 39 Plan 03 Task 2 — ContractorChipSendAction tests.
//
// Covers WORK-01 (paper-plane unsent vs RotateCcw + "Sent {date}" sent state).
// Source of truth:
//   .planning/phases/39-work-order-documents-panels/39-03-PLAN.md § Task 2
//   .planning/phases/39-work-order-documents-panels/39-UI-SPEC.md § Surface 1
//   .planning/phases/39-work-order-documents-panels/39-CONTEXT.md D-03

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import ToastContainer from "./ui/ToastContainer";
import ContractorChipSendAction from "./ContractorChipSendAction";

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

type Props = React.ComponentProps<typeof ContractorChipSendAction>;

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    projectId: "proj-1",
    project: {
      _id: "proj-1",
      title: "Gramercy",
      procurementItems: [
        { _key: "it-1", itemName: "Sconce", roomOrLocation: "Foyer" },
      ],
      projectAddress: { street: "1 Main", city: "Darien", state: "CT", zip: "06820" },
    },
    contractor: {
      _id: "c-1",
      _key: "pc-key-1",
      name: "Marco DeLuca",
      email: "marco@deluca.com",
      trades: ["Wallcovering"],
    },
    latestWorkOrder: null,
    ...overrides,
  };
}

function renderChip(overrides: Partial<Props> = {}) {
  const props = baseProps(overrides);
  return {
    ...render(
      <ToastContainer>
        <ContractorChipSendAction {...props} />
      </ToastContainer>,
    ),
    props,
  };
}

describe("ContractorChipSendAction — WORK-01 unsent state", () => {
  it('renders icon button with aria-label "Send work order to {name}" and no Sent link', () => {
    const { container } = renderChip({ latestWorkOrder: null });
    const btn = container.querySelector(
      '[data-testid="chip-action-pc-key-1"]',
    ) as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute("aria-label")).toBe(
      "Send work order to Marco DeLuca",
    );
    expect(container.querySelector('[data-testid="chip-sent-link-pc-key-1"]')).toBeNull();
  });
});

describe("ContractorChipSendAction — WORK-01 sent state", () => {
  it("renders Sent link with correct href + aria-label 'Resend ...'", () => {
    const { container } = renderChip({
      latestWorkOrder: { _id: "WO1", lastSentAt: "2026-04-12T15:14:00Z" },
    });
    const link = container.querySelector(
      '[data-testid="chip-sent-link-pc-key-1"]',
    ) as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe(
      "/admin/projects/proj-1/work-orders/WO1",
    );
    // Should say "Sent Apr 12" (or similar date format). We assert the date-ish text.
    expect(link!.textContent).toMatch(/Sent\s+Apr\s+12/);

    const btn = container.querySelector(
      '[data-testid="chip-action-pc-key-1"]',
    ) as HTMLButtonElement | null;
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute("aria-label")).toBe(
      "Resend work order to Marco DeLuca",
    );
  });
});

describe("ContractorChipSendAction — click opens modal", () => {
  it("clicking the icon button mounts the compose modal (special-instructions reachable)", () => {
    const { container } = renderChip({ latestWorkOrder: null });
    const btn = container.querySelector(
      '[data-testid="chip-action-pc-key-1"]',
    ) as HTMLButtonElement;
    fireEvent.click(btn);
    const ta = container.querySelector('[data-testid="special-instructions"]');
    expect(ta).not.toBeNull();
  });
});

describe("ContractorChipSendAction — Sent link stopPropagation", () => {
  it("clicking the Sent link does NOT propagate to a parent click listener", () => {
    const parentSpy = vi.fn();
    const { container } = render(
      <ToastContainer>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: test harness only */}
        <div data-testid="wrapper" onClick={parentSpy}>
          <ContractorChipSendAction
            {...baseProps({
              latestWorkOrder: { _id: "WO1", lastSentAt: "2026-04-12T15:14:00Z" },
            })}
          />
        </div>
      </ToastContainer>,
    );
    const link = container.querySelector(
      '[data-testid="chip-sent-link-pc-key-1"]',
    ) as HTMLAnchorElement;
    fireEvent.click(link);
    expect(parentSpy).not.toHaveBeenCalled();
  });
});

describe("ContractorChipSendAction — optimistic flip after submit", () => {
  it("after modal onSent fires, chip shows 'Sent today' link with new workOrderId href", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, workOrderId: "NEW-WO" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { container } = renderChip({ latestWorkOrder: null });
    fireEvent.click(
      container.querySelector(
        '[data-testid="chip-action-pc-key-1"]',
      ) as HTMLButtonElement,
    );
    // Modal is open — fill required field and submit.
    const ta = container.querySelector(
      '[data-testid="special-instructions"]',
    ) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "Access via service entrance." } });

    await act(async () => {
      fireEvent.click(
        container.querySelector(
          '[data-testid="submit-work-order"]',
        ) as HTMLButtonElement,
      );
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });

    const link = container.querySelector(
      '[data-testid="chip-sent-link-pc-key-1"]',
    ) as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe(
      "/admin/projects/proj-1/work-orders/NEW-WO",
    );
    expect(link!.textContent).toMatch(/Sent\s+today/);
  });
});
