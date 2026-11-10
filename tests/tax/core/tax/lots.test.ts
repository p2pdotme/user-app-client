import { baseSettings, buy, istDate, sell } from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import { computeFyReport } from "@/tax/core/tax/compute";
import {
  type Acquisition,
  matchLots,
  type Transfer,
} from "@/tax/core/tax/lots";
import type { ManualLot } from "@/tax/core/types";
import { D } from "@/tax/lib/decimal";

const acq = (
  id: string,
  local: string,
  qty: string,
  cost: string,
): Acquisition => ({
  id,
  date: istDate(local),
  qty: new D(qty),
  cost: new D(cost),
  source: "P2P",
  costUnknown: false,
});

const xfer = (
  id: string,
  local: string,
  qty: string,
  consideration: string,
  feeQty = "0",
): Transfer => ({
  id,
  orderId: id,
  kind: "SELL",
  date: istDate(local),
  qty: new D(qty),
  consideration: new D(consideration),
  feeQty: new D(feeQty),
  txHash: "0x",
});

describe("FIFO vs weighted average", () => {
  const acqs = [
    acq("a", "2026-06-01T10:00", "500", "44500"),
    acq("b", "2026-07-10T10:00", "500", "45500"),
  ];
  const sales = [
    xfer("s1", "2026-09-05T10:00", "700", "65100"),
    xfer("s2", "2026-12-20T10:00", "300", "27000"),
  ];

  it("FIFO consumes oldest lots first", () => {
    const r = matchLots(acqs, sales, "FIFO");
    expect(r.disposals[0].cost.toFixed(2)).toBe("62700.00");
    expect(
      r.disposals[0].matches.map((m) => [m.lotId, m.qty.toString()]),
    ).toEqual([
      ["a", "500"],
      ["b", "200"],
    ]);
    expect(r.disposals[1].cost.toFixed(2)).toBe("27300.00");
    expect(r.holdingQty.isZero()).toBe(true);
  });

  it("AVERAGE uses running weighted-average cost", () => {
    const r = matchLots(acqs, sales, "AVERAGE");
    // avg = 90,000 / 1000 = ₹90 → 700 × 90 = 63,000 ; 300 × 90 = 27,000
    expect(r.disposals[0].cost.toFixed(2)).toBe("63000.00");
    expect(r.disposals[0].gain.toFixed(2)).toBe("2100.00");
    expect(r.disposals[1].cost.toFixed(2)).toBe("27000.00");
    expect(r.disposals[1].gain.toFixed(2)).toBe("0.00");
    // dates still reported from the lots actually consumed
    expect(r.disposals[0].matches.map((m) => m.lotId)).toEqual(["a", "b"]);
  });

  it("AVERAGE re-averages after a new purchase", () => {
    const r = matchLots(
      [
        acq("a", "2026-04-01T10:00", "100", "9000"),
        acq("b", "2026-05-01T10:00", "100", "10000"),
      ],
      [
        xfer("s1", "2026-04-15T10:00", "50", "5000"),
        xfer("s2", "2026-06-01T10:00", "150", "15000"),
      ],
      "AVERAGE",
    );
    expect(r.disposals[0].cost.toFixed(2)).toBe("4500.00"); // avg 90
    // remaining 50 @ 90 = 4,500 + 100 @ 100 = 10,000 → 150 @ 96.666…
    expect(r.disposals[1].cost.toFixed(2)).toBe("14500.00");
  });

  it("orders BUY before SELL on identical timestamps", () => {
    const r = matchLots(
      [acq("a", "2026-06-01T10:00", "10", "900")],
      [xfer("s", "2026-06-01T10:00", "10", "1000")],
      "FIFO",
    );
    expect(r.disposals[0].shortfallQty.isZero()).toBe(true);
    expect(r.disposals[0].gain.toFixed(2)).toBe("100.00");
  });

  it("does not deduct the cost of USDC paid as fee", () => {
    const r = matchLots(
      [acq("a", "2026-06-01T10:00", "101", "10100")],
      [xfer("s", "2026-06-02T10:00", "100", "10500", "1")],
      "FIFO",
    );
    expect(r.disposals[0].cost.toFixed(2)).toBe("10000.00");
    expect(r.disposals[0].feeCost.toFixed(2)).toBe("100.00");
    expect(r.holdingQty.isZero()).toBe(true);
  });
});

describe("oversell", () => {
  it("flags the shortfall and treats its cost as ₹0", () => {
    const r = matchLots(
      [acq("a", "2026-06-01T10:00", "100", "9000")],
      [xfer("s", "2026-06-02T10:00", "150", "15000")],
      "FIFO",
    );
    const d = r.disposals[0];
    expect(d.shortfallQty.toString()).toBe("50");
    expect(d.cost.toFixed(2)).toBe("9000.00");
    expect(d.gain.toFixed(2)).toBe("6000.00");
  });

  it("is reported in the FY report and resolved by a manual opening balance", () => {
    const orders = normalizeOrders([
      sell("2026-06-02T10:00", 100, 9500),
    ]).orders;
    const flagged = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(flagged.oversold).toHaveLength(1);
    expect(flagged.tax.taxableIncome.toFixed(2)).toBe("9500.00");

    const opening: ManualLot = {
      id: "o",
      kind: "OPENING",
      date: "2025-01-01",
      qty: "100",
      cost: "8,600",
      source: "EXCHANGE",
      costUnknown: false,
      note: "",
    };
    const fixed = computeFyReport({
      orders,
      lots: [opening],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(fixed.oversold).toHaveLength(0);
    expect(fixed.tax.taxableIncome.toFixed(2)).toBe("900.00");
    expect(fixed.disposals[0].matches[0].source).toBe("EXCHANGE");
  });

  it("external deposit with unknown cost uses ₹0 and is listed", () => {
    const orders = normalizeOrders([
      sell("2026-06-02T10:00", 100, 9500),
    ]).orders;
    const ext: ManualLot = {
      id: "e",
      kind: "EXTERNAL",
      date: "2026-05-01",
      qty: "100",
      cost: "",
      source: "UNKNOWN",
      costUnknown: true,
      note: "",
    };
    const r = computeFyReport({
      orders,
      lots: [ext],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(r.oversold).toHaveLength(0);
    expect(r.unknownCostLots).toHaveLength(1);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("9500.00");
  });

  it("reports invalid manual lots instead of using them", () => {
    const bad: ManualLot = {
      id: "x",
      kind: "OPENING",
      date: "2026-02-31",
      qty: "10",
      cost: "1",
      source: "EXCHANGE",
      costUnknown: false,
      note: "",
    };
    const r = computeFyReport({
      orders: [],
      lots: [bad],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(r.manualLotIssues).toEqual([{ id: "x", problem: "INVALID_DATE" }]);
  });
});

describe("lots carried across financial years", () => {
  it("uses a lot bought in FY 2025-26 for a sale in FY 2026-27", () => {
    const orders = normalizeOrders([
      buy("2025-12-01T10:00", 100, 8500),
      buy("2026-05-01T10:00", 100, 9000),
      sell("2026-06-01T10:00", 150, 14_250),
    ]).orders;
    const r = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    // 100 @ 85 + 50 @ 90 = 8,500 + 4,500 = 13,000
    expect(r.disposals[0].cost.toFixed(2)).toBe("13000.00");
    expect(r.disposals[0].matches[0].acquiredAt.getUTCFullYear()).toBe(2025);
    // FY 2026-27 shows only the FY's own buys
    expect(r.usdcBought.toFixed(0)).toBe("100");
  });

  it("the earlier FY sees no disposals", () => {
    const orders = normalizeOrders([
      buy("2025-12-01T10:00", 100, 8500),
      sell("2026-06-01T10:00", 50, 5000),
    ]).orders;
    const r = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2025,
    });
    expect(r.disposals).toHaveLength(0);
    expect(r.law).toBe("ITA_1961");
  });
});

describe("outside USDC (required step)", () => {
  it("reports the USDC not covered by any purchase, including fee USDC", () => {
    const orders = normalizeOrders([
      buy("2026-05-01T10:00", 50, 4_500),
      sell("2026-06-02T10:00", 150, 14_250, { fixedFeePaid: "100000" }),
    ]).orders;
    const r = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(r.outsideUsdc).not.toBeNull();
    // 150 sold + 0.1 fee − 50 bought
    expect(r.outsideUsdc?.missing.toString()).toBe("100.1");
    expect(r.outsideUsdc?.firstShortDate).toBe("2026-06-02");
    expect(r.outsideUsdc?.avgBuyRate?.toFixed(2)).toBe("90.00");
    expect(r.outsideUsdc?.spent.toString()).toBe("150.1");
    expect(r.outsideUsdc?.known.toString()).toBe("50");
  });

  it("is cleared by an external deposit dated on the first short day", () => {
    const orders = normalizeOrders([
      buy("2026-05-01T10:00", 50, 4_500),
      sell("2026-06-02T10:00", 150, 14_250, { fixedFeePaid: "100000" }),
      sell("2026-07-02T10:00", 20, 1_900),
    ]).orders;
    const first = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    const need = first.outsideUsdc;
    expect(need?.missing.toString()).toBe("120.1");
    const lot: ManualLot = {
      id: "x",
      kind: "EXTERNAL",
      date: need?.firstShortDate ?? "",
      qty: need?.missing.toFixed(6) ?? "0",
      cost: "11000",
      source: "EXCHANGE",
      costUnknown: false,
      note: "",
    };
    const fixed = computeFyReport({
      orders,
      lots: [lot],
      tds: [],
      settings: baseSettings,
      fy: 2026,
    });
    expect(fixed.outsideUsdc).toBeNull();
    expect(fixed.oversold).toHaveLength(0);
  });

  it("only looks at history up to the end of the selected FY", () => {
    const orders = normalizeOrders([
      buy("2025-12-01T10:00", 10, 900),
      sell("2026-06-02T10:00", 50, 4_750),
    ]).orders;
    const fy25 = computeFyReport({
      orders,
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2025,
    });
    expect(fy25.outsideUsdc).toBeNull();
  });
});

describe("LIFO and specific identification", () => {
  const acqs = [
    acq("a", "2026-06-01T10:00", "500", "44500"),
    acq("b", "2026-07-10T10:00", "500", "45500"),
  ];
  const sales = [
    xfer("s1", "2026-09-05T10:00", "700", "65100"),
    xfer("s2", "2026-12-20T10:00", "300", "27000"),
  ];

  it("LIFO consumes the newest lot held at the time of the sale", () => {
    const r = matchLots(acqs, sales, "LIFO");
    expect(
      r.disposals[0].matches.map((m) => [m.lotId, m.qty.toString()]),
    ).toEqual([
      ["b", "500"],
      ["a", "200"],
    ]);
    expect(r.disposals[0].cost.toFixed(2)).toBe("63300.00");
    expect(r.disposals[1].cost.toFixed(2)).toBe("26700.00");
  });

  it("LIFO never uses a lot bought after the sale", () => {
    const r = matchLots(
      [acq("a", "2026-04-01T10:00", "100", "9000")],
      [xfer("s1", "2026-05-01T10:00", "100", "9500")],
      "LIFO",
    );
    expect(r.disposals[0].matches.map((m) => m.lotId)).toEqual(["a"]);
  });

  it("SPECIFIC takes the tagged lot first, then oldest first", () => {
    const r = matchLots(acqs, sales, "SPECIFIC", { s2: "b" });
    // s1 untagged → FIFO: a 500, b 200; s2 tagged b → b's remaining 300
    expect(r.disposals[0].cost.toFixed(2)).toBe("62700.00");
    expect(r.disposals[1].matches.map((m) => m.lotId)).toEqual(["b"]);
    expect(r.disposals[1].lotsHeld?.map((l) => l.lot.id)).toEqual(["b"]);
  });

  it("SPECIFIC with a tag for a lot not held falls back to oldest first", () => {
    const r = matchLots(acqs, sales, "SPECIFIC", { s1: "zzz" });
    expect(r.disposals[0].cost.toFixed(2)).toBe("62700.00");
  });

  it("lotsHeld is only reported for SPECIFIC", () => {
    expect(
      matchLots(acqs, sales, "FIFO").disposals[0].lotsHeld,
    ).toBeUndefined();
  });
});
