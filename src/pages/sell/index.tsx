import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { z } from "zod";
import { NonHomeHeader, NumpadInput } from "@/components";
import FlatfeeAlert from "@/components/flat-fee-alert";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { getSellQuizState } from "@/core/client";
import { getFeeConfig } from "@/core/fees";
import {
  useAnalytics,
  usePriceConfig,
  useTxLimits,
  useUSDCBalance,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { calculateFee, truncateAmount } from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";
import { HelpDrawer } from "../order/help-drawer";
import { AmountDisplay } from "./amount-display";
import { LimitBanner } from "./limit-banner";
import { SellErrorState } from "./sell-error-state";

export function Sell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();

  const { priceConfig, isPriceConfigLoading, isPriceConfigError } =
    usePriceConfig();
  const { txLimit, isTxLimitLoading, isTxLimitError } = useTxLimits();
  const { usdcBalance, isUsdcBalanceLoading } = useUSDCBalance();

  const { data: feeConfig } = useQuery({
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

  const feeConfigSmallOrderThreshold = feeConfig?.smallOrderThreshold ?? 0;
  const feeConfigSmallOrderFixedFee = feeConfig?.smallOrderFixedFee ?? 0;

  const MAX_SELL_LIMIT = useMemo(() => txLimit?.sellLimit ?? 0, [txLimit]);

  const ZodSellAmountSchema = useMemo(
    () =>
      z.object({
        crypto: z
          .string()
          .refine((val) => val === "" || !Number.isNaN(Number(val)), {
            error: t("VALIDATION_INVALID_AMOUNT"),
          })
          .refine(
            (val) => {
              if (val === "") return true;
              const cryptoValue = Number(val);
              const fee = calculateFee(
                cryptoValue,
                feeConfigSmallOrderThreshold,
                feeConfigSmallOrderFixedFee,
              );
              const totalAmountWithFee = cryptoValue + fee;

              return totalAmountWithFee <= (usdcBalance ?? Infinity);
            },
            {
              error: t("VALIDATION_INSUFFICIENT_BALANCE"),
            },
          )
          .refine((val) => val === "" || Number(val) <= MAX_SELL_LIMIT, {
            error: t("VALIDATION_MAXIMUM_SELL_LIMIT", {
              limit: MAX_SELL_LIMIT,
            }),
          }),
        fiat: z
          .string()
          .refine((val) => val === "" || !Number.isNaN(Number(val)), {
            error: t("VALIDATION_INVALID_AMOUNT"),
          }),
      }),
    [
      MAX_SELL_LIMIT,
      usdcBalance,
      feeConfigSmallOrderThreshold,
      feeConfigSmallOrderFixedFee,
      t,
    ],
  );

  type SellAmountType = z.infer<typeof ZodSellAmountSchema>;

  const [amount, setAmount] = useState<SellAmountType>({
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
      onSuccess: (data: SellAmountType) => void,
      onError: (error: string, amount: SellAmountType) => void,
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

      const sellPrice = priceConfig?.sellPrice;

      // Handle conversion, but be careful with partial inputs like "."
      let newAmount: SellAmountType;
      if (currentDenomination === "crypto") {
        newAmount = {
          crypto: value,
          fiat:
            value && value !== "." && sellPrice
              ? truncateAmount(Number(value) * sellPrice).toString()
              : "",
        };
      } else {
        newAmount = {
          crypto:
            value && value !== "." && sellPrice
              ? truncateAmount(Number(value) / sellPrice, 6).toString()
              : "",
          fiat: value,
        };
      }

      // Only validate if we have a complete number, not just a decimal point
      if (value === "." || value === "") {
        // Allow partial inputs through without validation
        onSuccess(newAmount);
      } else {
        safeParseWithResult(ZodSellAmountSchema, newAmount).match(
          (validData) => onSuccess(validData),
          (validationError) => onError(validationError.message, newAmount),
        );
      }
    },
    [priceConfig?.sellPrice, ZodSellAmountSchema],
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
    let effectiveMax = Math.min(usdcBalance ?? Infinity, MAX_SELL_LIMIT);

    // Subtract the fixed fee if it applies
    const fee = calculateFee(
      effectiveMax,
      feeConfigSmallOrderThreshold,
      feeConfigSmallOrderFixedFee,
    );
    effectiveMax = Math.max(0, effectiveMax - fee);

    if (denomination === "crypto") {
      handleUpdateAmount(effectiveMax.toString());
    } else {
      const maxFiatAmount = effectiveMax * (priceConfig?.sellPrice ?? 85);
      handleUpdateAmount(maxFiatAmount.toString());
    }
  }, [
    denomination,
    handleUpdateAmount,
    MAX_SELL_LIMIT,
    priceConfig?.sellPrice,
    usdcBalance,
    feeConfigSmallOrderThreshold,
    feeConfigSmallOrderFixedFee,
  ]);

  const toggleCurrency = useCallback(() => {
    setDenomination((prev) => (prev === "crypto" ? "fiat" : "crypto"));
  }, []);

  const handleContinue = useCallback(() => {
    const cryptoValue = Number(amount.crypto);
    if (!cryptoValue) {
      setError(t("VALIDATION_PLEASE_ENTER_AMOUNT"));
      return;
    }
    if (cryptoValue > MAX_SELL_LIMIT) {
      setError(
        t("VALIDATION_MAXIMUM_LIMIT_EXCEEDED", { limit: MAX_SELL_LIMIT }),
      );
      return;
    }

    // Track sell transaction started
    track(EVENTS.TRANSACTION, {
      transaction_type: "sell",
      status: "started",
      amount,
      currency: currency.currency,
      denomination,
    });

    setIsSubmitting(true);
    const quizState = getSellQuizState();
    const quizCompleted = quizState.isOk() && quizState.value.completed;
    const nextHref = quizCompleted
      ? INTERNAL_HREFS.SELL_PREVIEW
      : INTERNAL_HREFS.SELL_QUIZ;
    navigate(nextHref, { state: { amount } });
    setIsSubmitting(false);
  }, [
    amount,
    navigate,
    MAX_SELL_LIMIT,
    track,
    denomination,
    currency.currency,
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
          orderType="SELL"
        />
        <NonHomeHeader
          title={t("SELL_USDC")}
          onHelpClick={() => setShowHelpDrawer(true)}
        />
        <main className="no-scrollbar flex h-full w-full flex-col overflow-y-auto">
          <SellErrorState onRetry={handleRetry} />
        </main>
      </>
    );
  }

  const hasExceededLimit =
    Number(amount.crypto) > MAX_SELL_LIMIT && !!amount.crypto;

  const isContinueDisabled =
    !amount.crypto ||
    Number(amount.crypto) === 0 ||
    isSubmitting ||
    !!error ||
    isPriceConfigLoading ||
    isTxLimitLoading ||
    isUsdcBalanceLoading;

  const showFlatFeeAlert =
    !!feeConfig &&
    Number(amount.crypto) > 0 &&
    Number(amount.crypto) <= feeConfigSmallOrderThreshold &&
    !hasExceededLimit;

  return (
    <>
      <HelpDrawer
        open={showHelpDrawer}
        onOpenChange={setShowHelpDrawer}
        orderType="SELL"
      />
      <NonHomeHeader
        title={t("SELL_USDC")}
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

          <div>
            <FlatfeeAlert
              amount={Number(amount.crypto)}
              show={showFlatFeeAlert}
              orderType="sell"
              fiatAmount={Number(amount.fiat)}
              exchangeRate={priceConfig?.sellPrice}
            />
            <LimitBanner
              isLoading={isTxLimitLoading}
              isError={isTxLimitError}
              limit={txLimit?.sellLimit}
              hasExceededLimit={hasExceededLimit}
            />
          </div>
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
