/**
 * Indian Standard Time helpers. IST is UTC+05:30 all year (no daylight
 * saving, and none in the years the VDA regime covers), so a fixed offset is
 * exact and no time-zone database is needed.
 */
const IST_OFFSET = "+05:30";
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** IST wall-clock time "YYYY-MM-DDTHH:mm:ss" → the instant it names. */
export function istToInstant(local: string): Date {
  return new Date(`${local}${IST_OFFSET}`);
}

export interface IstFields {
  year: number;
  /** 1 to 12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/** IST calendar and clock fields of an instant. */
export function istFields(date: Date): IstFields {
  // Shift the instant so its UTC fields read as IST wall-clock time
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

export const pad2 = (n: number): string => String(n).padStart(2, "0");

/** English short month name ("Apr") for a 1-based month. */
export const monthShort = (month: number): string => MONTHS[month - 1];
