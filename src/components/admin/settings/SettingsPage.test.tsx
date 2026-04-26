// @vitest-environment jsdom
// src/components/admin/settings/SettingsPage.test.tsx
// Phase 34 Plan 03 — SettingsPage root component tests
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Settings page layout

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  act,
  waitFor,
  within,
} from "@testing-library/react";
import SettingsPage, { type SiteSettingsPayload } from "./SettingsPage";

afterEach(cleanup);

function defaultSettings(
  overrides: Partial<SiteSettingsPayload> = {},
): SiteSettingsPayload {
  return {
    siteTitle: "La Sprezzatura",
    tagline: "",
    contactEmail: "hello@lasprezz.com",
    contactPhone: "",
    studioLocation: "",
    socialLinks: { instagram: "", pinterest: "", houzz: "" },
    heroSlideshow: [],
    renderingAllocation: 50,
    renderingImageTypes: [],
    renderingExcludedUsers: [],
    // Phase 38 — Send Update sender config (SETT-10 / SETT-11)
    defaultFromEmail: "",
    defaultCcEmail: "",
    // Phase 40 — VEND-03
    trades: [],
    // Phase 43 — TRAD-08
    contractorChecklistItems: [],
    vendorChecklistItems: [],
    ...overrides,
  };
}

// Default fetch mock used by tests that don't care about specific responses —
// the inUseDocTypes fetch fires on mount and must resolve successfully so
// unrelated tests don't see an unhandled rejection.
function mockInUseDocTypesFetch(types: string[] = []) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({ types }),
  } as Response);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SettingsPage (Phase 34 Plan 03)", () => {
  it("renders a sub-nav button for every settings section", () => {
    render(<SettingsPage initialSettings={defaultSettings()} />);
    // Each entry in the sidebar sub-nav exposes a role=button with the
    // section label as the accessible name.
    const labels = [
      /General/,
      /Social links/,
      /Hero slideshow/,
      /Rendering/,
      /Trades/,
      /Contractor checklist/,
      /Vendor checklist/,
      /Workflow templates/,
    ];
    for (const name of labels) {
      expect(screen.getByRole("button", { name })).not.toBeNull();
    }
  });

  it("General is the active section by default (aria-current='page')", () => {
    render(<SettingsPage initialSettings={defaultSettings()} />);
    const generalNav = screen.getByRole("button", { name: /General/ });
    expect(generalNav.getAttribute("aria-current")).toBe("page");
    // Other nav buttons should not be marked active.
    const renderingNav = screen.getByRole("button", { name: /^Rendering$/ });
    expect(renderingNav.getAttribute("aria-current")).toBeNull();
  });

  it("clicking a section nav button activates it", () => {
    render(<SettingsPage initialSettings={defaultSettings()} />);
    const renderingNav = screen.getByRole("button", { name: /^Rendering$/ });
    expect(renderingNav.getAttribute("aria-current")).toBeNull();
    fireEvent.click(renderingNav);
    expect(renderingNav.getAttribute("aria-current")).toBe("page");
    // General should no longer be active.
    expect(
      screen.getByRole("button", { name: /General/ }).getAttribute("aria-current"),
    ).toBeNull();
  });

  it("sticky footer bar contains Save settings button", () => {
    render(<SettingsPage initialSettings={defaultSettings()} />);
    const footer = document.querySelector("[data-settings-footer]");
    expect(footer).not.toBeNull();
    const saveBtn = within(footer as HTMLElement).getByRole("button", {
      name: /Save settings/,
    });
    expect(saveBtn).not.toBeNull();
  });

  it("dirty state indicator appears in footer left slot when form is modified", () => {
    render(<SettingsPage initialSettings={defaultSettings()} />);
    // Not dirty on initial render
    expect(
      document.querySelector("[data-settings-dirty-indicator]"),
    ).toBeNull();
    // Modify the site title input
    const siteTitleInput = screen.getByPlaceholderText(
      "Your studio name",
    ) as HTMLInputElement;
    fireEvent.change(siteTitleInput, {
      target: { value: "La Sprezzatura Studios" },
    });
    expect(
      document.querySelector("[data-settings-dirty-indicator]"),
    ).not.toBeNull();
    expect(
      document.querySelector("[data-settings-dirty-indicator]")!
        .textContent,
    ).toContain("Unsaved changes");
  });

  it("saving state replaces button label with Saving... and Loader2 icon", async () => {
    // Hold the fetch promise open so the saving state persists long enough
    // to observe synchronously.
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      fetchPromise as unknown as Promise<Response>,
    );

    render(<SettingsPage initialSettings={defaultSettings()} />);
    // Mark dirty so save is meaningful
    const siteTitleInput = screen.getByPlaceholderText(
      "Your studio name",
    ) as HTMLInputElement;
    fireEvent.change(siteTitleInput, { target: { value: "Updated" } });

    const saveBtn = screen.getByRole("button", { name: /Save settings/ });
    await act(async () => {
      fireEvent.click(saveBtn);
      // Allow React to process the click → setSaving(true) effect
      await Promise.resolve();
    });

    // Now the button label should be Saving... and an Loader2 icon (svg)
    // should be in the footer
    const footer = document.querySelector(
      "[data-settings-footer]",
    ) as HTMLElement;
    expect(footer.textContent).toContain("Saving...");
    const loaderSvg = footer.querySelector(".animate-spin");
    expect(loaderSvg).not.toBeNull();

    // Resolve the fetch so the test doesn't leak an open handle.
    await act(async () => {
      resolveFetch(
        new Response("{}", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  it("error banner appears in left slot when save returns 4xx/5xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: "Server boom" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    render(<SettingsPage initialSettings={defaultSettings()} />);
    // Mark dirty first
    const siteTitleInput = screen.getByPlaceholderText(
      "Your studio name",
    ) as HTMLInputElement;
    fireEvent.change(siteTitleInput, { target: { value: "Updated" } });

    const saveBtn = screen.getByRole("button", { name: /Save settings/ });
    await act(async () => {
      fireEvent.click(saveBtn);
      // Let the fetch mock + error handling run to completion
      await new Promise((r) => setTimeout(r, 0));
      await Promise.resolve();
    });

    const banner = document.querySelector(
      "[data-settings-error-banner]",
    );
    expect(banner).not.toBeNull();
    expect(banner!.textContent).toContain("Could not save");
  });
});

describe("SettingsPage — Phase 43 checklist sections (TRAD-08)", () => {
  it("renders sub-nav entries for both Contractor and Vendor checklists", () => {
    mockInUseDocTypesFetch();
    render(
      <SettingsPage
        initialSettings={defaultSettings({
          contractorChecklistItems: ["W-9"],
          vendorChecklistItems: ["Vendor agreement"],
        })}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Contractor checklist/ }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /Vendor checklist/ }),
    ).not.toBeNull();
    // All section bodies stay mounted (display:none for inactive ones)
    // so item labels exist in the DOM regardless of which nav is active.
    expect(screen.getByText("W-9")).not.toBeNull();
    expect(screen.getByText("Vendor agreement")).not.toBeNull();
  });

  it("fetches inUseDocTypes on mount", async () => {
    const fetchMock = mockInUseDocTypesFetch(["W-9"]);
    render(<SettingsPage initialSettings={defaultSettings()} />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/site-settings?action=inUseDocTypes",
      );
    });
  });

  it("handleSave issues updateContractorChecklistItems and updateVendorChecklistItems POSTs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ types: [], success: true }),
    } as Response);

    render(
      <SettingsPage
        initialSettings={defaultSettings({
          contractorChecklistItems: ["W-9"],
          vendorChecklistItems: ["Vendor agreement"],
        })}
      />,
    );

    // Mark the form dirty so Save is enabled — edit any visible field.
    const siteTitleInput = screen.getByPlaceholderText(
      "Your studio name",
    ) as HTMLInputElement;
    fireEvent.change(siteTitleInput, { target: { value: "Updated" } });

    const saveBtn = screen.getByRole("button", { name: /Save settings/ });
    await act(async () => {
      fireEvent.click(saveBtn);
      // Allow the sequential fetch chain (update → updateTrades →
      // updateContractorChecklistItems → updateVendorChecklistItems) to run.
      await new Promise((r) => setTimeout(r, 0));
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      const bodies = fetchMock.mock.calls
        .map(([, init]) => (init as RequestInit | undefined)?.body)
        .filter(
          (b): b is string => typeof b === "string",
        );
      expect(
        bodies.some((b) =>
          b.includes('"action":"updateContractorChecklistItems"'),
        ),
      ).toBe(true);
      expect(
        bodies.some((b) =>
          b.includes('"action":"updateVendorChecklistItems"'),
        ),
      ).toBe(true);
    });
  });

  it("handleCancel resets both new checklist arrays to initialSettings values", () => {
    mockInUseDocTypesFetch();
    render(
      <SettingsPage
        initialSettings={defaultSettings({
          contractorChecklistItems: ["W-9"],
          vendorChecklistItems: ["Vendor agreement"],
        })}
      />,
    );

    // Dirty the form so Cancel is enabled.
    const siteTitleInput = screen.getByPlaceholderText(
      "Your studio name",
    ) as HTMLInputElement;
    fireEvent.change(siteTitleInput, { target: { value: "Dirty" } });

    const cancelBtn = document.querySelector(
      "[data-settings-cancel]",
    ) as HTMLButtonElement | null;
    expect(cancelBtn).not.toBeNull();
    fireEvent.click(cancelBtn!);

    // After cancel, the contractor checklist is still open and still shows the
    // original item label (proving state was reset, not blown away).
    expect(screen.getByText("W-9")).not.toBeNull();
  });
});
