// @vitest-environment jsdom
// src/components/admin/ProcurementEditor.test.tsx
// Phase 37 Plan 01 -- Wave 0 RED baseline
//
// Requirements covered:
//   PROC-10 (row-click opens modal, interactive elements stopPropagation)
//   PROC-12 (no COST / NET columns)
//   PROC-13 (column header reads EXPECTED INSTALL)
// Decision IDs validated: D-05, D-06.
//
// Strategy: render ProcurementEditor with a single-item fixture and assert
// row-level click behavior + column header copy. Tests reference the
// post-Phase-37 contract and will FAIL today because:
//   - current editor is inline-edit, not modal-based
//   - current column headers say COST / NET, not EXPECTED INSTALL
//   - current row does not dispatch an "open modal" handler
//
// Plan 03 makes these tests GREEN.

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ProcurementEditor from "./ProcurementEditor";

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

// Minimal fixture project with a single procurement item. The exact prop
// shape of ProcurementEditor is currently (items, projectId). Post-Phase-37
// the component will also accept an onOpenModal callback prop (or dispatch a
// custom event) -- tests below use a callback prop intercepted by a spy.

function makeFixtureItem(overrides: Record<string, unknown> = {}) {
  return {
    _key: "item-parlour-sofa",
    name: "Parlour sofa",
    status: "ordered",
    orderDate: "2026-03-01",
    expectedDeliveryDate: "2026-04-30",
    installDate: null,
    trackingNumber: "1Z999AA10123456784",
    vendor: "Restoration Hardware",
    manufacturer: null,
    qty: 1,
    notes: null,
    carrierETA: null,
    carrierName: "UPS",
    trackingUrl: "https://wwwapps.ups.com/tracking/tracking.cgi?tracknum=1Z999",
    lastSyncAt: null,
    syncSource: null,
    retrievedStatus: null,
    images: [],
    ...overrides,
  };
}

type OpenModalSpy = ReturnType<typeof vi.fn>;

function renderEditor(onOpenModal: OpenModalSpy) {
  const items = [makeFixtureItem()];
  // Cast to any so compilation passes before Plan 03 widens the prop type.
  // Intent is expressed in the spy call assertions.
  return render(
    // biome-ignore lint/suspicious/noExplicitAny: pre-refactor prop surface
    <ProcurementEditor
      {...({ items, projectId: "proj-test", onOpenModal } as any)}
    />,
  );
}

describe("ProcurementEditor -- row click opens modal (PROC-10, D-05)", () => {
  it("PROC-10: clicking a non-interactive area of the row calls onOpenModal with the item _key", () => {
    const onOpenModal = vi.fn();
    renderEditor(onOpenModal);

    // Find the row by name cell. The row is the closest tr/container element.
    const nameCell = screen.getByText("Parlour sofa");
    const row =
      nameCell.closest("[data-procurement-row]") ??
      nameCell.closest("tr") ??
      nameCell.parentElement;
    expect(row).toBeTruthy();
    fireEvent.click(row as HTMLElement);

    expect(
      onOpenModal,
      "clicking row body must dispatch onOpenModal with the item key (PROC-10)",
    ).toHaveBeenCalledWith(
      expect.objectContaining({ _key: "item-parlour-sofa" }),
    );
  });

  it("PROC-10 / D-05: clicking the status badge button does NOT fire onOpenModal", () => {
    const onOpenModal = vi.fn();
    renderEditor(onOpenModal);

    // Status badge is the status text/button on the row. It might render as
    // a button or a span with click handler -- either way, it is labeled with
    // the status text "Ordered".
    const badge =
      screen.queryByRole("button", { name: /ordered/i }) ??
      screen.getByText(/ordered/i);
    fireEvent.click(badge);

    expect(
      onOpenModal,
      "status badge click must stopPropagation (D-05)",
    ).not.toHaveBeenCalled();
  });

  it("PROC-10 / D-05: clicking the tracking link does NOT fire onOpenModal", () => {
    const onOpenModal = vi.fn();
    renderEditor(onOpenModal);

    const trackingLink = screen.getByRole("link", {
      name: /1Z999AA10123456784|track/i,
    });
    fireEvent.click(trackingLink);

    expect(
      onOpenModal,
      "tracking link click must stopPropagation (D-05)",
    ).not.toHaveBeenCalled();
  });

  it("PROC-10 / D-05: clicking the refresh sync icon does NOT fire onOpenModal", () => {
    const onOpenModal = vi.fn();
    renderEditor(onOpenModal);

    const refresh = screen.getByRole("button", { name: /refresh|sync/i });
    fireEvent.click(refresh);

    expect(
      onOpenModal,
      "refresh/sync icon click must stopPropagation (D-05)",
    ).not.toHaveBeenCalled();
  });

  it("PROC-10 / D-05: clicking the delete trash icon does NOT fire onOpenModal", () => {
    const onOpenModal = vi.fn();
    renderEditor(onOpenModal);

    const deleteBtn = screen.getByRole("button", { name: /delete|remove|trash/i });
    fireEvent.click(deleteBtn);

    expect(
      onOpenModal,
      "delete trash icon click must stopPropagation (D-05)",
    ).not.toHaveBeenCalled();
  });

  it("PROC-13 / PROC-12: column header row shows 'EXPECTED INSTALL' and NOT 'COST' or 'NET'", () => {
    const onOpenModal = vi.fn();
    renderEditor(onOpenModal);

    // Column header row content -- use exact text match (case sensitive per plan).
    expect(
      screen.getByText("EXPECTED INSTALL"),
      "PROC-13: column header must read EXPECTED INSTALL",
    ).toBeInTheDocument();

    expect(
      screen.queryByText("COST"),
      "PROC-12: COST column must be removed",
    ).toBeNull();
    expect(
      screen.queryByText("NET"),
      "PROC-12: NET column must be removed",
    ).toBeNull();
  });

  it("D-06: clicking '+ Add item' dispatches onOpenModal in create mode", () => {
    const onOpenModal = vi.fn();
    renderEditor(onOpenModal);

    const addBtn = screen.getByRole("button", { name: /add item/i });
    fireEvent.click(addBtn);

    expect(
      onOpenModal,
      "+ Add item must dispatch onOpenModal with mode: 'create' (D-06)",
    ).toHaveBeenCalledWith(expect.objectContaining({ mode: "create" }));
  });
});
