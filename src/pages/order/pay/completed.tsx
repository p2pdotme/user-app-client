import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useOrders } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Eye, EyeOff, Share } from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { CashbackRewardCard } from "@/components/cashback-reward-card";
// Removed animation per request
import { FAQAccordion } from "@/components/faq-accordion";
import { TextLogo } from "@/components/text-logo";
import { TipMerchantCard } from "@/components/tip-merchant-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import { useAnalytics } from "@/hooks";
import { useReceiptShare } from "@/hooks/use-receipt-share";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import {
  formatFiatAmount,
  getPaymentAddressFromOrderDetails,
} from "@/lib/utils";
import { getPageFAQs } from "@/pages/help/constants";

export function PayCompleted({ order }: { order: Order }) {
  const { t } = useTranslation();
  const orders = useOrders();
  const navigate = useNavigate();
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
  const [decryptedPaidBy, setDecryptedPaidBy] = useState<string | undefined>(
    undefined,
  );
  const paidTo =
    order.currency === "VEN"
      ? t("QR_CODE_PAYMENT")
      : getPaymentAddressFromOrderDetails(order.id.toString()) ||
        t("NOT_FOUND");
  const [showPaidBy, setShowPaidBy] = useState(false);
  const [showPaidTo, setShowPaidTo] = useState(paidTo === t("NOT_FOUND"));

  // Get FAQs for pay completed page (only for India users)
  const faqs = getPageFAQs("PAY_COMPLETED_PAGE");

  // Calculate and format completion time using moment
  const completionTimeDisplay = useMemo(() => {
    const completedMoment = moment.unix(Number(order.completedTimestamp));
    const placedMoment = moment.unix(Number(order.placedTimestamp));
    const duration = moment.duration(completedMoment.diff(placedMoment));

    const minutes = duration.minutes();
    const seconds = duration.seconds();

    if (duration.asSeconds() < 60) {
      return `${t("COMPLETED_IN")} ${Math.floor(duration.asSeconds())}s`;
    } else {
      return `${t("COMPLETED_IN")} ${minutes}m${seconds}s`;
    }
  }, [order.completedTimestamp, order.placedTimestamp, t]);

  // Track pay order completed view
  useEffect(() => {
    const completedTimestamp = Number(order.completedTimestamp);
    const placedTimestamp = Number(order.placedTimestamp);
    const totalTime = completedTimestamp - placedTimestamp;

    trackWithDedupe(EVENTS.TRANSACTION, `transaction_${order.id}_completed`, {
      transaction_type: "pay",
      status: "completed",
      orderId: order.id.toString(),
      currency: order.currency,
      amount: Number(order.amount),
      fiatAmount: Number(order.fiatAmount),
      placedToCompletedTimeInSeconds: totalTime,
    });
  }, [order, trackWithDedupe]);

  useEffect(() => {
    const decryptPaymentAddressAsync = async () => {
      const decrypted = await orders.decryptPaymentAddress({
        encrypted: order.encMerchantUpi,
      });
      if (decrypted.isErr()) {
        console.error("Failed to decrypt payment address:", decrypted.error);
        setDecryptedPaidBy(t("SESSION_CHANGED"));
        setShowPaidBy(true);
      } else {
        setDecryptedPaidBy(decrypted.value);
      }
    };
    decryptPaymentAddressAsync();
  }, [order.encMerchantUpi, t, orders.decryptPaymentAddress]);

  const togglePaidBy = () => {
    setShowPaidBy(!showPaidBy);
  };

  const togglePaidTo = () => {
    setShowPaidTo(!showPaidTo);
  };

  const { shareReceipt, isSharing } = useReceiptShare({ order });

  // Branding row shows: Paid via P2P.me

  return (
    <>
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto">
        <section className="flex flex-col items-center justify-center py-2">
          <div className="relative overflow-hidden">
            <DotLottieReact
              className="h-40 w-80 origin-center scale-200"
              src={ASSETS.ANIMATIONS.COMPLETED}
              autoplay
            />
          </div>
          <h2 className="text-center font-medium text-5xl text-primary">
            {formatFiatAmount(Number(order.fiatAmount), order.currency)}
          </h2>
        </section>
        <div className="items-center-safe justify-center-safe flex gap-2 py-2">
          <ASSETS.ICONS.Logo className="size-7 text-primary" />
          <p className="font-medium text-foreground text-sm">
            {t("PAID_VIA")} P2P.me
          </p>
        </div>

        {/* Completed in is shown below in details; animation removed */}

        {/* Tip Card */}
        <TipMerchantCard orderId={Number(order.id)} />
        <CashbackRewardCard orderId={Number(order.id)} />

        <Card className="w-full gap-2 shadow-none sm:gap-4">
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("ORDER_ID")} </span>
                <span className="text-muted-foreground">{order.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("TYPE")} </span>
                <span className="text-muted-foreground">{order.orderType}</span>
              </div>

              {isLoadingOrderFeeDetails || orderFeeDetailsError ? (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("YOU_SEND")} </span>
                  <Skeleton className="h-4 w-20" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("YOU_SEND")} </span>
                  <span className="text-muted-foreground">
                    {actualUsdcAmount
                      ? `${actualUsdcAmount.toFixed(3)} USDC`
                      : null}
                  </span>
                </div>
              )}

              {isLoadingOrderFeeDetails || orderFeeDetailsError ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t("FEE")} </span>
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t("YOU_RECEIVE")} </span>
                    <Skeleton className="h-4 w-20" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t("FEE")} </span>
                    <span className="text-muted-foreground">
                      {fixedFeePaid} USDC
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t("YOU_RECEIVE")} </span>
                    <span className="text-muted-foreground">
                      {actualFiatAmount
                        ? formatFiatAmount(actualFiatAmount, order.currency)
                        : null}
                    </span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("PAID_BY")} </span>
                <div className="flex min-w-0 items-center justify-end gap-2">
                  <span
                    className={`text-muted-foreground transition-all duration-200 ${!showPaidBy ? "select-none blur-sm" : ""} min-w-0 flex-1 truncate text-right`}>
                    {decryptedPaidBy}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePaidBy}
                    className="export-screenshot-ignore size-4 p-0 text-muted-foreground transition-colors hover:text-foreground">
                    {showPaidBy ? (
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
                        !decryptedPaidBy ||
                        decryptedPaidBy === t("NOT_FOUND") ||
                        decryptedPaidBy === t("SESSION_CHANGED")
                      )
                        return toast.warning(t("NO_ADDRESS_TO_COPY"));
                      try {
                        await navigator.clipboard.writeText(decryptedPaidBy);
                        toast.success(
                          t("PAYMENT_ADDRESS_COPIED_TO_CLIPBOARD", {
                            paymentAddressName: t("PAID_BY"),
                          }),
                        );
                      } catch {
                        toast.error(
                          t("FAILED_TO_COPY_PAYMENT_ADDRESS", {
                            paymentAddressName: t("PAID_BY"),
                          }),
                        );
                      }
                    }}
                    disabled={
                      !decryptedPaidBy ||
                      decryptedPaidBy === t("NOT_FOUND") ||
                      decryptedPaidBy === t("SESSION_CHANGED")
                    }
                    className="export-screenshot-ignore size-4 p-0 text-muted-foreground transition-colors hover:text-foreground">
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("PAID_TO")} </span>
                <div className="flex min-w-0 items-center justify-end gap-2">
                  <span
                    className={`text-muted-foreground transition-all duration-200 ${!showPaidTo ? "select-none blur-sm" : ""} min-w-0 flex-1 truncate text-right`}>
                    {paidTo}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePaidTo}
                    className="export-screenshot-ignore size-4 p-0 text-muted-foreground transition-colors hover:text-foreground">
                    {showPaidTo ? (
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
                        !paidTo ||
                        paidTo === t("NOT_FOUND") ||
                        paidTo === t("SESSION_CHANGED")
                      )
                        return toast.warning(t("NO_ADDRESS_TO_COPY"));
                      try {
                        await navigator.clipboard.writeText(paidTo);
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
                    disabled={
                      !paidTo ||
                      paidTo === t("NOT_FOUND") ||
                      paidTo === t("SESSION_CHANGED")
                    }
                    className="export-screenshot-ignore size-4 p-0 text-muted-foreground transition-colors hover:text-foreground">
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("COMPLETED_IN")} </span>
                <span className="animate-pulse font-medium text-primary/90">
                  {completionTimeDisplay.replace(`${t("COMPLETED_IN")} `, "")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("COMPLETED_AT")} </span>
                <span className="text-muted-foreground">
                  {moment
                    .unix(Number(order.completedTimestamp))
                    .format("DD MMM YYYY, hh:mm A")}
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

        {/* <Card className="w-full gap-4 shadow-none sm:gap-4">
          <div className="flex items-center justify-start gap-2 px-4 py-2">
            <div className="bg-primary/30 flex items-center justify-center gap-2 rounded-full p-2">
              <User className="text-primary size-6" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{t("MERCHANT_PLACEHOLDER")}</p>
              <div className="text-muted-foreground flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <Star
                    className="size-4 text-yellow-500"
                    fill="currentColor"
                  />
                  <p className="text-muted-foreground text-xs">4.3</p>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("ORDERS_COUNT", { count: 100 })}
                </p>
              </div>
            </div>
          </div>
          <CardContent>
            <p>{t("HOW_WAS_YOUR_EXPERIENCE")}</p>
          </CardContent>
          <CardFooter>
            <div className="flex w-full items-center justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                {t("DROP_A_QUICK_RATING")}
              </p>
              <div className="flex items-center gap-2">
                <Star className="text-foreground size-4" />
                <Star className="text-foreground size-4" />
                <Star className="text-foreground size-4" />
                <Star className="text-foreground size-4" />
                <Star className="text-foreground size-4" />
              </div>
            </div>
          </CardFooter>
        </Card> */}

        <div className="screenshot-only-logo mt-auto hidden justify-center pt-8 pb-4">
          <TextLogo />
        </div>

        {order.currency === "INR" && faqs.length > 0 && (
          <section className="container-narrow flex w-full flex-col">
            <FAQAccordion faqs={faqs} />
          </section>
        )}
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
          className="w-1/2 p-6"
          onClick={shareReceipt}
          disabled={isSharing}>
          <Share className="size-4" />
          <p className="font-medium text-sm">{t("SHARE")}</p>
        </Button>
      </footer>
    </>
  );
}
