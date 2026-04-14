// @vitest-environment jsdom
// Phase 35 Plan 02 — CardFilterInput primitive tests
// Source of truth: .planning/phases/35-dashboard-polish-global-ux-cleanup/35-UI-SPEC.md § <CardFilterInput /> (new, shared)

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CardFilterInput from "./CardFilterInput";

afterEach(() => {
  cleanup();
});

describe("CardFilterInput (Phase 35 Plan 02)", () => {
  it("renders placeholder text", () => {
    render(
      <CardFilterInput value="" onChange={() => {}} placeholder="Filter deliveries…" />,
    );
    expect(screen.getByPlaceholderText("Filter deliveries…")).toBeTruthy();
  });

  it("typing triggers onChange with new value (synchronous, no debounce)", () => {
    const onChange = vi.fn();
    render(
      <CardFilterInput value="" onChange={onChange} placeholder="Filter deliveries…" />,
    );
    const input = screen.getByPlaceholderText("Filter deliveries…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "sofa" } });
    expect(onChange).toHaveBeenCalledWith("sofa");
  });

  it("X clear button is absent when value is empty", () => {
    render(
      <CardFilterInput value="" onChange={() => {}} placeholder="Filter deliveries…" />,
    );
    expect(screen.queryByRole("button", { name: /clear/i })).toBeNull();
  });

  it("X clear button is present when value is non-empty", () => {
    render(
      <CardFilterInput value="abc" onChange={() => {}} placeholder="Filter deliveries…" />,
    );
    expect(screen.getByRole("button", { name: /clear/i })).toBeTruthy();
  });

  it("clicking X clear button calls onChange('')", () => {
    const onChange = vi.fn();
    render(
      <CardFilterInput value="abc" onChange={onChange} placeholder="Filter deliveries…" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("aria-label falls back to placeholder when not provided", () => {
    render(
      <CardFilterInput value="" onChange={() => {}} placeholder="Filter deliveries…" />,
    );
    expect(screen.getByLabelText("Filter deliveries…")).toBeTruthy();
  });

  it("uses explicit ariaLabel when provided", () => {
    render(
      <CardFilterInput
        value=""
        onChange={() => {}}
        placeholder="Filter deliveries…"
        ariaLabel="Deliveries filter"
      />,
    );
    expect(screen.getByLabelText("Deliveries filter")).toBeTruthy();
  });

  it("merges className onto outer wrapper (width override usage)", () => {
    const { container } = render(
      <CardFilterInput
        value=""
        onChange={() => {}}
        placeholder="Filter"
        className="w-64"
      />,
    );
    // outermost div is the wrapper
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toMatch(/w-64/);
  });

  it("input is type=text, autoComplete=off, spellCheck=false", () => {
    render(
      <CardFilterInput value="" onChange={() => {}} placeholder="Filter" />,
    );
    const input = screen.getByPlaceholderText("Filter") as HTMLInputElement;
    expect(input.type).toBe("text");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input.spellcheck).toBe(false);
  });
});
