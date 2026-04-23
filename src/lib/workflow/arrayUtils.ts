/**
 * Reorder helper used by phase and milestone list editors (D-08 — up/down arrows).
 * Pure function. Does not mutate input.
 */
export function moveItem<T>(arr: T[], idx: number, dir: "up" | "down"): T[] {
  const copy = arr.slice();
  if (idx < 0 || idx >= copy.length) return copy;
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= copy.length) return copy;
  [copy[idx], copy[target]] = [copy[target], copy[idx]];
  return copy;
}
