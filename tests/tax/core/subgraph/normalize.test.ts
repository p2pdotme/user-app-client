import {
  buy,
  istSeconds,
  rawOrder,
  sell,
  units,
} from "@tests/tax/helpers/factories";
import { describe, expect, it } from "vitest";
import { DISPUTE_STATUS, ORDER_TYPE } from "@/tax/core/subgraph/config";
import {
  decodeCurrency,
  normalizeOrders,
  rateOf,
} from "@/tax/core/subgraph/normalize";
import type { NormalizedOrder } from "@/tax/core/types";

const only = (r: ReturnType<typeof normalizeOrders>): NormalizedOrder => {
  expect(r.orders).toHaveLength(1);
  return r.orders[0];
};

describe("decimal scaling", () => {
  it("scales USDC and INR by 6 decimals", () => {
    const o = only(
      normalizeOrders([
        rawOrder({ usdcAmount: "15262515", fiatAmount: "1499999974" }),
      ]),
    );
    expect(o.qty.toString()).toBe("15.262515");
    expect(o.inr.toString()).toBe("1499.999974");
    expect(rateOf(o).toFixed(4)).toBe("98.2800");
  });

  it("keeps full precision for large amounts", () => {
    const o = only(
      normalizeOrders([
        rawOrder({
          usdcAmount: "123456789012345",
          fiatAmount: "11111111111111111",
        }),
      ]),
    );
    expect(o.qty.toString()).toBe("123456789.012345");
    expect(o.inr.toString()).toBe("11111111111.111111");
  });

  it("decodes bytes32 currency codes", () => {
    expect(
      decodeCurrency(
        "0x494e520000000000000000000000000000000000000000000000000000000000",
      ),
    ).toBe("INR");
  });
});

describe("actualUsdcAmount / actualFiatAmount fallback", () => {
  it("uses actual amounts when non-zero", () => {
    const o = only(
      normalizeOrders([
        rawOrder({
          usdcAmount: units(100),
          actualUsdcAmount: units(90),
          fiatAmount: units(9000),
          actualFiatAmount: units(8100),
        }),
      ]),
    );
    expect(o.qty.toString()).toBe("90");
    expect(o.inr.toString()).toBe("8100");
  });

  it("falls back to usdcAmount / fiatAmount when actual is 0", () => {
    const o = only(
      normalizeOrders([
        rawOrder({
          usdcAmount: units(100),
          actualUsdcAmount: "0",
          fiatAmount: units(9000),
          actualFiatAmount: "0",
        }),
      ]),
    );
    expect(o.qty.toString()).toBe("100");
    expect(o.inr.toString()).toBe("9000");
  });
});

describe("fees are never deducted", () => {
  it("BUY: the full INR paid, fee included, is the cost of acquisition", () => {
    // live example: 5.1 USDC, fiat 516.987, actualFiat 522.0555, fee 0.05 USDC
    const o = only(
      normalizeOrders([
        rawOrder({
          type: ORDER_TYPE.BUY,
          usdcAmount: "5100000",
          actualUsdcAmount: "5100000",
          fiatAmount: "516987000",
          actualFiatAmount: "522055500",
          fixedFeePaid: "50000",
        }),
      ]),
    );
    expect(o.qty.toString()).toBe("5.1");
    // cost of acquisition is the price; the INR fee stays out of it
    expect(o.inr.toString()).toBe("516.987");
    expect(o.feeInr.toString()).toBe("5.0685");
    expect(o.feeUsdc.toString()).toBe("0.05");
  });

  it("reads where a BUY was delivered and who the counterparty was", () => {
    const o = only(
      normalizeOrders([
        rawOrder({
          type: ORDER_TYPE.BUY,
          usdcRecipientAddress: `0x${"B".repeat(40)}`,
          acceptedMerchantAddress: `0x${"c".repeat(40)}`,
        }),
      ]),
    );
    expect(o.recipient).toBe(`0x${"b".repeat(40)}`);
    expect(o.counterparty).toBe(`0x${"c".repeat(40)}`);
    const zero = only(
      normalizeOrders([
        rawOrder({
          type: ORDER_TYPE.BUY,
          usdcRecipientAddress: `0x${"0".repeat(40)}`,
        }),
      ]),
    );
    expect(zero.recipient).toBeNull();
  });

  it("SELL: USDC fee inside actualUsdcAmount is split out", () => {
    // live example: usdc 0.864875, actual 0.964875, fee 0.1
    const o = only(
      normalizeOrders([
        rawOrder({
          type: ORDER_TYPE.PAY,
          usdcAmount: "864875",
          actualUsdcAmount: "964875",
          fiatAmount: "84999915",
          actualFiatAmount: "84999915",
          fixedFeePaid: "100000",
        }),
      ]),
    );
    expect(o.kind).toBe("PAY");
    expect(o.qty.toString()).toBe("0.864875");
    expect(o.inr.toString()).toBe("84.999915");
    expect(o.feeQtyFromLots.toString()).toBe("0.1");
  });

  it("SELL: tips are treated as fee USDC", () => {
    const o = only(
      normalizeOrders([
        sell("2026-06-01T10:00", 10, 980, { tipsPaid: "250000" }),
      ]),
    );
    expect(o.qty.toString()).toBe("10");
    expect(o.feeQtyFromLots.toString()).toBe("0.25");
    expect(o.feeInr.toFixed(2)).toBe("24.50");
  });
});

describe("exclusions", () => {
  it("lists cancelled, pending, unresolved-dispute and non-INR orders with a reason", () => {
    const r = normalizeOrders([
      rawOrder({ status: 4, cancelledAt: istSeconds("2026-06-01T10:00") }),
      rawOrder({ status: 1, completedAt: "0" }),
      rawOrder({ disputeStatus: DISPUTE_STATUS.RAISED }),
      rawOrder({
        currency:
          "0x42524c0000000000000000000000000000000000000000000000000000000000",
      }),
      rawOrder({ type: 9 }),
      rawOrder({ usdcAmount: "0", actualUsdcAmount: "0" }),
      rawOrder({ disputeStatus: DISPUTE_STATUS.SETTLED }),
    ]);
    expect(r.excluded.map((e) => e.reason).sort()).toEqual(
      [
        "CANCELLED",
        "DISPUTE_UNRESOLVED",
        "NON_INR",
        "NOT_COMPLETED",
        "UNKNOWN_TYPE",
        "ZERO_AMOUNT",
      ].sort(),
    );
    expect(r.excluded.find((e) => e.reason === "NON_INR")?.currency).toBe(
      "BRL",
    );
    // settled dispute + completed is kept
    expect(r.orders).toHaveLength(1);
  });
});

describe("dates", () => {
  it("uses completedAt, else blockTimestamp", () => {
    const withCompleted = only(
      normalizeOrders([
        rawOrder({ completedAt: "1793964464", blockTimestamp: "1793960000" }),
      ]),
    );
    expect(withCompleted.date.getTime()).toBe(1793964464 * 1000);
    const fallback = only(
      normalizeOrders([
        rawOrder({ completedAt: "0", blockTimestamp: "1793960000" }),
      ]),
    );
    expect(fallback.date.getTime()).toBe(1793960000 * 1000);
  });

  it("sorts orders by date", () => {
    const r = normalizeOrders([
      buy("2026-07-01T10:00", 1, 90),
      buy("2026-05-01T10:00", 1, 90),
    ]);
    expect(r.orders[0].date < r.orders[1].date).toBe(true);
  });
});
