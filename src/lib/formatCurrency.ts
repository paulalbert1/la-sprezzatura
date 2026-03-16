const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/**
 * Format an integer cent value as a US dollar string.
 * e.g. 199900 -> "$1,999.00"
 */
export function formatCurrency(cents: number): string {
  return formatter.format(cents / 100);
}
