import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import { NonHomeHeader, NumpadInput } from "@/components";
import FlatFeeAlert from "@/components/flat-fee-alert";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { getFeeConfig } from "@/core/fees";
import {
  useAnalytics,
  useHapticInteractions,
  usePriceConfig,
  useTxLimits,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";
import { HelpDrawer } from "../order/help-drawer";
import { AmountDisplay } from "./amount-display";
import { BuyErrorState } from "./buy-error-state";
import { LimitBanner } from "./limit-banner";

export function Buy() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { onValidationError, triggerTapHaptic } = useHapticInteractions();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();

  const { priceConfig, isPriceConfigLoading, isPriceConfigError } =
    usePriceConfig();
  const { txLimit, isTxLimitLoading, isTxLimitError } = useTxLimits();

  const { data: feeConfig, isLoading: isFeeConfigLoading } = useQuery({
    queryKey: ["feeConfig", currency.currency],
    queryFn: () =>
      getFeeConfig(currency.currency).match(
        (config) => config,
        (error) => {
          throw error;
        },
      ),
    enabled: !!currency.currency,
  });

  const MAX_BUY_LIMIT = useMemo(() => txLimit?.buyLimit ?? 100, [txLimit]);

  const ZodBuyAmountSchema = useMemo(
    () =>
      z.object({
        crypto: z
          .string()
          .refine((val) => val === "" || !Number.isNaN(Number(val)), {
            error: t("VALIDATION_INVALID_AMOUNT"),
          })
          .refine((val) => val === "" || Number(val) <= MAX_BUY_LIMIT, {
            error: t("VALIDATION_MAXIMUM_BUY_LIMIT", { limit: MAX_BUY_LIMIT }),
          }),
        fiat: z
          .string()
          .refine((val) => val === "" || !Number.isNaN(Number(val)), {
            error: t("VALIDATION_INVALID_AMOUNT"),
          }),
      }),
    [MAX_BUY_LIMIT, t],
  );

  type BuyAmountType = z.infer<typeof ZodBuyAmountSchema>;

  const [amount, setAmount] = useState<BuyAmountType>({
    crypto: "",
    fiat: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [denomination, setDenomination] = useState<"crypto" | "fiat">("crypto");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  const updateAmount = useCallback(
    (
      value: string,
      currentDenomination: "crypto" | "fiat",
      onSuccess: (data: BuyAmountType) => void,
      onError: (error: string, amount: BuyAmountType) => void,
    ) => {
      // Allow empty string, single decimal point, and valid numbers
      if (value !== "" && value !== "." && Number.isNaN(Number(value))) {
        return;
      }

      // Handle leading zeros - remove them except for "0" or "0."
      if (value === "0") {
        value = "0";
      } else if (value.match(/^0+\d/)) {
        value = value.replace(/^0+(?=\d)/, "");
      }

      // Limit decimal places
      const parts = value.split(".");
      if (parts[1]) {
        parts[1] = parts[1].slice(0, currentDenomination === "crypto" ? 6 : 2);
        value = parts.join(".");
      }

      const buyPrice = priceConfig?.buyPrice;

      // Handle conversion, but be careful with partial inputs like "."
      let newAmount: BuyAmountType;
      if (currentDenomination === "crypto") {
        newAmount = {
          crypto: value,
          fiat:
            value && value !== "." && buyPrice
              ? truncateAmount(Number(value) * buyPrice).toString()
              : "",
        };
      } else {
        newAmount = {
          crypto:
            value && value !== "." && buyPrice
              ? truncateAmount(Number(value) / buyPrice, 6).toString()
              : "",
          fiat: value,
        };
      }

      // Only validate if we have a complete number, not just a decimal point
      if (value === "." || value === "") {
        // Allow partial inputs through without validation
        onSuccess(newAmount);
      } else {
        safeParseWithResult(ZodBuyAmountSchema, newAmount).match(
          (validData) => onSuccess(validData),
          (validationError) => {
            // Trigger haptic feedback for validation errors
            onValidationError();
            onError(validationError.message, newAmount);
          },
        );
      }
    },
    [priceConfig?.buyPrice, ZodBuyAmountSchema, onValidationError],
  );

  const handleUpdateAmount = useCallback(
    (value: string) => {
      updateAmount(
        value,
        denomination,
        (validData) => {
          setAmount(validData);
          setError(null);
        },
        (errorMessage, newAmount) => {
          setAmount(newAmount);
          setError(errorMessage);
        },
      );
    },
    [denomination, updateAmount],
  );

  const handleInput = useCallback(
    (value: string) => {
      const currentValue = amount[denomination];
      handleUpdateAmount(currentValue + value);
    },
    [amount, denomination, handleUpdateAmount],
  );

  const handleDelete = useCallback(() => {
    const currentValue = amount[denomination];
    handleUpdateAmount(currentValue.slice(0, -1));
  }, [amount, denomination, handleUpdateAmount]);

  const handleClear = useCallback(() => {
    setAmount({ crypto: "", fiat: "" });
    setError(null);
  }, []);

  const handleMax = useCallback(() => {
    if (denomination === "crypto") {
      handleUpdateAmount(MAX_BUY_LIMIT.toString());
    } else {
      const maxFiatAmount = MAX_BUY_LIMIT * (priceConfig?.buyPrice ?? 85);
      handleUpdateAmount(maxFiatAmount.toString());
    }
  }, [denomination, handleUpdateAmount, MAX_BUY_LIMIT, priceConfig?.buyPrice]);

  const toggleCurrency = useCallback(() => {
    triggerTapHaptic(); // Haptic feedback for currency toggle
    setDenomination((prev) => (prev === "crypto" ? "fiat" : "crypto"));
  }, [triggerTapHaptic]);

  const handleContinue = useCallback(() => {
    const cryptoValue = Number(amount.crypto);
    if (!cryptoValue) {
      onValidationError(); // Haptic feedback for validation error
      setError(t("VALIDATION_PLEASE_ENTER_AMOUNT"));
      return;
    }
    if (cryptoValue > MAX_BUY_LIMIT) {
      onValidationError(); // Haptic feedback for validation error
      setError(
        t("VALIDATION_MAXIMUM_LIMIT_EXCEEDED", { limit: MAX_BUY_LIMIT }),
      );
      return;
    }

    // Track buy transaction started
    track(EVENTS.TRANSACTION, {
      transaction_type: "buy",
      status: "started",
      amount,
      denomination,
    });

    // Note: Success haptic will be handled by Button component since this is navigation
    setIsSubmitting(true);
    navigate(INTERNAL_HREFS.BUY_PREVIEW, { state: { amount } });
    setIsSubmitting(false);
  }, [
    amount,
    navigate,
    MAX_BUY_LIMIT,
    onValidationError,
    track,
    denomination,
    t,
  ]);

  const handleRetry = () => window.location.reload();

  const hasCriticalError = isPriceConfigError || isTxLimitError;

  if (hasCriticalError) {
    return (
      <>
        <HelpDrawer
          open={showHelpDrawer}
          onOpenChange={setShowHelpDrawer}
          orderType="BUY"
        />
        <NonHomeHeader
          title={t("BUY_USDC")}
          onHelpClick={() => setShowHelpDrawer(true)}
        />
        <main className="no-scrollbar flex h-full w-full flex-col overflow-y-auto">
          <BuyErrorState onRetry={handleRetry} />
        </main>
      </>
    );
  }

  const hasExceededLimit =
    Number(amount.crypto) > MAX_BUY_LIMIT && !!amount.crypto;

  const isContinueDisabled =
    !amount.crypto ||
    Number(amount.crypto) === 0 ||
    (feeConfig?.smallOrderFixedFee !== undefined
      ? Number(amount.crypto) <= feeConfig.smallOrderFixedFee
      : false) ||
    isSubmitting ||
    !!error ||
    isPriceConfigLoading ||
    isTxLimitLoading ||
    isFeeConfigLoading;

  const showFlatFeeAlert =
    !!feeConfig &&
    Number(amount.crypto) > 0 &&
    Number(amount.crypto) <= feeConfig.smallOrderThreshold &&
    !hasExceededLimit;

  return (
    <>
      <HelpDrawer
        open={showHelpDrawer}
        onOpenChange={setShowHelpDrawer}
        orderType="BUY"
      />
      <NonHomeHeader
        title={t("BUY_USDC")}
        onHelpClick={() => setShowHelpDrawer(true)}
      />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-between gap-2 overflow-hidden py-8">
        <section className="no-scrollbar items-center-safe flex w-full flex-1 flex-col justify-between overflow-y-auto py-4">
          <div />
          <AmountDisplay
            amount={amount}
            denomination={denomination}
            toggleCurrency={toggleCurrency}
            isPriceLoading={isPriceConfigLoading}
            isPriceError={isPriceConfigError}
          />

          {feeConfig && (
            <div>
              <FlatFeeAlert
                amount={Number(amount.crypto)}
                show={showFlatFeeAlert}
                orderType="buy"
                fiatAmount={Number(amount.fiat)}
                exchangeRate={priceConfig?.buyPrice}
              />
              <LimitBanner
                isLoading={isTxLimitLoading}
                isError={isTxLimitError}
                limit={txLimit?.buyLimit}
                hasExceededLimit={hasExceededLimit}
              />
            </div>
          )}
        </section>
        <section className="flex h-[45%] w-full shrink-0 flex-col items-center gap-4">
          <NumpadInput
            onChange={handleInput}
            onMax={handleMax}
            onClear={handleClear}
            onDelete={handleDelete}
          />
        </section>
        <Button
          className="w-full p-6"
          onClick={handleContinue}
          disabled={isContinueDisabled}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("PROCESSING")}...
            </>
          ) : (
            t("CONTINUE")
          )}
        </Button>
      </main>
    </>
  );
}
