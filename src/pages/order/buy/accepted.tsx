import { getStoredQrPayload } from "@p2pdotme/sdk/country";
import { useOrders } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Copy,
  LifeBuoy,
  Loader2,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ASSETS from "@/assets";
import {
  CircleCountdownTimer,
  OrderProgress,
  TransferWarningAlert,
} from "@/components";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import {
  useAnalytics,
  useOrderExpiresAt,
  useOrderFlow,
  useSupportChat,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import {
  getPaymentIdDisplayParts,
  getPaymentIdFields,
} from "@/lib/compound-payment-id";
import { CURRENCY_META_DATA, uploadsPaymentQR } from "@/lib/constants";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import {
  buildPixBrCode,
  buildTransfermovilQr,
  cn,
  formatFiatAmount,
  formatFiatAmountNumeric,
  generateUPILink,
  getPaymentMethodFromOrderDetails,
} from "@/lib/utils";
import { HelpDrawer } from "../help-drawer";
import { BUY_FLOW_PROGRESS_TEXT } from "../shared";

const COUNTDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

// Builds the value encoded into the scannable QR code for a given currency.
// PEN/VEN store an optional QR payload packed with typed fallback; we encode
// only the QR. BRL (Pix) sends only the key, so we build a scan-to-pay BR Code.
// INR (and other UPI-style) addresses are wrapped into a upi:// deep link.
function buildQrValue({
  paymentAddress,
  amount,
  currency,
  orderId,
}: {
  paymentAddress: string;
  amount: string;
  currency: keyof typeof CURRENCY_META_DATA;
  orderId: string;
}) {
  if (uploadsPaymentQR(currency)) {
    return getStoredQrPayload(currency, paymentAddress) ?? "";
  }
  if (currency === "BRL") {
    return buildPixBrCode(paymentAddress, amount, orderId);
  }
  return generateUPILink(paymentAddress, amount, currency, orderId);
}

// QR Code Drawer Component
function QRCodeDrawer({
  children,
  paymentAddress,
  amount,
  currency,
  orderId,
}: {
  children: React.ReactNode;
  paymentAddress: string;
  amount: string;
  currency: keyof typeof CURRENCY_META_DATA;
  orderId: string;
}) {
  const { t } = useTranslation();
  const qrValue = buildQrValue({ paymentAddress, amount, currency, orderId });

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("SCAN_PAY")}</DrawerTitle>
          <DrawerDescription>
            {t("SCAN_THIS_QR_CODE_WITH_YOUR_PAYMENT_APP")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col items-center gap-6 px-4 pb-4">
          <div className="rounded-xl border-2 border-primary bg-white p-4 shadow-primary-shadow shadow-xl">
            <QRCodeSVG value={qrValue} size={200} level="L" />
          </div>

          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-muted-foreground text-sm">
              {t(CURRENCY_META_DATA[currency].paymentAddressName)}
            </p>
            <div className="flex w-full items-center justify-center rounded-lg bg-primary/10 p-2 px-4 text-sm">
              <p className="text-muted-foreground">{paymentAddress}</p>
            </div>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose className="w-full rounded-lg bg-primary p-4 text-primary-foreground">
            {t("CLOSE")}
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Cancel Order Confirmation Drawer Component
function CancelOrderDrawer({
  children,
  onConfirmCancel,
  isLoading,
}: {
  children: React.ReactNode;
  onConfirmCancel: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-center">
          <DrawerTitle>{t("CANCEL_ORDER")}</DrawerTitle>
          <DrawerDescription>
            {t("ARE_YOU_SURE_YOU_WANT_TO_CANCEL_THIS_ORDER")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <p className="text-center text-muted-foreground text-sm">
            {t(
              "THIS_ACTION_CANNOT_BE_UNDONE_THE_ORDER_WILL_BE_PERMANENTLY_CANCELLED",
            )}
          </p>
          <Alert variant="warning">
            <AlertTriangle className="size-4" />
            <AlertDescription className="text-foreground text-sm">
              {t("BUY_UX_CANCEL_ALREADY_PAID_WARNING")}
            </AlertDescription>
          </Alert>
        </div>

        <DrawerFooter>
          <Button
            variant="destructive"
            className="w-full"
            onClick={onConfirmCancel}
            disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              t("YES_CANCEL_ORDER")
            )}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              {t("NO_KEEP_ORDER")}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function BuyAccepted({ order }: { order: Order }) {
  const { t } = useTranslation();
  const orders = useOrders();
  const { track, trackWithDedupe } = useAnalytics();
  const { openSupportChat } = useSupportChat();
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);

  const {
    data: orderFeeDetails,
    isLoading: isLoadingOrderFeeDetails,
    error: orderFeeDetailsError,
    refetch: refetchOrderFeeDetails,
    isFetching: isFetchingOrderFeeDetails,
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
  const actualFiatAmount = orderFeeDetails?.actualFiatAmount;
  const [isPaymentTimeoutExpired, setIsPaymentTimeoutExpired] = useState(false);
  const [decryptedPaymentAddress, setDecryptedPaymentAddress] = useState<
    string | undefined
  >(undefined);
  const [decryptStatus, setDecryptStatus] = useState<
    "loading" | "ok" | "error"
  >("loading");
  const [decryptAttempt, setDecryptAttempt] = useState(0);

  const {
    data: orderExpiresAt,
    isPending: isLoadingAcceptedTimestamp,
    isError: isErrorAcceptedTimestamp,
    refetch: refetchOrderExpiresAt,
    isRefetching: isRefetchingOrderExpiresAt,
  } = useOrderExpiresAt(Number(order.id));

  const paymentMethod =
    getPaymentMethodFromOrderDetails(order.id.toString()) ||
    CURRENCY_META_DATA[order.currency].paymentMethod;

  // Track buy transaction accepted view
  useEffect(() => {
    trackWithDedupe(EVENTS.TRANSACTION, `transaction_${order.id}_accepted`, {
      transaction_type: "buy",
      status: "accepted",
      orderId: order.id.toString(),
      merchantId: order.acceptedMerchant,
      amount: Number(order.amount),
      currency: order.currency,
      paymentMethod,
    });
  }, [order, paymentMethod, trackWithDedupe]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: decryptAttempt re-runs decryption on Retry
  useEffect(() => {
    let cancelled = false;
    const decryptPaymentAddressAsync = async () => {
      setDecryptStatus("loading");
      const decrypted = await orders.decryptPaymentAddress({
        encrypted: order.encUpi,
      });
      if (cancelled) return;
      if (decrypted.isErr()) {
        console.error("Failed to decrypt payment address", decrypted.error);
        // Never surface a placeholder as if it were the payee — it could be
        // copied, encoded in a QR or paid to.
        setDecryptedPaymentAddress(undefined);
        setDecryptStatus("error");
        track(EVENTS.TRANSACTION, {
          transaction_type: "buy",
          status: "decrypt_failed",
          orderId: order.id.toString(),
          currency: order.currency,
          attempt: decryptAttempt + 1,
        });
      } else {
        setDecryptedPaymentAddress(decrypted.value);
        setDecryptStatus("ok");
      }
    };
    decryptPaymentAddressAsync();
    return () => {
      cancelled = true;
    };
  }, [order.encUpi, orders.decryptPaymentAddress, decryptAttempt]);

  const isPaymentDetailsUnavailable = decryptStatus !== "ok";

  const openHelpForAlreadyPaid = useCallback(() => {
    track(EVENTS.TRANSACTION, {
      transaction_type: "buy",
      status: "already_paid_help_tapped",
      orderId: order.id.toString(),
      currency: order.currency,
      source: "accepted_expired",
    });
    setShowHelpDrawer(true);
  }, [order.id, order.currency, track]);

  const { paidBuyOrderMutation, cancelOrderMutation } = useOrderFlow();

  const handleMadePayment = () => {
    if (isPaymentDetailsUnavailable) return;
    console.log(
      `[ORDER:${order.id}:${order.orderType}:${order.status}] Marking as paid...`,
    );
    paidBuyOrderMutation.mutate(
      {
        orderId: Number(order.id),
      },
      {
        onSuccess: (receipt) => {
          console.log(
            `[ORDER:${order.id}:${order.orderType}:${order.status}] Marked as paid with receipt: `,
            receipt,
          );

          // Track buy transaction paid (in-progress)
          trackWithDedupe(EVENTS.TRANSACTION, `transaction_${order.id}_paid`, {
            transaction_type: "buy",
            status: "paid",
            orderId: order.id.toString(),
            amount: Number(order.amount),
            currency: order.currency,
            paymentMethod,
          });

          toast.success(t("MARKED_AS_PAID"));
        },
        onError: (error) => {
          track(EVENTS.TRANSACTION, {
            transaction_type: "buy",
            status: "mark_paid_failed",
            orderId: order.id.toString(),
            currency: order.currency,
            errorMessage: String(
              (error as { message?: unknown })?.message ?? "",
            ),
          });
          toast.error(t("FAILED_TO_MARK_AS_PAID"), {
            description: getUserFacingErrorMessage(t, error),
            action: {
              label: t("RETRY"),
              onClick: () => handleMadePayment(),
            },
          });
        },
      },
    );
  };

  const handleCancelOrder = () => {
    console.log(
      `[ORDER:${order.id}:${order.orderType}:${order.status}] Cancelling order...`,
    );
    cancelOrderMutation.mutate(
      {
        orderId: Number(order.id),
      },
      {
        onSuccess: (receipt) => {
          console.log(
            `[ORDER:${order.id}:${order.orderType}:${order.status}] Marked as paid with receipt: `,
            receipt,
          );
          trackWithDedupe(
            "buy_order_user_initiated_cancellation",
            `buy_order_user_initiated_cancellation_${order.id}`,
            {
              orderId: order.id.toString(),
              amount: Number(order.amount),
              currency: order.currency,
              paymentMethod,
            },
          );
          toast.success(t("ORDER_CANCELLED"));
        },
        onError: (error) => {
          track(EVENTS.TRANSACTION, {
            transaction_type: "buy",
            status: "cancel_failed",
            orderId: order.id.toString(),
            currency: order.currency,
            errorMessage: String(
              (error as { message?: unknown })?.message ?? "",
            ),
          });
          toast.error(t("FAILED_TO_CANCEL_ORDER"), {
            description: getUserFacingErrorMessage(t, error),
          });
        },
      },
    );
  };

  const paymentIdFields = getPaymentIdFields(order.currency);
  const storedQr = decryptedPaymentAddress
    ? getStoredQrPayload(order.currency, decryptedPaymentAddress)
    : null;
  const packedQr = uploadsPaymentQR(order.currency) ? storedQr : null;
  const catalogParts = decryptedPaymentAddress
    ? getPaymentIdDisplayParts(decryptedPaymentAddress, order.currency)
    : [];
  const isMultiField = paymentIdFields.length > 1;
  // Hide the plain "To" row only when multi-field parts or a packed QR block
  // already show the destination (INR single-field UPI must keep the To row).
  const hidePackedToRow =
    !!packedQr || (isMultiField && catalogParts.length > 0);

  const transfermovilQrValue =
    decryptedPaymentAddress && order.currency === "CUP"
      ? buildTransfermovilQr(decryptedPaymentAddress)
      : null;

  const trackPaymentDetailsCopied = (field: string) => {
    track(EVENTS.TRANSACTION, {
      transaction_type: "buy",
      status: "payment_details_copied",
      field,
      orderId: order.id.toString(),
      currency: order.currency,
    });
  };

  const handleCopyPaymentField = (value: string) => {
    if (isPaymentDetailsUnavailable) return;
    navigator.clipboard.writeText(value);
    trackPaymentDetailsCopied("payment_field");
    toast.success(
      t("PAYMENT_ADDRESS_COPIED_TO_CLIPBOARD", {
        paymentAddressName: t(
          CURRENCY_META_DATA[order.currency].paymentAddressName,
        ),
      }),
    );
  };

  const handleCopyPaymentAddress = () => {
    if (decryptedPaymentAddress && !isPaymentDetailsUnavailable) {
      navigator.clipboard.writeText(decryptedPaymentAddress);
      trackPaymentDetailsCopied("payment_address");
      toast.success(
        t("PAYMENT_ADDRESS_COPIED_TO_CLIPBOARD", {
          paymentAddressName: t(
            CURRENCY_META_DATA[order.currency].paymentAddressName,
          ),
        }),
      );
    } else {
      toast.error(
        t("FAILED_TO_COPY_PAYMENT_ADDRESS", {
          paymentAddressName: t(
            CURRENCY_META_DATA[order.currency].paymentAddressName,
          ),
        }),
      );
    }
  };

  // Only ever show / copy / deep-link the exact amount to pay, which
  // includes fees. order.fiatAmount can exclude the fee, so falling back to
  // it could make the user underpay; on error show Retry instead.
  const payableFiatAmount: number | undefined = actualFiatAmount;

  const upiLink =
    order.currency === "INR" &&
    paymentMethod === "UPI" &&
    decryptedPaymentAddress &&
    !isPaymentDetailsUnavailable &&
    payableFiatAmount
      ? generateUPILink(
          decryptedPaymentAddress,
          payableFiatAmount.toFixed(2),
          order.currency,
          order.id.toString(),
        )
      : null;
  const upiDeepLink = upiLink?.startsWith("upi://") ? upiLink : null;

  const handleCopyFiatAmount = () => {
    if (payableFiatAmount) {
      const numericAmount = formatFiatAmountNumeric(
        payableFiatAmount,
        order.currency,
      );
      navigator.clipboard.writeText(numericAmount);
      trackPaymentDetailsCopied("amount");
      toast.success(t("DEV_TOASTS_COPIED_TO_CLIPBOARD"));
    } else {
      toast.warning(t("NO_AMOUNT_TO_COPY"));
    }
  };

  return (
    <>
      <HelpDrawer
        open={showHelpDrawer}
        onOpenChange={setShowHelpDrawer}
        order={order}
        orderType="BUY"
        paymentWindowEnded={isPaymentTimeoutExpired}
      />
      <main
        className={cn(
          "flex h-full w-full flex-col overflow-y-auto pt-4",
          (paidBuyOrderMutation.isPending || cancelOrderMutation.isPending) &&
            "pointer-events-none animate-pulse blur-[1px]",
        )}>
        <section className="container-narrow flex flex-col items-center justify-center gap-4 py-8">
          {isLoadingAcceptedTimestamp && (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          )}
          {isErrorAcceptedTimestamp && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-center text-muted-foreground text-sm">
                {t("BUY_UX_TIMER_LOAD_FAILED")}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={isRefetchingOrderExpiresAt}
                onClick={() => refetchOrderExpiresAt()}>
                <RefreshCw
                  className={cn(
                    "size-4",
                    isRefetchingOrderExpiresAt && "animate-spin",
                  )}
                />
                {t("RETRY")}
              </Button>
            </div>
          )}
          {orderExpiresAt ? (
            <CircleCountdownTimer
              expiresAt={orderExpiresAt.toString()}
              countdownDuration={COUNTDOWN_DURATION}
              onComplete={() => {
                console.log(t("PAYMENT_TIMEOUT_EXPIRED"));
                setIsPaymentTimeoutExpired(true);
                track(EVENTS.TRANSACTION, {
                  transaction_type: "buy",
                  status: "timeout",
                  orderId: order.id.toString(),
                  amount: Number(order.amount),
                  currency: order.currency,
                  paymentMethod,
                });
              }}
            />
          ) : null}
          {isPaymentTimeoutExpired ? (
            <>
              <h2 className="text-center font-medium text-lg">
                {t("BUY_UX_PAYMENT_WINDOW_ENDED_TITLE")}
              </h2>
              <p className="text-center text-muted-foreground text-sm">
                {t("BUY_UX_PAYMENT_WINDOW_ENDED_DESCRIPTION")}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-center font-medium text-lg">
                {t("COMPLETE_YOU_PAYMENT_AND_CONFIRM")}...
              </h2>
              <p className="text-center text-muted-foreground text-sm">
                {t(
                  "TRANSFER_THE_AMOUNT_TO_THE_PAYMENT_ADDRESS_BELOW_AND_CLICK_I_HAVE_PAID_TO_CONTINUE",
                  {
                    paymentAddressName: t(
                      CURRENCY_META_DATA[order.currency].paymentAddressName,
                    ),
                  },
                )}
              </p>
            </>
          )}
        </section>

        <motion.footer
          initial={{ opacity: 0, y: 400 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="mx-auto mt-auto flex w-full max-w-lg flex-shrink-0 flex-col justify-center gap-2 rounded-t-3xl border-t bg-background py-4 shadow-[0_-4px_16px_var(--primary-shadow)]">
          <section className="flex w-full flex-col items-center">
            <p className="text-center text-sm">
              {t("A_MERCHANT_ACCEPTED_YOUR_ORDER")}
            </p>
          </section>
          <Separator className="h-4 animate-pulse bg-primary py-1" />
          <OrderProgress
            steps={BUY_FLOW_PROGRESS_TEXT}
            currentStepKey={order.status}
          />

          <div className="mx-4 flex flex-col gap-2 pb-2">
            <TransferWarningAlert currency={order.currency} />
            {decryptStatus === "error" ? (
              <Alert variant="destructive" className="w-full">
                <AlertTriangle className="size-4" />
                <AlertTitle>{t("BUY_UX_DECRYPT_FAILED_TITLE")}</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>{t("BUY_UX_DECRYPT_FAILED_DESCRIPTION")}</p>
                  <div className="flex w-full gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setDecryptAttempt((n) => n + 1)}>
                      <RefreshCw className="size-4" />
                      {t("RETRY")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={openSupportChat}>
                      {t("CONTACT_SUPPORT")}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <Card className="mx-4 gap-2 shadow-none">
            <div className="-translate-x-2 -translate-y-3 w-fit bg-background">
              <div className="flex w-fit items-center gap-2 rounded-sm bg-primary/30 px-2 py-1">
                <ASSETS.ICONS.Pay className="size-4" />
                <p className="rounded-sm font-medium text-xs">
                  {t("PAY_VIA_PAYMENT_METHOD_AND_CONFIRM", {
                    paymentMethod: t(paymentMethod),
                  })}
                </p>
              </div>
            </div>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("ID")} </span>
                  <span className="text-muted-foreground">{order.id}</span>
                </div>

                {(() => {
                  // Use actualFiatAmount directly (includes fees)

                  return (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t("YOU_SEND")} </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {isLoadingOrderFeeDetails ? (
                            <Skeleton className="h-5 w-20" />
                          ) : payableFiatAmount ? (
                            formatFiatAmount(payableFiatAmount, order.currency)
                          ) : orderFeeDetailsError ? (
                            <button
                              type="button"
                              disabled={isFetchingOrderFeeDetails}
                              onClick={() => void refetchOrderFeeDetails()}
                              className="font-medium text-primary underline underline-offset-2">
                              {t("BUY_UX_AMOUNT_LOAD_FAILED_RETRY")}
                            </button>
                          ) : null}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 bg-primary/20"
                          onClick={handleCopyFiatAmount}>
                          <Copy className="size-4 text-primary" />
                          <span className="sr-only">
                            {t("COPY_TO_CLIPBOARD")}
                          </span>
                        </Button>
                      </div>
                    </div>
                  );
                })()}

                {isMultiField ? (
                  catalogParts.map((part) => (
                    <div
                      key={part.key}
                      className="flex items-start justify-between gap-2">
                      <span className="shrink-0 font-medium">
                        {t(part.labelKey)}
                      </span>
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="min-w-0 break-all text-right text-muted-foreground">
                          {part.value}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0 bg-primary/20"
                          disabled={isPaymentDetailsUnavailable}
                          onClick={() => handleCopyPaymentField(part.value)}>
                          <Copy className="size-4 text-primary" />
                          <span className="sr-only">
                            {t("COPY_TO_CLIPBOARD")}
                          </span>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : hidePackedToRow ? null : (
                  <div className="flex items-start justify-between gap-2">
                    <span className="shrink-0 font-medium">{t("TO")}</span>
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="min-w-0 break-all text-right text-muted-foreground">
                        {decryptStatus === "ok" && decryptedPaymentAddress ? (
                          decryptedPaymentAddress
                        ) : decryptStatus === "loading" ? (
                          <Skeleton className="h-5 w-28" />
                        ) : (
                          "—"
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 bg-primary/20"
                        disabled={isPaymentDetailsUnavailable}
                        onClick={handleCopyPaymentAddress}>
                        <Copy className="size-4 text-primary" />
                        <span className="sr-only">
                          {t("COPY_TO_CLIPBOARD")}
                        </span>
                      </Button>
                      {decryptedPaymentAddress &&
                        !isPaymentDetailsUnavailable &&
                        (order.currency === "INR" ||
                          order.currency === "BRL") && (
                          <QRCodeDrawer
                            paymentAddress={decryptedPaymentAddress}
                            amount={
                              actualFiatAmount
                                ? formatFiatAmountNumeric(
                                    actualFiatAmount,
                                    order.currency,
                                  )
                                : ""
                            }
                            currency={order.currency}
                            orderId={order.id.toString()}>
                            <div className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm border-primary bg-primary/20">
                              <QrCode className="size-4 text-primary" />
                              <span className="sr-only">
                                {t("SHOW_QR_CODE")}
                              </span>
                            </div>
                          </QRCodeDrawer>
                        )}
                    </div>
                  </div>
                )}

                {packedQr &&
                  decryptedPaymentAddress &&
                  !isPaymentDetailsUnavailable && (
                    <div className="flex flex-col items-center gap-2 pt-2">
                      <div className="rounded-xl border-2 border-primary bg-white p-3 shadow-primary-shadow shadow-xl">
                        <QRCodeSVG
                          value={buildQrValue({
                            paymentAddress: decryptedPaymentAddress,
                            amount: actualFiatAmount
                              ? formatFiatAmountNumeric(
                                  actualFiatAmount,
                                  order.currency,
                                )
                              : "",
                            currency: order.currency,
                            orderId: order.id.toString(),
                          })}
                          size={180}
                          level="L"
                        />
                      </div>
                      <p className="text-center text-muted-foreground text-xs">
                        {t("SCAN_THIS_QR_CODE_WITH_YOUR_PAYMENT_APP")}
                      </p>
                    </div>
                  )}

                {/* Cuba (Transfermóvil): the address is a phone + 16-digit card
                  that's painful to type, so a scannable transfer payload is
                  always shown alongside the copyable fields above. */}
                {transfermovilQrValue && (
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <div className="rounded-xl border-2 border-primary bg-white p-3 shadow-primary-shadow shadow-xl">
                      <QRCodeSVG
                        value={transfermovilQrValue}
                        size={180}
                        level="L"
                      />
                    </div>
                    <p className="text-center text-muted-foreground text-xs">
                      {t("SCAN_THIS_QR_CODE_WITH_YOUR_PAYMENT_APP")}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("PAYMENT_MODE")} </span>
                  <span className="text-muted-foreground">
                    {t(paymentMethod)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isPaymentTimeoutExpired && (
            <div className="mx-4 flex flex-col gap-3 pt-2">
              {upiDeepLink ? (
                <Button asChild className="h-12 w-full">
                  <a
                    href={upiDeepLink}
                    onClick={() =>
                      track(EVENTS.TRANSACTION, {
                        transaction_type: "buy",
                        status: "upi_button_tapped",
                        orderId: order.id.toString(),
                        currency: order.currency,
                        fiatAmount: payableFiatAmount,
                      })
                    }>
                    {t("BUY_UX_PAY_IN_UPI_APP", {
                      amount: formatFiatAmount(
                        payableFiatAmount ?? 0,
                        order.currency,
                      ),
                    })}
                  </a>
                </Button>
              ) : null}
              <div className="rounded-lg bg-primary/10 p-3 text-sm">
                <p className="mb-1 font-medium">{t("BUY_UX_HOW_TO_PAY")}</p>
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                  <li>
                    {t("BUY_UX_STEP_EXACT_AMOUNT", {
                      amount: payableFiatAmount
                        ? formatFiatAmount(payableFiatAmount, order.currency)
                        : "…",
                    })}
                  </li>
                  <li>{t("BUY_UX_STEP_OWN_ACCOUNT")}</li>
                  <li>{t("BUY_UX_STEP_NO_CRYPTO_REMARKS")}</li>
                  <li>{t("BUY_UX_STEP_CONFIRM")}</li>
                </ol>
              </div>
              <p className="text-center text-muted-foreground text-xs">
                {t("FRAUD_NOTICE")}
              </p>
            </div>
          )}

          <div className="flex w-full flex-col gap-2 px-4 py-4">
            <Button
              className="h-12 w-full"
              variant={
                upiDeepLink || isPaymentTimeoutExpired ? "outline" : "default"
              }
              disabled={
                isPaymentTimeoutExpired ||
                isPaymentDetailsUnavailable ||
                paidBuyOrderMutation.isPending ||
                isLoadingAcceptedTimestamp
              }
              onClick={handleMadePayment}>
              {paidBuyOrderMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <p className="font-medium text-sm">
                  {isPaymentTimeoutExpired
                    ? t("ORDER_EXPIRED")
                    : t("I_HAVE_MADE_THE_PAYMENT")}
                </p>
              )}
            </Button>
            {isPaymentTimeoutExpired && (
              <Button className="h-12 w-full" onClick={openHelpForAlreadyPaid}>
                <LifeBuoy className="size-4" />
                <p className="font-medium text-sm">
                  {t("BUY_UX_ALREADY_PAID_GET_HELP")}
                </p>
              </Button>
            )}
            <CancelOrderDrawer
              onConfirmCancel={handleCancelOrder}
              isLoading={cancelOrderMutation.isPending}>
              <Button
                variant="outline"
                className="h-12 w-full"
                disabled={
                  paidBuyOrderMutation.isPending ||
                  cancelOrderMutation.isPending ||
                  isLoadingAcceptedTimestamp
                }>
                <p className="font-medium text-sm">{t("CANCEL_ORDER")}</p>
              </Button>
            </CancelOrderDrawer>
          </div>
        </motion.footer>
      </main>
    </>
  );
}
