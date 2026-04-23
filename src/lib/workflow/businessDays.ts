import { differenceInBusinessDays, addBusinessDays as dfAddBusinessDays } from "date-fns";

/**
 * Normalize a date to UTC noon to avoid timezone edge cases with date-fns,
 * which uses local time for day-of-week calculations. Midnight UTC timestamps
 * (e.g. "2026-04-17T00:00:00Z") become Thursday evening in Eastern time,
 * shifting the business-day count by one day.
 */
function toUTCNoon(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

/**
 * Business-day count between two dates (weekends excluded, holidays ignored).
 * Clamps to 0 when later < earlier. Used by approval-timeout math (Pitfall 4).
 * Normalizes both dates to UTC noon to avoid timezone edge cases with date-fns.
 */
export function businessDaysBetween(earlier: Date, later: Date): number {
  if (later.getTime() <= earlier.getTime()) return 0;
  const diff = differenceInBusinessDays(toUTCNoon(later), toUTCNoon(earlier));
  return Math.max(0, diff);
}

export function addBusinessDays(date: Date, n: number): Date {
  return dfAddBusinessDays(date, n);
}
