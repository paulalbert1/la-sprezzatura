// @vitest-environment jsdom
// src/components/admin/QuickAssignTypeahead.test.tsx
// Phase 35 Plan 04 Task 1 — Single-trade bypass (DASH-18 / D-13).
// Source of truth:
//   .planning/phases/35-dashboard-polish-global-ux-cleanup/35-CONTEXT.md D-13
//   .planning/phases/35-dashboard-polish-global-ux-cleanup/35-UI-SPEC.md
//     § "Quick-assign single trade" and "Quick-assign multi trade" rows

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import QuickAssignTypeahead from "./QuickAssignTypeahead";

afterEach(() => {
  cleanup();
});

type FetchMock = ReturnType<typeof vi.fn>;

function mockSearchResponse(
  contractors: Array<{
    _id: string;
    name: string;
    email?: string;
    trades?: string[];
  }> = [],
  clients: Array<{ _id: string; name: string; email?: string }> = [],
): FetchMock {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/api/admin/search")) {
      return {
        ok: true,
        json: async () => ({ clients, contractors }),
      } as Response;
    }
    if (url.includes("/api/admin/contractors")) {
      return { ok: true, json: async () => ({ ok: true }) } as Response;
    }
    if (url.includes("/api/admin/clients")) {
      return { ok: true, json: async () => ({ ok: true }) } as Response;
    }
    return { ok: true, json: async () => ({}) } as Response;
  });
  (
    globalThis as unknown as { fetch: FetchMock }
  ).fetch = fetchMock;
  return fetchMock;
}

async function typeAndWaitForResult(query: string, name: string) {
  const input = screen.getByPlaceholderText(
    "Assign a client or contractor...",
  );
  fireEvent.change(input, { target: { value: query } });
  // debounce is 250ms
  await act(async () => {
    await new Promise((r) => setTimeout(r, 300));
  });
  return screen.findByText(name);
}

beforeEach(() => {
  vi.restoreAllMocks();
  (globalThis as unknown as { fetch: FetchMock }).fetch = vi.fn();
});

describe("QuickAssignTypeahead — single-trade bypass (DASH-18)", () => {
  it("contractor with exactly 1 trade: assigns immediately, does NOT render the trade picker", async () => {
    const fetchMock = mockSearchResponse([
      {
        _id: "c-solo",
        name: "Solo Trade Co",
        email: "solo@example.com",
        trades: ["electrical-rough-in"],
      },
    ]);
    render(
      <QuickAssignTypeahead
        projectId="p-1"
        existingClients={[]}
        existingContractors={[]}
      />,
    );
    const resultRow = await typeAndWaitForResult("solo", "Solo Trade Co");
    fireEvent.click(resultRow);

    // Trade picker must NOT render
    await waitFor(() => {
      expect(screen.queryByText(/Assign for which trade/i)).toBeNull();
    });

    // POST /api/admin/contractors fires exactly once with the single trade
    await waitFor(() => {
      const calls = fetchMock.mock.calls.filter((args: unknown[]) => {
        const url = typeof args[0] === "string" ? args[0] : String(args[0]);
        return url.includes("/api/admin/contractors");
      });
      expect(calls.length).toBe(1);
      const body = JSON.parse((calls[0][1] as RequestInit).body as string);
      expect(body).toMatchObject({
        action: "assign-to-project",
        projectId: "p-1",
        contractorId: "c-solo",
        trade: "electrical-rough-in",
      });
    });
  });

  it("contractor with exactly 1 trade: success confirmation uses formatted trade label", async () => {
    mockSearchResponse([
      {
        _id: "c-solo",
        name: "Solo Trade Co",
        trades: ["electrical-rough-in"],
      },
    ]);
    render(
      <QuickAssignTypeahead
        projectId="p-1"
        existingClients={[]}
        existingContractors={[]}
      />,
    );
    const resultRow = await typeAndWaitForResult("solo", "Solo Trade Co");
    fireEvent.click(resultRow);

    // Confirmation copy uses formatTrade output (sentence-case)
    await screen.findByText(
      /Assigned Solo Trade Co as Electrical rough-in\.?/,
    );
  });

  it("contractor with 2+ trades: renders the trade picker (no bypass)", async () => {
    mockSearchResponse([
      {
        _id: "c-multi",
        name: "Multi Trade Co",
        trades: ["electrical-rough-in", "hvac"],
      },
    ]);
    render(
      <QuickAssignTypeahead
        projectId="p-1"
        existingClients={[]}
        existingContractors={[]}
      />,
    );
    const resultRow = await typeAndWaitForResult("multi", "Multi Trade Co");
    fireEvent.click(resultRow);

    // Trade picker appears
    await screen.findByText(/Assign for which trade/i);
    // Both trade options rendered (formatted)
    expect(
      screen.getByRole("button", { name: /Electrical rough-in/ }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /HVAC|Hvac/ })).toBeTruthy();
  });

  it("contractor with 0 trades: falls back to 'No trades listed'", async () => {
    mockSearchResponse([
      {
        _id: "c-none",
        name: "No Trades Co",
        trades: [],
      },
    ]);
    render(
      <QuickAssignTypeahead
        projectId="p-1"
        existingClients={[]}
        existingContractors={[]}
      />,
    );
    const resultRow = await typeAndWaitForResult("none", "No Trades Co");
    fireEvent.click(resultRow);

    await screen.findByText(/No trades listed/i);
  });

  it("non-contractor entity (client): unaffected by single-trade bypass logic", async () => {
    const fetchMock = mockSearchResponse(
      [],
      [{ _id: "cli-1", name: "Alice Client", email: "alice@example.com" }],
    );
    render(
      <QuickAssignTypeahead
        projectId="p-1"
        existingClients={[]}
        existingContractors={[]}
      />,
    );
    const resultRow = await typeAndWaitForResult("alice", "Alice Client");
    fireEvent.click(resultRow);

    // Client endpoint called, not contractor endpoint
    await waitFor(() => {
      const clientCalls = fetchMock.mock.calls.filter((args: unknown[]) => {
        const url = typeof args[0] === "string" ? args[0] : String(args[0]);
        return url.includes("/api/admin/clients");
      });
      expect(clientCalls.length).toBe(1);
    });

    const contractorCalls = fetchMock.mock.calls.filter((args: unknown[]) => {
      const url = typeof args[0] === "string" ? args[0] : String(args[0]);
      return url.includes("/api/admin/contractors");
    });
    expect(contractorCalls.length).toBe(0);

    // Trade picker never rendered
    expect(screen.queryByText(/Assign for which trade/i)).toBeNull();
  });
});
