import { type Address, isAddress, isHash } from "viem";
import { z } from "zod";

/**
 * Runtime validation of untrusted subgraph data (zod + viem), so a schema
 * change upstream fails loudly instead of producing a wrong tax number.
 */

/**
 * 0x + 40 hex. All-lower / all-upper hex carries no checksum (EIP-55) and is
 * accepted; mixed-case input must have a valid checksum (catches typos).
 * Output is lowercased for the subgraph query.
 */
const isWalletAddress = (s: string): s is Address => {
  if (!isAddress(s, { strict: false })) return false;
  const hex = s.slice(2);
  const sameCase = hex === hex.toLowerCase() || hex === hex.toUpperCase();
  return sameCase || isAddress(s, { strict: true });
};

export const AddressSchema = z
  .string()
  .trim()
  .refine(isWalletAddress, {
    message:
      "Enter a valid wallet address: 0x followed by 40 hexadecimal characters.",
  })
  .transform((s) => s.toLowerCase() as Address);

const UIntString = z.string().regex(/^\d+$/, "Expected an unsigned integer");
const Bytes = z
  .string()
  .regex(/^0x([0-9a-fA-F]{2})*$/, "Expected 0x-prefixed bytes");
const TxHash = z
  .string()
  .refine(
    (s) => s === "" || s === "0x" || isHash(s),
    "Invalid transaction hash",
  );

/** One row from orders_collection: exactly the privacy-safe field list. */
export const RawOrderSchema = z.object({
  id: Bytes,
  orderId: UIntString,
  type: z.number().int().nonnegative(),
  status: z.number().int().nonnegative(),
  currency: Bytes,
  usdcAmount: UIntString,
  fiatAmount: UIntString,
  actualUsdcAmount: UIntString,
  actualFiatAmount: UIntString,
  fixedFeePaid: UIntString,
  tipsPaid: UIntString,
  userAddress: Bytes,
  isUserCompleted: z.boolean(),
  disputeStatus: z.number().int().nonnegative(),
  placedAt: UIntString,
  completedAt: UIntString,
  cancelledAt: UIntString,
  blockTimestamp: UIntString,
  transactionHash: TxHash,
  // Optional: older recordings and some rows do not carry these
  usdcRecipientAddress: Bytes.nullish(),
  acceptedMerchantAddress: Bytes.nullish(),
});

export const OrdersPageSchema = z.array(RawOrderSchema);

/** Optional env override, validated at startup. */
export const SubgraphUrlSchema = z.url({ protocol: /^https$/ });
