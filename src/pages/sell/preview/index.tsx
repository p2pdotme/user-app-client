import { ABIS } from "@p2pdotme";
import { ArrowDownCircle, ArrowUpCircle, Clock4, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { parseUnits, zeroAddress } from "viem";
import ASSETS from "@/assets";
import { DashedSeparator, NonHomeHeader } from "@/components";
import { PWAUpdateDrawer } from "@/components/pwa-update-drawer";
import { SlippageDrawer } from "@/components/slippage-drawer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts/settings";
import {
  useAnalytics,
  useOrderFlow,
  useProcessingTimes,
  useQuotedPrice,
  useThirdweb,
} from "@/hooks";
import { useContractVersion } from "@/hooks/use-contract-version";
import type { PlaceOrderStep } from "@/hooks/use-order-flow";
import { EVENTS } from "@/lib/analytics";
import { formatPaymentIdPreview } from "@/lib/compound-payment-id";
import { getFiatUnit, INTERNAL_HREFS, ORDER_TYPE } from "@/lib/constants";
import { isSlippageError, placeOrderErrorKey } from "@/lib/errors";
import {
  getUserFacingErrorMessage,
  isUserCancellation,
} from "@/lib/user-facing-error";
import {
  addLocalOrderPaymentDetails,
  cn,
  extractOrderIdFromOrderPlaced,
  formatFiatAmount,
} from "@/lib/utils";
import { safeParseWithResult } from "@/lib/zod-neverthrow";
import { HelpDrawer } from "../../order/help-drawer";
import { saveLastSellPaymentDetails } from "../last-sell-payment-details";
import {
  SellPaymentDetailsField,
  type SellPaymentDetailsValue,
} from "../sell-payment-details-field";
import { FundProtectionGuidelines } from "./fund-protection-guidelines";
import { type SellPreviewState, SellPreviewStateSchema } from "./shared";

/**
 * @description This page uses the amount passed from the previous page.
 * It takes a "receiving address" input from the user and places an order on the P2P.me protocol.
 * The protocol returns an order ID, which is the single source of truth.
 * This order ID is then sent to the next page as the `order/orderId` URL parameter.
 * The order details will be fetched on the next page directly from the protocol using the order ID.
 */
export function SellPreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const {
    settings: { currency },
  } = useSettings();

  const { account } = useThirdweb();
  const { quotedPrice: quotedSellPrice, hasPriceChanged } =
    useQuotedPrice("sell");
  const {
    data: processingTimes,
    isLoading: isProcessingTimesLoading,
    isError: isProcessingTimesError,
  } = useProcessingTimes();
  const { track } = useAnalytics();

  const [sellPreviewState, setSellPreviewState] = useState<SellPreviewState>({
    amount: {
      crypto: 0,
      fiat: 0,
    },
  });

  const [paymentDetails, setPaymentDetails] = useState<SellPaymentDetailsValue>(
    { paymentId: "", isValid: false, source: "none" },
  );
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderStep, setPlaceOrderStep] = useState<
    PlaceOrderStep | "approved-then-placing" | null
  >(null);
  const approvalStartedAtRef = useRef<number | null>(null);
  const { placeOrderMutation } = useOrderFlow({
    onPlaceOrderStep: (step) => {
      if (step === "approving") {
        approvalStartedAtRef.current = Date.now();
        setPlaceOrderStep("approving");
        return;
      }
      if (approvalStartedAtRef.current !== null) {
        track(EVENTS.TRANSACTION, {
          transaction_type: "sell",
          status: "approval_step_completed",
          approvalDurationMs: Date.now() - approvalStartedAtRef.current,
          currency: currency.currency,
        });
        approvalStartedAtRef.current = null;
        setPlaceOrderStep("approved-then-placing");
        return;
      }
      setPlaceOrderStep("placing");
    },
  });

  // State for contract version mismatch dialog
  const [showContractMismatch, setShowContractMismatch] = useState(false);
  // State for slippage drawer
  const [showSlippageDrawer, setShowSlippageDrawer] = useState(false);

  const { checkContractSync } = useContractVersion();
  // validate the state being passed from the previous page
  useEffect(() => {
    safeParseWithResult(SellPreviewStateSchema, locationState).match(
      (data) => {
        setSellPreviewState(data);
      },
      (error) => {
        console.error("SellPreviewLocationState", error);
        navigate(INTERNAL_HREFS.SELL);
      },
    );
  }, [navigate, locationState]);

  // Track preview viewed once the amount is known
  const previewTrackedRef = useRef(false);
  const previewCryptoAmount = sellPreviewState.amount.crypto;
  useEffect(() => {
    if (previewTrackedRef.current || !(previewCryptoAmount > 0)) return;
    previewTrackedRef.current = true;
    track(EVENTS.TRANSACTION, {
      transaction_type: "sell",
      status: "preview_viewed",
      amount: previewCryptoAmount,
      currency: currency.currency,
    });
  }, [previewCryptoAmount, track, currency.currency]);

  const currentAddress = paymentDetails.paymentId;

  const isPlacingOrderDisabled = isPlacingOrder || !paymentDetails.isValid;

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setPlaceOrderStep(null);
    approvalStartedAtRef.current = null;
    const placeStartedAt = Date.now();

    // Check contract version before proceeding
    const isSynced = await checkContractSync({ fresh: true });
    if (!isSynced) {
      setShowContractMismatch(true);
      setIsPlacingOrder(false);
      return;
    }

    // Live price moved since the quote was shown → let the user re-quote
    // instead of placing the order at a rate they never saw.
    if (await hasPriceChanged()) {
      setShowSlippageDrawer(true);
      setIsPlacingOrder(false);
      return;
    }

    const cryptoBig = parseUnits(sellPreviewState.amount.crypto.toString(), 6);
    const sellPriceBig = parseUnits(quotedSellPrice.toString(), 6);
    // Mirror the contract's fiatAmount = (amount * sellPrice) / 1e6 so the
    // slippage check tolerates frontend rounding and only triggers on real
    // price movements.
    const fiatAmountLimit = (cryptoBig * sellPriceBig) / 1_000_000n;

    await placeOrderMutation
      .mutateAsync(
        {
          amount: cryptoBig,
          recipientAddr: zeroAddress,
          orderType: ORDER_TYPE.SELL,
          currency: currency.currency,
          fiatAmount: parseUnits(sellPreviewState.amount.fiat.toString(), 6),
          fiatAmountLimit,
          user: account?.address as `0x${string}`,
        },
        {
          onSuccess: (receipt) => {
            const orderId = extractOrderIdFromOrderPlaced(
              ABIS.DIAMOND,
              receipt.logs,
              account?.address as `0x${string}`,
            );
            // Keep what the user entered so the ACCEPTED screen can prefill it
            // even if we can't key it by order ID below.
            saveLastSellPaymentDetails(
              account?.address,
              currentAddress,
              currency.currency,
            );

            if (!orderId) {
              // The USDC is already escrowed — the order exists, we just couldn't
              // read its ID from the receipt. Don't leave the page frozen.
              track(EVENTS.TRANSACTION, {
                transaction_type: "sell",
                status: "placed_order_id_missing",
                amount: sellPreviewState.amount.crypto,
                currency: currency.currency,
                address_source: paymentDetails.source,
              });
              setIsPlacingOrder(false);
              setPlaceOrderStep(null);
              toast.success(t("SELL_UX_ORDER_PLACED_ID_MISSING_TITLE"), {
                description: t("SELL_UX_ORDER_PLACED_ID_MISSING_DESCRIPTION"),
              });
              navigate(INTERNAL_HREFS.TRANSACTIONS, { replace: true });
              return;
            }

            // Track transaction started upon successful order placement
            track(EVENTS.TRANSACTION, {
              transaction_type: "sell",
              status: "placed",
              amount: sellPreviewState.amount.crypto,
              orderId: orderId.toString(),
              currency: currency.currency,
              paymentChannel: 0,
              address_source: paymentDetails.source,
              placeDurationMs: Date.now() - placeStartedAt,
            });
            // Store payment details; IDR is already packed as `Provider|number`
            addLocalOrderPaymentDetails(orderId.toString(), currentAddress);
            navigate(`${INTERNAL_HREFS.ORDER}/${orderId}`);
          },
          onError: (error) => {
            // Track failed sell transaction
            track(EVENTS.TRANSACTION, {
              transaction_type: "sell",
              status: "failed",
              amount: sellPreviewState.amount.crypto,
              errorMessage: error.message,
              currency: currency.currency,
              paymentChannel: 0,
              address_source: paymentDetails.source,
            });

            console.error("Error placing order", error);
            setIsPlacingOrder(false);
            setPlaceOrderStep(null);

            if (isUserCancellation(error)) {
              return;
            }

            if (isSlippageError(error)) {
              setShowSlippageDrawer(true);
              return;
            }

            const key = placeOrderErrorKey(error);
            toast.error(
              t(key),
              key === "FAILED_TO_PLACE_ORDER"
                ? {
                    description: getUserFacingErrorMessage(t, error),
                  }
                : undefined,
            );
          },
        },
      )
      .catch(() => {
        // onError above already handled UI state; avoid an unhandled rejection.
      });
  };

  const placingOrderLabel =
    placeOrderStep === "approving"
      ? t("SELL_UX_APPROVING_USDC_STEP")
      : placeOrderStep === "approved-then-placing"
        ? t("SELL_UX_PLACING_ORDER_STEP")
        : t("SELL_UX_PLACING_ORDER");

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <HelpDrawer
        open={showHelpDrawer}
        onOpenChange={setShowHelpDrawer}
        orderType="SELL"
      />
      <PWAUpdateDrawer
        open={showContractMismatch}
        onReload={() => window.location.reload()}
      />
      <SlippageDrawer
        open={showSlippageDrawer}
        onOpenChange={setShowSlippageDrawer}
        onConfirm={() => {
          setShowSlippageDrawer(false);
          // Back to the amount screen with the same amount prefilled so the
          // user only has to re-quote, not re-type.
          navigate(INTERNAL_HREFS.SELL, {
            replace: true,
            state: { prefillCryptoAmount: sellPreviewState.amount.crypto },
          });
        }}
      />
      <NonHomeHeader
        title={t("ORDER_PREVIEW")}
        onHelpClick={() => setShowHelpDrawer(true)}
      />
      <main
        className={cn(
          "no-scrollbar container-narrow flex min-h-0 w-full flex-1 flex-col items-center gap-8 overflow-y-auto py-8 transition-all duration-300",
          isPlacingOrder && "pointer-events-none",
        )}>
        <section className="flex w-full items-start justify-start">
          {ASSETS.IMAGES.USDCFiatOverlapped(currency.currency, {
            className: "h-18",
          })}
        </section>
        <section className="flex w-full items-start justify-start">
          <h2 className="w-3/4 font-medium text-xl">
            {t("CONFIRM_SALE_OF_USDC_WITH_CURRENCY", {
              currency: getFiatUnit(currency.currency),
            })}
          </h2>
        </section>
        <section className="flex w-full flex-col gap-3">
          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("YOU_SEND")}</p>
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {sellPreviewState.amount.crypto} USDC
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("YOU_RECEIVE")}</p>
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="size-4 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                {formatFiatAmount(
                  sellPreviewState.amount.fiat,
                  currency.currency,
                )}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between">
            <p className="font-medium text-sm">{t("ESTIMATED_TIME")}</p>
            <div className="flex items-center gap-2">
              <Clock4 className="size-4 text-muted-foreground" />
              {isProcessingTimesLoading ? (
                <Skeleton className="h-4 w-24 rounded-sm" />
              ) : isProcessingTimesError ? (
                <p className="text-muted-foreground text-sm">
                  {t("SELL_UX_PROCESSING_TIMES_UNAVAILABLE")}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("FROM_TO_MINUTES", {
                    from: processingTimes?.sellMin,
                    to: processingTimes?.sellMax,
                  })}
                </p>
              )}
            </div>
          </div>
        </section>
        <DashedSeparator
          className="h-0.5 w-full text-border"
          dashSize="10px"
          dashGap="10px"
        />
        <SellPaymentDetailsField
          onChange={setPaymentDetails}
          analyticsContext="preview"
        />
        <FundProtectionGuidelines />
      </main>
      <footer className="container-narrow flex w-full flex-col items-center justify-center gap-2 p-4">
        {paymentDetails.isValid ? (
          <p className="w-full truncate text-center text-muted-foreground text-xs">
            {t("SELL_UX_YOU_WILL_BE_PAID_TO")}{" "}
            <span className="font-medium text-foreground">
              {formatPaymentIdPreview(
                paymentDetails.paymentId,
                currency.currency,
                t,
              )}
            </span>
          </p>
        ) : null}
        <Button
          onClick={handlePlaceOrder}
          className="w-full p-6"
          disabled={isPlacingOrderDisabled}>
          {isPlacingOrder ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              <p className="font-medium text-sm" aria-live="polite">
                {placingOrderLabel}
              </p>
            </>
          ) : (
            <p className="font-medium text-sm">{t("PLACE_ORDER")}</p>
          )}
        </Button>
      </footer>
    </div>
  );
}
