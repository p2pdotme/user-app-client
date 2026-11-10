/**
 * Use cases from the SWAN review note (6 Nov 2026), test matrix rows as numbered
 * there, and the open points of the 7 Nov 2026 re-check.
 */
import {
  baseSettings,
  buy,
  rawOrder,
  sell,
} from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { CURRENCY_INR, ORDER_TYPE } from "@/tax/core/subgraph/config";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import { computeFyReport, type ReportInput } from "@/tax/core/tax/compute";
import type { ManualLot, RawOrder, ReceiptType } from "@/tax/core/types";

const WALLET = `0x${"a".repeat(40)}`;
const OTHER = `0x${"b".repeat(40)}`;
const STRANGER = `0x${"e".repeat(40)}`;

function report(raws: RawOrder[], extra: Partial<ReportInput> = {}) {
  const { orders, excluded } = normalizeOrders(raws);
  return computeFyReport({
    orders,
    excluded,
    lots: [],
    tds: [],
    settings: baseSettings,
    fy: 2026,
    wallets: [WALLET],
    ...extra,
  });
}

const lot = (
  source: ReceiptType,
  qty: string,
  cost: string,
  date = "2026-05-01",
): ManualLot => ({
  id: `${source}-${qty}-${date}`,
  kind: "EXTERNAL",
  date,
  qty,
  cost,
  source,
  costUnknown: false,
  note: "",
});

const sale100 = () => [sell("2026-06-02T10:00", 100, 9_800)];

describe("#7 platform fee in INR on a buy is not part of cost", () => {
  it("₹680 paid for 6.547 USDC costs ₹674.85; the ₹5.15 fee stays out", () => {
    const r = report([
      buy("2026-04-10T10:00", 6.547, 674.85, {
        actualFiatAmount: "680000000",
        fixedFeePaid: "50000",
      }),
      sell("2026-04-20T10:00", 6.547, 690),
    ]);
    expect(r.disposals[0].cost.toFixed(2)).toBe("674.85");
    expect(r.tax.taxableIncome.toFixed(2)).toBe("15.15");
    expect(r.buyFeesInr.toFixed(2)).toBe("5.15");
    expect(r.inrSpent.toFixed(2)).toBe("674.85");
  });
});

describe("#9 to #14 cost depends on how outside USDC came in", () => {
  it("#9 bought on an exchange: cost is the INR paid", () => {
    const r = report(sale100(), { lots: [lot("EXCHANGE", "100", "9500")] });
    expect(r.tax.taxableIncome.toFixed(2)).toBe("300.00");
    expect(r.receiptIncome).toHaveLength(0);
  });

  it("#14 moved from own wallet: original cost carries over", () => {
    const r = report(sale100(), { lots: [lot("OWN_WALLET", "100", "9000")] });
    expect(r.tax.taxableIncome.toFixed(2)).toBe("800.00");
    expect(r.receiptIncome).toHaveLength(0);
  });

  it("#10 salary: income on receipt at value; that value is the cost", () => {
    const r = report(sale100(), { lots: [lot("SALARY", "100", "9700")] });
    expect(r.tax.taxableIncome.toFixed(2)).toBe("100.00");
    expect(r.receiptIncome).toEqual([
      expect.objectContaining({ head: "SALARY_OR_BUSINESS" }),
    ]);
    expect(r.tax.receiptIncome.toFixed(2)).toBe("9700.00");
  });

  it("#11 reward / airdrop: income from other sources on receipt", () => {
    const r = report(sale100(), { lots: [lot("REWARD", "100", "9700")] });
    expect(r.receiptIncome[0].head).toBe("OTHER_SOURCES");
    expect(r.tax.taxableIncome.toFixed(2)).toBe("100.00");
  });

  it("#12 gift from a relative: not income; giver's cost carries", () => {
    const r = report(sale100(), {
      lots: [lot("GIFT_RELATIVE", "100", "8500")],
    });
    expect(r.receiptIncome).toHaveLength(0);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("1300.00");
  });

  it("#13 non-relative gifts up to ₹50,000, giver's cost unknown: nil cost", () => {
    const r = report(sale100(), {
      lots: [lot("GIFT_NON_RELATIVE", "100", "9700")],
    });
    expect(r.receiptIncome).toHaveLength(0);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("9800.00");
  });

  it("#13 non-relative gifts up to ₹50,000: cost is the giver's cost (s.49(1)(ii))", () => {
    const r = report(sale100(), {
      lots: [{ ...lot("GIFT_NON_RELATIVE", "100", "9700"), giverCost: "9000" }],
    });
    expect(r.receiptIncome).toHaveLength(0);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("800.00");
  });

  it("#13 other gifts from non-relatives (money, property) count towards ₹50,000", () => {
    const r = report(sale100(), {
      lots: [{ ...lot("GIFT_NON_RELATIVE", "100", "9700"), giverCost: "9000" }],
      otherGifts: { "2026": "45000" },
    });
    // 45,000 + 9,700 > 50,000 → taxed on receipt; cost = value taxed
    expect(r.receiptIncome).toHaveLength(1);
    expect(r.tax.receiptIncome.toFixed(2)).toBe("9700.00");
    expect(r.tax.taxableIncome.toFixed(2)).toBe("100.00");
  });

  it("other gifts of another year do not count", () => {
    const r = report(sale100(), {
      lots: [lot("GIFT_NON_RELATIVE", "100", "9700")],
      otherGifts: { "2025": "45000" },
    });
    expect(r.receiptIncome).toHaveLength(0);
  });

  it("#13 non-relative gifts above ₹50,000 in aggregate: taxed on receipt, cost = value", () => {
    const r = report([sell("2026-06-02T10:00", 600, 58_800)], {
      lots: [
        lot("GIFT_NON_RELATIVE", "300", "29100", "2026-04-15"),
        lot("GIFT_NON_RELATIVE", "300", "29100", "2026-05-15"),
      ],
    });
    // aggregate ₹58,200 > ₹50,000 → both taxed, cost = value
    expect(r.receiptIncome).toHaveLength(2);
    expect(r.tax.receiptIncome.toFixed(2)).toBe("58200.00");
    expect(r.tax.taxableIncome.toFixed(2)).toBe("600.00");
  });

  it("income on receipt counts towards the surcharge slab", () => {
    const r = report(sale100(), {
      lots: [lot("SALARY", "100", "9700")],
      settings: { ...baseSettings, otherIncome: "4995000" },
    });
    // 49,95,000 + 9,700 + 100 > 50 lakh
    expect(r.tax.surchargeRate.toString()).toBe("0.1");
  });
});

describe("#15 / #16 purchases delivered to another address", () => {
  const deliveredTo = (to: string) => [
    buy("2026-05-01T10:00", 100, 9_000, { usdcRecipientAddress: to }),
    sell("2026-06-02T10:00", 100, 9_800),
  ];

  it("#15 a lot delivered elsewhere is not this wallet's cost and must be answered", () => {
    const r = report(deliveredTo(OTHER));
    expect(r.deliveredElsewhere).toEqual([
      expect.objectContaining({ address: OTHER, status: "PENDING" }),
    ]);
    expect(r.buys).toHaveLength(0);
    expect(r.allBuys).toHaveLength(1);
    expect(r.outsideUsdc?.missing.toString()).toBe("100");
  });

  it("#15 'not mine' is recorded and the lot stays out", () => {
    const r = report(deliveredTo(STRANGER), { notMyWallets: [STRANGER] });
    expect(r.deliveredElsewhere[0].status).toBe("NOT_MINE");
    expect(r.outsideUsdc).not.toBeNull();
  });

  it("#16 same taxpayer, two wallets: one FIFO pool across both", () => {
    const r = report(
      [
        buy("2026-05-01T10:00", 100, 9_000, { usdcRecipientAddress: OTHER }),
        sell("2026-06-02T10:00", 100, 9_800, { userAddress: OTHER }),
      ],
      { wallets: [WALLET, OTHER] },
    );
    expect(r.deliveredElsewhere).toHaveLength(0);
    expect(r.outsideUsdc).toBeNull();
    expect(r.tax.taxableIncome.toFixed(2)).toBe("800.00");
  });

  it("delivery to the zero address or a missing field counts as the placer's wallet", () => {
    const r = report([
      buy("2026-05-01T10:00", 100, 9_000, {
        usdcRecipientAddress: `0x${"0".repeat(40)}`,
      }),
      sell("2026-06-02T10:00", 100, 9_800),
    ]);
    expect(r.deliveredElsewhere).toHaveLength(0);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("800.00");
  });
});

describe("re-check: income is per sale; lot rows share it by quantity", () => {
  it("a sale with a net gain is taxed on that gain, not on its gaining lots", () => {
    const r = report([
      buy("2026-04-01T10:00", 100, 9_000),
      buy("2026-04-02T10:00", 100, 10_500),
      sell("2026-05-01T10:00", 200, 19_800),
    ]);
    // sale: 19,800 − (9,000 + 10,500) = +300. Lot by lot it would be +900 / −600.
    const rows = r.disposals[0].rows;
    expect(rows.map((x) => x.cost.toFixed(2))).toEqual(["9000.00", "10500.00"]);
    expect(rows.map((x) => x.income.toFixed(2))).toEqual(["150.00", "150.00"]);
    expect(rows.every((x) => x.loss.isZero())).toBe(true);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("300.00");
    expect(r.tax.ignoredLosses.toFixed(2)).toBe("0.00");
  });

  it("every row of a loss-making sale shows nil; the loss is a memo", () => {
    const r = report([
      buy("2026-04-01T10:00", 100, 9_000),
      buy("2026-04-02T10:00", 300, 31_500),
      sell("2026-05-01T10:00", 400, 39_000),
    ]);
    // sale: 39,000 − 40,500 = −1,500, shared 100 : 300
    const rows = r.disposals[0].rows;
    expect(rows.map((x) => x.income.toFixed(2))).toEqual(["0.00", "0.00"]);
    expect(rows.map((x) => x.loss.toFixed(2))).toEqual(["375.00", "1125.00"]);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("0.00");
    expect(r.tax.ignoredLosses.toFixed(2)).toBe("1500.00");
  });

  it("losses on one sale are still not set off against another sale", () => {
    const r = report([
      buy("2026-04-01T10:00", 200, 18_000),
      sell("2026-05-01T10:00", 100, 9_500),
      sell("2026-05-02T10:00", 100, 8_700),
    ]);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("500.00");
    expect(r.tax.ignoredLosses.toFixed(2)).toBe("300.00");
  });

  it("quarter-wise accrual for the ITR", () => {
    const r = report([
      buy("2026-04-01T10:00", 300, 27_000),
      sell("2026-06-15T23:00", 100, 9_500),
      sell("2026-06-16T10:00", 100, 9_600),
      sell("2027-03-20T10:00", 100, 9_700),
    ]);
    expect(r.quarters.map((q) => [q.label, q.income.toFixed(2)])).toEqual([
      ["Up to 15 June", "500.00"],
      ["16 June to 15 September", "600.00"],
      ["16 September to 15 December", "0.00"],
      ["16 December to 15 March", "0.00"],
      ["16 March to 31 March", "700.00"],
    ]);
  });
});

describe("#31 non-INR orders are listed, not silently dropped", () => {
  it("lists completed non-INR orders in the year", () => {
    const r = report([
      buy("2026-04-01T10:00", 10, 900),
      rawOrder({
        type: ORDER_TYPE.SELL,
        currency:
          "0x42524c0000000000000000000000000000000000000000000000000000000000",
      }),
    ]);
    expect(r.nonInrOrders).toHaveLength(1);
    expect(r.nonInrOrders[0].currency).toBe("BRL");
    expect(CURRENCY_INR).toMatch(/^0x494e52/);
  });
});

describe("#19 to #21 TDS per counterparty", () => {
  it("#19 buyer crossing ₹10,000: 1% on everything that buyer paid", () => {
    const m = `0x${"9".repeat(40)}`;
    const r = report([
      buy("2026-04-01T10:00", 300, 27_000),
      sell("2026-05-01T10:00", 60, 6_000, { acceptedMerchantAddress: m }),
      sell("2026-05-02T10:00", 60, 6_000, { acceptedMerchantAddress: m }),
    ]);
    expect(r.sellerTds.expected.toFixed(2)).toBe("120.00");
    expect(r.sellerTds.threshold.toString()).toBe("10000");
  });

  it("#20 many buyers, none above the limit: no TDS", () => {
    const r = report([
      buy("2026-04-01T10:00", 300, 27_000),
      ...Array.from({ length: 5 }, (_, i) =>
        sell(`2026-05-0${i + 1}T10:00`, 50, 5_000, {
          acceptedMerchantAddress: `0x${String(i).repeat(40)}`,
        }),
      ),
    ]);
    expect(r.sellerTds.expected.toFixed(2)).toBe("0.00");
  });

  it("#21 buyer side uses the user's own status, separate from the seller side", () => {
    const m = `0x${"7".repeat(40)}`;
    const r = report(
      [
        buy("2026-04-01T10:00", 300, 30_000, { acceptedMerchantAddress: m }),
        sell("2026-05-01T10:00", 120, 12_000, { acceptedMerchantAddress: m }),
      ],
      {
        settings: {
          ...baseSettings,
          userSpecifiedPerson: true,
          counterpartySpecifiedPerson: false,
        },
      },
    );
    expect(r.buyerTds.threshold.toString()).toBe("50000");
    expect(r.buyerTds.total.toFixed(2)).toBe("0.00");
    expect(r.sellerTds.threshold.toString()).toBe("10000");
    expect(r.sellerTds.expected.toFixed(2)).toBe("120.00");
  });
});

describe("worked example still holds exactly", () => {
  it("taxable ₹2,400, total ₹748.80", () => {
    const r = report([
      buy("2026-06-01T10:00", 500, 44_500),
      buy("2026-07-10T10:00", 500, 45_500),
      sell("2026-09-05T10:00", 700, 65_100),
      sell("2026-12-20T10:00", 300, 27_000),
    ]);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("2400.00");
    expect(r.tax.totalTax.toFixed(2)).toBe("748.80");
    expect(r.outsideUsdc).toBeNull();
    expect(r.deliveredElsewhere).toHaveLength(0);
  });
});

describe("sanity: buyer advisory counts every purchase the user paid for", () => {
  it("includes purchases delivered elsewhere", () => {
    const r = report(
      [
        buy("2026-04-01T10:00", 200, 20_000, {
          usdcRecipientAddress: STRANGER,
        }),
      ],
      { notMyWallets: [STRANGER] },
    );
    expect(r.buyerTds.lines).toHaveLength(1);
    expect(r.allBuys).toHaveLength(1);
    expect(r.buys).toHaveLength(0);
  });
});

describe("re-check: advance tax by head of income", () => {
  const q4Gain = () => [
    buy("2026-04-01T10:00", 1000, 80_000),
    sell("2027-03-01T10:00", 1000, 1_80_000),
  ];
  const today = new Date("2026-04-02T00:00:00Z");

  it("capital gains: gains in Q4 are all due by 15 March (proviso to s.234C / s.425)", () => {
    const plan = report(q4Gain(), { today }).advanceTax;
    expect(plan.accrual).toBe(true);
    expect(plan.instalments.map((i) => i.amount.toFixed(2))).toEqual([
      "0.00",
      "0.00",
      "0.00",
      "31200.00",
    ]);
  });

  it("business income: 15/45/75/100% of the whole year's tax", () => {
    const plan = report(q4Gain(), {
      today,
      settings: { ...baseSettings, headOfIncome: "BUSINESS" },
    }).advanceTax;
    expect(plan.accrual).toBe(false);
    expect(plan.instalments.map((i) => i.amount.toFixed(2))).toEqual([
      "4680.00",
      "9360.00",
      "9360.00",
      "7800.00",
    ]);
  });
});

describe("#32 cost methods: FIFO, LIFO, specific identification, weighted average", () => {
  const raws = () => [
    buy("2026-04-01T10:00", 100, 9_000),
    buy("2026-04-10T10:00", 100, 9_800),
    sell("2026-05-01T10:00", 100, 9_900),
  ];
  const taxable = (extra: Partial<ReportInput>) =>
    report(raws(), extra).tax.taxableIncome.toFixed(2);
  const settings = (costMethod: ReportInput["settings"]["costMethod"]) => ({
    ...baseSettings,
    costMethod,
  });

  it("each method gives its own answer", () => {
    expect(taxable({})).toBe("900.00");
    expect(taxable({ settings: settings("LIFO") })).toBe("100.00");
    expect(taxable({ settings: settings("AVERAGE") })).toBe("500.00");
  });

  it("specific identification uses the purchase tagged against the sale", () => {
    const fixed = raws();
    const { orders } = normalizeOrders(fixed);
    const [, second, sale] = orders;
    const r = report(fixed, {
      settings: settings("SPECIFIC"),
      specificLots: { [sale.id]: second.id },
    });
    expect(r.tax.taxableIncome.toFixed(2)).toBe("100.00");
    expect(r.disposals[0].lotsHeld?.map((l) => l.lot.id)).toEqual([
      orders[0].id,
      second.id,
    ]);
  });

  it("specific identification without a tag falls back to oldest first", () => {
    expect(taxable({ settings: settings("SPECIFIC") })).toBe("900.00");
  });
});
