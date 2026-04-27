import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useOrders } from "@p2pdotme/sdk/react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Share,
} from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { TextLogo } from "@/components/text-logo";
import { TipMerchantCard } from "@/components/tip-merchant-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { viemChain } from "@/core/adapters/thirdweb/chain";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import { useAnalytics } from "@/hooks";
import { useUsdcTransferTxHash } from "@/hooks/use-event-timestamp";
import { useReceiptShare } from "@/hooks/use-receipt-share";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { formatFiatAmount, truncateAddress } from "@/lib/utils";

export function BuyCompleted({ order }: { order: Order }) {
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
  const [decryptedPaymentAddress, setDecryptedPaymentAddress] = useState<
    string | undefined
  >(undefined);
  const [showPaymentAddress, setShowPaymentAddress] = useState(false);

  const { shareReceipt, isSharing } = useReceiptShare({ order });

  const { data: usdcTxHash, isLoading: isTxHashLoading } =
    useUsdcTransferTxHash({
      orderId: Number(order.id),
      recipientAddr: order.recipientAddr,
      amount: order.amount,
    });

  const completionTimeDisplay = useMemo(() => {
    const completed = Number(order.completedTimestamp);
    const placed = Number(order.placedTimestamp);
    const delta = Math.max(0, completed - placed);
    if (delta < 60) return `${t("COMPLETED_IN")} ${delta}s`;
    const minutes = Math.floor(delta / 60);
    const seconds = delta % 60;
    return `${t("COMPLETED_IN")} ${minutes}m${seconds}s`;
  }, [order.completedTimestamp, order.placedTimestamp, t]);

  const handleCopy = async (value?: string) => {
    if (!value || value === t("NOT_FOUND") || value === t("SESSION_CHANGED")) {
      toast.warning(t("NO_ADDRESS_TO_COPY"));
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
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
  };

  // Track buy transaction completed view
  useEffect(() => {
    const completedTimestamp = Number(order.completedTimestamp);
    const placedTimestamp = Number(order.placedTimestamp);
    const totalTime = completedTimestamp - placedTimestamp;

    trackWithDedupe(EVENTS.TRANSACTION, `transaction_${order.id}_completed`, {
      transaction_type: "buy",
      status: "completed",
      orderId: order.id.toString(),
      currency: order.currency,
      amount: Number(order.amount),
      fiatAmount: Number(order.fiatAmount),
      placedToCompletedTimeInSeconds: totalTime,
    });
  }, [order, trackWithDedupe]);

  // Decrypt merchant payment address
  useEffect(() => {
    const decryptPaymentAddressAsync = async () => {
      const decrypted = await orders.decryptPaymentAddress({
        encrypted: order.encUpi,
      });
      if (decrypted.isErr()) {
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

  // Branding row shows: Bought via P2P.me

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
            {Number(order.amount).toFixed(3)}{" "}
            <span className="font-normal text-muted-foreground text-sm">
              USDC
            </span>
          </h2>
        </section>
        <div className="items-center-safe justify-center-safe flex gap-2 py-2">
          <ASSETS.ICONS.Logo className="size-7 text-primary" />
          <p className="font-medium text-foreground text-sm">
            {t("BOUGHT_VIA")} P2P.me
          </p>
        </div>
        <Alert variant="warning" className="export-screenshot-ignore">
          <AlertTriangle className="size-4" />
          <AlertTitle>
            <p className="font-normal text-foreground text-sm">
              {t("NOTE_FOR_CENTRALIZED_EXCHANGES")}
            </p>
          </AlertTitle>
          <AlertDescription>
            <p className="font-normal text-foreground text-sm">
              {t("CEX_DEPOSITS_TAKE_10_15_MINUTES_TO_CONFIRM")}
            </p>
          </AlertDescription>
        </Alert>

        {/* Tip Card */}
        <TipMerchantCard orderId={Number(order.id)} />

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
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("YOU_SEND")} </span>
                  <span className="text-muted-foreground">
                    {actualFiatAmount
                      ? formatFiatAmount(actualFiatAmount, order.currency)
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
                      {fixedFeePaid.toFixed(3)} USDC
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t("YOU_RECEIVE")} </span>
                    <span className="text-muted-foreground">
                      {actualUsdcAmount
                        ? `${actualUsdcAmount.toFixed(3)} USDC`
                        : null}
                    </span>
                  </div>
                </>
              )}

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
                    onClick={() => handleCopy(decryptedPaymentAddress)}
                    disabled={
                      !decryptedPaymentAddress ||
                      decryptedPaymentAddress === t("NOT_FOUND") ||
                      decryptedPaymentAddress === t("SESSION_CHANGED")
                    }
                    className="export-screenshot-ignore size-4 p-0 text-muted-foreground transition-colors hover:text-foreground">
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-medium">{t("TRANSACTION_HASH")} </span>
                {isTxHashLoading ? (
                  <Skeleton className="h-4 w-40" />
                ) : usdcTxHash ? (
                  (() => {
                    const explorerBase = viemChain.blockExplorers?.default?.url;
                    if (!explorerBase) {
                      return (
                        <span className="text-muted-foreground">
                          {truncateAddress(usdcTxHash)}
                        </span>
                      );
                    }
                    const href = `${explorerBase}/tx/${usdcTxHash}`;
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        aria-label={
                          t("TRANSACTION_HASH") || "Transaction Hash"
                        }>
                        {truncateAddress(usdcTxHash)}
                        <ExternalLink className="ml-1 inline size-3" />
                      </a>
                    );
                  })()
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
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
      </main>
      <footer className="container-narrow flex w-full items-center justify-center gap-2 p-4">
        <Button
          onClick={() => navigate(INTERNAL_HREFS.HOME)}
          className="w-1/2 bg-muted p-6 hover:bg-muted/80">
          <p className="whitespace-nowrap font-medium text-foreground text-sm">
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
