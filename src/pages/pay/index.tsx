import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { parseUnits, zeroAddress } from "viem";
import { z } from "zod";
import { NonHomeHeader, NumpadInput } from "@/components";
import FlatfeeAlert from "@/components/flat-fee-alert";
import { PWAUpdateDrawer } from "@/components/pwa-update-drawer";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts";
import { getFeeConfig } from "@/core/fees";
import { ABIS } from "@/core/p2pdotme";
import {
  useAnalytics,
  useOrderFlow,
  usePriceConfig,
  useThirdweb,
  useTxLimits,
  useUSDCBalance,
} from "@/hooks";
import { useContractVersion } from "@/hooks/use-contract-version";
import { EVENTS } from "@/lib/analytics";
import {
  INTERNAL_HREFS,
  ORDER_TYPE,
  PAY_DISABLED_CURRENCIES,
} from "@/lib/constants";
import { placeOrderErrorKey } from "@/lib/errors";
import {
  calculateFee,
  cn,
  extractOrderIdFromOrderPlaced,
  truncateAmount,
} from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";
import { HelpDrawer } from "../order/help-drawer";
import { AmountDisplay } from "./amount-display";
import { LimitBanner } from "./limit-banner";
import { PayErrorState } from "./pay-error-state";
import { PayNotesDrawer } from "./pay-notes-drawer";

export function Pay() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    settings: { currency },
  } = useSettings();
  const { track } = useAnalytics();
  const { account } = useThirdweb();

  // Redirect to home if pay is disabled for this currency
  useEffect(() => {
    if (
      PAY_DISABLED_CURRENCIES.includes(
        currency.currency as (typeof PAY_DISABLED_CURRENCIES)[number],
      )
    ) {
      navigate(INTERNAL_HREFS.HOME, { replace: true });
    }
  }, [currency.currency, navigate]);

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

  const MAX_PAY_LIMIT = useMemo(() => txLimit?.sellLimit ?? 0, [txLimit]);

  const ZodPayAmountSchema = useMemo(
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
          .refine((val) => val === "" || Number(val) <= MAX_PAY_LIMIT, {
            error: t("VALIDATION_MAXIMUM_PAY_LIMIT", { limit: MAX_PAY_LIMIT }),
          }),
        fiat: z
          .string()
          .refine((val) => val === "" || !Number.isNaN(Number(val)), {
            error: t("VALIDATION_INVALID_AMOUNT"),
          }),
      }),
    [
      MAX_PAY_LIMIT,
      usdcBalance,
      feeConfigSmallOrderThreshold,
      feeConfigSmallOrderFixedFee,
      t,
    ],
  );

  type PayAmountType = z.infer<typeof ZodPayAmountSchema>;

  const [amount, setAmount] = useState<PayAmountType>({
    crypto: "",
    fiat: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [denomination, setDenomination] = useState<"crypto" | "fiat">("fiat");
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // State for contract version mismatch dialog
  const [showContractMismatch, setShowContractMismatch] = useState(false);

  const { placeOrderMutation } = useOrderFlow();
  const { checkContractSync } = useContractVersion();

  const updateAmount = useCallback(
    (
      value: string,
      currentDenomination: "crypto" | "fiat",
      onSuccess: (data: PayAmountType) => void,
      onError: (error: string, amount: PayAmountType) => void,
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
      let newAmount: PayAmountType;
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
        safeParseWithResult(ZodPayAmountSchema, newAmount).match(
          (validData) => onSuccess(validData),
          (validationError) => onError(validationError.message, newAmount),
        );
      }
    },
    [priceConfig?.sellPrice, ZodPayAmountSchema],
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
    let effectiveMax = Math.min(usdcBalance ?? Infinity, MAX_PAY_LIMIT);

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
    MAX_PAY_LIMIT,
    priceConfig?.sellPrice,
    usdcBalance,
    feeConfigSmallOrderThreshold,
    feeConfigSmallOrderFixedFee,
  ]);

  const toggleCurrency = useCallback(() => {
    setDenomination((prev) => (prev === "crypto" ? "fiat" : "crypto"));
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    setIsPlacingOrder(true);

    // Check contract version before proceeding
    const isSynced = await checkContractSync();
    if (!isSynced) {
      setShowContractMismatch(true);
      setIsPlacingOrder(false);
      return;
    }

    const cryptoValue = Number(amount.crypto);
    if (!cryptoValue) {
      setError(t("VALIDATION_PLEASE_ENTER_AMOUNT"));
      setIsPlacingOrder(false);
      return;
    }
    if (cryptoValue > MAX_PAY_LIMIT) {
      setError(
        t("VALIDATION_MAXIMUM_LIMIT_EXCEEDED", { limit: MAX_PAY_LIMIT }),
      );
      setIsPlacingOrder(false);
      return;
    }

    // Track pay transaction started
    track(EVENTS.TRANSACTION, {
      transaction_type: "pay",
      status: "started",
      amount,
      currency: currency.currency,
      denomination,
    });

    await placeOrderMutation.mutateAsync(
      {
        amount: parseUnits(amount.crypto.toString(), 6),
        recipientAddr: zeroAddress,
        orderType: ORDER_TYPE.PAY,
        currency: currency.currency,
        fiatAmount: parseUnits(amount.fiat.toString(), 6),
        user: account?.address as `0x${string}`,
      },
      {
        onSuccess: (receipt) => {
          const orderId = extractOrderIdFromOrderPlaced(
            ABIS.DIAMOND,
            receipt.logs,
          );
          if (!orderId) {
            toast.error(t("ORDER_ID_NOT_FOUND"));
            return;
          }

          // Track transaction started upon successful order placement
          track(EVENTS.TRANSACTION, {
            transaction_type: "pay",
            status: "placed",
            amount: cryptoValue,
            currency: currency.currency,
            orderId: orderId.toString(),
            paymentChannel: 0,
          });

          navigate(`${INTERNAL_HREFS.ORDER}/${orderId}`);
        },
        onError: (error) => {
          // Track failed pay transaction
          track(EVENTS.TRANSACTION, {
            transaction_type: "pay",
            status: "failed",
            amount: cryptoValue,
            currency: currency.currency,
            errorMessage: error.message,
            paymentChannel: 0,
          });

          console.error("Error placing order", error);
          const key = placeOrderErrorKey(error);
          toast.error(
            t(key),
            key === "FAILED_TO_PLACE_ORDER"
              ? {
                  description: error.message,
                }
              : undefined,
          );
          setIsPlacingOrder(false);
        },
      },
    );
  }, [
    amount,
    MAX_PAY_LIMIT,
    placeOrderMutation,
    account,
    currency.currency,
    navigate,
    t,
    track,
    denomination,
    checkContractSync,
  ]);

  const handleRetry = () => window.location.reload();

  const hasCriticalError = isPriceConfigError || isTxLimitError;

  if (hasCriticalError) {
    return (
      <>
        <HelpDrawer
          open={showHelpDrawer}
          onOpenChange={setShowHelpDrawer}
          orderType="PAY"
        />
        <NonHomeHeader
          title={`${t("SCAN_PAY")} USDC`}
          onHelpClick={() => setShowHelpDrawer(true)}
        />
        <main className="no-scrollbar flex h-full w-full flex-col overflow-y-auto">
          <PayErrorState onRetry={handleRetry} />
        </main>
      </>
    );
  }

  const hasExceededLimit =
    Number(amount.crypto) > MAX_PAY_LIMIT && !!amount.crypto;

  const isContinueDisabled =
    !amount.crypto ||
    Number(amount.crypto) === 0 ||
    isPlacingOrder ||
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
        orderType="PAY"
      />
      <PWAUpdateDrawer
        open={showContractMismatch}
        onReload={() => window.location.reload()}
      />
      <NonHomeHeader
        title={`${t("SCAN_PAY")} USDC`}
        onHelpClick={() => setShowHelpDrawer(true)}
      />
      <main
        className={cn(
          "no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-between gap-2 overflow-hidden py-8",
          isPlacingOrder && "pointer-events-none",
        )}>
        <section className="no-scrollbar flex w-full flex-1 flex-col justify-between overflow-y-auto py-4">
          <PayNotesDrawer />
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
              orderType="pay"
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
          onClick={handlePlaceOrder}
          disabled={isContinueDisabled}>
          {isPlacingOrder ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("PLACING_ORDER")}...
            </>
          ) : (
            t("PLACE_ORDER")
          )}
        </Button>
      </main>
    </>
  );
}
