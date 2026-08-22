import type { Order } from "@/core/adapters/thirdweb/validation";

const ZERO = "0x0000000000000000000000000000000000000000";

/**
 * Order is the OUTPUT of OrderSchema, so every contract bigint is already a
 * string here. Build that shape directly rather than parsing.
 *
 * placedTimestamp is a fixed "0" so the factory stays deterministic. That puts
 * the order outside the dispute window, so a test that needs the dispute entry
 * live has to override placedTimestamp with a recent unix second value.
 */
export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    acceptedAccountNo: "0",
    acceptedMerchant: ZERO,
    amount: "100.0",
    assignedAccountNos: [],
    completedTimestamp: "0",
    currency: "INR",
    disputeInfo: {
      accountNumber: "0",
      raisedBy: "USER",
      redactTransId: "0",
      status: "DEFAULT",
    },
    encMerchantUpi: "",
    encUpi: "",
    fiatAmount: "8500.0",
    id: "1234",
    orderType: "BUY",
    placedTimestamp: "0",
    preferredPaymentChannelConfigId: "0",
    pubkey: "",
    recipientAddr: ZERO,
    status: "PAID",
    user: ZERO,
    userCompleted: false,
    userCompletedTimestamp: "0",
    userPubKey: "",
    ...overrides,
  };
}

export function makeDisputedOrder(overrides: Partial<Order> = {}): Order {
  return makeOrder({
    disputeInfo: {
      accountNumber: "0",
      raisedBy: "USER",
      redactTransId: "0",
      status: "RAISED",
    },
    ...overrides,
  });
}
