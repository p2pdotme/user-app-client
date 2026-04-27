import { useOrders } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Copy, Loader2, QrCode } from "lucide-react";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { CircleCountdownTimer, OrderProgress } from "@/components";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useAcceptedTimestamp, useAnalytics, useOrderFlow } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import {
  deserializeCompoundPaymentId,
  getPaymentIdFields,
} from "@/lib/compound-payment-id";
import { CURRENCY_META_DATA } from "@/lib/constants";
import {
  cn,
  formatFiatAmount,
  formatFiatAmountNumeric,
  generateUPILink,
  getPaymentMethodFromOrderDetails,
} from "@/lib/utils";
import { BUY_FLOW_PROGRESS_TEXT } from "../shared";

const COUNTDOWN_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const upiLink = generateUPILink(paymentAddress, amount, currency, orderId);

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
            <QRCodeSVG value={upiLink} size={200} level="L" />
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
  const actualFiatAmount = orderFeeDetails?.actualFiatAmount;
  const [isPaymentTimeoutExpired, setIsPaymentTimeoutExpired] = useState(false);
  const [decryptedPaymentAddress, setDecryptedPaymentAddress] = useState<
    string | undefined
  >(undefined);

  const {
    data: acceptedTimestamp,
    isPending: isLoadingAcceptedTimestamp,
    isError: isErrorAcceptedTimestamp,
    error: errorAcceptedTimestamp,
  } = useAcceptedTimestamp(Number(order.id));

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

  useEffect(() => {
    const decryptPaymentAddressAsync = async () => {
      console.log("decrypted");

      const decrypted = await orders.decryptPaymentAddress({
        encrypted: order.encUpi,
      });
      console.log({ decrypted }, "decrypted");
      if (decrypted.isErr()) {
        setDecryptedPaymentAddress(t("SESSION_CHANGED"));
      } else {
        setDecryptedPaymentAddress(decrypted.value);
      }
    };
    decryptPaymentAddressAsync();
  }, [order.encUpi, t, orders.decryptPaymentAddress]);

  const { paidBuyOrderMutation, cancelOrderMutation } = useOrderFlow();

  const handleMadePayment = async () => {
    console.log(
      `[ORDER:${order.id}:${order.orderType}:${order.status}] Marking as paid...`,
    );
    await paidBuyOrderMutation.mutateAsync(
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
          toast.error(t("FAILED_TO_MARK_AS_PAID"), {
            description: error.message,
          });
        },
      },
    );
  };

  const handleCancelOrder = async () => {
    console.log(
      `[ORDER:${order.id}:${order.orderType}:${order.status}] Cancelling order...`,
    );
    await cancelOrderMutation.mutateAsync(
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
          toast.error(t("FAILED_TO_CANCEL_ORDER"), {
            description: error.message,
          });
        },
      },
    );
  };

  const paymentIdFields = getPaymentIdFields(order.currency);
  const isCompound = paymentIdFields.length > 1;
  const compoundParts =
    decryptedPaymentAddress && isCompound
      ? deserializeCompoundPaymentId(decryptedPaymentAddress)
      : [];

  const handleCopyPaymentField = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(
      t("PAYMENT_ADDRESS_COPIED_TO_CLIPBOARD", {
        paymentAddressName: t(
          CURRENCY_META_DATA[order.currency].paymentAddressName,
        ),
      }),
    );
  };

  const handleCopyPaymentAddress = () => {
    if (decryptedPaymentAddress) {
      navigator.clipboard.writeText(decryptedPaymentAddress);
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

  const handleCopyFiatAmount = () => {
    if (actualFiatAmount) {
      const numericAmount = formatFiatAmountNumeric(
        actualFiatAmount,
        order.currency,
      );
      navigator.clipboard.writeText(numericAmount);
      toast.success(t("DEV_TOASTS_COPIED_TO_CLIPBOARD"));
    } else {
      toast.warning(t("NO_AMOUNT_TO_COPY"));
    }
  };

  return (
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
            <div className="text-center text-destructive">
              <p className="text-sm">{t("FAILED_TO_LOAD_TIMER")}</p>
              <p className="text-xs">{errorAcceptedTimestamp.message}</p>
            </div>
          </div>
        )}
        {acceptedTimestamp && (
          <CircleCountdownTimer
            startTimestamp={acceptedTimestamp.toString()}
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
        )}
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
          <p className="text-center text-sm text-success">{t("ON_TIME")}</p>
        </section>
        <Separator className="h-4 animate-pulse bg-primary py-1" />
        <OrderProgress
          steps={BUY_FLOW_PROGRESS_TEXT}
          currentStepKey={order.status}
        />

        <div className="mx-4 pb-2">
          <Alert variant="warning" className="w-full">
            <AlertTriangle className="size-4" />
            <AlertDescription className="flex w-full items-center justify-between text-xs">
              <p className="text-foreground">{t("FRAUD_NOTICE")}</p>
            </AlertDescription>
          </Alert>
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
                        {isLoadingOrderFeeDetails || orderFeeDetailsError ? (
                          <Skeleton className="h-5 w-20" />
                        ) : actualFiatAmount ? (
                          formatFiatAmount(actualFiatAmount, order.currency)
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

              {isCompound ? (
                paymentIdFields.map((fieldConfig, i) => (
                  <div
                    key={fieldConfig.key}
                    className="flex items-center justify-between">
                    <span className="font-medium">{t(fieldConfig.label)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {compoundParts[i] ?? "..."}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 bg-primary/20"
                        onClick={() =>
                          compoundParts[i] &&
                          handleCopyPaymentField(compoundParts[i])
                        }>
                        <Copy className="size-4 text-primary" />
                        <span className="sr-only">
                          {t("COPY_TO_CLIPBOARD")}
                        </span>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("TO")} </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {decryptedPaymentAddress ?? "..."}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 bg-primary/20"
                      onClick={handleCopyPaymentAddress}>
                      <Copy className="size-4 text-primary" />
                      <span className="sr-only">{t("COPY_TO_CLIPBOARD")}</span>
                    </Button>
                    {decryptedPaymentAddress && order.currency === "INR" && (
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
                        <div className="flex size-6 cursor-pointer items-center justify-center rounded-sm border-primary bg-primary/20">
                          <QrCode className="size-4 text-primary" />
                          <span className="sr-only">{t("SHOW_QR_CODE")}</span>
                        </div>
                      </QRCodeDrawer>
                    )}
                  </div>
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

        <div className="flex w-full flex-col gap-2 px-4 py-4">
          <Button
            className="h-12 w-full"
            disabled={
              isPaymentTimeoutExpired ||
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
  );
}
