// @vitest-environment jsdom
// src/components/admin/ui/TagInput.test.tsx
// Phase 34 Plan 02 — TagInput primitive tests
// Source of truth: .planning/phases/34-settings-and-studio-retirement/34-UI-SPEC.md § Rendering Configuration

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TagInput from "./TagInput";

afterEach(cleanup);

describe("TagInput (Phase 34 Plan 02)", () => {
  it("pressing Enter with non-empty input adds the value as a new tag", () => {
    const onChange = vi.fn();
    render(<TagInput tags={["alpha"]} onChange={onChange} placeholder="Add" />);
    const input = screen.getByPlaceholderText("Add") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["alpha", "beta"]);
  });

  it("pressing Enter with empty input is a no-op", () => {
    const onChange = vi.fn();
    render(<TagInput tags={["alpha"]} onChange={onChange} placeholder="Add" />);
    const input = screen.getByPlaceholderText("Add") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clicking × on a tag removes it", () => {
    const onChange = vi.fn();
    render(
      <TagInput tags={["alpha", "beta", "gamma"]} onChange={onChange} />,
    );
    const removeBtn = screen.getByLabelText("Remove beta");
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith(["alpha", "gamma"]);
  });

  it("duplicate value is silently rejected (no add, no error)", () => {
    const onChange = vi.fn();
    render(<TagInput tags={["alpha"]} onChange={onChange} placeholder="Add" />);
    const input = screen.getByPlaceholderText("Add") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "alpha" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    // No error text either
    expect(screen.queryByText(/valid email/i)).toBeNull();
  });

  it("Backspace on empty input removes the last tag", () => {
    const onChange = vi.fn();
    render(<TagInput tags={["alpha", "beta"]} onChange={onChange} placeholder="Add" />);
    const input = screen.getByPlaceholderText("Add") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenCalledWith(["alpha"]);
  });

  it("validator prop 'email' rejects malformed addresses and shows inline error", () => {
    const onChange = vi.fn();
    render(
      <TagInput
        tags={[]}
        onChange={onChange}
        validator="email"
        placeholder="Add email"
      />,
    );
    const input = screen.getByPlaceholderText("Add email") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "not-an-email" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Enter a valid email address.")).not.toBeNull();
  });

  it("onChange fires with the new tags array after add", () => {
    const onChange = vi.fn();
    render(<TagInput tags={[]} onChange={onChange} placeholder="Add" />);
    const input = screen.getByPlaceholderText("Add") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "first" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(["first"]);
  });

  it("onChange fires with the new tags array after remove", () => {
    const onChange = vi.fn();
    render(<TagInput tags={["only"]} onChange={onChange} />);
    const removeBtn = screen.getByLabelText("Remove only");
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
