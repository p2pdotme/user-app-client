import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { z } from "zod";
import { NonHomeHeader, NumpadInput } from "@/components";
import FlatfeeAlert from "@/components/flat-fee-alert";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { getSellQuizState } from "@/core/client";
import { getFeeConfig } from "@/core/fees";
import {
  useAnalytics,
  usePageMeta,
  usePriceConfig,
  useTxLimits,
  useUSDCBalance,
} from "@/hooks";
import { useMaxSellTxLimit } from "@/hooks/use-tx-limits";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS, MIN_ORDER_FIAT_BY_CURRENCY } from "@/lib/constants";
import { saveLimitReturn } from "@/lib/limit-increase";
import { calculateFee, truncateAmount } from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";
import { DepositDrawer } from "../homescreen/deposit-drawer";
import { HelpDrawer } from "../order/help-drawer";
import { AmountDisplay } from "./amount-display";
import { LimitBanner } from "./limit-banner";
import { SellErrorState } from "./sell-error-state";

export function Sell() {
  const { t } = useTranslation();
  usePageMeta({ title: t("SELL"), description: t("SEO_DESCRIPTION_SELL") });
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const { track } = useAnalytics();
  const {
    settings: { currency },
  } = useSettings();

  const { priceConfig, isPriceConfigLoading, isPriceConfigError } =
    usePriceConfig();
  const { txLimit, isTxLimitLoading, isTxLimitError } = useTxLimits();
  const { maxSellTxLimit } = useMaxSellTxLimit();
  const { usdcBalance, isUsdcBalanceLoading } = useUSDCBalance();

  const { data: feeConfig } = useQuery({
    queryKey: ["feeConfig", currency.currency, "sell"],
    queryFn: () =>
      getFeeConfig(currency.currency, "sell").match(
        (config) => config,
        (error) => {
          throw error;
        },
      ),
    enabled: !!currency.currency,
  });

  const feeConfigSmallOrderThreshold = feeConfig?.smallOrderThreshold ?? 0;
  const feeConfigSmallOrderFixedFee = feeConfig?.smallOrderFixedFee ?? 0;

  // Until the real limit loads, don't validate against (or show) a limit of 0;
  // a typed or prefilled amount used to flash "Maximum limit is 0 USDC".
  const isLimitKnown = txLimit?.sellLimit !== undefined;
  const MAX_SELL_LIMIT = useMemo(
    () => txLimit?.sellLimit ?? Number.POSITIVE_INFINITY,
    [txLimit],
  );

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
  const [errorReason, setErrorReason] = useState<
    "insufficient_balance" | "limit" | "invalid" | null
  >(null);

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
          setErrorReason(null);
        },
        (errorMessage, newAmount) => {
          setAmount(newAmount);
          setError(errorMessage);
          const reason = errorMessage.includes(
            t("VALIDATION_INSUFFICIENT_BALANCE"),
          )
            ? "insufficient_balance"
            : errorMessage.includes(
                  t("VALIDATION_MAXIMUM_SELL_LIMIT", { limit: MAX_SELL_LIMIT }),
                )
              ? "limit"
              : "invalid";
          setErrorReason(reason);
        },
      );
    },
    [denomination, updateAmount, t, MAX_SELL_LIMIT],
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
    setErrorReason(null);
  }, []);

  // Max needs the real balance (and the live price in fiat mode); until they
  // load it does nothing rather than guessing.
  const isMaxReady =
    !isUsdcBalanceLoading &&
    usdcBalance !== undefined &&
    !isTxLimitLoading &&
    (denomination === "crypto" || !!priceConfig?.sellPrice);

  const handleMax = useCallback(() => {
    if (!isMaxReady) return;
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
      if (!priceConfig?.sellPrice) return;
      const maxFiatAmount = effectiveMax * priceConfig.sellPrice;
      handleUpdateAmount(maxFiatAmount.toString());
    }
  }, [
    isMaxReady,
    denomination,
    handleUpdateAmount,
    MAX_SELL_LIMIT,
    priceConfig?.sellPrice,
    usdcBalance,
    feeConfigSmallOrderThreshold,
    feeConfigSmallOrderFixedFee,
  ]);

  // Prefill the amount when coming back from the preview (e.g. after a price
  // change) so the user doesn't have to type it again.
  const prefillCryptoAmount = (
    locationState as { prefillCryptoAmount?: unknown } | null
  )?.prefillCryptoAmount;
  const hasPrefilledRef = useRef(false);
  useEffect(() => {
    if (hasPrefilledRef.current) return;
    if (typeof prefillCryptoAmount !== "number" || !(prefillCryptoAmount > 0))
      return;
    if (!priceConfig?.sellPrice || isUsdcBalanceLoading || isTxLimitLoading)
      return;
    hasPrefilledRef.current = true;
    updateAmount(
      prefillCryptoAmount.toString(),
      "crypto",
      (validData) => {
        setAmount(validData);
        setError(null);
      },
      (errorMessage, newAmount) => {
        setAmount(newAmount);
        setError(errorMessage);
      },
    );
  }, [
    prefillCryptoAmount,
    priceConfig?.sellPrice,
    isUsdcBalanceLoading,
    isTxLimitLoading,
    updateAmount,
  ]);

  // Analytics: record why an amount was blocked (once per distinct reason).
  const lastTrackedReasonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!errorReason || lastTrackedReasonRef.current === errorReason) return;
    lastTrackedReasonRef.current = errorReason;
    track(EVENTS.TRANSACTION, {
      transaction_type: "sell",
      status: "amount_blocked",
      reason: errorReason,
      currency: currency.currency,
    });
  }, [errorReason, track, currency.currency]);

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
    isLimitKnown && Number(amount.crypto) > MAX_SELL_LIMIT && !!amount.crypto;
  const isAtMarketMax =
    maxSellTxLimit !== undefined &&
    txLimit?.sellLimit !== undefined &&
    txLimit.sellLimit >= maxSellTxLimit;

  const minOrderFiat = MIN_ORDER_FIAT_BY_CURRENCY[currency.currency];
  const isBelowMinimum =
    minOrderFiat !== undefined &&
    !!amount.fiat &&
    Number(amount.fiat) > 0 &&
    Number(amount.fiat) < minOrderFiat;

  const isContinueDisabled =
    !amount.crypto ||
    Number(amount.crypto) === 0 ||
    isSubmitting ||
    !!error ||
    isBelowMinimum ||
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

          <div className="w-full">
            <FlatfeeAlert
              amount={Number(amount.crypto)}
              show={showFlatFeeAlert}
              orderType="sell"
              fiatAmount={Number(amount.fiat)}
              exchangeRate={priceConfig?.sellPrice}
            />
            {error ? (
              <div className="mt-3 flex flex-col items-center gap-2">
                <p
                  className="text-center text-destructive text-sm"
                  role="alert">
                  {error}
                </p>
                {errorReason === "insufficient_balance" ? (
                  <DepositDrawer>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        track(EVENTS.TRANSACTION, {
                          transaction_type: "sell",
                          status: "deposit_tapped_from_amount",
                          currency: currency.currency,
                        })
                      }>
                      {t("SELL_UX_DEPOSIT_USDC")}
                    </Button>
                  </DepositDrawer>
                ) : null}
              </div>
            ) : null}
            <LimitBanner
              isLoading={isTxLimitLoading}
              isError={isTxLimitError}
              limit={txLimit?.sellLimit}
              hasExceededLimit={hasExceededLimit}
              isAtMarketMax={isAtMarketMax}
              onBeforeVerify={() =>
                saveLimitReturn({
                  flow: "sell",
                  cryptoAmount: Number(amount.crypto),
                })
              }
            />
            {isBelowMinimum ? (
              <p className="mt-3 text-center text-destructive text-sm">
                {t("VALIDATION_MINIMUM_ORDER", {
                  amount: `${currency.symbolNative} ${minOrderFiat}`,
                })}
              </p>
            ) : null}
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
