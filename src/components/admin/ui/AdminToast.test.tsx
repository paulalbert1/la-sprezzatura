// @vitest-environment jsdom
// src/components/admin/ui/AdminToast.test.tsx
// Phase 34 Plan 02 — AdminToast primitive tests
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § AdminToast primitive contract

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import AdminToast from "./AdminToast";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AdminToast (Phase 34 Plan 02)", () => {
  it("auto-dismisses after duration ms when duration > 0", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <AdminToast
        title="Saved"
        duration={2000}
        onDismiss={onDismiss}
      />,
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does NOT auto-dismiss when duration=0", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <AdminToast title="Persistent" duration={0} onDismiss={onDismiss} />,
    );
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("hover pauses the dismiss timer; mouseleave resumes", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <AdminToast
        title="Hover pause"
        duration={3000}
        onDismiss={onDismiss}
      />,
    );
    const toast = screen.getByText("Hover pause").closest("[data-admin-toast]") as HTMLElement;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.mouseEnter(toast);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.mouseLeave(toast);
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("manual X click triggers onDismiss immediately", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();
    render(
      <AdminToast title="Close me" duration={5000} onDismiss={onDismiss} />,
    );
    const closeBtn = screen.getByLabelText("Dismiss notification");
    fireEvent.click(closeBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("variant='success' renders left bar #9A7B4B; title #2C2520", () => {
    render(<AdminToast title="Saved" variant="success" onDismiss={() => {}} />);
    const bar = document.querySelector("[data-admin-toast-bar]") as HTMLElement;
    expect(bar.style.backgroundColor).toBe("rgb(154, 123, 75)"); // #9A7B4B
    const title = screen.getByText("Saved") as HTMLElement;
    expect(title.style.color).toBe("rgb(44, 37, 32)"); // #2C2520
  });

  it("variant='error' renders left bar #9B3A2A; title #9B3A2A", () => {
    render(<AdminToast title="Error" variant="error" onDismiss={() => {}} />);
    const bar = document.querySelector("[data-admin-toast-bar]") as HTMLElement;
    expect(bar.style.backgroundColor).toBe("rgb(155, 58, 42)"); // #9B3A2A
    const title = screen.getByText("Error") as HTMLElement;
    expect(title.style.color).toBe("rgb(155, 58, 42)");
  });

  it("variant='info' renders left bar #6B5E52; title #2C2520", () => {
    render(<AdminToast title="Info" variant="info" onDismiss={() => {}} />);
    const bar = document.querySelector("[data-admin-toast-bar]") as HTMLElement;
    expect(bar.style.backgroundColor).toBe("rgb(107, 94, 82)"); // #6B5E52
    const title = screen.getByText("Info") as HTMLElement;
    expect(title.style.color).toBe("rgb(44, 37, 32)");
  });

  it("action button click invokes action.onClick and does NOT auto-dismiss", () => {
    vi.useFakeTimers();
    const actionClick = vi.fn();
    const onDismiss = vi.fn();
    render(
      <AdminToast
        title="With action"
        duration={3000}
        action={{ label: "Undo", onClick: actionClick }}
        onDismiss={onDismiss}
      />,
    );
    const actionBtn = screen.getByText("Undo");
    fireEvent.click(actionBtn);
    expect(actionClick).toHaveBeenCalledTimes(1);
    // After action, auto-dismiss should NOT have been triggered synchronously
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
