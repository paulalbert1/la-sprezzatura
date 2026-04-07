/**
 * Determines whether a procurement item is overdue.
 * Overdue = expectedDeliveryDate is in the past AND status is not "delivered" or "installed".
 */
export function isOverdue(
  expectedDeliveryDate: string | undefined,
  status: string | undefined,
): boolean {
  if (!expectedDeliveryDate) return false;
  if (status === "delivered" || status === "installed") return false;
  return new Date(expectedDeliveryDate) < new Date();
}
