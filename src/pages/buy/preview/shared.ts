import { isAddress } from "viem";
import { z } from "zod";

export const BuyPreviewStateSchema = z.object({
  amount: z.object({
    crypto: z.coerce.number(),
    fiat: z.coerce.number(),
  }),
});

export type BuyPreviewState = z.infer<typeof BuyPreviewStateSchema>;

// Define zod schema for form validation
export const walletAddressFormSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, { error: "Wallet name is required" }),
  address: z
    .string()
    .min(1, { error: "Wallet address is required" })
    .refine((val) => isAddress(val), {
      error: "Address must be a valid EVM address",
    }),
  isActive: z.boolean().default(false),
});

export type WalletAddressFormData = z.infer<typeof walletAddressFormSchema>;
export type WalletAddressesPage = "list" | "add" | "edit" | "delete";

/**
 * Generates avatar content from a label (1-2 characters)
 */
export const getAvatarContent = (label: string): string => {
  if (!label) return "";
  const words = label.split(" ");
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  } else {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
};
