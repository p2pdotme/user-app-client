import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { parseUnits } from "viem";
import ASSETS from "@/assets";
import { DashedSeparator, OrderProgress, QrScanner } from "@/components";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { parseQRData } from "@/lib/qr-parsers";
import {
  addLocalOrderPaymentDetails,
  cn,
  formatFiatAmount,
  truncate6,
  truncateAmount,
} from "@/lib/utils";
import { PAY_FLOW_PROGRESS_TEXT } from "../shared";

export function PayAccepted({ order }: { order: Order }) {
  const { t } = useTranslation();
  const [isProcessingQR, setIsProcessingQR] = useState(false);
  const { setSellOrderUpiMutation } = useOrderFlow();
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

  const handleSendPaymentDetails = useCallback(
    async (qrString: string) => {
      console.log(
        `[ORDER:${order.id}:${order.orderType}:${order.status}] Sending payment details...`,
      );

      if (!qrString) {
        onQRError(); // Error haptic for missing QR data
        setIsProcessingQR(false); // Reset loading state
        toast.warning(t("FAILED_TO_SEND_PAYMENT_DETAILS"), {
          description: t("Payment details not found for this order"),
        });
        return;
      }

      if (isPriceConfigError || !priceConfig?.sellPrice) {
        onQRError(); // Error haptic for price config error
        setIsProcessingQR(false); // Reset loading state
        toast.error(t("FAILED_TO_FETCH_SELL_PRICE"), {
          description: priceConfigError?.message,
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
        toast.error(t(parseResult.error.code), {
          description: t(parseResult.error.message),
        });
        return;
      }

      const { paymentAddress, amount } = parseResult.value;
      // Store payment details (IDR gets GO_PAY prefix, others store address directly)
      addLocalOrderPaymentDetails(
        order.id.toString(),
        paymentAddress,
        order.currency === "IDR" ? "GO_PAY" : undefined,
      );
      let updatedAmount = Number(order.amount);
      if (amount) {
        updatedAmount = truncate6(Number(amount.usdc));
        if (updatedAmount !== Number(order.amount)) {
          toast.success(t("ORDER_AMOUNT_UPDATED"), {
            description: t("ORDER_AMOUNT_UPDATED_DESCRIPTION", {
              from: order.amount,
              to: truncateAmount(updatedAmount, 6),
            }),
          });
        }
      }

      // QR processing complete, now sending to server
      setIsProcessingQR(false);

      await setSellOrderUpiMutation.mutateAsync(
        {
          orderId: BigInt(order.id),
          paymentAddress: qrString,
          merchantPublicKey: order.pubkey,
          updatedAmount: parseUnits(updatedAmount.toString(), 6),
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
            toast.error(t("FAILED_TO_SEND_PAYMENT_DETAILS"), {
              description: error.message,
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
      order.amount,
      order.pubkey,
      isPriceConfigError,
      priceConfig?.sellPrice,
      setSellOrderUpiMutation,
      t,
      priceConfigError?.message,
      onQRScanned,
      onQRError,
    ],
  );

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

    if (!setSellOrderUpiMutation.isPending) {
      await handleSendPaymentDetails(data);
    }
  };

  // Determine current loading state and message
  const getLoadingState = () => {
    if (isProcessingQR && !setSellOrderUpiMutation.isPending) {
      return { isLoading: true, message: t("PROCESSING_QR") };
    }
    if (setSellOrderUpiMutation.isPending) {
      return { isLoading: true, message: t("SENDING_PAYMENT_DETAILS") };
    }
    return { isLoading: false, message: "" };
  };

  const loadingState = getLoadingState();

  return (
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
          <p className="text-center text-sm text-success">{t("ON_TIME")}</p>
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
                <span className="font-medium">{t("YOU_RECEIVE")} </span>
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
