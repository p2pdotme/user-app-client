import { z } from "zod";
import { getSettings } from "@/core/client";
import type { Currency } from "@/core/client/settings";
import { COUNTRY_OPTIONS } from "@/lib/constants";
import { validatePaymentAddress } from "@/lib/utils";

/**
 * Currency config the sell payment-details UI validates against: the
 * `currencyOverride` (an existing order's currency) when given and known,
 * else the app's current settings currency.
 */
export const resolveSellCurrency = (
  settingsCurrency: Currency,
  currencyOverride?: string,
): Pick<Currency, "currency" | "paymentAddressName"> => {
  if (!currencyOverride || currencyOverride === settingsCurrency.currency) {
    return settingsCurrency;
  }
  const option = COUNTRY_OPTIONS.find((c) => c.currency === currencyOverride);
  return option
    ? {
        currency: option.currency as Currency["currency"],
        paymentAddressName:
          option.paymentAddressName as Currency["paymentAddressName"],
      }
    : settingsCurrency;
};

export const SellPreviewStateSchema = z.object({
  amount: z.object({
    crypto: z.coerce.number(),
    fiat: z.coerce.number(),
  }),
});

export type SellPreviewState = z.infer<typeof SellPreviewStateSchema>;

// Create form schema that validates based on currency
export const createSellAddressFormSchema = (currencyOverride?: string) => {
  const settingsResult = getSettings();
  if (!currencyOverride && settingsResult.isErr()) {
    return z.object({
      id: z.string().optional(),
      label: z.string().min(1, { error: "Label is required" }),
      address: z.string().min(1, { error: "Payment details are required" }),
      isActive: z.boolean(),
    });
  }
  const currency =
    currencyOverride ??
    (settingsResult.isOk() ? settingsResult.value.currency.currency : "");
  return z.object({
    id: z.string().optional(),
    label: z.string().min(1, { error: "Label is required" }),
    address: z
      .string()
      .min(1, { error: "Payment details are required" })
      .refine((val) => validatePaymentAddress(val, currency), {
        error: "Invalid payment details format",
      }),
    isActive: z.boolean(),
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
