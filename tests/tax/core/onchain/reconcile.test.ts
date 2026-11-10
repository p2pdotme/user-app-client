import { istDate, normalized } from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import {
  p2pRateNear,
  reconcile,
  type TokenTransfer,
  USDC_BASE,
} from "@/tax/core/onchain";
import type { NormalizedOrder } from "@/tax/core/types";
import { D } from "@/tax/lib/decimal";

const W = `0x${"a".repeat(40)}`; // factories' default wallet
const W2 = `0x${"b".repeat(40)}`;
const ESCROW = `0x${"e".repeat(40)}`;
const FRIEND = `0x${"f".repeat(40)}`;
const CEX = `0x${"c".repeat(40)}`;
const P2P_TOKEN = `0x${"7".repeat(40)}`;

let n = 0;
const hash = () => `0x${(++n).toString(16).padStart(64, "0")}`;

const usdc = (
  local: string,
  from: string,
  to: string,
  amount: string,
  txHash = hash(),
): TokenTransfer => ({
  txHash,
  time: istDate(local),
  from,
  to,
  token: USDC_BASE,
  symbol: "USDC",
  amount: new D(amount),
});

const order = (
  kind: NormalizedOrder["kind"],
  local: string,
  qty: string,
  inr: string,
  extra: Partial<NormalizedOrder> = {},
): NormalizedOrder => ({ ...normalized(kind, local, qty, inr), ...extra });

describe("on-chain reconciliation", () => {
  it("matches orders by hash, or by amount and nearest time, incl. fee legs", () => {
    const tx = hash();
    const orders = [
      order("BUY", "2026-06-01T10:00", "100", "9000", { txHash: tx }),
      // Sell of 50 + 0.5 fee, escrowed 2 hours before completion
      order("SELL", "2026-06-05T12:00", "50", "4600", {
        feeQtyFromLots: new D("0.5"),
      }),
    ];
    const sellTx = hash();
    const rec = reconcile({
      orders,
      wallets: [W],
      transfers: [
        usdc("2026-06-01T09:58", ESCROW, W, "100", tx),
        usdc("2026-06-05T10:00", W, ESCROW, "50", sellTx),
        usdc("2026-06-05T10:00", W, ESCROW, "0.5", sellTx),
      ],
    });
    expect(rec.ordersChecked).toBe(2);
    expect(rec.matched).toBe(2);
    expect(rec.inflows).toHaveLength(0);
    expect(rec.outflows).toHaveLength(0);
  });

  it("lists what moved outside P2P.me: sent to a friend, withdrawn from an exchange", () => {
    const rec = reconcile({
      orders: [],
      wallets: [W],
      transfers: [
        usdc("2026-07-01T10:00", CEX, W, "300"),
        usdc("2026-07-02T10:00", W, FRIEND, "120"),
      ],
    });
    expect(rec.inflows.map((m) => [m.counterparty, m.qty.toString()])).toEqual([
      [CEX, "300"],
    ]);
    expect(rec.outflows.map((m) => [m.counterparty, m.qty.toString()])).toEqual(
      [[FRIEND, "120"]],
    );
    expect(rec.outflows[0].id).toContain(":OUT:");
  });

  it("ignores moves between the taxpayer's own wallets and duplicate rows", () => {
    const own = usdc("2026-07-01T10:00", W, W2, "40");
    const rec = reconcile({
      orders: [],
      wallets: [W, W2],
      // the same internal transfer appears in both wallets' files
      transfers: [own, { ...own }, usdc("2026-07-03T10:00", CEX, W2, "5")],
    });
    expect(rec.internal).toBe(1);
    expect(rec.outflows).toHaveLength(0);
    expect(rec.inflows).toHaveLength(1);
    expect(rec.inflows[0].wallet).toBe(W2);
  });

  it("sets aside an escrow that came back in full (cancelled order)", () => {
    const rec = reconcile({
      orders: [],
      wallets: [W],
      transfers: [
        usdc("2026-08-01T10:00", W, ESCROW, "25"),
        usdc("2026-08-01T11:00", ESCROW, W, "25"),
      ],
    });
    expect(rec.returned).toHaveLength(1);
    expect(rec.inflows).toHaveLength(0);
    expect(rec.outflows).toHaveLength(0);
  });

  it("does not hide a sale that the same address later matches with another payment", () => {
    const rec = reconcile({
      orders: [],
      wallets: [W],
      transfers: [
        usdc("2026-08-01T10:00", W, FRIEND, "100"),
        usdc("2026-08-03T10:00", W, FRIEND, "30"),
        usdc("2026-08-05T10:00", FRIEND, W, "100"),
      ],
    });
    // The next movement with FRIEND after the first 100 out is another outflow
    expect(rec.returned).toHaveLength(0);
    expect(rec.outflows).toHaveLength(2);
    expect(rec.inflows).toHaveLength(1);
  });

  it("keeps a second order in the same transaction available", () => {
    const tx = hash();
    const rec = reconcile({
      orders: [
        order("SELL", "2026-06-05T12:00", "40", "3600", { txHash: tx }),
        order("SELL", "2026-06-05T12:00", "60", "5400", { txHash: tx }),
      ],
      wallets: [W],
      transfers: [
        usdc("2026-06-05T12:00", W, ESCROW, "40", tx),
        usdc("2026-06-05T12:00", W, ESCROW, "60", tx),
      ],
    });
    expect(rec.matched).toBe(2);
    expect(rec.outflows).toHaveLength(0);
  });

  it("does not take an exchange withdrawal days before a purchase as its delivery", () => {
    const rec = reconcile({
      orders: [order("BUY", "2026-06-10T10:00", "50", "4500")],
      wallets: [W],
      transfers: [usdc("2026-06-07T10:00", CEX, W, "50")],
    });
    expect(rec.matched).toBe(0);
    expect(rec.inflows).toHaveLength(1);
  });

  it("flags a swap of another token for USDC", () => {
    const tx = hash();
    const rec = reconcile({
      orders: [],
      wallets: [W],
      transfers: [
        usdc("2026-11-01T10:00", FRIEND, W, "19.65", tx),
        {
          txHash: tx,
          time: istDate("2026-11-01T10:00"),
          from: W,
          to: FRIEND,
          token: P2P_TOKEN,
          symbol: "P2P",
          amount: new D("50.41"),
        },
        {
          txHash: hash(),
          time: istDate("2026-11-02T10:00"),
          from: CEX,
          to: W,
          token: `0x${"8".repeat(40)}`,
          symbol: "AIRDROP",
          amount: new D("1000"),
        },
      ],
    });
    expect(rec.inflows).toHaveLength(1);
    expect(rec.inflows[0].swap).toEqual([
      { symbol: "P2P", token: P2P_TOKEN, amount: new D("50.41") },
    ]);
    expect(rec.otherTokens).toEqual([{ symbol: "AIRDROP", count: 1 }]);
  });

  it("does not expect a transfer for a purchase delivered elsewhere, and reports unmatched orders", () => {
    const rec = reconcile({
      orders: [
        order("BUY", "2026-06-01T10:00", "10", "900", { recipient: FRIEND }),
        order("SELL", "2026-06-02T10:00", "7", "650"),
      ],
      wallets: [W],
      transfers: [],
    });
    expect(rec.ordersChecked).toBe(1);
    expect(rec.unmatchedOrders.map((o) => o.kind)).toEqual(["SELL"]);
  });

  it("does not match a transfer more than 7 days before the order", () => {
    const rec = reconcile({
      orders: [order("SELL", "2026-06-20T10:00", "7", "650")],
      wallets: [W],
      transfers: [usdc("2026-06-01T10:00", W, ESCROW, "7")],
    });
    expect(rec.matched).toBe(0);
    expect(rec.outflows).toHaveLength(1);
  });
});

describe("P2P.me rate near a date", () => {
  it("uses orders within 15 days, else all orders", () => {
    const orders = [
      order("SELL", "2026-06-01T10:00", "10", "900"),
      order("SELL", "2026-09-01T10:00", "10", "1000"),
    ];
    expect(p2pRateNear(orders, istDate("2026-06-05T10:00"))?.toString()).toBe(
      "90",
    );
    expect(p2pRateNear(orders, istDate("2027-01-01T10:00"))?.toString()).toBe(
      "95",
    );
    expect(p2pRateNear([], istDate("2027-01-01T10:00"))).toBeNull();
  });
});
