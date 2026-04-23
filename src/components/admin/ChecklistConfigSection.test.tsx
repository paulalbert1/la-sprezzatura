// @vitest-environment jsdom
// Phase 43 Plan 01 Task 3 — ChecklistConfigSection RED test scaffold.
//
// Covers TRAD-08 (Settings config for checklist items; delete guard).
// Source of truth:
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-01-PLAN.md § Task 3
//   .planning/phases/43-document-checklists-settings-config-and-completeness/43-UI-SPEC.md § Settings Config Interaction
//
// These tests intentionally FAIL (RED) — ChecklistConfigSection does not exist
// yet. Plan 03 drives them to GREEN.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
// Intentional RED import — module created in Plan 03.
// @ts-expect-error — module does not exist yet.
import ChecklistConfigSection from "./ChecklistConfigSection";

afterEach(cleanup);
beforeEach(() => {
  vi.restoreAllMocks();
});

describe("ChecklistConfigSection — list rendering (TRAD-08)", () => {
  it("renders one row per item", () => {
    const { container } = render(
      <ChecklistConfigSection
        items={["W-9", "Certificate of insurance"]}
        inUseTypes={new Set<string>()}
        onChange={() => undefined}
      />,
    );
    expect(container.textContent).toContain("W-9");
    expect(container.textContent).toContain("Certificate of insurance");
  });
});

describe("ChecklistConfigSection — add flow (TRAD-08)", () => {
  it("appends a new item via onChange when Enter is pressed", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ChecklistConfigSection
        items={["W-9", "Certificate of insurance"]}
        inUseTypes={new Set<string>()}
        onChange={handleChange}
      />,
    );
    const input = container.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement | null;
    expect(input).toBeTruthy();
    fireEvent.change(input!, { target: { value: "Trade license" } });
    fireEvent.keyDown(input!, { key: "Enter", code: "Enter" });
    expect(handleChange).toHaveBeenCalledWith([
      "W-9",
      "Certificate of insurance",
      "Trade license",
    ]);
  });

  it("rejects duplicate add and surfaces 'A checklist item with that name already exists.'", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ChecklistConfigSection
        items={["W-9"]}
        inUseTypes={new Set<string>()}
        onChange={handleChange}
      />,
    );
    const input = container.querySelector(
      'input[type="text"]',
    ) as HTMLInputElement | null;
    fireEvent.change(input!, { target: { value: "W-9" } });
    fireEvent.keyDown(input!, { key: "Enter", code: "Enter" });
    expect(handleChange).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "A checklist item with that name already exists.",
    );
  });
});

describe("ChecklistConfigSection — rename flow (TRAD-08)", () => {
  it("rename pencil → edit → check commits renamed array via onChange", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ChecklistConfigSection
        items={["W-9"]}
        inUseTypes={new Set<string>()}
        onChange={handleChange}
      />,
    );
    // Click the pencil (first button in the row by convention); tests tolerate
    // either an aria-label or a Lucide icon-only button.
    const buttons = Array.from(container.querySelectorAll("button")).filter(
      (b) => b.querySelector("svg"),
    );
    expect(buttons.length).toBeGreaterThan(0);
    // The first svg button is pencil (edit start).
    fireEvent.click(buttons[0]);

    // After entering rename mode, an input appears with the current value.
    const inputs = Array.from(
      container.querySelectorAll('input[type="text"]'),
    ) as HTMLInputElement[];
    const renameInput = inputs.find((i) => i.value === "W-9");
    expect(renameInput).toBeTruthy();
    fireEvent.change(renameInput!, { target: { value: "W-9 (2024)" } });

    // Click the Check (commit) button; it is a second svg button that appears in rename mode.
    const renameButtons = Array.from(
      container.querySelectorAll("button"),
    ).filter((b) => b.querySelector("svg"));
    // Commit button is the last new svg button
    fireEvent.click(renameButtons[renameButtons.length - 2] ?? renameButtons[0]);

    expect(handleChange).toHaveBeenCalled();
    const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1][0];
    expect(lastCall).toEqual(["W-9 (2024)"]);
  });
});

describe("ChecklistConfigSection — delete flow (TRAD-08)", () => {
  it("confirming delete fires onChange with the item removed", () => {
    const handleChange = vi.fn();
    const { container } = render(
      <ChecklistConfigSection
        items={["W-9", "Certificate of insurance"]}
        inUseTypes={new Set<string>()}
        onChange={handleChange}
      />,
    );
    // Find and click a delete (Trash2) button — last svg button per row.
    const rowButtons = Array.from(container.querySelectorAll("button")).filter(
      (b) => b.querySelector("svg") && !b.disabled,
    );
    expect(rowButtons.length).toBeGreaterThan(0);
    // Click the delete on the first row (second svg button, pencil+trash pairing).
    // Delete is conventionally the second button per row.
    fireEvent.click(rowButtons[1] ?? rowButtons[0]);

    // Confirm in the modal by clicking a button labelled Delete / Confirm.
    const confirmBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => /delete|confirm|remove/i.test(b.textContent || ""),
    );
    if (confirmBtn) fireEvent.click(confirmBtn);

    expect(handleChange).toHaveBeenCalled();
  });

  it("delete button is disabled and wrapped in a span with the guard tooltip when item is in use (D-15)", () => {
    const { container } = render(
      <ChecklistConfigSection
        items={["W-9"]}
        inUseTypes={new Set(["W-9"])}
        onChange={() => undefined}
      />,
    );
    // Find the wrapping span that carries the guard title.
    const guardSpan = Array.from(container.querySelectorAll("span")).find(
      (s) =>
        (s.getAttribute("title") ?? "").includes(
          "This type has documents — remove documents from all trades first.",
        ),
    );
    expect(guardSpan).toBeTruthy();
    const disabledBtn = guardSpan?.querySelector("button");
    expect(disabledBtn?.disabled).toBe(true);
  });
});
