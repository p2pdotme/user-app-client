import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useOrders } from "@p2pdotme/sdk/react";
import { Copy, Eye, EyeOff, MessageCircle, X } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { useAnalytics, useCancelledTimestamp, useSupportChat } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { formatFiatAmount, truncateAddress } from "@/lib/utils";

export function BuyCancelled({ order }: { order: Order }) {
  const { t } = useTranslation();
  const orders = useOrders();
  const navigate = useNavigate();
  const { trackWithDedupe } = useAnalytics();
  const { openSupportChat } = useSupportChat();
  const [decryptedPaymentAddress, setDecryptedPaymentAddress] = useState<
    string | undefined
  >(undefined);
  const [showPaymentAddress, setShowPaymentAddress] = useState(false);
  const {
    data: cancelledTimestamp,
    isPending: isLoadingCancelledTimestamp,
    isError: isErrorCancelledTimestamp,
    error: errorCancelledTimestamp,
  } = useCancelledTimestamp(Number(order.id));

  // Track buy transaction cancelled view
  useEffect(() => {
    if (!cancelledTimestamp) return;

    trackWithDedupe(EVENTS.TRANSACTION, `transaction_${order.id}_cancelled`, {
      transaction_type: "buy",
      status: "cancelled",
      orderId: order.id.toString(),
      currency: order.currency,
      amount: Number(order.amount),
      fiatAmount: Number(order.fiatAmount),
      placedToCancelledTimeInSeconds:
        Number(cancelledTimestamp) - Number(order.placedTimestamp),
    });
  }, [order, cancelledTimestamp, trackWithDedupe]);

  // Decrypt merchant payment address
  useEffect(() => {
    const decryptPaymentAddressAsync = async () => {
      const decrypted = await orders.decryptPaymentAddress({
        encrypted: order.encUpi,
      });
      if (decrypted.isErr()) {
        console.error("Failed to decrypt payment address:", decrypted.error);
        setDecryptedPaymentAddress(t("SESSION_CHANGED"));
        setShowPaymentAddress(true);
      } else {
        setDecryptedPaymentAddress(decrypted.value);
      }
    };
    decryptPaymentAddressAsync();
  }, [order.encUpi, t, orders.decryptPaymentAddress]);

  const togglePaymentAddress = () => {
    setShowPaymentAddress(!showPaymentAddress);
  };

  return (
    <>
      <main className="container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto">
        <section className="flex flex-col items-center justify-center py-2">
          <div className="relative">
            <DotLottieReact
              className="h-40 w-80"
              src={ASSETS.ANIMATIONS.CANCELLED}
              autoplay
            />
          </div>
          <h2 className="text-center font-medium text-5xl text-primary">
            {order.amount}{" "}
            <span className="font-normal text-muted-foreground text-sm">
              USDC
            </span>
          </h2>
        </section>
        <div className="items-center-safe justify-center-safe flex gap-2 py-2">
          <div className="flex items-center justify-center gap-2 rounded-full bg-destructive p-1.5">
            <X className="size-5 text-white" />
          </div>
          <p className="font-medium text-foreground text-sm">
            {t("TRANSACTION_CANCELLED")}
          </p>
        </div>
        <Card className="w-full gap-2 shadow-none sm:gap-4">
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("ORDER_ID")} </span>
                <span className="text-muted-foreground">{order.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_RECEIVE")} </span>
                <span className="text-muted-foreground">
                  {order.amount} USDC
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_SEND")} </span>
                <span className="text-muted-foreground">
                  {formatFiatAmount(order.fiatAmount, order.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("RECEIVING_ADDRESS")} </span>
                <span className="text-muted-foreground">
                  {truncateAddress(order.recipientAddr)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("PAID_TO")} </span>
                <div className="flex min-w-0 items-center justify-end gap-2">
                  <span
                    className={`text-muted-foreground transition-all duration-200 ${!showPaymentAddress ? "select-none blur-sm" : ""} min-w-0 flex-1 truncate text-right`}>
                    {decryptedPaymentAddress}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePaymentAddress}
                    className="export-screenshot-ignore size-4 p-0 text-muted-foreground transition-colors hover:text-foreground">
                    {showPaymentAddress ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (
                        !decryptedPaymentAddress ||
                        decryptedPaymentAddress === t("NOT_FOUND") ||
                        decryptedPaymentAddress === t("SESSION_CHANGED")
                      )
                        return toast.warning(t("NO_ADDRESS_TO_COPY"));
                      try {
                        await navigator.clipboard.writeText(
                          decryptedPaymentAddress,
                        );
                        toast.success(
                          t("PAYMENT_ADDRESS_COPIED_TO_CLIPBOARD", {
                            paymentAddressName: t("PAID_TO"),
                          }),
                        );
                      } catch {
                        toast.error(
                          t("FAILED_TO_COPY_PAYMENT_ADDRESS", {
                            paymentAddressName: t("PAID_TO"),
                          }),
                        );
                      }
                    }}
                    className="export-screenshot-ignore size-4 p-0 text-muted-foreground transition-colors hover:text-foreground">
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("CANCELLED_AT")} </span>
                <span className="text-muted-foreground">
                  {isLoadingCancelledTimestamp && (
                    <Skeleton className="h-4 w-24" />
                  )}
                  {isErrorCancelledTimestamp && (
                    <p className="text-destructive">
                      {errorCancelledTimestamp.message}
                    </p>
                  )}
                  {cancelledTimestamp
                    ? moment
                        .unix(cancelledTimestamp)
                        .format("DD MMM YYYY, hh:mm A")
                    : ""}
                </span>
              </div>

              {/* Dispute Status */}
              {order.disputeInfo.status !== "DEFAULT" && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("DISPUTE_STATUS")} </span>
                  <span
                    className={`text-sm ${
                      order.disputeInfo.status === "RAISED"
                        ? "text-destructive"
                        : "text-success"
                    }`}>
                    {order.disputeInfo.status === "RAISED"
                      ? t("DISPUTE_RAISED")
                      : t("DISPUTE_SETTLED")}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full gap-4 border-none bg-primary/20 shadow-none sm:gap-4">
          <CardContent className="space-y-2">
            <p className="font-medium text-sm">
              {t("WHY_YOUR_TRANSACTION_MIGHT_HAVE_FAILED")}
            </p>
            <ul className="list-disc pl-4 font-light text-sm">
              <li>
                <p>{t("BUY_CANCELLED_REASON_1")}</p>
              </li>
              <li>
                <p>{t("BUY_CANCELLED_REASON_2")}</p>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="gap-2 p-5"
              variant="outline"
              onClick={openSupportChat}>
              <MessageCircle className="size-4" />
              <p className="font-medium text-sm">{t("CHAT_WITH_US")}</p>
            </Button>
          </CardFooter>
        </Card>
      </main>
      <footer className="container-narrow flex w-full items-center justify-center gap-2 p-4">
        <Button
          onClick={() => navigate(INTERNAL_HREFS.HOME)}
          className="w-1/2 bg-muted p-6 hover:bg-muted/80">
          <p className="font-medium text-foreground text-sm">
            {t("RETURN_HOME")}
          </p>
        </Button>
        <Button
          onClick={() => {
            navigate(INTERNAL_HREFS.BUY);
          }}
          className="w-1/2 p-6">
          <p className="font-medium text-sm">{t("REORDER")}</p>
        </Button>
      </footer>
    </>
  );
}
