// @vitest-environment jsdom
// Phase 35 Plan 02 — UpcomingDeliveriesCard tests
// Source of truth: .planning/phases/35-dashboard-polish-global-ux-cleanup/35-UI-SPEC.md
// Requirements: DASH-11..15; CONTEXT D-01..D-11

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import UpcomingDeliveriesCard from "./UpcomingDeliveriesCard";

afterEach(() => {
  cleanup();
});

type Row = {
  _id: string;
  name: string;
  clientName: string | null;
  projectTitle: string;
  projectId: string;
  expectedDeliveryDate: string | null;
  status: string;
  delivered: boolean;
  trackingNumber?: string;
  carrier?: "fedex" | "ups" | "usps" | string | null;
};

const baseRow = (over: Partial<Row> = {}): Row => ({
  _id: "r1",
  name: "Sofa",
  clientName: "Acme Client",
  projectTitle: "Darien Living Room",
  projectId: "p1",
  expectedDeliveryDate: "2026-05-02",
  status: "in-transit",
  delivered: false,
  ...over,
});

describe("UpcomingDeliveriesCard (Phase 35 Plan 02)", () => {
  it("renders card title 'Upcoming Deliveries'", () => {
    render(<UpcomingDeliveriesCard deliveries={[]} />);
    expect(screen.getByText("Upcoming Deliveries")).toBeTruthy();
  });

  it("with all undelivered items: renders all rows and no Show delivered link", () => {
    const rows: Row[] = [
      baseRow({ _id: "a", name: "Sofa", clientName: "Alice" }),
      baseRow({ _id: "b", name: "Rug", clientName: "Bob" }),
    ];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    expect(screen.getByText("Sofa")).toBeTruthy();
    expect(screen.getByText("Rug")).toBeTruthy();
    expect(screen.queryByText(/Show delivered/)).toBeNull();
  });

  it("with mixed delivered/undelivered: only undelivered render by default; Show delivered (N) link present", () => {
    const rows: Row[] = [
      baseRow({ _id: "u1", name: "Sofa", delivered: false }),
      baseRow({ _id: "d1", name: "DeliveredLamp", delivered: true }),
      baseRow({ _id: "d2", name: "DeliveredChair", delivered: true }),
    ];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    expect(screen.getByText("Sofa")).toBeTruthy();
    expect(screen.queryByText("DeliveredLamp")).toBeNull();
    expect(screen.queryByText("DeliveredChair")).toBeNull();
    expect(screen.getByText("Show delivered (2)")).toBeTruthy();
  });

  it("clicking Show delivered reveals delivered rows and swaps copy to Hide delivered", () => {
    const rows: Row[] = [
      baseRow({ _id: "u1", name: "Sofa", delivered: false }),
      baseRow({ _id: "d1", name: "DeliveredLamp", delivered: true }),
    ];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    fireEvent.click(screen.getByText("Show delivered (1)"));
    expect(screen.getByText("DeliveredLamp")).toBeTruthy();
    expect(screen.getByText("Hide delivered")).toBeTruthy();
    expect(screen.queryByText(/Show delivered/)).toBeNull();
  });

  it("typing in filter narrows rows by client name (case-insensitive)", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", name: "Sofa", clientName: "Alice Smith" }),
      baseRow({ _id: "2", name: "Rug", clientName: "Bob Jones" }),
    ];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    const input = screen.getByPlaceholderText("Filter deliveries…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "alice" } });
    expect(screen.getByText("Sofa")).toBeTruthy();
    expect(screen.queryByText("Rug")).toBeNull();
  });

  it("filter matches tracking number", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", name: "Sofa", trackingNumber: "1Z999AA10123456784" }),
      baseRow({ _id: "2", name: "Rug", trackingNumber: "X" }),
    ];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    const input = screen.getByPlaceholderText("Filter deliveries…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1Z999" } });
    expect(screen.getByText("Sofa")).toBeTruthy();
    expect(screen.queryByText("Rug")).toBeNull();
  });

  it("row with carrier=fedex renders ETA {MMM d} · FedEx", () => {
    const rows: Row[] = [
      baseRow({
        _id: "1",
        name: "Sofa",
        carrier: "fedex",
        expectedDeliveryDate: "2026-05-02",
      }),
    ];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    expect(screen.getByText(/ETA May 2.*FedEx/)).toBeTruthy();
  });

  it("row with carrier=null or unsupported carrier renders no ETA element", () => {
    const rows: Row[] = [
      baseRow({ _id: "1", name: "SofaA", carrier: null }),
      baseRow({ _id: "2", name: "SofaB", carrier: "dhl" }),
    ];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    expect(screen.queryByText(/ETA/)).toBeNull();
  });

  it("empty state: no undelivered + no filter → All caught up copy", () => {
    render(<UpcomingDeliveriesCard deliveries={[]} />);
    expect(screen.getByText("All caught up — no undelivered items.")).toBeTruthy();
  });

  it("empty state: filter with no matches → No deliveries match your filter", () => {
    const rows: Row[] = [baseRow({ _id: "1", name: "Sofa", clientName: "Alice" })];
    render(<UpcomingDeliveriesCard deliveries={rows} />);
    const input = screen.getByPlaceholderText("Filter deliveries…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "zzzz-nomatch" } });
    expect(screen.getByText("No deliveries match your filter.")).toBeTruthy();
  });

  it("row visual order: client name, then item, then project in the row's left block", () => {
    const rows: Row[] = [
      baseRow({
        _id: "1",
        name: "ItemX",
        clientName: "ClientX",
        projectTitle: "ProjectX",
      }),
    ];
    const { container } = render(<UpcomingDeliveriesCard deliveries={rows} />);
    // The row is an anchor; find it and check text node order.
    const row = container.querySelector("a[href*='/admin/projects/']") as HTMLElement;
    expect(row).toBeTruthy();
    const leftBlock = within(row).getByText("ClientX").parentElement as HTMLElement;
    const textNodes = Array.from(leftBlock.querySelectorAll("span")).map(
      (s) => s.textContent?.trim() ?? "",
    );
    const clientIdx = textNodes.indexOf("ClientX");
    const itemIdx = textNodes.indexOf("ItemX");
    const projIdx = textNodes.indexOf("ProjectX");
    expect(clientIdx).toBeGreaterThanOrEqual(0);
    expect(itemIdx).toBeGreaterThan(clientIdx);
    expect(projIdx).toBeGreaterThan(itemIdx);
  });
});
