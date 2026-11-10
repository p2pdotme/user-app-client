import type { ReceiptType } from "@/tax/core/types";

export interface ReceiptOption {
  value: Exclude<ReceiptType, "UNKNOWN">;
  label: string;
  /** Label for the per-USDC ₹ input */
  priceLabel: string;
  hint: string;
}

/** How USDC from outside P2P.me came in; each has its own cost rule. */
export const RECEIPT_OPTIONS: readonly ReceiptOption[] = [
  {
    value: "EXCHANGE",
    label: "Bought on an exchange",
    priceLabel: "Price you paid per USDC (₹)",
    hint: "Not taxed when bought. The INR you paid is your cost.",
  },
  {
    value: "OWN_WALLET",
    label: "Moved from my own wallet or another chain",
    priceLabel: "What you originally paid per USDC (₹)",
    hint: "Moving your own USDC is not a sale. The original cost carries over.",
  },
  {
    value: "SALARY",
    label: "Salary, freelance or business payment",
    priceLabel: "Value per USDC when you received it (₹)",
    hint: "Taxed as salary or business income when received, at your slab rate. That value becomes your cost.",
  },
  {
    value: "REWARD",
    label: "Reward, referral, cashback or airdrop",
    priceLabel: "Value per USDC when you received it (₹)",
    hint: "Taxed as income from other sources when received, at your slab rate. That value becomes your cost.",
  },
  {
    value: "GIFT_RELATIVE",
    label: "Gift from a relative",
    priceLabel: "What the giver paid per USDC (₹)",
    hint: "Not taxed when received. The giver's cost becomes your cost.",
  },
  {
    value: "GIFT_NON_RELATIVE",
    label: "Gift from someone who is not a relative",
    priceLabel: "Value per USDC when you received it (₹)",
    hint: "If all your gifts from non-relatives in the year (money and property, not only this USDC) exceed ₹50,000, they are taxed when received and that value is your cost. Otherwise they are not taxed and your cost is what the giver paid, or nil if you do not know it.",
  },
];

export const RECEIPT_LABEL: Record<ReceiptType, string> = {
  ...Object.fromEntries(RECEIPT_OPTIONS.map((o) => [o.value, o.label])),
  UNKNOWN: "Not known (cost taken as ₹0)",
} as Record<ReceiptType, string>;

export const receiptOption = (type: ReceiptType): ReceiptOption | undefined =>
  RECEIPT_OPTIONS.find((o) => o.value === type);
