import { baseSettings, buy, sell } from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import { computeFyReport } from "@/tax/core/tax/compute";
import {
  scheduleTotal,
  scheduleVdaCsv,
  scheduleVdaRows,
} from "@/tax/core/tax/schedule-vda";
import { D } from "@/tax/lib/decimal";
import { formatInr, formatNumber, formatUsdc } from "@/tax/lib/format";
import {
  EMPTY_MANUAL,
  parseManualData,
  serializeManualData,
} from "@/tax/lib/manual-data";

describe("manual data JSON", () => {
  it("round-trips export → import", () => {
    const data = {
      ...EMPTY_MANUAL,
      settings: {
        ...baseSettings,
        costMethod: "AVERAGE" as const,
        regime: "OLD" as const,
      },
      lots: [
        {
          id: "l1",
          kind: "OPENING" as const,
          date: "2025-01-01",
          qty: "10",
          cost: "900",
          source: "EXCHANGE" as const,
          costUnknown: false,
          note: "old",
        },
      ],
      tds: [
        { id: "t1", date: "2026-05-01", amount: "100", reference: "TAN123" },
      ],
      notMyWallets: [`0x${"c".repeat(40)}`],
    };
    expect(parseManualData(serializeManualData(data))._unsafeUnwrap()).toEqual(
      data,
    );
  });

  it("round-trips on-chain answers and linked receipts, dropping bad ones", () => {
    const hash = `0x${"1".repeat(64)}`;
    const to = `0x${"f".repeat(40)}`;
    const good = {
      id: `${hash}:OUT:${to}:5.000000`,
      txHash: hash,
      at: "2026-08-01T04:30:00.000Z",
      qty: "5.000000",
      to,
      treatment: "SOLD" as const,
      consideration: "450",
    };
    const data = {
      ...EMPTY_MANUAL,
      lots: [
        {
          id: "l1",
          kind: "EXTERNAL" as const,
          date: "2026-07-01",
          qty: "3",
          cost: "264",
          source: "EXCHANGE" as const,
          costUnknown: false,
          note: "",
          txRef: `${hash}:IN:${to}:3.000000`,
        },
      ],
      outflows: [good],
    };
    expect(parseManualData(serializeManualData(data))._unsafeUnwrap()).toEqual(
      data,
    );
    const tampered = JSON.stringify({
      ...data,
      outflows: [
        good,
        { ...good, txHash: "0xnope" },
        { ...good, treatment: "X" },
      ],
    });
    expect(parseManualData(tampered)._unsafeUnwrap().outflows).toEqual([good]);
  });

  it("rejects non-JSON and wrong versions", () => {
    expect(parseManualData("nope")._unsafeUnwrapErr().code).toBe(
      "ImportParseError",
    );
    expect(parseManualData('{"version":2}')._unsafeUnwrapErr().code).toBe(
      "ImportVersionError",
    );
    expect(parseManualData("[]")._unsafeUnwrapErr().code).toBe(
      "ImportVersionError",
    );
  });

  it("sanitises untrusted fields", () => {
    const parsed = parseManualData(
      JSON.stringify({
        version: 1,
        settings: {
          costMethod: "HIFO",
          regime: 42,
          specifiedPerson: false,
          headOfIncome: "BUSINESS",
        },
        lots: [
          { kind: "BOGUS" },
          { kind: "EXTERNAL", qty: 5, note: "x".repeat(500) },
          null,
        ],
        tds: ["bad", { amount: "10" }],
      }),
    )._unsafeUnwrap();
    expect(parsed.settings).toEqual({
      ...baseSettings,
      // old single switch described the user
      userSpecifiedPerson: false,
      headOfIncome: "BUSINESS",
    });
    expect(parsed.lots).toHaveLength(1);
    expect(parsed.lots[0].qty).toBe("");
    expect(parsed.lots[0].note).toHaveLength(200);
    expect(parsed.tds).toHaveLength(1);
    expect(parsed.tds[0].id).toBeTruthy();
  });

  it("migrates lots saved before receipt types existed", () => {
    const parsed = parseManualData(
      JSON.stringify({
        version: 1,
        lots: [
          { kind: "OPENING", date: "2025-01-01", qty: "10", cost: "900" },
          {
            kind: "EXTERNAL",
            date: "2025-01-01",
            qty: "5",
            source: "UNKNOWN",
            costUnknown: true,
          },
        ],
        notMyWallets: ["0xNOT-AN-ADDRESS", `0x${"D".repeat(40)}`],
      }),
    )._unsafeUnwrap();
    expect(parsed.lots.map((l) => l.source)).toEqual(["EXCHANGE", "UNKNOWN"]);
    expect(parsed.notMyWallets).toEqual([`0x${"d".repeat(40)}`]);
    expect(parsed.settings.costMethodLocked).toBe(false);
  });
});

describe("Schedule VDA", () => {
  const orders = normalizeOrders([
    buy("2026-06-01T10:00", 500, 44_500),
    buy("2026-07-10T10:00", 500, 45_500),
    sell("2026-09-05T10:00", 700, 65_100),
    sell("2026-12-20T10:00", 300, 27_000),
  ]).orders;
  const report = computeFyReport({
    orders,
    lots: [],
    tds: [],
    settings: baseSettings,
    fy: 2026,
  });
  const rows = scheduleVdaRows(report.disposals, "CAPITAL_GAINS");

  it("splits a sale lot-wise, one acquisition date per row", () => {
    // 700 sold: 500 from 1 Jun lot + 200 from 10 Jul lot; 300 sold from 10 Jul lot
    expect(rows).toHaveLength(3);
    expect(
      rows.map((r) => r.acquisitionDate?.toISOString().slice(0, 10)),
    ).toEqual(["2026-06-01", "2026-07-10", "2026-07-10"]);
    // consideration shared pro rata: 65,100 × 500/700 and × 200/700
    expect(rows[0].consideration.toFixed(2)).toBe("46500.00");
    expect(rows[1].consideration.toFixed(2)).toBe("18600.00");
    // the sale's income (65,100 − 62,700 = 2,400) is shared by quantity
    expect(rows[0].income.toFixed(2)).toBe("1714.29");
    expect(rows[1].income.toFixed(2)).toBe("685.71");
    expect(scheduleTotal(rows).toFixed(2)).toBe("2400.00");
  });

  it("shows nil income on a loss row and keeps the loss as a memo", () => {
    expect(rows[2].income.toFixed(2)).toBe("0.00");
    expect(rows[2].loss.toFixed(2)).toBe("300.00");
    expect(rows.every((r) => !r.income.isNegative())).toBe(true);
  });

  it("exports CSV with plain 2-dp numbers, IST dates and nil on loss", () => {
    const csv = scheduleVdaCsv(rows, {
      sl: "Sl",
      orderId: "Order",
      acq: "Acq",
      transfer: "Transfer",
      head: "Head",
      acquiredAs: "Acquired as",
      cost: "Cost",
      consideration: "Consideration",
      income: "Income",
      loss: "Loss",
      headCg: "Capital Gain",
      headBusiness: "Business",
    });
    const lines = csv.split(/\r?\n/);
    expect(lines[0]).toBe(
      "Sl,Order,Acq,Transfer,Head,Acquired as,Cost,Consideration,Income,Loss",
    );
    expect(lines[1]).toContain(
      "01/06/2026,05/09/2026,Capital Gain,Bought on P2P.me,44500.00,46500.00,1714.29,0.00",
    );
    expect(lines[3]).toContain("27300.00,27000.00,0.00,300.00");
    expect(csv).not.toMatch(/,-\d/);
  });
});

describe("display formatting (rounding only for display)", () => {
  it("uses Indian grouping and 2 dp for ₹", () => {
    expect(formatInr(new D("1234567.891"))).toBe("₹12,34,567.89");
    expect(formatInr(new D("-300"))).toBe("−₹300.00");
    expect(formatInr(new D("-0.001"))).toBe("₹0.00");
  });
  it("uses 6 dp for USDC", () => {
    expect(formatUsdc(new D("1234.5"))).toBe("1,234.500000");
    expect(formatNumber(new D("999.9999995"), 6)).toBe("1,000.000000");
  });
});
