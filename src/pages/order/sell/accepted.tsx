import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { CURRENCY } from "@p2pdotme/sdk/country";
import { useQuery } from "@tanstack/react-query";
import { Info, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { DashedSeparator, OrderProgress } from "@/components";
import { OrderElapsedTime } from "@/components/order-elapsed-time";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/contexts";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import { useAnalytics, useOrderFlow } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { formatPaymentIdPreview } from "@/lib/compound-payment-id";
import {
  getUserFacingErrorMessage,
  isUserCancellation,
} from "@/lib/user-facing-error";
import {
  addLocalOrderPaymentDetails,
  cn,
  formatFiatAmount,
  getPaymentAddressFromOrderDetails,
} from "@/lib/utils";
import { getLastSellPaymentDetails } from "../../sell/last-sell-payment-details";
import {
  SellPaymentDetailsField,
  type SellPaymentDetailsValue,
} from "../../sell/sell-payment-details-field";
import { SELL_FLOW_PROGRESS_TEXT } from "../shared";
import { FeeDetailValue } from "./fee-detail-value";
import { SellReceivingPaymentRow } from "./sell-receiving-payment-row";

/** Survives React Strict Mode remount so we don't submit two UserOps at once. */
const sellUpiInFlight = new Set<string>();
const sellUpiSent = new Set<string>();

export function SellAccepted({ order }: { order: Order }) {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const { track, trackWithDedupe } = useAnalytics();
  const {
    data: orderFeeDetails,
    isLoading: isLoadingOrderFeeDetails,
    error: orderFeeDetailsError,
  } = useQuery({
    queryKey: ["orderFeeDetails", order.id],
    queryFn: () =>
      getOrderFeeDetails(Number(order.id)).match(
        (details) => details,
        (error) => {
          throw error;
        },
      ),
    enabled: !!order.id,
  });

  // Extract values from the combined query result
  const fixedFeePaid = orderFeeDetails?.fixedFeePaid ?? 0;
  const actualUsdcAmount = orderFeeDetails?.actualUsdtAmount;
  const actualFiatAmount = orderFeeDetails?.actualFiatAmount;

  const { setSellOrderUpiWithFiatMutation } = useOrderFlow();
  const orderKey = order.id.toString();
  // Payment details are kept on the device that placed the order. On another
  // device / cleared storage they're missing, so the user can enter them here.
  const [storedPaymentAddress, setStoredPaymentAddress] = useState(() =>
    getPaymentAddressFromOrderDetails(orderKey),
  );
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [inlineDetails, setInlineDetails] = useState<SellPaymentDetailsValue>({
    paymentId: "",
    isValid: false,
    source: "none",
  });
  // IDR manual entries are packed `Provider|number` and can't be put back
  // into the raw input, so only prefill for other currencies.
  const [prefillAddress] = useState(() =>
    order.currency === CURRENCY.IDR
      ? undefined
      : getLastSellPaymentDetails(order.currency),
  );
  const needsDetails = !storedPaymentAddress;
  const showForm = needsDetails || showDetailsForm;

  // Track sell transaction accepted view
  useEffect(() => {
    trackWithDedupe(EVENTS.TRANSACTION, `transaction_${order.id}_accepted`, {
      transaction_type: "sell",
      status: "accepted",
      orderId: order.id.toString(),
      currency: order.currency,
      amount: Number(order.amount),
      fiatAmount: Number(order.fiatAmount),
    });
  }, [order, trackWithDedupe]);

  useEffect(() => {
    if (!needsDetails) return;
    trackWithDedupe(
      EVENTS.TRANSACTION,
      `transaction_${order.id}_details_missing`,
      {
        transaction_type: "sell",
        status: "payment_details_missing_shown",
        orderId: order.id.toString(),
        currency: order.currency,
        hasPrefill: !!prefillAddress,
      },
    );
  }, [needsDetails, order.id, order.currency, prefillAddress, trackWithDedupe]);

  const handleSendPaymentDetails = useCallback(
    async (paymentAddress: string, trigger: "auto" | "retry" | "inline") => {
      if (sellUpiSent.has(orderKey) || sellUpiInFlight.has(orderKey)) return;
      if (!order.pubkey || !paymentAddress) return;

      console.log(
        `[ORDER:${order.id}:${order.orderType}:${order.status}] Sending payment details...`,
      );

      sellUpiInFlight.add(orderKey);
      try {
        await setSellOrderUpiWithFiatMutation.mutateAsync(
          {
            orderId: BigInt(order.id),
            paymentAddress,
            merchantPublicKey: order.pubkey,
            // SELL orders never change amount after acceptance — 0n keeps the
            // order's USDC/fiat legs untouched (see useOrderFlow for why the
            // fiat-denominated variant is used across the board).
            updatedFiatAmount: 0n,
          },
          {
            onSuccess: (receipt) => {
              sellUpiSent.add(orderKey);
              console.log(
                `[ORDER:${order.id}:${order.orderType}:${order.status}] Payment details sent with receipt: `,
                receipt,
              );
              track(EVENTS.TRANSACTION, {
                transaction_type: "sell",
                status: "payment_details_sent",
                trigger,
                orderId: orderKey,
                currency: order.currency,
              });
              toast.success(t("PAYMENT_DETAILS_SENT"));
            },
            onError: (error) => {
              track(EVENTS.TRANSACTION, {
                transaction_type: "sell",
                status: "payment_details_failed",
                trigger,
                orderId: orderKey,
                currency: order.currency,
                errorMessage: error.message,
                userCancelled: isUserCancellation(error),
              });
              toast.error(t("FAILED_TO_SEND_PAYMENT_DETAILS"), {
                description: getUserFacingErrorMessage(t, error),
              });
            },
          },
        );
      } catch {
        // onError already toasted; mutateAsync still rejects — swallow to avoid uncaught.
      } finally {
        sellUpiInFlight.delete(orderKey);
      }
    },
    [
      order.id,
      order.orderType,
      order.pubkey,
      order.status,
      order.currency,
      orderKey,
      setSellOrderUpiWithFiatMutation,
      t,
      track,
    ],
  );

  // Auto-send stored details once. After a failure the user retries
  // explicitly (Retry resets the mutation back to idle).
  useEffect(() => {
    if (
      !order.pubkey ||
      !storedPaymentAddress ||
      setSellOrderUpiWithFiatMutation.status !== "idle"
    ) {
      return;
    }
    void handleSendPaymentDetails(storedPaymentAddress, "auto");
  }, [
    handleSendPaymentDetails,
    order.pubkey,
    storedPaymentAddress,
    setSellOrderUpiWithFiatMutation.status,
  ]);

  const sendFailed = setSellOrderUpiWithFiatMutation.isError;
  const sendPending = setSellOrderUpiWithFiatMutation.isPending;

  const handleRetry = () => {
    if (!storedPaymentAddress) return;
    track(EVENTS.TRANSACTION, {
      transaction_type: "sell",
      status: "payment_details_retry",
      orderId: orderKey,
      currency: order.currency,
    });
    sellUpiInFlight.delete(orderKey);
    sellUpiSent.delete(orderKey);
    setSellOrderUpiWithFiatMutation.reset();
    void handleSendPaymentDetails(storedPaymentAddress, "retry");
  };

  const handleInlineSubmit = () => {
    if (!inlineDetails.isValid) return;
    track(EVENTS.TRANSACTION, {
      transaction_type: "sell",
      status: "payment_details_inline_submitted",
      orderId: orderKey,
      currency: order.currency,
      address_source: inlineDetails.source,
      wasMissing: needsDetails,
    });
    addLocalOrderPaymentDetails(orderKey, inlineDetails.paymentId);
    setStoredPaymentAddress(inlineDetails.paymentId);
    setShowDetailsForm(false);
    sellUpiInFlight.delete(orderKey);
    sellUpiSent.delete(orderKey);
    setSellOrderUpiWithFiatMutation.reset();
    void handleSendPaymentDetails(inlineDetails.paymentId, "inline");
  };

  return (
    <main className="flex h-full w-full flex-col overflow-y-auto">
      {showForm ? (
        <section className="container-narrow flex flex-col gap-4 py-8">
          <div className="flex flex-col gap-1">
            <h2 className="font-medium text-lg">
              {needsDetails
                ? t("SELL_UX_DETAILS_MISSING_TITLE")
                : t("SELL_UX_USE_DIFFERENT_DETAILS")}
            </h2>
            {needsDetails ? (
              <p className="text-muted-foreground text-sm">
                {t("SELL_UX_DETAILS_MISSING_DESCRIPTION")}
              </p>
            ) : null}
          </div>
          <SellPaymentDetailsField
            onChange={setInlineDetails}
            initialManualAddress={prefillAddress}
            analyticsContext="accepted"
          />
          {inlineDetails.isValid ? (
            <p className="truncate text-center text-muted-foreground text-xs">
              {t("SELL_UX_YOU_WILL_BE_PAID_TO")}{" "}
              <span className="font-medium text-foreground">
                {formatPaymentIdPreview(
                  inlineDetails.paymentId,
                  order.currency,
                  t,
                )}
              </span>
            </p>
          ) : null}
          <Button
            className="w-full p-6"
            disabled={!inlineDetails.isValid || sendPending}
            onClick={handleInlineSubmit}>
            {sendPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("SELL_UX_SEND_PAYMENT_DETAILS")}
          </Button>
          {!needsDetails ? (
            <Button variant="ghost" onClick={() => setShowDetailsForm(false)}>
              {t("CANCEL")}
            </Button>
          ) : null}
          <p className="text-center text-muted-foreground text-xs">
            {t("SELL_UX_ACCEPTED_TIMEOUT_NOTE")}
          </p>
        </section>
      ) : (
        <section className="container-narrow flex flex-col items-center justify-center gap-4 py-8">
          <DotLottieReact
            className="h-40 w-80"
            src={ASSETS.ANIMATIONS.WAITING_TRANSFER}
            autoplay
            loop
          />
          <h2 className="text-center font-medium text-lg">
            {sendFailed
              ? t("FAILED_TO_SEND_PAYMENT_DETAILS")
              : `${t("SENDING_YOUR_PAYMENT_DETAILS")}...`}
          </h2>
          <p className="text-center text-muted-foreground text-sm">
            {sendFailed
              ? getUserFacingErrorMessage(
                  t,
                  setSellOrderUpiWithFiatMutation.error,
                )
              : t(
                  "YOUR_PAYMENT_DETAILS_WILL_BE_SENT_SHORTLY_DONT_LEAVE_THE_PAGE",
                )}
          </p>
          <p className="text-center text-muted-foreground text-xs">
            {t("SELL_UX_ACCEPTED_TIMEOUT_NOTE")}
          </p>
          {sendFailed ? (
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Button disabled={sendPending} onClick={handleRetry}>
                {t("TRY_AGAIN")}
              </Button>
              <Button
                variant="outline"
                disabled={sendPending}
                onClick={() => setShowDetailsForm(true)}>
                {t("SELL_UX_USE_DIFFERENT_DETAILS")}
              </Button>
            </div>
          ) : null}
        </section>
      )}

      <motion.footer
        initial={{ opacity: 0, y: 400 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className="mx-auto mt-auto flex w-full max-w-lg flex-shrink-0 flex-col justify-center gap-2 rounded-t-3xl border-t bg-background py-4 shadow-[0_-4px_16px_var(--primary-shadow)]">
        <section className="flex w-full flex-col items-center">
          <p className="text-center text-sm">
            {t("SENDING_YOUR_PAYMENT_DETAILS")}
          </p>
          <OrderElapsedTime
            sinceTimestamp={order.placedTimestamp}
            expectedSeconds={600}
          />
        </section>
        <Separator className="h-4 animate-pulse bg-primary py-1" />
        <OrderProgress
          steps={SELL_FLOW_PROGRESS_TEXT}
          currentStepKey={order.status}
        />

        <Card className="mx-4 gap-2 shadow-none sm:gap-4">
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {ASSETS.IMAGES.USDCFiatOverlapped(order.currency, {
                  className: "h-6",
                })}
                <p className="font-medium text-lg">
                  {t(order.orderType).toUpperCase()} USDC
                </p>
              </div>
              <Badge
                className={cn(
                  "px-4 py-1 text-sm",
                  "bg-success/20 text-success",
                )}>
                {t(order.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("ID")} </span>
                <span className="text-muted-foreground">{order.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_SEND")} </span>
                <span className="text-muted-foreground">
                  <FeeDetailValue
                    isLoading={isLoadingOrderFeeDetails}
                    isError={!!orderFeeDetailsError}
                    skeletonClassName="h-4 w-20"
                    value={`${actualUsdcAmount?.toFixed(3)} USDC`}
                  />
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("FEE")} </span>
                <span className="text-muted-foreground">
                  <FeeDetailValue
                    isLoading={isLoadingOrderFeeDetails}
                    isError={!!orderFeeDetailsError}
                    skeletonClassName="h-4 w-16"
                    value={`${fixedFeePaid.toFixed(3)} USDC`}
                  />
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_RECEIVE")} </span>
                <span className="text-muted-foreground">
                  <FeeDetailValue
                    isLoading={isLoadingOrderFeeDetails}
                    isError={!!orderFeeDetailsError}
                    skeletonClassName="h-4 w-20"
                    value={
                      actualFiatAmount
                        ? formatFiatAmount(actualFiatAmount, order.currency)
                        : null
                    }
                    fallback={formatFiatAmount(
                      Number(order.fiatAmount),
                      order.currency,
                    )}
                  />
                </span>
              </div>

              <SellReceivingPaymentRow
                currency={order.currency}
                address={storedPaymentAddress}
                paymentAddressName={currency.paymentAddressName}
              />
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("PAYMENT_DETAILS")} </span>
                <span
                  className={
                    setSellOrderUpiWithFiatMutation.isSuccess
                      ? "text-success"
                      : "text-destructive"
                  }>
                  {setSellOrderUpiWithFiatMutation.isSuccess
                    ? t("PAYMENT_DETAILS_SENT")
                    : sendPending
                      ? `${t("SENDING_YOUR_PAYMENT_DETAILS")}...`
                      : sendFailed
                        ? t("FAILED_TO_SEND_PAYMENT_DETAILS")
                        : t("NOT_SENT")}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <DashedSeparator
              className="h-0.5 text-muted-foreground"
              dashGap="8"
              dashSize="12"
            />
            {(() => {
              const fiatAmount = Number(order.fiatAmount);

              return (
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">
                    {t("TOTAL_RECEIVABLE_AMOUNT")}{" "}
                  </span>
                  <span className="text-muted-foreground">
                    {formatFiatAmount(fiatAmount, order.currency)}
                  </span>
                </div>
              );
            })()}
          </CardFooter>
        </Card>
        <Alert
          variant="default"
          className="mx-4 w-[calc(100%-2rem)] border-none bg-primary/10 p-3 shadow-none">
          <Info className="size-4 text-primary" />
          <AlertTitle className="font-medium text-primary text-sm">
            {t("NOTE")}
          </AlertTitle>
          <AlertDescription className="text-xs">
            {t(
              "YOUR_PAYMENT_DETAILS_WILL_BE_SENT_ONCE_THE_MERCHANT_IS_CONNECTED",
            )}
            .
          </AlertDescription>
        </Alert>
      </motion.footer>
    </main>
  );
}
