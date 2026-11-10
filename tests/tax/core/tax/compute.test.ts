import { baseSettings, buy, sell } from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import { computeFyReport, computeTax } from "@/tax/core/tax/compute";
import type { TdsEntry } from "@/tax/core/types";
import { D } from "@/tax/lib/decimal";

const workedExample = () =>
  normalizeOrders([
    buy("2026-06-01T10:00", 500, 44_500),
    buy("2026-07-10T10:00", 500, 45_500),
    sell("2026-09-05T10:00", 700, 65_100),
    sell("2026-12-20T10:00", 300, 27_000),
  ]).orders;

describe("worked example (FY 2026-27)", () => {
  it("matches FIFO cost, ignores the loss and computes tax exactly", () => {
    const r = computeFyReport({
      orders: workedExample(),
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });

    expect(r.disposals.map((d) => d.cost.toFixed(2))).toEqual([
      "62700.00",
      "27300.00",
    ]);
    expect(r.disposals.map((d) => d.gain.toFixed(2))).toEqual([
      "2400.00",
      "-300.00",
    ]);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("2400.00");
    expect(r.tax.ignoredLosses.toFixed(2)).toBe("300.00");
    expect(r.tax.tax.toFixed(2)).toBe("720.00");
    expect(r.tax.surcharge.toFixed(2)).toBe("0.00");
    expect(r.tax.cess.toFixed(2)).toBe("28.80");
    expect(r.tax.totalTax.toFixed(2)).toBe("748.80");
    expect(r.tax.tdsCredit.toFixed(2)).toBe("0.00");
    expect(r.tax.netPayable.toFixed(2)).toBe("748.80");
    expect(r.tax.isRefund).toBe(false);
    expect(r.law).toBe("ITA_2025");
  });

  it("shows a refund of ₹172.20 when ₹921 TDS is entered", () => {
    const tds: TdsEntry[] = [
      { id: "t1", date: "2026-09-05", amount: "921", reference: "26AS" },
    ];
    const r = computeFyReport({
      orders: workedExample(),
      lots: [],
      tds,
      settings: baseSettings,
      fy: 2026,
    });
    expect(r.tax.tdsCredit.toFixed(2)).toBe("921.00");
    expect(r.tax.netPayable.toFixed(2)).toBe("-172.20");
    expect(r.tax.isRefund).toBe(true);
  });

  it("summarises volumes", () => {
    const r = computeFyReport({
      orders: workedExample(),
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(r.usdcBought.toFixed(6)).toBe("1000.000000");
    expect(r.usdcSold.toFixed(6)).toBe("1000.000000");
    expect(r.inrSpent.toFixed(2)).toBe("90000.00");
    expect(r.inrReceived.toFixed(2)).toBe("92100.00");
  });

  it("builds the monthly gain / ignored-loss series", () => {
    const r = computeFyReport({
      orders: workedExample(),
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    const sep = r.monthly.find((m) => m.month === "2026-09");
    const dec = r.monthly.find((m) => m.month === "2026-12");
    expect(r.monthly).toHaveLength(12);
    expect(sep?.gains.toFixed(2)).toBe("2400.00");
    expect(dec?.losses.toFixed(2)).toBe("300.00");
  });

  it("ignores TDS entries dated outside the FY", () => {
    const tds: TdsEntry[] = [
      { id: "a", date: "2026-03-31", amount: "500", reference: "" },
      { id: "b", date: "not-a-date", amount: "500", reference: "" },
      { id: "c", date: "2026-04-01", amount: "abc", reference: "" },
    ];
    const r = computeFyReport({
      orders: workedExample(),
      lots: [],
      tds,
      settings: baseSettings,
      fy: 2026,
    });
    expect(r.tax.tdsCredit.toFixed(2)).toBe("0.00");
  });
});

describe("losses never offset gains", () => {
  it("sums only positive gains", () => {
    const t = computeTax(
      [new D(1000), new D(-5000), new D(500)],
      baseSettings,
      new D(0),
    );
    expect(t.taxableIncome.toFixed(2)).toBe("1500.00");
    expect(t.ignoredLosses.toFixed(2)).toBe("5000.00");
    expect(t.tax.toFixed(2)).toBe("450.00");
  });

  it("has zero tax when every sale is a loss", () => {
    const t = computeTax([new D(-100), new D(-200)], baseSettings, new D(0));
    expect(t.taxableIncome.isZero()).toBe(true);
    expect(t.totalTax.isZero()).toBe(true);
  });

  it("effective rate without surcharge is 31.2%", () => {
    const t = computeTax([new D(100_000)], baseSettings, new D(0));
    expect(t.totalTax.toFixed(2)).toBe("31200.00");
  });
});

describe("surcharge", () => {
  it("uses other income + VDA income to pick the slab", () => {
    const t = computeTax(
      [new D(1_00_000)],
      { ...baseSettings, otherIncome: "49,50,000" },
      new D(0),
    );
    // total = 50,50,000 > 50 lakh → 10%
    expect(t.surchargeRate.toString()).toBe("0.1");
    expect(t.tax.toFixed(2)).toBe("30000.00");
    expect(t.surcharge.toFixed(2)).toBe("3000.00");
    expect(t.cess.toFixed(2)).toBe("1320.00");
    expect(t.totalTax.toFixed(2)).toBe("34320.00");
  });

  it("treats invalid other income as zero", () => {
    const t = computeTax(
      [new D(100)],
      { ...baseSettings, otherIncome: "lots" },
      new D(0),
    );
    expect(t.otherIncome.isZero()).toBe(true);
  });
});

describe("advance tax wiring", () => {
  it("requires advance tax when net payable ≥ ₹10,000", () => {
    const orders = normalizeOrders([
      buy("2026-04-10T10:00", 1000, 90_000),
      sell("2026-05-10T10:00", 1000, 1_30_000),
    ]).orders;
    const r = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
      today: new Date("2026-04-15T00:00:00Z"),
    });
    // gain 40,000 → total tax 12,480
    expect(r.tax.totalTax.toFixed(2)).toBe("12480.00");
    expect(r.advanceTax.required).toBe(true);
    expect(
      r.advanceTax.instalments.map((i) => i.cumulativeAmount.toFixed(2)),
    ).toEqual(["1872.00", "5616.00", "9360.00", "12480.00"]);
  });

  it("does not require advance tax for the worked example", () => {
    const r = computeFyReport({
      orders: workedExample(),
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(r.advanceTax.required).toBe(false);
  });
});
