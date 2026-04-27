import { ArrowDown, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits, parseUnits } from "viem";
import ASSETS from "@/assets";
import { BridgeTokenSelectorDrawer } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSafeDynamicContext } from "@/contexts";
import type { SupportedBridgeChains } from "@/core/rango";
import {
  CHAIN_TO_CHAINID_MAP,
  RANGO_ALL_CHAINS_SET,
} from "@/core/rango/config";
import { useRangoFetch, useRangoQuote, useUSDCBalance } from "@/hooks";
import { truncateAmount } from "@/lib/utils";
import type { DepositState } from "./shared";

interface FromToCardsProps {
  depositState: [
    DepositState,
    React.Dispatch<React.SetStateAction<DepositState>>,
  ];
}

export function FromToCards({ depositState }: FromToCardsProps) {
  const { t } = useTranslation();
  const { primaryWallet } = useSafeDynamicContext();
  const { usdcBalance } = useUSDCBalance();
  const [depositData, setDepositData] = depositState;
  const {
    rangoBalance,
    isRangoBalanceLoading,
    isRangoBalanceError,
    rangoBalanceError,
  } = useRangoFetch(
    depositData.sourceChain?.id as SupportedBridgeChains,
    "DEPOSIT",
  );

  const {
    data: rangoQuote,
    isLoading: isRangoQuoteLoading,
    isError: isRangoQuoteError,
    error: rangoQuoteError,
  } = useRangoQuote(
    "DEPOSIT",
    {
      blockchain: depositData.sourceChain?.id as string,
      address: depositData.sourceToken?.address as string | null,
    },
    parseUnits(
      depositData.amount || "0",
      depositData.sourceToken?.decimals || 18,
    ).toString(),
  );

  // Determine if we should show quote (valid inputs provided)
  const shouldShowQuote = !!(
    depositData.sourceChain?.id &&
    depositData.sourceToken?.address !== undefined &&
    depositData.amount &&
    depositData.amount !== "0" &&
    Number(depositData.amount) > 0
  );

  // Helper function to detect if current token is a native token
  const isNativeToken = (): boolean => {
    if (!depositData.sourceToken) return false;
    // Native tokens typically have null address or zero address
    return (
      depositData.sourceToken.address === null ||
      depositData.sourceToken.address ===
        "0x0000000000000000000000000000000000000000" ||
      depositData.sourceToken.address === ""
    );
  };

  const selectedTokenBalance = (() => {
    if (isRangoBalanceLoading) {
      return {
        shouldShowMax: false,
        balance: null,
        usdBalance: null,
        usdAmount: "...",
        isLoading: true,
        isError: false,
      };
    }

    if (isRangoBalanceError || !rangoBalance) {
      return {
        shouldShowMax: false,
        balance: "0",
        usdBalance: "0.00",
        usdAmount: "$0.00",
        isLoading: false,
        isError: true,
      };
    }

    const tokenData = rangoBalance.find(
      (b) => b.symbol === depositData.sourceToken?.symbol,
    );

    const balance = tokenData?.balance || "0";
    const usdBalance = tokenData?.usdBalance || "0.00";
    const price = tokenData?.price || 0;
    const amount = Number(depositData.amount) || 0;

    return {
      shouldShowMax: !!tokenData?.address,
      balance,
      usdBalance,
      usdAmount: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price * amount),
      isLoading: false,
      isError: false,
    };
  })();

  const handle50Percent = () => {
    if (selectedTokenBalance.isLoading) {
      toast.info(t("BALANCE_LOADING"));
      return;
    }

    if (selectedTokenBalance.isError) {
      toast.error(t("BALANCE_ERROR"));
      return;
    }

    if (selectedTokenBalance.balance && selectedTokenBalance.balance !== "0") {
      setDepositData({
        ...depositData,
        amount: (Number(selectedTokenBalance.balance) * 0.5).toString(),
      });
    } else {
      toast.warning(t("BALANCE_NOT_LOADED"));
    }
  };

  const handleMax = () => {
    if (selectedTokenBalance.isLoading) {
      toast.info(t("BALANCE_LOADING"));
      return;
    }

    if (selectedTokenBalance.isError) {
      toast.error(t("BALANCE_ERROR"));
      return;
    }

    if (selectedTokenBalance.balance && selectedTokenBalance.balance !== "0") {
      setDepositData({
        ...depositData,
        amount: selectedTokenBalance.balance.toString(),
      });
    } else {
      toast.warning(t("BALANCE_NOT_LOADED"));
    }
  };

  const handle75Percent = () => {
    if (selectedTokenBalance.isLoading) {
      toast.info(t("BALANCE_LOADING"));
      return;
    }

    if (selectedTokenBalance.isError) {
      toast.error(t("BALANCE_ERROR"));
      return;
    }

    if (selectedTokenBalance.balance && selectedTokenBalance.balance !== "0") {
      setDepositData({
        ...depositData,
        amount: (Number(selectedTokenBalance.balance) * 0.75).toString(),
      });
    } else {
      toast.warning(t("BALANCE_NOT_LOADED"));
    }
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
              value={depositData.amount}
              onChange={(e) =>
                setDepositData({
                  ...depositData,
                  amount: e.target.value,
                })
              }
            />
            <p className="truncate px-2 text-muted-foreground text-sm">
              {selectedTokenBalance.usdAmount}
            </p>
          </div>
          <div className="flex w-28 flex-col items-end gap-3">
            {depositData.sourceChain &&
              depositData.sourceToken &&
              (selectedTokenBalance.shouldShowMax ||
                selectedTokenBalance.isLoading ||
                isNativeToken()) && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-6 rounded-sm border-none bg-background text-xs shadow-none"
                    onClick={handle50Percent}
                    disabled={
                      selectedTokenBalance.isLoading ||
                      selectedTokenBalance.isError
                    }>
                    {selectedTokenBalance.isLoading ? "..." : "50%"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-6 rounded-sm border-none bg-background text-xs shadow-none"
                    onClick={isNativeToken() ? handle75Percent : handleMax}
                    disabled={
                      selectedTokenBalance.isLoading ||
                      selectedTokenBalance.isError
                    }>
                    {selectedTokenBalance.isLoading
                      ? "..."
                      : isNativeToken()
                        ? "75%"
                        : t("MAX")}
                  </Button>
                </div>
              )}
            <BridgeTokenSelectorDrawer
              bridgeType="DEPOSIT"
              selectedNetwork={depositData.sourceChain}
              selectedToken={depositData.sourceToken}
              onNetworkSelect={(network) => {
                // Auto-switch EVM chains when selecting a new chain
                if (
                  network?.id &&
                  RANGO_ALL_CHAINS_SET.has(
                    network.id as SupportedBridgeChains,
                  ) &&
                  primaryWallet?.connector.supportsNetworkSwitching() &&
                  network.id !== "SOLANA" // Skip Solana as it's not an EVM chain
                ) {
                  primaryWallet
                    .switchNetwork(
                      CHAIN_TO_CHAINID_MAP[network.id as SupportedBridgeChains],
                    )
                    .then(() => {
                      console.log(
                        `[Deposit] Successfully switched to ${network.id}`,
                      );
                      // TODO: Add amplitude tracking here when analytics is implemented
                      // trackAmplitudeEvent("BRIDGE_SWITCH_CHAIN", {
                      //   from: primaryWallet.chain,
                      //   to: network.id,
                      // });
                    })
                    .catch((error) => {
                      console.error("Failed to switch network:", error);
                      toast.error(t("FAILED_TO_SWITCH_NETWORK"), {
                        description: error.message,
                      });
                    });
                }

                setDepositData({
                  ...depositData,
                  sourceChain: network,
                  sourceToken: null,
                });
              }}
              onTokenSelect={(token) =>
                setDepositData({
                  ...depositData,
                  sourceToken: token,
                })
              }>
              <div className="relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                {depositData.sourceChain && depositData.sourceToken ? (
                  <>
                    <div className="relative flex shrink-0 items-center">
                      <img
                        src={depositData.sourceToken?.logo}
                        alt={depositData.sourceToken?.symbol}
                        className="size-5"
                      />
                      <img
                        src={depositData.sourceChain?.logo}
                        alt={depositData.sourceChain?.name}
                        className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background"
                      />
                    </div>
                    <p className="font-medium text-muted-foreground">
                      {depositData.sourceToken?.symbol}
                    </p>
                  </>
                ) : (
                  <p className="text-center font-medium text-muted-foreground text-sm">
                    {!depositData.sourceChain
                      ? t("SELECT_CHAIN_AND_TOKEN")
                      : t("SELECT_TOKEN")}
                  </p>
                )}
                <ChevronDown className="size-4 shrink-0" />
              </div>
            </BridgeTokenSelectorDrawer>
            {depositData.sourceChain && depositData.sourceToken && (
              <div className="text-center font-medium text-xs">
                {selectedTokenBalance.isLoading ? (
                  <div className="flex items-center justify-center gap-1 text-primary">
                    <div className="h-3 w-16 animate-pulse rounded bg-primary/30" />
                  </div>
                ) : selectedTokenBalance.isError ? (
                  <p className="text-destructive">{t("BALANCE_ERROR")}</p>
                ) : (
                  <p className="text-primary">
                    {truncateAmount(selectedTokenBalance.balance || "0", 6)} / $
                    {truncateAmount(selectedTokenBalance.usdBalance || "0", 2)}
                  </p>
                )}
              </div>
            )}
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
                    rangoQuote.route.to.decimals || 6,
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
          <div className="flex w-24 flex-col items-end gap-3">
            <div className="h-6 w-full"></div>
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
      {isRangoBalanceError && (
        <div className="px-4 py-2">
          <p className="text-destructive text-sm">
            {t("BALANCE_FETCH_ERROR")}: {rangoBalanceError?.message}
          </p>
        </div>
      )}
    </section>
  );
}
