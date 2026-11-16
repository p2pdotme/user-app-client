import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { parseUnits } from "viem";
import ASSETS from "@/assets";
import { DashedSeparator, OrderProgress } from "@/components";
import { OrderElapsedTime } from "@/components/order-elapsed-time";
import { QrScanner } from "@/components/qr-scanner";
import { TransferWarningAlert } from "@/components/transfer-warning-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import {
  useAnalytics,
  useHapticInteractions,
  useOrderFlow,
  usePriceConfig,
} from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import {
  getQrErrorKeys,
  getSupportedQrTypes,
  parseQRData,
} from "@/lib/qr-parsers";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { addLocalOrderPaymentDetails, cn, formatFiatAmount } from "@/lib/utils";
import { PAY_FLOW_PROGRESS_TEXT } from "../shared";

type PendingAmountChange = {
  qrString: string;
  paymentAddress: string;
  updatedFiatAmount: bigint;
  from: string;
  to: string;
};

export function PayAccepted({ order }: { order: Order }) {
  const { t } = useTranslation();
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  // QR total differs from the order amount: ask the payer to confirm the new
  // bill total before the order is re-pinned to it.
  const [pendingAmountChange, setPendingAmountChange] =
    useState<PendingAmountChange | null>(null);
  const { setSellOrderUpiWithFiatMutation } = useOrderFlow();
  const { priceConfig, isPriceConfigError, priceConfigError } = usePriceConfig(
    order.currency,
  );
  const { onQRScanned, onQRError } = useHapticInteractions();
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

  // Track pay QR displayed (accepted status)
  useEffect(() => {
    trackWithDedupe(EVENTS.TRANSACTION, `transaction_${order.id}_accepted`, {
      transaction_type: "pay",
      status: "accepted",
      orderId: order.id.toString(),
      currency: order.currency,
    });
  }, [order, trackWithDedupe]);

  const submitPaymentDetails = useCallback(
    async (
      qrString: string,
      paymentAddress: string,
      updatedFiatAmount: bigint,
    ) => {
      // Store payment details (IDR gets GO_PAY prefix, others store address directly)
      addLocalOrderPaymentDetails(
        order.id.toString(),
        paymentAddress,
        order.currency === "IDR" ? "GO_PAY" : undefined,
      );

      await setSellOrderUpiWithFiatMutation.mutateAsync(
        {
          orderId: BigInt(order.id),
          // VEN Pago Móvil: send the trimmed blob from parseQR, not the raw
          // scanner string, so the merchant can re-encode a valid QR.
          paymentAddress: order.currency === "VEN" ? paymentAddress : qrString,
          merchantPublicKey: order.pubkey,
          updatedFiatAmount,
        },
        {
          onSuccess: (receipt) => {
            onQRScanned(); // Success haptic for successful payment details sent
            console.log(
              `[ORDER:${order.id}:${order.orderType}:${order.status}] Payment details sent with receipt: `,
              receipt,
            );
            toast.success(t("PAYMENT_DETAILS_SENT"));
          },
          onError: (error) => {
            onQRError(); // Error haptic for mutation failure
            console.error("Failed to send payment details", error);
            toast.error(t("FAILED_TO_SEND_PAYMENT_DETAILS"), {
              description: getUserFacingErrorMessage(t, error),
            });
          },
        },
      );
    },
    [
      order.id,
      order.orderType,
      order.status,
      order.currency,
      order.pubkey,
      setSellOrderUpiWithFiatMutation,
      t,
      onQRScanned,
      onQRError,
    ],
  );

  const handleSendPaymentDetails = useCallback(
    async (qrString: string) => {
      console.log(
        `[ORDER:${order.id}:${order.orderType}:${order.status}] Sending payment details...`,
      );

      if (!qrString) {
        onQRError(); // Error haptic for missing QR data
        setIsProcessingQR(false); // Reset loading state
        toast.warning(t("FAILED_TO_SEND_PAYMENT_DETAILS"), {
          description: t("PAYF_QR_NOT_SUPPORTED_DESCRIPTION"),
        });
        return;
      }

      if (isPriceConfigError || !priceConfig?.sellPrice) {
        onQRError(); // Error haptic for price config error
        setIsProcessingQR(false); // Reset loading state
        toast.error(t("FAILED_TO_FETCH_SELL_PRICE"), {
          description: getUserFacingErrorMessage(t, priceConfigError),
        });
        return;
      }

      const parseResult = await parseQRData(
        qrString,
        order.currency,
        priceConfig.sellPrice,
        order.id,
      );

      if (parseResult.isErr()) {
        onQRError(); // Error haptic for QR parse error
        setIsProcessingQR(false); // Reset loading state
        const code = parseResult.error.code;
        track(EVENTS.TRANSACTION, {
          transaction_type: "pay",
          status: "qr_rejected",
          code,
          orderId: order.id.toString(),
          currency: order.currency,
        });
        const { titleKey, descriptionKey } = getQrErrorKeys(code);
        const supportedTypes = getSupportedQrTypes(order.currency);
        const description = [
          t(descriptionKey, { currency: order.currency }),
          supportedTypes
            ? t("PAYF_QR_SUPPORTED_TYPES", { types: supportedTypes })
            : null,
        ]
          .filter(Boolean)
          .join(" ");
        toast.error(t(titleKey), { description });
        return;
      }

      track(EVENTS.TRANSACTION, {
        transaction_type: "pay",
        status: "qr_parsed",
        orderId: order.id.toString(),
        currency: order.currency,
      });

      const { paymentAddress, amount } = parseResult.value;
      const orderFiatAmount = formatFiatAmount(
        order.fiatAmount,
        order.currency,
        {
          hideCurrency: true,
        },
      );

      const qrFiatAmount = amount?.fiat
        ? formatFiatAmount(amount?.fiat, order.currency, {
            hideCurrency: true,
          })
        : "";

      // A PAY order is a fiat invoice, so when the QR carries a total that
      // differs from what the order was placed with we pin the order to the
      // QR's *fiat* figure via `setSellOrderUpiWithFiat`. The Diamond writes
      // that fiat exactly and derives the USDC to pull from the order's own
      // rate (rounded up so it always covers the fiat) — no client-side
      // USDC math, so settlement lands on precisely what the payee quoted.
      // Compare on the display-formatted strings (currency precision) so float
      // noise from the QR parser isn't treated as a change. `0n` = keep as is.
      if (amount && amount.fiat > 0 && orderFiatAmount !== qrFiatAmount) {
        // parseUnits rejects >6 decimals; fix the float to the on-chain scale.
        const updatedFiatAmount = parseUnits(amount.fiat.toFixed(6), 6);
        track(EVENTS.TRANSACTION, {
          transaction_type: "pay",
          status: "amount_mismatch",
          orderId: order.id.toString(),
          currency: order.currency,
          orderFiatAmount: Number(order.fiatAmount),
          qrFiatAmount: amount.fiat,
        });
        // Don't silently re-price the order: let the payer confirm first.
        setIsProcessingQR(false);
        setPendingAmountChange({
          qrString,
          paymentAddress,
          updatedFiatAmount,
          from: formatFiatAmount(order.fiatAmount, order.currency),
          to: formatFiatAmount(amount.fiat, order.currency),
        });
        return;
      }

      // QR processing complete, now sending to server
      setIsProcessingQR(false);
      await submitPaymentDetails(qrString, paymentAddress, 0n);
    },
    [
      order.id,
      order.orderType,
      order.status,
      order.currency,
      order.fiatAmount,
      isPriceConfigError,
      priceConfig?.sellPrice,
      t,
      track,
      priceConfigError,
      onQRError,
      submitPaymentDetails,
    ],
  );

  const handleConfirmAmountChange = async () => {
    const pending = pendingAmountChange;
    if (!pending) return;
    setPendingAmountChange(null);
    track(EVENTS.TRANSACTION, {
      transaction_type: "pay",
      status: "amount_mismatch_confirmed",
      orderId: order.id.toString(),
      currency: order.currency,
    });
    toast.warning(t("ORDER_AMOUNT_UPDATED"), {
      description: t("ORDER_AMOUNT_UPDATED_DESCRIPTION", {
        from: pending.from,
        to: pending.to,
      }),
    });
    await submitPaymentDetails(
      pending.qrString,
      pending.paymentAddress,
      pending.updatedFiatAmount,
    );
  };

  const handleRejectAmountChange = () => {
    setPendingAmountChange(null);
    track(EVENTS.TRANSACTION, {
      transaction_type: "pay",
      status: "amount_mismatch_rejected",
      orderId: order.id.toString(),
      currency: order.currency,
    });
    toast.info(t("PAYF_AMOUNT_CHANGE_REJECTED"));
  };

  const handleQrScan = async (data: string) => {
    console.log("QR Code scanned:", data);
    if (!data) {
      onQRError(); // Error haptic for invalid QR data
      setIsProcessingQR(false);
      toast.error(t("INVALID_QR_DATA"));
      return;
    }
    setIsProcessingQR(true);

    // Track payment details parsed/scanned
    track(EVENTS.TRANSACTION, {
      transaction_type: "pay",
      status: "scanned",
      orderId: order.id.toString(),
      currency: order.currency,
    });

    if (!setSellOrderUpiWithFiatMutation.isPending) {
      await handleSendPaymentDetails(data);
    }
  };

  // Determine current loading state and message
  const getLoadingState = () => {
    if (isProcessingQR && !setSellOrderUpiWithFiatMutation.isPending) {
      return { isLoading: true, message: t("PROCESSING_QR") };
    }
    if (setSellOrderUpiWithFiatMutation.isPending) {
      return { isLoading: true, message: t("SENDING_PAYMENT_DETAILS") };
    }
    return { isLoading: false, message: "" };
  };

  const loadingState = getLoadingState();

  return (
    <>
      <AlertDialog
        open={!!pendingAmountChange}
        onOpenChange={(open) => {
          if (!open && pendingAmountChange) handleRejectAmountChange();
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("PAYF_AMOUNT_CHANGE_TITLE")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("PAYF_AMOUNT_CHANGE_DESCRIPTION")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1 rounded-lg bg-warning/10 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("PAYF_AMOUNT_CHANGE_ORDER_AMOUNT")}
              </span>
              <span className="line-through">{pendingAmountChange?.from}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>{t("PAYF_AMOUNT_CHANGE_QR_AMOUNT")}</span>
              <span>{pendingAmountChange?.to}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRejectAmountChange}>
              {t("PAYF_AMOUNT_CHANGE_CANCEL")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAmountChange}>
              {t("PAYF_AMOUNT_CHANGE_CONFIRM", {
                amount: pendingAmountChange?.to ?? "",
              })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <main
        className={cn(
          "flex h-full w-full flex-col overflow-y-auto",
          loadingState.isLoading &&
            "pointer-events-none animate-pulse blur-[1px]",
        )}>
        <section className="container-narrow flex flex-col items-center justify-center gap-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-sm">
            <QrScanner
              analyticsLocation="pay_order"
              onScan={handleQrScan}
              className="w-full"
              isProcessing={loadingState.isLoading}
              processingMessage={loadingState.message}
            />
          </motion.div>
        </section>

        <motion.footer
          initial={{ opacity: 0, y: 400 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="mx-auto mt-auto flex w-full max-w-lg flex-shrink-0 flex-col justify-center gap-2 rounded-t-3xl border-t bg-background py-4 shadow-[0_-4px_16px_var(--primary-shadow)]">
          <section className="flex w-full flex-col items-center">
            <p className="text-center text-sm">
              {t("ASK_THE_VENDOR_TO_GENERATE_QR_ONLY_AFTER_YOUR_SCANNER_OPENS")}
            </p>
            <OrderElapsedTime
              sinceTimestamp={order.placedTimestamp}
              expectedSeconds={300}
            />
          </section>
          <Separator className="h-4 animate-pulse bg-primary py-1" />
          <OrderProgress
            steps={PAY_FLOW_PROGRESS_TEXT}
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
                    {t("SCAN_PAY").toUpperCase()} USDC
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
                    {isLoadingOrderFeeDetails || orderFeeDetailsError ? (
                      <Skeleton className="h-4 w-20" />
                    ) : (
                      `${actualUsdcAmount?.toFixed(3)} USDC`
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("FEE")} </span>
                  <span className="text-muted-foreground">
                    {isLoadingOrderFeeDetails || orderFeeDetailsError ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      `${fixedFeePaid.toFixed(3)} USDC`
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {t("PAYF_MERCHANT_GETS")}{" "}
                  </span>
                  <span className="text-muted-foreground">
                    {isLoadingOrderFeeDetails || orderFeeDetailsError ? (
                      <Skeleton className="h-4 w-20" />
                    ) : actualFiatAmount ? (
                      formatFiatAmount(actualFiatAmount, order.currency)
                    ) : null}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("PAYMENT_DETAILS")} </span>
                  <span className="text-destructive">{t("NOT_SENT")}</span>
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
                    <span className="font-medium">{t("PAYF_BILL_TOTAL")} </span>
                    <span className="text-muted-foreground">
                      {formatFiatAmount(fiatAmount, order.currency)}
                    </span>
                  </div>
                );
              })()}
            </CardFooter>
          </Card>
          <TransferWarningAlert
            currency={order.currency}
            className="mx-4 w-[calc(100%-2rem)]"
          />
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
    </>
  );
}
