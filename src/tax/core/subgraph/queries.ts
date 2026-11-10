/**
 * PRIVACY: only these fields are ever requested. Never add encUpi,
 * encMerchantUpi, pubkey, userPubKey, disputeAccountNumber or
 * disputeRedactTransId (enforced by tests/queries.test.ts).
 */
export const ORDER_FIELDS = [
  "id",
  "orderId",
  "type",
  "status",
  "currency",
  "usdcAmount",
  "fiatAmount",
  "actualUsdcAmount",
  "actualFiatAmount",
  "fixedFeePaid",
  "tipsPaid",
  "userAddress",
  "isUserCompleted",
  "disputeStatus",
  "placedAt",
  "completedAt",
  "cancelledAt",
  "blockTimestamp",
  "transactionHash",
  // Where a BUY's USDC was delivered (may differ from the placer)
  "usdcRecipientAddress",
  // Counterparty (merchant), used for per-payer TDS thresholds
  "acceptedMerchantAddress",
] as const;

export const FORBIDDEN_FIELDS = [
  "encUpi",
  "encMerchantUpi",
  "pubkey",
  "userPubKey",
  "disputeAccountNumber",
  "disputeRedactTransId",
] as const;

export const USER_ORDERS_QUERY = /* GraphQL */ `
  query UserOrders($address: Bytes!, $lastId: Bytes!, $first: Int!) {
    orders_collection(
      first: $first
      orderBy: id
      orderDirection: asc
      where: { id_gt: $lastId, userAddress: $address }
    ) {
      ${ORDER_FIELDS.join("\n      ")}
    }
  }
`;
