import { z } from "zod";
import { getSettings } from "@/core/client";
import { validatePaymentAddress } from "@/lib/utils";

export const SellPreviewStateSchema = z.object({
  amount: z.object({
    crypto: z.coerce.number(),
    fiat: z.coerce.number(),
  }),
});

export type SellPreviewState = z.infer<typeof SellPreviewStateSchema>;

// Create form schema that validates based on currency
export const createSellAddressFormSchema = () => {
  const settingsResult = getSettings();
  if (settingsResult.isErr()) {
    return z.object({
      id: z.string().optional(),
      label: z.string().min(1, { error: "Label is required" }),
      address: z.string().min(1, { error: "Payment details are required" }),
      isActive: z.boolean().default(false),
    });
  }
  const currency = settingsResult.value.currency.currency;
  return z.object({
    id: z.string().optional(),
    label: z.string().min(1, { error: "Label is required" }),
    address: z
      .string()
      .min(1, { error: "Payment details are required" })
      .refine((val) => validatePaymentAddress(val, currency), {
        error: "Invalid payment details format",
      }),
    isActive: z.boolean().default(false),
  });
};
export type SellAddressFormData = z.infer<
  ReturnType<typeof createSellAddressFormSchema>
>;
export type SellAddressesPage = "list" | "add" | "edit" | "delete";

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
