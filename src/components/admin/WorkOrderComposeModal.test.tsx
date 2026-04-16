// @vitest-environment jsdom
// Phase 39 Plan 03 Task 1 — WorkOrderComposeModal tests.
//
// Covers WORK-02 (item checkboxes), WORK-03 (custom fields + preset toggles),
// WORK-04 (submit gate). Mirrors ProcurementItemModal.test.tsx scaffold —
// inline-render `container.querySelectorAll` convention.

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import ToastContainer from "./ui/ToastContainer";
import WorkOrderComposeModal from "./WorkOrderComposeModal";

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

type Project = React.ComponentProps<typeof WorkOrderComposeModal>["project"];
type Contractor = React.ComponentProps<typeof WorkOrderComposeModal>["contractor"];

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    _id: "proj-1",
    title: "Gramercy Park Apartment",
    procurementItems: [
      { _key: "it-1", itemName: "Fromental wallpaper", roomOrLocation: "Living room", orderStatus: "Ordered" },
      { _key: "it-2", itemName: "Kravet fabric", roomOrLocation: "Sofa", orderStatus: "Pending" },
      { _key: "it-3", itemName: "RH sconce", roomOrLocation: "Foyer" },
    ],
    projectAddress: { street: "10 Park", city: "Darien", state: "CT", zip: "06820" },
    ...overrides,
  };
}

function makeContractor(overrides: Partial<Contractor> = {}): Contractor {
  return {
    _id: "c-1",
    name: "Marco DeLuca",
    email: "marco@deluca.com",
    trades: ["Wallcovering", "Paint"],
    ...overrides,
  };
}

function renderModal(
  overrides: Partial<React.ComponentProps<typeof WorkOrderComposeModal>> = {},
) {
  const onClose = overrides.onClose ?? vi.fn();
  const onSent = overrides.onSent ?? vi.fn();
  const props: React.ComponentProps<typeof WorkOrderComposeModal> = {
    open: true,
    projectId: "proj-1",
    project: makeProject(),
    contractor: makeContractor(),
    onClose,
    onSent,
    ...overrides,
  };
  const utils = render(
    <ToastContainer>
      <WorkOrderComposeModal {...props} />
    </ToastContainer>,
  );
  return { ...utils, props, onClose, onSent };
}

describe("WorkOrderComposeModal — render gate", () => {
  it("renders nothing when open={false}", () => {
    const { container } = renderModal({ open: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("WorkOrderComposeModal — WORK-02 (item checkboxes)", () => {
  it("renders exactly one checkbox per procurementItems entry and toggles only the clicked row", () => {
    const { container } = renderModal();
    const boxes = container.querySelectorAll<HTMLInputElement>(
      'input[data-testid^="item-checkbox-"]',
    );
    expect(boxes.length).toBe(3);

    const second = container.querySelector<HTMLInputElement>(
      'input[data-testid="item-checkbox-it-2"]',
    );
    expect(second).not.toBeNull();
    expect(second!.checked).toBe(false);
    fireEvent.click(second!);
    expect(second!.checked).toBe(true);

    const first = container.querySelector<HTMLInputElement>(
      'input[data-testid="item-checkbox-it-1"]',
    );
    expect(first!.checked).toBe(false);
  });

  it('renders subtitle "To {name} · {email}" verbatim', () => {
    const { container } = renderModal();
    expect(container.textContent).toContain("To Marco DeLuca · marco@deluca.com");
  });
});

describe("WorkOrderComposeModal — WORK-03 (custom fields + preset toggles)", () => {
  it('appends + removes custom-field rows via "+ Add custom field"', () => {
    const { container } = renderModal();
    const addBtn = container.querySelector<HTMLButtonElement>(
      '[data-testid="add-custom-field"]',
    );
    expect(addBtn).not.toBeNull();

    fireEvent.click(addBtn!);
    expect(container.querySelector('[data-testid="custom-key-0"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="custom-value-0"]')).not.toBeNull();

    const remove = container.querySelector<HTMLButtonElement>(
      '[data-testid="custom-remove-0"]',
    );
    expect(remove).not.toBeNull();
    fireEvent.click(remove!);
    expect(container.querySelector('[data-testid="custom-key-0"]')).toBeNull();
  });

  it("renders all 5 preset toggles; toggling deliveryAddress reveals input pre-filled from projectAddress", () => {
    const { container } = renderModal();
    const presetKeys = [
      "dueDate",
      "poNumber",
      "deliveryAddress",
      "contractorTrade",
      "signoffContact",
    ];
    for (const key of presetKeys) {
      expect(
        container.querySelector(`[data-testid="preset-toggle-${key}"]`),
        `preset toggle ${key} must exist`,
      ).not.toBeNull();
    }

    const toggle = container.querySelector<HTMLButtonElement>(
      '[data-testid="preset-toggle-deliveryAddress"]',
    );
    fireEvent.click(toggle!);

    // Reveal input should now exist below with the composed address.
    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('input[type="text"], input[type="date"]'),
    );
    const addressInput = inputs.find((el) => el.value === "10 Park, Darien, CT, 06820");
    expect(addressInput, "delivery address input with composed value").toBeDefined();
  });

  it("Pitfall 8: contractor-trade preset fills from contractor.trades[0] and input is readOnly", () => {
    const { container } = renderModal({
      contractor: makeContractor({ trades: ["Wallcovering", "Paint"] }),
    });
    fireEvent.click(
      container.querySelector<HTMLButtonElement>(
        '[data-testid="preset-toggle-contractorTrade"]',
      )!,
    );
    const tradeInput = Array.from(
      container.querySelectorAll<HTMLInputElement>("input"),
    ).find((i) => i.value === "Wallcovering");
    expect(tradeInput, "trade input with trades[0] as value").toBeDefined();
    expect(tradeInput!.hasAttribute("readonly") || tradeInput!.readOnly).toBe(true);
  });
});

describe("WorkOrderComposeModal — WORK-04 (submit gate)", () => {
  it("submit disabled when specialInstructions empty; enabled after typing", () => {
    const { container } = renderModal();
    const submit = container.querySelector<HTMLButtonElement>(
      '[data-testid="submit-work-order"]',
    );
    expect(submit).not.toBeNull();
    expect(submit!.hasAttribute("disabled")).toBe(true);

    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="special-instructions"]',
    );
    expect(ta).not.toBeNull();
    fireEvent.change(ta!, { target: { value: "Access via the service entrance." } });
    expect(submit!.hasAttribute("disabled")).toBe(false);
  });
});

describe("WorkOrderComposeModal — submit flow", () => {
  it("POSTs /api/admin/work-orders + chains POST /[id]/send and fires onSent + onClose on success", async () => {
    // Phase 39 Plan 04 Task 4 — modal now chains a second POST to /[id]/send
    // when sendAfter=true (default). This test asserts the create body shape
    // on call[0] and the send URL on call[1].
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, workOrderId: "WO-X" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSent = vi.fn();
    const onClose = vi.fn();
    const { container } = renderModal({ onSent, onClose });

    // Tick an item checkbox
    fireEvent.click(
      container.querySelector<HTMLInputElement>(
        '[data-testid="item-checkbox-it-1"]',
      )!,
    );

    // Type special instructions
    const ta = container.querySelector<HTMLTextAreaElement>(
      '[data-testid="special-instructions"]',
    )!;
    fireEvent.change(ta, { target: { value: "Please confirm." } });

    // Submit
    await act(async () => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>(
          '[data-testid="submit-work-order"]',
        )!,
      );
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });

    // Two fetch calls: create then send.
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // call[0] — create
    const [createUrl, createInit] = fetchMock.mock.calls[0];
    expect(createUrl).toBe("/api/admin/work-orders");
    expect(createInit.method).toBe("POST");
    const body = JSON.parse(createInit.body);
    expect(body.contractorId).toBe("c-1");
    expect(body.projectId).toBe("proj-1");
    expect(body.selectedItemKeys).toEqual(["it-1"]);
    expect(body.specialInstructions).toBe("Please confirm.");
    expect(Array.isArray(body.customFields)).toBe(true);

    // call[1] — send
    const [sendUrl, sendInit] = fetchMock.mock.calls[1];
    expect(sendUrl).toBe("/api/admin/work-orders/WO-X/send");
    expect(sendInit.method).toBe("POST");

    expect(onSent).toHaveBeenCalledWith({ workOrderId: "WO-X" });
    expect(onClose).toHaveBeenCalled();
  });

  it("when sendAfter=false, only POSTs the create endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, workOrderId: "WO-Y" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSent = vi.fn();
    const { container } = renderModal({ onSent, sendAfter: false });

    fireEvent.change(
      container.querySelector<HTMLTextAreaElement>(
        '[data-testid="special-instructions"]',
      )!,
      { target: { value: "Save only." } },
    );
    await act(async () => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>(
          '[data-testid="submit-work-order"]',
        )!,
      );
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/work-orders");
    expect(onSent).toHaveBeenCalledWith({ workOrderId: "WO-Y" });
  });

  it("surfaces inline error and skips onSent when the chained send fails", async () => {
    // First call (create) succeeds; second call (send) returns ok:false.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, workOrderId: "WO-Z" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Email send failed" }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSent = vi.fn();
    const { container } = renderModal({ onSent });
    fireEvent.change(
      container.querySelector<HTMLTextAreaElement>(
        '[data-testid="special-instructions"]',
      )!,
      { target: { value: "X" } },
    );
    await act(async () => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>(
          '[data-testid="submit-work-order"]',
        )!,
      );
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Email send failed");
    expect(onSent).not.toHaveBeenCalled();
  });

  it("surfaces inline error on non-ok response and does not fire onSent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Boom" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const onSent = vi.fn();
    const { container } = renderModal({ onSent });
    fireEvent.change(
      container.querySelector<HTMLTextAreaElement>(
        '[data-testid="special-instructions"]',
      )!,
      { target: { value: "X" } },
    );
    await act(async () => {
      fireEvent.click(
        container.querySelector<HTMLButtonElement>(
          '[data-testid="submit-work-order"]',
        )!,
      );
      await new Promise((r) => setTimeout(r, 0));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(container.textContent).toContain("Boom");
    expect(onSent).not.toHaveBeenCalled();
  });
});
