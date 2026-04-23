import { describe, it, expect } from "vitest";
import { moveItem } from "./arrayUtils";

describe("moveItem", () => {
  it("moves item up one slot", () => {
    expect(moveItem([1, 2, 3], 1, "up")).toEqual([2, 1, 3]);
  });
  it("moves item down one slot", () => {
    expect(moveItem([1, 2, 3], 1, "down")).toEqual([1, 3, 2]);
  });
  it("is a no-op at the top boundary when moving up", () => {
    expect(moveItem([1, 2, 3], 0, "up")).toEqual([1, 2, 3]);
  });
  it("is a no-op at the bottom boundary when moving down", () => {
    expect(moveItem([1, 2, 3], 2, "down")).toEqual([1, 2, 3]);
  });
  it("returns a new array (does not mutate input)", () => {
    const input = [1, 2, 3];
    const out = moveItem(input, 1, "up");
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3]);
  });
  it("handles out-of-range idx by returning a copy unchanged", () => {
    expect(moveItem([1, 2, 3], -1, "up")).toEqual([1, 2, 3]);
    expect(moveItem([1, 2, 3], 99, "down")).toEqual([1, 2, 3]);
  });
});
