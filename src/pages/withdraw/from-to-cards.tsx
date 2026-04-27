import { ArrowDown, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { BridgeTokenSelectorDrawer } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { BridgeChain, BridgeToken } from "@/core/rango";
import type { RangoQuoteResponse } from "@/core/rango/types";
import { useUSDCBalance } from "@/hooks";
import { truncateAmount } from "@/lib/utils";
import type { WithdrawState } from "./shared";

interface FromToCardsProps {
  withdrawState: [
    WithdrawState,
    React.Dispatch<React.SetStateAction<WithdrawState>>,
  ];
  rangoQuote: RangoQuoteResponse | undefined;
  isRangoQuoteLoading: boolean;
  isRangoQuoteError: boolean;
  rangoQuoteError: Error | null;
}

export function FromToCards({
  withdrawState,
  rangoQuote,
  isRangoQuoteLoading,
  isRangoQuoteError,
  rangoQuoteError,
}: FromToCardsProps) {
  const { t } = useTranslation();
  const { usdcBalance } = useUSDCBalance();
  const [withdrawData, setWithdrawData] = withdrawState;

  const usdcBalanceNumber = Number(usdcBalance || "0");

  // Determine if we should show quote (valid inputs provided)
  const shouldShowQuote = !!(
    withdrawData.destinationChain?.id &&
    withdrawData.destinationToken?.address !== undefined &&
    withdrawData.amount &&
    withdrawData.amount !== "0" &&
    Number(withdrawData.amount) > 0
  );

  const handle50Percent = () => {
    if (!usdcBalance) {
      toast.warning(t("BALANCE_NOT_LOADED"));
      return;
    }
    setWithdrawData((prev) => ({
      ...prev,
      amount: (usdcBalanceNumber * 0.5).toString(),
    }));
  };

  const handleMax = () => {
    if (!usdcBalance) {
      toast.warning(t("BALANCE_NOT_LOADED"));
      return;
    }
    setWithdrawData((prev) => ({
      ...prev,
      amount: usdcBalance.toString(),
    }));
  };

  const handleDestinationNetworkSelect = (network: BridgeChain) => {
    setWithdrawData((prev) => ({
      ...prev,
      destinationChain: network,
      destinationToken: null, // Reset token when network changes
    }));
  };

  const handleDestinationTokenSelect = (token: BridgeToken) => {
    setWithdrawData((prev) => ({
      ...prev,
      destinationToken: token,
    }));
  };

  const handleAmountChange = (value: string) => {
    setWithdrawData((prev) => ({
      ...prev,
      amount: value,
    }));
  };

  return (
    <section className="relative flex w-full flex-col gap-4 py-4">
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-1 flex-col items-start gap-1">
            <p className="px-2 font-medium text-sm">{t("YOU_SEND")}</p>
            <Input
              type="number"
              className="h-10 w-full border-none bg-transparent pl-2 font-bold text-2xl text-primary shadow-none placeholder:text-primary/50"
              placeholder="0.00"
              min={0}
              value={withdrawData.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <p className="truncate px-2 text-muted-foreground text-sm">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(Number(withdrawData.amount))}
            </p>
          </div>
          <div className="flex w-24 flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-6 rounded-sm border-none bg-background text-xs shadow-none"
                onClick={handle50Percent}
                disabled={!usdcBalance}>
                50%
              </Button>
              <Button
                variant="outline"
                className="h-6 rounded-sm border-none bg-background text-xs shadow-none"
                onClick={handleMax}
                disabled={!usdcBalance}>
                {t("MAX")}
              </Button>
            </div>
            <div className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
              <div className="relative flex items-center">
                <ASSETS.ICONS.Usdc className="size-5" />
                <ASSETS.ICONS.NetworkBase className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
              </div>
              <p className="font-medium text-muted-foreground">USDC</p>
            </div>
            <p className="text-center font-medium text-primary text-xs">
              {t("BALANCE")}:{" "}
              <span className="font-medium">
                {usdcBalance ? truncateAmount(usdcBalance) : "..."}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 flex items-center justify-center rounded-full bg-primary p-2">
        <ArrowDown className="size-7 text-primary-foreground" />
      </div>
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-1 flex-col items-start gap-1">
            <p className="px-2 font-medium text-sm">{t("YOU_RECEIVE")}</p>

            {/* Loading state - when actively fetching quote */}
            {shouldShowQuote && isRangoQuoteLoading && (
              <Skeleton className="ml-2 h-10 w-32 text-primary" />
            )}

            {/* Error state - when quote fetch failed */}
            {shouldShowQuote && isRangoQuoteError && (
              <p className="h-10 border-none pl-2 text-destructive text-xs">
                {rangoQuoteError?.message || t("FAILED_TO_GET_QUOTE")}
              </p>
            )}

            {/* Success state - when quote is available */}
            {shouldShowQuote &&
              !isRangoQuoteLoading &&
              !isRangoQuoteError &&
              rangoQuote?.route && (
                <p className="h-10 truncate border-none pl-2 font-bold text-2xl text-primary shadow-none">
                  {formatUnits(
                    BigInt(rangoQuote.route.outputAmount || "0"),
                    rangoQuote.route.to.decimals || 18,
                  )}
                </p>
              )}

            {/* Default state - when no valid inputs or no route found */}
            {(!shouldShowQuote ||
              (!isRangoQuoteLoading &&
                !isRangoQuoteError &&
                !rangoQuote?.route)) && (
              <p className="h-10 truncate border-none pl-2 font-bold text-2xl text-primary shadow-none">
                0.00
              </p>
            )}

            <p className="truncate px-2 text-muted-foreground text-sm">
              {shouldShowQuote &&
              !isRangoQuoteLoading &&
              !isRangoQuoteError &&
              rangoQuote?.route
                ? new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(rangoQuote.route.outputAmountUsd || 0)
                : "$0.00"}
            </p>
          </div>
          <div className="flex w-28 flex-col items-end gap-3">
            <div className="h-6 w-full"></div>
            <BridgeTokenSelectorDrawer
              bridgeType="WITHDRAW"
              selectedNetwork={withdrawData.destinationChain}
              selectedToken={withdrawData.destinationToken}
              onNetworkSelect={handleDestinationNetworkSelect}
              onTokenSelect={handleDestinationTokenSelect}>
              <div className="relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                {withdrawData.destinationChain &&
                withdrawData.destinationToken ? (
                  <>
                    <div className="relative flex shrink-0 items-center">
                      <img
                        src={withdrawData.destinationToken.logo}
                        alt={withdrawData.destinationToken.symbol}
                        className="size-5"
                      />
                      <img
                        src={withdrawData.destinationChain.logo}
                        alt={withdrawData.destinationChain.name}
                        className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background"
                      />
                    </div>
                    <p className="font-medium text-muted-foreground">
                      {withdrawData.destinationToken.symbol}
                    </p>
                  </>
                ) : (
                  <p className="text-center font-medium text-muted-foreground text-sm">
                    {!withdrawData.destinationChain
                      ? t("SELECT_CHAIN_AND_TOKEN")
                      : t("SELECT_TOKEN")}
                  </p>
                )}
                <ChevronDown className="size-4 shrink-0" />
              </div>
            </BridgeTokenSelectorDrawer>

            {/* No balance display for withdraw destination */}
            <div className="h-4 w-full"></div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
