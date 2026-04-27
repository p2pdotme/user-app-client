import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Copy, XCircle } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { OrderProgress } from "@/components";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RANGO_SLIPPAGE } from "@/core/rango/config";
import type { RangoQuoteResponse, RangoSwapResponse } from "@/core/rango/types";
import { DEPOSIT_PROGRESS_STEPS, type DepositState } from "./shared";

interface QuoteDetailsProps {
  depositState: DepositState;
  rangoQuote: RangoQuoteResponse | undefined;
  swapResponse: RangoSwapResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onReset: () => void;
}

export function QuoteDetails({
  depositState,
  rangoQuote,
  swapResponse,
  isLoading,
  isError,
  error,
  onReset,
}: QuoteDetailsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const handleCopyRequestId = () => {
    const requestId = swapResponse?.requestId || rangoQuote?.requestId;
    if (!requestId) {
      toast.error(t("RANGO_REQUEST_ID_NOT_FOUND"));
      return;
    }
    navigator.clipboard.writeText(requestId);
    toast.success(t("RANGO_REQUEST_ID_COPIED_TO_CLIPBOARD"));
  };

  const handleDone = () => {
    // Invalidate USDC balance on success to refetch latest balance
    if (depositState.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });
    }
    onReset();
  };

  // Show success state
  if (depositState.status === "completed") {
    const activeQuote = swapResponse?.route || rangoQuote?.route;

    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="size-6 text-success" />
            {t("DEPOSIT_SUCCESSFUL")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Transaction summary */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_SENT")} </span>
                <span className="text-muted-foreground">
                  {depositState.amount} {depositState.sourceToken?.symbol}
                </span>
              </div>

              {activeQuote && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("YOU_RECEIVED")} </span>
                  <span className="text-muted-foreground">
                    {formatUnits(
                      BigInt(activeQuote.outputAmount || "0"),
                      activeQuote.to.decimals || 18,
                    )}{" "}
                    {activeQuote.to.symbol}
                  </span>
                </div>
              )}
            </div>

            {/* Request ID for tracking */}
            {(swapResponse?.requestId || rangoQuote?.requestId) && (
              <div className="rounded-lg bg-primary/10 p-4">
                <div className="flex items-center justify-start gap-2 text-sm">
                  <span className="font-medium">{t("RANGO_REQUEST_ID")}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
                    onClick={handleCopyRequestId}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-muted-foreground text-xs">
                  {swapResponse?.requestId || rangoQuote?.requestId}
                </span>
              </div>
            )}

            <Button className="w-full" onClick={handleDone}>
              {t("DONE")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show failure state
  if (depositState.status === "failed") {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="size-6 text-destructive" />
            {t("DEPOSIT_FAILED")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Error message */}
            <Alert variant="destructive">
              <XCircle className="size-4 text-destructive" />
              <AlertDescription>
                {swapResponse?.error ||
                  error?.message ||
                  t("DEPOSIT_FAILED_GENERIC")}
              </AlertDescription>
            </Alert>

            {/* Transaction summary */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("ATTEMPTED_AMOUNT")} </span>
                <span className="text-muted-foreground">
                  {depositState.amount} {depositState.sourceToken?.symbol}
                </span>
              </div>
            </div>

            {/* Request ID for support */}
            {(swapResponse?.requestId || rangoQuote?.requestId) && (
              <div className="rounded-lg bg-destructive/10 p-4">
                <div className="flex items-center justify-start gap-2 text-sm">
                  <span className="font-medium">{t("RANGO_REQUEST_ID")}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
                    onClick={handleCopyRequestId}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-muted-foreground text-xs">
                  {swapResponse?.requestId || rangoQuote?.requestId}
                </span>
                <p className="mt-2 text-destructive text-xs">
                  {t("SAVE_REQUEST_ID_FOR_SUPPORT")}
                </p>
              </div>
            )}

            <Button className="w-full" variant="outline" onClick={handleDone}>
              {t("DONE")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show progress when deposit is in progress - use swap response data if available
  if (["preparing", "approval", "swapping"].includes(depositState.status)) {
    const activeQuote = swapResponse?.route || rangoQuote?.route;
    const activeRequestId = swapResponse?.requestId || rangoQuote?.requestId;

    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("DEPOSIT_PROGRESS")}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderProgress
            steps={DEPOSIT_PROGRESS_STEPS}
            currentStepKey={depositState.status}
            className="p-2"
          />

          {/* Show complete transaction details from swap response or quote */}
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("YOU_SEND")} </span>
              <span className="text-muted-foreground">
                {depositState.amount} {depositState.sourceToken?.symbol}
              </span>
            </div>

            {activeQuote && (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("YOU_RECEIVE")} </span>
                  <div className="text-right">
                    <span className="text-muted-foreground">
                      {formatUnits(
                        BigInt(activeQuote.outputAmount || "0"),
                        activeQuote.to.decimals || 18,
                      )}{" "}
                      {activeQuote.to.symbol}
                    </span>
                    <div className="font-light text-muted-foreground text-xs">
                      (±{RANGO_SLIPPAGE}% {t("SLIPPAGE")})
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("ESTIMATED_FEE")} </span>
                  <span className="text-muted-foreground">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(Number(activeQuote.feeUsd))}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("ESTIMATED_TIME")} </span>
                  <span className="text-muted-foreground">
                    {activeQuote.estimatedTimeInSeconds
                      ? moment
                          .duration(
                            activeQuote.estimatedTimeInSeconds,
                            "seconds",
                          )
                          .humanize()
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">{t("SWAPPER")} </span>
                  <span className="text-muted-foreground">
                    {activeQuote.swapper.title}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Route Display */}
          {activeQuote?.path && (activeQuote.path?.length ?? 0) > 0 && (
            <div className="my-4">
              <h4 className="mb-3 font-medium text-sm">{t("PATH")}</h4>
              <div className="flex items-center justify-center gap-3 overflow-x-auto py-2">
                {/* Starting token */}
                <div className="flex min-w-0 flex-col items-center gap-1">
                  <div className="relative">
                    <div className="flex size-8 items-center justify-center rounded-full bg-gray-100">
                      {activeQuote.path[0]?.from.image ? (
                        <img
                          src={activeQuote.path[0].from.image}
                          alt={activeQuote.path[0].from.symbol}
                          className="size-6 rounded-full"
                        />
                      ) : (
                        <span className="font-medium text-xs">
                          {activeQuote.path[0]?.from.symbol}
                        </span>
                      )}
                    </div>
                    {activeQuote.path[0]?.from.blockchainImage && (
                      <img
                        src={activeQuote.path[0].from.blockchainImage}
                        alt={activeQuote.path[0].from.blockchain}
                        className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background"
                      />
                    )}
                  </div>
                  <span className="text-center font-medium text-xs">
                    {activeQuote.path[0]?.from.symbol}
                  </span>
                </div>

                {/* Route steps */}
                {activeQuote.path.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <ASSETS.ICONS.SwapRouteRightArrow className="size-4 flex-shrink-0 text-primary/70" />
                    <div className="flex min-w-0 flex-col items-center gap-1">
                      <div className="relative">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gray-100">
                          {step.to.image ? (
                            <img
                              src={step.to.image}
                              alt={step.to.symbol}
                              className="size-6 rounded-full"
                            />
                          ) : (
                            <span className="font-medium text-xs">
                              {step.to.symbol}
                            </span>
                          )}
                        </div>
                        {step.to.blockchainImage && (
                          <img
                            src={step.to.blockchainImage}
                            alt={step.to.blockchain}
                            className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background"
                          />
                        )}
                      </div>
                      <span className="text-center font-medium text-xs">
                        {step.to.symbol}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request ID for tracking */}
          {activeRequestId && (
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center justify-start gap-2 text-sm">
                <span className="font-medium">{t("RANGO_REQUEST_ID")}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
                  onClick={handleCopyRequestId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-muted-foreground text-xs">
                {activeRequestId}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Don't render if no amount or tokens selected (initial idle state)
  if (
    !depositState.amount ||
    !depositState.sourceToken ||
    !depositState.sourceChain
  ) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("QUOTE_DETAILS")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("YOU_SEND")} </span>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("YOU_RECEIVE")} </span>
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("ESTIMATED_TIME")} </span>
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("ESTIMATED_FEE")} </span>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Route Skeleton */}
          <div className="my-4">
            <h4 className="mb-3 font-medium text-sm">{t("PATH")}</h4>
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>

          {/* Request ID Skeleton */}
          <div className="rounded-lg bg-primary/10 p-4">
            <div className="flex items-center justify-start gap-2 text-sm">
              <span className="font-medium">{t("RANGO_REQUEST_ID")}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
                disabled>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Skeleton className="mt-2 h-3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (isError) {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("QUOTE_DETAILS")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || t("FAILED_TO_FETCH_QUOTE")}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Don't render if no quote data
  if (!rangoQuote) {
    return null;
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{t("QUOTE_DETAILS")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t("YOU_SEND")} </span>
            <span className="text-muted-foreground">
              {depositState.amount} {depositState.sourceToken?.symbol}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">{t("YOU_RECEIVE")} </span>
            <div className="text-right">
              <span className="text-muted-foreground">
                {formatUnits(
                  BigInt(rangoQuote?.route?.outputAmount || "0"),
                  rangoQuote?.route?.to.decimals || 18,
                )}{" "}
                {rangoQuote?.route?.to.symbol}
              </span>
              <div className="font-light text-muted-foreground text-xs">
                (±{RANGO_SLIPPAGE}% {t("SLIPPAGE")})
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">{t("ESTIMATED_FEE")} </span>
            <span className="text-muted-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(rangoQuote?.route?.feeUsd))}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">{t("ESTIMATED_TIME")} </span>
            <span className="text-muted-foreground">
              {rangoQuote?.route?.estimatedTimeInSeconds
                ? moment
                    .duration(
                      rangoQuote.route.estimatedTimeInSeconds,
                      "seconds",
                    )
                    .humanize()
                : "-"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">{t("SWAPPER")} </span>
            <span className="text-muted-foreground">
              {rangoQuote?.route?.swapper.title}
            </span>
          </div>
        </div>

        {/* Route Display */}
        {rangoQuote?.route?.path &&
          (rangoQuote.route.path?.length ?? 0) > 0 && (
            <div className="my-4">
              <h4 className="mb-3 font-medium text-sm">{t("PATH")}</h4>
              <div className="flex items-center justify-center gap-3 overflow-x-auto py-2">
                {/* Starting token */}
                <div className="flex min-w-0 flex-col items-center gap-1">
                  <div className="relative">
                    <div className="flex size-8 items-center justify-center rounded-full bg-gray-100">
                      {rangoQuote.route.path[0]?.from.image ? (
                        <img
                          src={rangoQuote.route.path[0].from.image}
                          alt={rangoQuote.route.path[0].from.symbol}
                          className="size-6 rounded-full"
                        />
                      ) : (
                        <span className="font-medium text-xs">
                          {rangoQuote.route.path[0]?.from.symbol}
                        </span>
                      )}
                    </div>
                    {rangoQuote.route.path[0]?.from.blockchainImage && (
                      <img
                        src={rangoQuote.route.path[0].from.blockchainImage}
                        alt={rangoQuote.route.path[0].from.blockchain}
                        className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background"
                      />
                    )}
                  </div>
                  <span className="text-center font-medium text-xs">
                    {rangoQuote.route.path[0]?.from.symbol}
                  </span>
                </div>

                {/* Route steps */}
                {rangoQuote.route.path.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <ASSETS.ICONS.SwapRouteRightArrow className="size-4 flex-shrink-0 text-primary/70" />
                    <div className="flex min-w-0 flex-col items-center gap-1">
                      <div className="relative">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gray-100">
                          {step.to.image ? (
                            <img
                              src={step.to.image}
                              alt={step.to.symbol}
                              className="size-6 rounded-full"
                            />
                          ) : (
                            <span className="font-medium text-xs">
                              {step.to.symbol}
                            </span>
                          )}
                        </div>
                        {step.to.blockchainImage && (
                          <img
                            src={step.to.blockchainImage}
                            alt={step.to.blockchain}
                            className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background"
                          />
                        )}
                      </div>
                      <span className="text-center font-medium text-xs">
                        {step.to.symbol}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="rounded-lg bg-primary/10 p-4">
          <div className="flex items-center justify-start gap-2 text-sm">
            <span className="font-medium">{t("RANGO_REQUEST_ID")}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
              onClick={handleCopyRequestId}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-muted-foreground text-xs">
            {rangoQuote?.requestId}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
