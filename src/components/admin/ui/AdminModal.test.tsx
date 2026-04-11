// @vitest-environment jsdom
// src/components/admin/ui/AdminModal.test.tsx
// Phase 34 Plan 02 — AdminModal primitive tests
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § AdminModal primitive contract

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import AdminModal from "./AdminModal";

afterEach(() => {
  cleanup();
  // Reset body overflow between tests (the modal sets it on mount, clears on unmount,
  // but exit animations / unmount order can leave residue if a render throws).
  document.body.style.overflow = "";
});

describe("AdminModal (Phase 34 Plan 02)", () => {
  it("renders nothing when open=false (unmounts to free state)", () => {
    const { container } = render(
      <AdminModal open={false} onClose={() => {}} title="Hidden">
        <p>body</p>
      </AdminModal>,
    );
    expect(container.textContent).toBe("");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("overlay click calls onClose when disableDismiss is falsy", () => {
    const onClose = vi.fn();
    render(
      <AdminModal open={true} onClose={onClose} title="Tester">
        <p>body</p>
      </AdminModal>,
    );
    const overlay = document.querySelector("[data-admin-modal-overlay]");
    expect(overlay).not.toBeNull();
    fireEvent.click(overlay!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("overlay click is no-op when disableDismiss is true", () => {
    const onClose = vi.fn();
    render(
      <AdminModal open={true} onClose={onClose} title="Tester" disableDismiss>
        <p>body</p>
      </AdminModal>,
    );
    const overlay = document.querySelector("[data-admin-modal-overlay]");
    fireEvent.click(overlay!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape key calls onClose when disableDismiss is falsy", () => {
    const onClose = vi.fn();
    render(
      <AdminModal open={true} onClose={onClose} title="Tester">
        <p>body</p>
      </AdminModal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape key is no-op when disableDismiss is true", () => {
    const onClose = vi.fn();
    render(
      <AdminModal open={true} onClose={onClose} title="Tester" disableDismiss>
        <p>body</p>
      </AdminModal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("X icon click calls onClose when disableDismiss is falsy", () => {
    const onClose = vi.fn();
    render(
      <AdminModal open={true} onClose={onClose} title="Tester">
        <p>body</p>
      </AdminModal>,
    );
    const closeBtn = screen.getByLabelText("Close");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("size='sm' applies max-w-[440px], size='md' applies max-w-[540px]", () => {
    const { rerender } = render(
      <AdminModal open={true} onClose={() => {}} title="T" size="sm">
        <p>body</p>
      </AdminModal>,
    );
    const cardSm = document.querySelector("[data-admin-modal-card]") as HTMLElement;
    expect(cardSm.className).toContain("max-w-[440px]");

    rerender(
      <AdminModal open={true} onClose={() => {}} title="T" size="md">
        <p>body</p>
      </AdminModal>,
    );
    const cardMd = document.querySelector("[data-admin-modal-card]") as HTMLElement;
    expect(cardMd.className).toContain("max-w-[540px]");
  });

  it("body scroll is trapped via document.body.style.overflow while open", () => {
    document.body.style.overflow = "auto";
    const { unmount } = render(
      <AdminModal open={true} onClose={() => {}} title="T">
        <p>body</p>
      </AdminModal>,
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("focus trap returns focus to trigger on close", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { rerender } = render(
      <AdminModal open={true} onClose={() => {}} title="T">
        <button type="button">inside</button>
      </AdminModal>,
    );
    // While open, the first focusable inside the modal should receive focus
    const inside = screen.getByText("inside");
    expect(document.activeElement).toBe(inside);

    // Close the modal; focus should return to the trigger
    rerender(
      <AdminModal open={false} onClose={() => {}} title="T">
        <button type="button">inside</button>
      </AdminModal>,
    );
    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });

  it("aria-modal='true' and role='dialog' set; aria-labelledby points at header id", () => {
    render(
      <AdminModal open={true} onClose={() => {}} title="Hello">
        <p>body</p>
      </AdminModal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    const header = document.getElementById(labelledBy!);
    expect(header).not.toBeNull();
    expect(header!.textContent).toContain("Hello");
  });
});
