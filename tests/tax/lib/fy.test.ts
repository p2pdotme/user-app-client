import { baseSettings, buy, istDate, sell } from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import { computeFyReport } from "@/tax/core/tax/compute";
import {
  fyLabel,
  fyMonthKeys,
  fyOf,
  istDateToInstant,
  lawForFy,
  selectableFys,
} from "@/tax/lib/fy";

describe("IST financial-year boundary", () => {
  it("31 Mar 23:30 IST is FY 2025-26; 1 Apr 00:10 IST is FY 2026-27", () => {
    expect(fyOf(istDate("2026-03-31T23:30"))).toBe(2025);
    expect(fyOf(istDate("2026-04-01T00:10"))).toBe(2026);
  });

  it("a UTC timestamp on 31 Mar 19:00 UTC is already 1 Apr in IST", () => {
    expect(fyOf(new Date("2026-03-31T19:00:00Z"))).toBe(2026);
    expect(fyOf(new Date("2026-03-31T18:29:59Z"))).toBe(2025);
  });

  it("assigns sales to the right FY in the report", () => {
    const orders = normalizeOrders([
      buy("2026-01-01T10:00", 200, 17_000),
      sell("2026-03-31T23:30", 100, 9_000),
      sell("2026-04-01T00:10", 100, 9_500),
    ]).orders;
    const fy25 = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2025,
    });
    const fy26 = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(fy25.disposals).toHaveLength(1);
    expect(fy25.tax.taxableIncome.toFixed(2)).toBe("500.00");
    expect(fy25.law).toBe("ITA_1961");
    expect(fy26.disposals).toHaveLength(1);
    expect(fy26.tax.taxableIncome.toFixed(2)).toBe("1000.00");
    expect(fy26.law).toBe("ITA_2025");
  });
});

describe("fy helpers", () => {
  it("labels and law versions", () => {
    expect(fyLabel(2026)).toBe("FY 2026-27");
    expect(fyLabel(2099)).toBe("FY 2099-00");
    expect(lawForFy(2025)).toBe("ITA_1961");
    expect(lawForFy(2026)).toBe("ITA_2025");
  });

  it("month keys run April → March", () => {
    const keys = fyMonthKeys(2026);
    expect(keys[0]).toBe("2026-04");
    expect(keys[11]).toBe("2027-03");
  });

  it("validates IST calendar dates", () => {
    expect(istDateToInstant("2026-04-01")?.toISOString()).toBe(
      "2026-03-31T18:30:00.000Z",
    );
    expect(istDateToInstant("2026-02-31")).toBeNull();
    expect(istDateToInstant("01/04/2026")).toBeNull();
  });

  it("selectable FYs include FY 2026-27 and start at FY 2022-23", () => {
    const list = selectableFys(new Date("2026-11-06T00:00:00Z"));
    expect(list[0]).toBe(2026);
    expect(list[list.length - 1]).toBe(2022);
  });
});
