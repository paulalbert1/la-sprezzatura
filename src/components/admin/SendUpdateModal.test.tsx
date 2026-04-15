// @vitest-environment jsdom
// src/components/admin/SendUpdateModal.test.tsx
// Phase 34 Plan 04 Task 3 — SendUpdateModal tests.
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-04-PLAN.md Task 3

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import ToastContainer from "./ui/ToastContainer";
import SendUpdateModal, {
  type SendUpdateModalProject,
} from "./SendUpdateModal";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fullInteriorProject(
  overrides: Partial<SendUpdateModalProject> = {},
): SendUpdateModalProject {
  return {
    _id: "project-abc",
    title: "Kimball Residence",
    engagementType: "full-interior-design",
    clients: [
      { _id: "c1", name: "Sarah Kimball", email: "sarah@x.com" },
    ],
    milestones: { total: 3, upcoming: 1 },
    procurement: { items: 12, delivered: 4 },
    pendingReviews: { count: 2 },
    ...overrides,
  };
}

function consultationProject(
  overrides: Partial<SendUpdateModalProject> = {},
): SendUpdateModalProject {
  return fullInteriorProject({
    engagementType: "consultation-only",
    procurement: { items: 0, delivered: 0 },
    ...overrides,
  });
}

// Wrap the modal in a ToastContainer for every test so useToast() resolves.
function renderModal(
  project: SendUpdateModalProject,
  extras: { open?: boolean; onClose?: () => void } = {},
) {
  const onClose = extras.onClose ?? vi.fn();
  const utils = render(
    <ToastContainer>
      <SendUpdateModal
        open={extras.open ?? true}
        onClose={onClose}
        project={project}
        senderSettings={{ defaultFromEmail: "", defaultCcEmail: "" }}
      />
    </ToastContainer>,
  );
  return { ...utils, onClose };
}

function findCheckboxRow(testId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
}

function isChecked(row: HTMLElement | null): boolean {
  return row?.getAttribute("aria-checked") === "true";
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SendUpdateModal (Phase 34 Plan 04)", () => {
  it("Milestones checkbox defaults to ON", () => {
    renderModal(fullInteriorProject());
    const row = findCheckboxRow("section-milestones");
    expect(row).not.toBeNull();
    expect(isChecked(row)).toBe(true);
  });

  it("Procurement checkbox defaults to ON when engagementType='full-interior-design' AND procurementItems.length > 0", () => {
    renderModal(fullInteriorProject());
    const row = findCheckboxRow("section-procurement");
    expect(row).not.toBeNull();
    expect(isChecked(row)).toBe(true);
  });

  it("Procurement row is hidden (not disabled) when engagementType !== 'full-interior-design'", () => {
    renderModal(consultationProject());
    const row = findCheckboxRow("section-procurement");
    // Row is not rendered at all — we must NOT find the data-testid anywhere.
    expect(row).toBeNull();
  });

  it("Pending reviews checkbox defaults to OFF (D-15 intentional)", () => {
    renderModal(fullInteriorProject());
    const row = findCheckboxRow("section-pending-reviews");
    expect(row).not.toBeNull();
    expect(isChecked(row)).toBe(false);
  });

  it("Personal link toggle defaults to ON (usePersonalLinks: true)", () => {
    renderModal(fullInteriorProject());
    const toggle = screen.getByRole("switch", {
      name: /Send each recipient their personal portal link/,
    });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
  });

  it("Preview email button opens /api/send-update/preview in a new tab (target=_blank)", () => {
    const openSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);
    renderModal(fullInteriorProject());
    const previewBtn = screen.getByRole("button", { name: /Preview email/ });
    fireEvent.click(previewBtn);
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target, features] = openSpy.mock.calls[0];
    expect(String(url)).toContain("/api/send-update/preview");
    expect(String(url)).toContain("projectId=project-abc");
    expect(target).toBe("_blank");
    expect(features).toContain("noopener");
  });

  it("Cancel button dismisses the modal", () => {
    const onClose = vi.fn();
    renderModal(fullInteriorProject(), { onClose });
    const cancelBtn = screen.getByRole("button", { name: /^Cancel$/ });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Send button calls POST /api/send-update exactly once per click with sections object and usePersonalLinks flag", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, recipientCount: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    renderModal(fullInteriorProject());
    const sendBtn = screen.getByTestId("send-update-send-button");
    fireEvent.click(sendBtn);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/send-update");
    expect(init?.method).toBe("POST");
    const body = JSON.parse((init?.body as string) ?? "{}");
    expect(body.projectId).toBe("project-abc");
    expect(body.usePersonalLinks).toBe(true);
    expect(body.sections).toEqual({
      milestones: true,
      procurement: true,
      artifacts: false, // D-15 mapping: pending reviews OFF by default
    });
  });

  it("sending state: button label becomes 'Sending...' and disables send + cancel", async () => {
    // Hold the fetch resolution so we can observe the intermediate state.
    let resolveFetch: (r: Response) => void = () => {};
    const pending = new Promise<Response>((r) => {
      resolveFetch = r;
    });
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending);

    renderModal(fullInteriorProject());
    const sendBtn = screen.getByTestId(
      "send-update-send-button",
    ) as HTMLButtonElement;
    fireEvent.click(sendBtn);

    await waitFor(() => {
      const btn = screen.getByTestId(
        "send-update-send-button",
      ) as HTMLButtonElement;
      expect(btn.textContent).toMatch(/Sending/);
      expect(btn.disabled).toBe(true);
    });

    // Cancel button must also be disabled during sending
    const cancelBtn = screen.getByRole("button", {
      name: /^Cancel$/,
    }) as HTMLButtonElement;
    expect(cancelBtn.disabled).toBe(true);

    // Let the promise resolve so the test doesn't leak
    resolveFetch(
      new Response(JSON.stringify({ success: true, recipientCount: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("success state: modal auto-closes; Update sent to N recipients toast appears", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, recipientCount: 3 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const onClose = vi.fn();
    renderModal(fullInteriorProject(), { onClose });
    const sendBtn = screen.getByTestId("send-update-send-button");
    fireEvent.click(sendBtn);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    // ToastContainer renders the toast text somewhere in the document
    await waitFor(() => {
      expect(screen.getByText(/Update sent to 3 recipients/)).toBeTruthy();
    });
  });

  it("error state: inline error banner appears above actions footer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Resend refused" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const onClose = vi.fn();
    renderModal(fullInteriorProject(), { onClose });
    const sendBtn = screen.getByTestId("send-update-send-button");
    fireEvent.click(sendBtn);
    await waitFor(() => {
      const banner = document.querySelector("[data-send-update-error]");
      expect(banner).not.toBeNull();
      expect(banner!.textContent).toContain("Resend refused");
    });
    // Modal stays open (onClose NOT called)
    expect(onClose).not.toHaveBeenCalled();
  });

  it("no-clients error: Send button disabled, message 'This project has no clients assigned…'", () => {
    renderModal(fullInteriorProject({ clients: [] }));
    const msg = document.querySelector("[data-send-update-no-clients]");
    expect(msg).not.toBeNull();
    expect(msg!.textContent).toMatch(/no clients assigned/i);
    const sendBtn = screen.getByTestId(
      "send-update-send-button",
    ) as HTMLButtonElement;
    expect(sendBtn.disabled).toBe(true);
  });
});
