import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { DashedSeparator, OrderProgress } from "@/components";
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
import { useSettings } from "@/contexts";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import { useAnalytics, useOrderFlow } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { formatPaymentIdForDisplay } from "@/lib/compound-payment-id";
import {
  cn,
  formatFiatAmount,
  getPaymentAddressFromOrderDetails,
} from "@/lib/utils";
import { SELL_FLOW_PROGRESS_TEXT } from "../shared";

export function SellAccepted({ order }: { order: Order }) {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const { trackWithDedupe } = useAnalytics();
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

  const { setSellOrderUpiMutation } = useOrderFlow();

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
  const hasInitiatedPaymentDetails = useRef(false);

  const handleSendPaymentDetails = useCallback(async () => {
    console.log(
      `[ORDER:${order.id}:${order.orderType}:${order.status}] Sending payment details...`,
    );

    const currentOrderPaidTo = getPaymentAddressFromOrderDetails(
      order.id.toString(),
    );
    if (!currentOrderPaidTo) {
      toast.error(t("FAILED_TO_SEND_PAYMENT_DETAILS"), {
        description: t("Payment details not found for this order"),
      });
      return;
    }

    await setSellOrderUpiMutation.mutateAsync(
      {
        orderId: BigInt(order.id),
        paymentAddress: currentOrderPaidTo,
        merchantPublicKey: order.pubkey,
        updatedAmount: BigInt(0),
      },
      {
        onSuccess: (receipt) => {
          console.log(
            `[ORDER:${order.id}:${order.orderType}:${order.status}] Payment details sent with receipt: `,
            receipt,
          );
          toast.success(t("PAYMENT_DETAILS_SENT"));
        },
        onError: (error) => {
          toast.error(t("FAILED_TO_SEND_PAYMENT_DETAILS"), {
            description: error.message,
          });
        },
      },
    );
  }, [
    order.id,
    order.orderType,
    order.pubkey,
    order.status,
    setSellOrderUpiMutation,
    t,
  ]);

  useEffect(() => {
    // Only execute once when the component mounts
    if (
      !hasInitiatedPaymentDetails.current &&
      !setSellOrderUpiMutation.isPending &&
      !setSellOrderUpiMutation.isSuccess
    ) {
      hasInitiatedPaymentDetails.current = true;
      handleSendPaymentDetails();
    }
  }, [
    handleSendPaymentDetails,
    setSellOrderUpiMutation.isPending,
    setSellOrderUpiMutation.isSuccess,
  ]);

  return (
    <main className="flex h-full w-full flex-col overflow-y-auto">
      <section className="container-narrow flex flex-col items-center justify-center gap-4 py-8">
        <DotLottieReact
          className="h-40 w-80"
          src={ASSETS.ANIMATIONS.WAITING_TRANSFER}
          autoplay
          loop
        />
        <h2 className="text-center font-medium text-lg">
          {t("SENDING_YOUR_PAYMENT_DETAILS")}...
        </h2>
        <p className="text-center text-muted-foreground text-sm">
          {t("YOUR_PAYMENT_DETAILS_WILL_BE_SENT_SHORTLY_DONT_LEAVE_THE_PAGE")}
        </p>
      </section>

      <motion.footer
        initial={{ opacity: 0, y: 400 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className="mx-auto mt-auto flex w-full max-w-lg flex-shrink-0 flex-col justify-center gap-2 rounded-t-3xl border-t bg-background py-4 shadow-[0_-4px_16px_var(--primary-shadow)]">
        <section className="flex w-full flex-col items-center">
          <p className="text-center text-sm">
            {t("SENDING_YOUR_PAYMENT_DETAILS")}
          </p>
          <p className="text-center text-sm text-success">{t("ON_TIME")}</p>
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
                <span className="font-medium">
                  {t("RECEIVING_PAYMENT_ADDRESS", {
                    paymentAddressName: t(currency.paymentAddressName),
                  })}{" "}
                </span>
                <span className="text-muted-foreground">
                  {(() => {
                    const addr = getPaymentAddressFromOrderDetails(
                      order.id.toString(),
                    );
                    if (!addr) return t("NOT_FOUND");
                    return formatPaymentIdForDisplay(addr, order.currency);
                  })()}
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
