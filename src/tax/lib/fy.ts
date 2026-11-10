import { TIMESTAMP_UNIT } from "@/tax/core/subgraph/config";
import type { LawVersion } from "@/tax/core/types";
import { istFields, istToInstant, pad2 } from "@/tax/lib/ist";

export const IST = "Asia/Kolkata";

/** First FY in which the VDA regime (s.115BBH) applied: FY 2022-23. */
export const FIRST_VDA_FY = 2022;

/** The Income-tax Act, 2025 applies to transactions on or after 1 Apr 2026 (FY 2026-27). */
export const ITA_2025_FIRST_FY = 2026;

/** Subgraph timestamp → Date. Returns null for "0" / empty / invalid. */
export function timestampToDate(raw: string | null | undefined): Date | null {
  if (!raw || !/^\d+$/.test(raw) || raw === "0") return null;
  const n = Number(raw);
  const ms = TIMESTAMP_UNIT === "seconds" ? n * 1000 : n;
  return new Date(ms);
}

/** IST calendar parts of an instant. */
export function istParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const { year, month, day } = istFields(date);
  return { year, month, day };
}

/**
 * Financial year (start year) of an instant, decided in IST.
 * FY N-(N+1) runs 1 Apr N 00:00:00 IST → 31 Mar N+1 23:59:59 IST.
 */
export function fyOf(date: Date): number {
  const { year, month } = istParts(date);
  return month >= 4 ? year : year - 1;
}

/** [start, end) instants of an FY. */
export function fyRange(fy: number): { start: Date; end: Date } {
  return {
    start: istToInstant(`${fy}-04-01T00:00:00`),
    end: istToInstant(`${fy + 1}-04-01T00:00:00`),
  };
}

export function fyLabel(fy: number): string {
  return `FY ${fy}-${String((fy + 1) % 100).padStart(2, "0")}`;
}

/** "Tax year" under the 2025 Act / assessment year under the 1961 Act. */
export function ayLabel(fy: number): string {
  return `AY ${fy + 1}-${String((fy + 2) % 100).padStart(2, "0")}`;
}

export function lawForFy(fy: number): LawVersion {
  return fy >= ITA_2025_FIRST_FY ? "ITA_2025" : "ITA_1961";
}

export function lawForDate(date: Date): LawVersion {
  return lawForFy(fyOf(date));
}

/** IST "YYYY-MM-DD" → instant of 00:00 IST that day. Returns null if invalid. */
export function istDateToInstant(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const d = istToInstant(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  // Reject rollovers such as 2026-02-31
  return istDateString(d) === isoDate ? d : null;
}

/** IST calendar date "YYYY-MM-DD" of an instant. */
export function istDateString(date: Date): string {
  const { year, month, day } = istFields(date);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** "YYYY-MM" month key in IST. */
export function istMonthKey(date: Date): string {
  const { year, month } = istFields(date);
  return `${year}-${pad2(month)}`;
}

/** The 12 IST month keys of an FY, April first. */
export function fyMonthKeys(fy: number): string[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = ((i + 3) % 12) + 1;
    const y = i < 9 ? fy : fy + 1;
    return `${y}-${String(m).padStart(2, "0")}`;
  });
}

/** All FYs selectable in the UI, newest first, up to the FY containing `today`. */
export function selectableFys(today: Date = new Date()): number[] {
  const current = fyOf(today);
  const list: number[] = [];
  for (let fy = Math.max(current, ITA_2025_FIRST_FY); fy >= FIRST_VDA_FY; fy--)
    list.push(fy);
  return list;
}
