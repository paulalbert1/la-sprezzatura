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
  within,
} from "@testing-library/react";
import SettingsPage, { type SiteSettingsPayload } from "./SettingsPage";

afterEach(cleanup);

function defaultSettings(): SiteSettingsPayload {
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
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SettingsPage (Phase 34 Plan 03)", () => {
  it("renders four CollapsibleSection children (General, Social Links, Hero Slideshow, Rendering Configuration)", () => {
    render(<SettingsPage initialSettings={defaultSettings()} />);
    // The CollapsibleSection primitive exposes each header as role="button"
    // with the title as the accessible name.
    expect(
      screen.getByRole("button", { name: /General/ }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /Social Links/ }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /Hero Slideshow/ }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: /Rendering Configuration/ }),
    ).not.toBeNull();
  });

  it("General section is expanded by default; others collapsed", () => {
    render(<SettingsPage initialSettings={defaultSettings()} />);
    // General's body renders the site-title input with its tenant-neutral placeholder
    expect(
      screen.queryByPlaceholderText("Your studio name"),
    ).not.toBeNull();
    // Rendering Configuration section is collapsed — the helper text
    // that lives inside its body must NOT be in the DOM.
    expect(
      screen.queryByText(/Maximum AI renderings per designer/i),
    ).toBeNull();
    // Hero slideshow body (empty state) must not be rendered either.
    expect(
      document.querySelector("[data-hero-empty-state]"),
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
