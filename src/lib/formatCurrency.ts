const formatterWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatterCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/**
 * Format an integer cent value as a US dollar string.
 * Whole dollar amounts omit cents: 199900 -> "$1,999"
 * Non-whole amounts show cents: 199950 -> "$1,999.50"
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? formatterWhole.format(dollars)
    : formatterCents.format(dollars);
}
