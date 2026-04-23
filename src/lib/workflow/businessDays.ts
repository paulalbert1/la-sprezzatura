import { differenceInBusinessDays, addBusinessDays as dfAddBusinessDays } from "date-fns";

/**
 * Business-day count between two dates (weekends excluded, holidays ignored).
 * Clamps to 0 when later < earlier. Used by approval-timeout math (Pitfall 4).
 */
export function businessDaysBetween(earlier: Date, later: Date): number {
  if (later.getTime() <= earlier.getTime()) return 0;
  const diff = differenceInBusinessDays(later, earlier);
  return Math.max(0, diff);
}

export function addBusinessDays(date: Date, n: number): Date {
  return dfAddBusinessDays(date, n);
}
