// @vitest-environment jsdom
// src/components/admin/RegenerateLinkDialog.test.tsx
// Phase 34 Plan 05 Task 2 — RegenerateLinkDialog tests.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md
// § "3. Per-client PURL regenerate control"

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import ToastContainer from "./ui/ToastContainer";
import RegenerateLinkDialog from "./RegenerateLinkDialog";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

// Provide a working clipboard.writeText mock that resolves immediately.
// Tests that need to assert on it should spy via navigator.clipboard.writeText.
beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    configurable: true,
  });
  // Reset fetch between tests.
  (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch = vi.fn();
});

function renderDialog(
  overrides: {
    open?: boolean;
    onClose?: () => void;
    clientName?: string;
    clientId?: string;
    baseUrl?: string;
  } = {},
) {
  const onClose = overrides.onClose ?? vi.fn();
  const utils = render(
    <ToastContainer>
      <RegenerateLinkDialog
        open={overrides.open ?? true}
        onClose={onClose}
        client={{
          _id: overrides.clientId ?? "client-abc",
          name: overrides.clientName ?? "Sarah Kimball",
        }}
        baseUrl={overrides.baseUrl ?? "https://lasprezz.com"}
      />
    </ToastContainer>,
  );
  return { ...utils, onClose };
}

function mockFetchSuccess(token: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, portalToken: token }),
  });
  (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
  return fetchMock;
}

function mockFetchError() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: async () => ({ error: "boom" }),
  });
  (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
  return fetchMock;
}

describe("RegenerateLinkDialog (Phase 34 Plan 05)", () => {
  it("renders title 'Regenerate personal link for {clientName}?'", () => {
    renderDialog({ clientName: "Sarah Kimball" });
    expect(
      screen.getByText("Regenerate personal link for Sarah Kimball?"),
    ).toBeInTheDocument();
  });

  it("body contains 'invalidates the current link across ALL this client's projects'", () => {
    renderDialog();
    // The paragraph is a single node so a substring match is sufficient.
    const bodyText =
      document.querySelector("[data-admin-modal-card]")?.textContent || "";
    expect(bodyText).toContain(
      "invalidates the current link across ALL this client's projects",
    );
  });

  it("cancel button dismisses dialog without API call", () => {
    const fetchMock = vi.fn();
    (globalThis as unknown as { fetch: typeof fetchMock }).fetch = fetchMock;
    const { onClose } = renderDialog();

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("confirm button posts { action: 'regenerate-portal-token', clientId } to /api/admin/clients", async () => {
    const fetchMock = mockFetchSuccess("NEWTOK01");
    renderDialog({ clientId: "client-xyz" });

    const confirmBtn = screen.getByRole("button", { name: /Regenerate link/ });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/clients");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      action: "regenerate-portal-token",
      clientId: "client-xyz",
    });
  });

  it("success response triggers toast with full URL and Copy link button", async () => {
    mockFetchSuccess("TOKABC12");
    const { onClose } = renderDialog({
      clientName: "Sarah Kimball",
      baseUrl: "https://lasprezz.com",
    });

    const confirmBtn = screen.getByRole("button", { name: /Regenerate link/ });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Toast provider renders the success payload.
    await waitFor(() => {
      expect(
        screen.getByText("New link generated for Sarah Kimball"),
      ).toBeInTheDocument();
    });

    // Full URL is present in the toast body.
    expect(
      screen.getByText("https://lasprezz.com/portal/client/TOKABC12"),
    ).toBeInTheDocument();

    // Copy link button rendered inside the toast.
    expect(screen.getByRole("button", { name: /Copy link/ })).toBeInTheDocument();

    // Dialog has also been asked to close (success path).
    expect(onClose).toHaveBeenCalled();
  });

  it("Copy link click flips button label to 'Copied ✓' for 1.5s", async () => {
    vi.useFakeTimers();
    try {
      mockFetchSuccess("CLIPTEST");
      renderDialog({ baseUrl: "https://lasprezz.com" });

      const confirmBtn = screen.getByRole("button", {
        name: /Regenerate link/,
      });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      // Drain the awaited fetch+setState chain so the toast renders.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      const copyBtn = screen.getByRole("button", { name: /Copy link/ });
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      // Drain the awaited clipboard.writeText resolution.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        "https://lasprezz.com/portal/client/CLIPTEST",
      );
      expect(
        screen.getByRole("button", { name: /Copied ✓/ }),
      ).toBeInTheDocument();

      // After 1.5s the label reverts.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });

      expect(
        screen.getByRole("button", { name: /Copy link/ }),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("error response keeps dialog open and shows inline error", async () => {
    mockFetchError();
    const { onClose } = renderDialog();

    const confirmBtn = screen.getByRole("button", { name: /Regenerate link/ });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      const errEl = document.querySelector("[data-regenerate-error]");
      expect(errEl).not.toBeNull();
      expect(errEl?.textContent).toMatch(/Could not regenerate/);
    });
    // Modal must NOT have been asked to close on error.
    expect(onClose).not.toHaveBeenCalled();
  });
});
