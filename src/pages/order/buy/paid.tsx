import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { OrderProgress } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { getOrderFeeDetails } from "@/core/fees";
import { cn, formatFiatAmount, truncateAddress } from "@/lib/utils";
import { BUY_FLOW_PROGRESS_TEXT } from "../shared";

export function BuyPaid({ order }: { order: Order }) {
  const { t } = useTranslation();
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

  return (
    <main className="flex h-full w-full flex-col overflow-y-auto pt-4">
      <section className="container-narrow flex flex-col items-center justify-center gap-4 py-8">
        <DotLottieReact
          className="h-40 w-80"
          src={ASSETS.ANIMATIONS.VERIFIED}
          loop
          autoplay
        />
        <h2 className="text-center font-medium text-lg">
          {t("VERIFYING_YOUR_PAYMENT")}...
        </h2>
        <p className="text-center text-muted-foreground text-sm">
          {t(
            "YOUR_PAYMENT_IS_BEING_VERIFIED_ONCE_COMPLETE_YOUR_USDC_WILL_BE_SENT_TO_THE_PROVIDED_ADDRESS",
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
            {t("MERCHANT_IS_VERIFYING_YOUR_PAYMENT")}
          </p>
          <p className="text-center text-sm text-success">{t("ON_TIME")}</p>
        </section>
        <Separator className="h-4 animate-pulse bg-primary py-1" />
        <OrderProgress
          steps={BUY_FLOW_PROGRESS_TEXT}
          currentStepKey={order.status}
        />

        <div className="flex items-center justify-between px-4">
          <h3 className="font-medium text-sm sm:text-base">
            {t("ORDER_DETAILS")}
          </h3>
        </div>

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
                  "px-6 py-1 text-sm",
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
                    <Skeleton className="h-4 w-16" />
                  ) : actualUsdcAmount ? (
                    `${actualUsdcAmount.toFixed(3)} USDC`
                  ) : null}
                </span>
              </div>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-1 overflow-y-auto sm:space-y-2"
                style={{ maxHeight: "120px" }}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("YOU_SEND")} </span>
                  <span className="text-muted-foreground">
                    {isLoadingOrderFeeDetails || orderFeeDetailsError ? (
                      <Skeleton className="h-4 w-16" />
                    ) : actualFiatAmount ? (
                      formatFiatAmount(actualFiatAmount, order.currency)
                    ) : null}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("RECEIVING_ADDRESS")} </span>
                  <span className="text-muted-foreground">
                    {truncateAddress(order.recipientAddr)}
                  </span>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.footer>
    </main>
  );
}
