import { baseSettings, buy, istDate, sell } from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { normalizeOrders } from "@/tax/core/subgraph/normalize";
import { computeFyReport } from "@/tax/core/tax/compute";
import { scheduleVdaRows } from "@/tax/core/tax/schedule-vda";
import type { OutflowEntry } from "@/tax/core/types";

const FRIEND = `0x${"f".repeat(40)}`;
const WALLET = `0x${"a".repeat(40)}`;

const outflow = (patch: Partial<OutflowEntry>): OutflowEntry => ({
  id: `0x${"1".repeat(64)}:OUT:${FRIEND}:100.000000`,
  txHash: `0x${"1".repeat(64)}`,
  at: istDate("2026-08-01T10:00").toISOString(),
  qty: "100",
  to: FRIEND,
  treatment: "SOLD",
  consideration: "9500",
  ...patch,
});

const orders = () =>
  normalizeOrders([
    buy("2026-06-01T10:00", 200, 18_000), // ₹90 / USDC
    sell("2026-09-01T10:00", 100, 9_200),
  ]).orders;

const report = (outflows: OutflowEntry[]) =>
  computeFyReport({
    orders: orders(),
    lots: [],
    tds: [],
    settings: baseSettings,
    fy: 2026,
    outflows,
  });

describe("USDC sent out outside P2P.me (on-chain check)", () => {
  it("taxes a sale outside P2P.me like a P2P.me sale and puts it in Schedule VDA", () => {
    const r = report([outflow({})]);
    // 9,500 − 9,000 = 500 outside; 9,200 − 9,000 = 200 on P2P.me
    expect(r.tax.taxableIncome.toFixed(2)).toBe("700.00");
    expect(r.outsideSales).toHaveLength(1);
    const rows = scheduleVdaRows(r.disposals, "CAPITAL_GAINS");
    expect(rows.map((x) => x.orderId)).toContain("On-chain 0x111111…1111");
    expect(r.outsideUsdc).toBeNull();
  });

  it("a gift takes the USDC out of holdings without income or an ignored loss", () => {
    const r = report([outflow({ treatment: "GIFT", consideration: "" })]);
    expect(r.tax.taxableIncome.toFixed(2)).toBe("200.00");
    expect(r.tax.ignoredLosses.toFixed(2)).toBe("0.00");
    expect(r.giftsOut).toHaveLength(1);
    expect(r.disposals.some((d) => d.transfer.kind === "GIFT_OUT")).toBe(false);
  });

  it("a gift of more than is held asks for the cost of the outside USDC", () => {
    const r = report([outflow({ treatment: "GIFT", qty: "150" })]);
    // 150 given + 100 sold > 200 bought
    expect(r.outsideUsdc?.missing.toFixed(2)).toBe("50.00");
  });

  it("ignores moves to own accounts and to a wallet now in the wallet set", () => {
    const own = report([outflow({ treatment: "OWN" })]);
    expect(own.tax.taxableIncome.toFixed(2)).toBe("200.00");
    const added = computeFyReport({
      orders: orders(),
      lots: [],
      tds: [],
      settings: baseSettings,
      fy: 2026,
      wallets: [WALLET, FRIEND],
      outflows: [outflow({})],
    });
    expect(added.outsideSales).toHaveLength(0);
  });

  it("leaves out a sale with no valid INR value and reports it", () => {
    const r = report([outflow({ consideration: "abc" })]);
    expect(r.outflowIssues).toHaveLength(1);
    expect(r.outsideSales).toHaveLength(0);
  });
});
