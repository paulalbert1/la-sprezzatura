// @vitest-environment jsdom
// src/components/admin/ui/CollapsibleSection.test.tsx
// Phase 34 Plan 02 — CollapsibleSection primitive tests
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § 1 /admin/settings layout

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CollapsibleSection from "./CollapsibleSection";

afterEach(cleanup);

describe("CollapsibleSection (Phase 34 Plan 02)", () => {
  it("renders header with title; chevron rotates 180 degrees when expanded", () => {
    render(
      <CollapsibleSection title="General" defaultOpen>
        <p>body</p>
      </CollapsibleSection>,
    );
    expect(screen.getByText("General")).not.toBeNull();
    const chevron = document.querySelector("[data-collapsible-chevron]");
    expect(chevron).not.toBeNull();
    // Chevron is an SVG element; classList.contains is the safe read.
    expect(chevron!.classList.contains("rotate-180")).toBe(true);
  });

  it("body is not rendered in DOM when collapsed", () => {
    render(
      <CollapsibleSection title="General">
        <p data-testid="inner">body content</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByTestId("inner")).toBeNull();
  });

  it("clicking header toggles expanded state", () => {
    render(
      <CollapsibleSection title="General">
        <p data-testid="inner">body</p>
      </CollapsibleSection>,
    );
    const header = screen.getByRole("button", { name: /General/ });
    expect(screen.queryByTestId("inner")).toBeNull();
    fireEvent.click(header);
    expect(screen.getByTestId("inner")).not.toBeNull();
    fireEvent.click(header);
    expect(screen.queryByTestId("inner")).toBeNull();
  });

  it("Enter key on header toggles expanded state", () => {
    render(
      <CollapsibleSection title="Section">
        <p data-testid="inner">body</p>
      </CollapsibleSection>,
    );
    const header = screen.getByRole("button", { name: /Section/ });
    fireEvent.keyDown(header, { key: "Enter" });
    expect(screen.getByTestId("inner")).not.toBeNull();
  });

  it("Space key on header toggles expanded state", () => {
    render(
      <CollapsibleSection title="Section">
        <p data-testid="inner">body</p>
      </CollapsibleSection>,
    );
    const header = screen.getByRole("button", { name: /Section/ });
    fireEvent.keyDown(header, { key: " " });
    expect(screen.getByTestId("inner")).not.toBeNull();
  });

  it("defaultOpen prop controls initial expanded state", () => {
    const { rerender } = render(
      <CollapsibleSection title="Section" defaultOpen={false}>
        <p data-testid="inner">body</p>
      </CollapsibleSection>,
    );
    expect(screen.queryByTestId("inner")).toBeNull();
    rerender(
      <CollapsibleSection title="Section" defaultOpen={true}>
        <p data-testid="inner">body</p>
      </CollapsibleSection>,
    );
    // rerender keeps state; check a fresh render instead
    cleanup();
    render(
      <CollapsibleSection title="Other" defaultOpen>
        <p data-testid="inner2">body</p>
      </CollapsibleSection>,
    );
    expect(screen.getByTestId("inner2")).not.toBeNull();
  });
});
