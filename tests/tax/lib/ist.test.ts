import { describe, expect, it } from "vitest";
import { formatDateIst, formatDateTimeIst } from "@/tax/lib/format";
import {
  fyOf,
  fyRange,
  istDateString,
  istDateToInstant,
  istMonthKey,
} from "@/tax/lib/fy";
import { istFields, istToInstant } from "@/tax/lib/ist";

describe("IST conversion", () => {
  it("reads an IST wall-clock time as the right instant", () => {
    expect(istToInstant("2026-04-01T00:00:00").toISOString()).toBe(
      "2026-03-31T18:30:00.000Z",
    );
    expect(istToInstant("2026-12-31T23:59:59").toISOString()).toBe(
      "2026-12-31T18:29:59.000Z",
    );
  });

  it("gives the IST calendar fields of an instant", () => {
    // 18:29:59 UTC is still 31 March in India; one second later is 1 April
    expect(istFields(new Date("2026-03-31T18:29:59Z"))).toEqual({
      year: 2026,
      month: 3,
      day: 31,
      hour: 23,
      minute: 59,
    });
    expect(istFields(new Date("2026-03-31T18:30:00Z"))).toEqual({
      year: 2026,
      month: 4,
      day: 1,
      hour: 0,
      minute: 0,
    });
    expect(istFields(new Date("2025-12-31T20:00:00Z")).year).toBe(2026);
  });

  it("puts the financial-year boundary at midnight IST", () => {
    expect(fyOf(new Date("2026-03-31T18:29:59Z"))).toBe(2025);
    expect(fyOf(new Date("2026-03-31T18:30:00Z"))).toBe(2026);
    const { start, end } = fyRange(2026);
    expect(start.toISOString()).toBe("2026-03-31T18:30:00.000Z");
    expect(end.toISOString()).toBe("2027-03-31T18:30:00.000Z");
  });

  it("formats dates and month keys in IST", () => {
    const late = new Date("2026-01-31T19:05:00Z");
    expect(istDateString(late)).toBe("2026-02-01");
    expect(istMonthKey(late)).toBe("2026-02");
    expect(formatDateIst(late)).toBe("01/02/2026");
    expect(formatDateTimeIst(late)).toBe("01 Feb 2026, 00:35");
    expect(formatDateTimeIst(new Date("2026-09-05T04:30:00Z"))).toBe(
      "05 Sep 2026, 10:00",
    );
  });

  it("round-trips calendar dates and rejects ones that do not exist", () => {
    expect(istDateString(istDateToInstant("2024-02-29") as Date)).toBe(
      "2024-02-29",
    );
    expect(istDateToInstant("2026-02-31")).toBeNull();
    expect(istDateToInstant("2026-13-01")).toBeNull();
    expect(istDateToInstant("01/02/2026")).toBeNull();
  });
});
