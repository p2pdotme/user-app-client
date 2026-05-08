import { ArrowUpDown, CheckCircle, Copy, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits, parseUnits } from "viem";
import ASSETS from "@/assets";
import { OrderProgress } from "@/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSafeDynamicContext } from "@/contexts";
import { handleDeposit } from "@/core/rango/bridgeHandler/deposit";
import { handleWithdraw } from "@/core/rango/bridgeHandler/withdraw";
import { BRIDGE_TOKEN_ADDRESSES } from "@/core/rango/config";
import type { RangoSwapResponse } from "@/core/rango/types";
import { useRangoQuote, useRangoSwap, useSounds, useThirdweb } from "@/hooks";
import type { DepositState } from "@/pages/deposit/shared";
import type { WithdrawState } from "@/pages/withdraw/shared";

type SwapDirection = "BASE_TO_SOLANA" | "SOLANA_TO_BASE";
type SwapStatus =
  | "idle"
  | "preparing"
  | "approval"
  | "swapping"
  | "completed"
  | "failed";

interface SwapState {
  direction: SwapDirection;
  amount: string;
  status: SwapStatus;
}

const SOLANA_USDC = {
  blockchain: "SOLANA",
  address: BRIDGE_TOKEN_ADDRESSES.SOLANA.USDC,
};

const SWAP_PROGRESS_STEPS = [
  { key: "approval", activeTextKey: "APPROVING", completedTextKey: "APPROVED" },
  { key: "swapping", activeTextKey: "SWAPPING", completedTextKey: "SWAPPED" },
] as const;

export function P2PSwapWidget() {
  const { t } = useTranslation();
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();
  const sounds = useSounds();

  const [swapState, setSwapState] = useState<SwapState>({
    direction: "BASE_TO_SOLANA",
    amount: "",
    status: "idle",
  });
  const [swapResponse, setSwapResponse] = useState<RangoSwapResponse | null>(
    null,
  );

  const bridgeType =
    swapState.direction === "BASE_TO_SOLANA" ? "WITHDRAW" : "DEPOSIT";
  const isInProgress = ["preparing", "approval", "swapping"].includes(
    swapState.status,
  );
  const isBaseSource = swapState.direction === "BASE_TO_SOLANA";

  const amountInUnits =
    swapState.amount && Number(swapState.amount) > 0
      ? parseUnits(swapState.amount, 6).toString()
      : "0";

  const {
    data: rangoQuote,
    isLoading: isQuoteLoading,
    isError: isQuoteError,
    error: quoteError,
  } = useRangoQuote(bridgeType, SOLANA_USDC, amountInUnits);

  const rangoSwap = useRangoSwap();

  const reset = () => {
    setSwapState((prev) => ({ ...prev, amount: "", status: "idle" }));
    setSwapResponse(null);
  };

  const toggleDirection = () => {
    setSwapState((prev) => ({
      direction:
        prev.direction === "BASE_TO_SOLANA" ? "SOLANA_TO_BASE" : "BASE_TO_SOLANA",
      amount: "",
      status: "idle",
    }));
    setSwapResponse(null);
  };

  // Adapters: the bridge handlers call setState((prev) => ({ ...prev, status })).
  // These wrappers translate those status updates back into SwapState.
  const makeDepositSetter =
    (): React.Dispatch<React.SetStateAction<DepositState>> =>
    (updater) => {
      setSwapState((prev) => {
        const fake: DepositState = {
          sourceChain: null,
          sourceToken: null,
          amount: prev.amount,
          status: prev.status,
        };
        const next = typeof updater === "function" ? updater(fake) : updater;
        return { ...prev, status: next.status };
      });
    };

  const makeWithdrawSetter =
    (): React.Dispatch<React.SetStateAction<WithdrawState>> =>
    (updater) => {
      setSwapState((prev) => {
        const fake: WithdrawState = {
          destinationChain: null,
          destinationToken: null,
          amount: prev.amount,
          recipientAddress: "",
          status: prev.status,
        };
        const next = typeof updater === "function" ? updater(fake) : updater;
        return { ...prev, status: next.status };
      });
    };

  const handleSwap = async () => {
    if (!swapState.amount || Number(swapState.amount) <= 0) {
      toast.error(t("PLEASE_ENTER_VALID_AMOUNT"));
      return;
    }
    if (!rangoQuote) {
      toast.error(t("QUOTE_NOT_AVAILABLE"));
      return;
    }

    setSwapState((prev) => ({ ...prev, status: "preparing" }));

    try {
      if (swapState.direction === "BASE_TO_SOLANA") {
        if (!account?.address) {
          toast.error(t("WALLET_NOT_CONNECTED"));
          setSwapState((prev) => ({ ...prev, status: "idle" }));
          return;
        }
        if (!primaryWallet?.address) {
          toast.error(t("CONNECT_YOUR_SOLANA_WALLET"));
          setSwapState((prev) => ({ ...prev, status: "idle" }));
          return;
        }

        const swapRes = await rangoSwap.mutateAsync({
          bridgeType: "WITHDRAW",
          token: SOLANA_USDC,
          amount: parseUnits(swapState.amount, 6).toString(),
          recipientAddress: primaryWallet.address,
        });
        setSwapResponse(swapRes);

        if (swapRes.error) {
          setSwapState((prev) => ({ ...prev, status: "failed" }));
          return;
        }

        await handleWithdraw(swapRes, account, makeWithdrawSetter(), sounds);
      } else {
        if (!primaryWallet?.address) {
          toast.error(t("CONNECT_YOUR_SOLANA_WALLET"));
          setSwapState((prev) => ({ ...prev, status: "idle" }));
          return;
        }
        if (!account?.address) {
          toast.error(t("WALLET_NOT_CONNECTED"));
          setSwapState((prev) => ({ ...prev, status: "idle" }));
          return;
        }

        const swapRes = await rangoSwap.mutateAsync({
          bridgeType: "DEPOSIT",
          token: SOLANA_USDC,
          amount: parseUnits(swapState.amount, 6).toString(),
        });
        setSwapResponse(swapRes);

        if (swapRes.error) {
          setSwapState((prev) => ({ ...prev, status: "failed" }));
          return;
        }

        await handleDeposit(swapRes, primaryWallet, makeDepositSetter(), sounds);
      }
    } catch (error) {
      setSwapState((prev) => ({ ...prev, status: "failed" }));
      const err = error as Error;
      if (err.message?.includes("User rejected")) {
        toast.error(t("TRANSACTION_REJECTED"), {
          description: t("TRANSACTION_REJECTED_DESCRIPTION"),
        });
      } else {
        toast.error(t("SWAP_TXN_NOT_CREATED"), { description: err.message });
      }
    }
  };

  const copyRequestId = (requestId: string) => {
    navigator.clipboard.writeText(requestId);
    toast.success(t("RANGO_REQUEST_ID_COPIED_TO_CLIPBOARD"));
  };

  if (swapState.status === "completed") {
    const activeQuote = swapResponse?.route ?? rangoQuote?.route;
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="size-6 text-success" />
            {t("SWAP_SUCCESSFUL")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("YOU_SENT")}</span>
              <span className="text-muted-foreground">
                {swapState.amount} USDC
              </span>
            </div>
            {activeQuote && (
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_RECEIVED")}</span>
                <span className="text-muted-foreground">
                  {formatUnits(
                    BigInt(activeQuote.outputAmount ?? "0"),
                    6,
                  )}{" "}
                  USDC
                </span>
              </div>
            )}
          </div>
          {swapResponse?.requestId && (
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{t("RANGO_REQUEST_ID")}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
                  onClick={() => copyRequestId(swapResponse.requestId)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-muted-foreground text-xs">
                {swapResponse.requestId}
              </span>
            </div>
          )}
          <Button className="w-full" onClick={reset}>
            {t("DONE")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (swapState.status === "failed") {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="size-6 text-destructive" />
            {t("SWAP_FAILED")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("ATTEMPTED_AMOUNT")}</span>
              <span className="text-muted-foreground">
                {swapState.amount} USDC
              </span>
            </div>
          </div>
          {swapResponse?.requestId && (
            <div className="rounded-lg bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{t("RANGO_REQUEST_ID")}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
                  onClick={() => copyRequestId(swapResponse.requestId)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-muted-foreground text-xs">
                {swapResponse.requestId}
              </span>
              <p className="mt-2 text-destructive text-xs">
                {t("SAVE_REQUEST_ID_FOR_SUPPORT")}
              </p>
            </div>
          )}
          <Button className="w-full" variant="outline" onClick={reset}>
            {t("DONE")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isInProgress) {
    const activeQuote = swapResponse?.route ?? rangoQuote?.route;
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("SWAP_IN_PROGRESS")}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderProgress
            steps={SWAP_PROGRESS_STEPS}
            currentStepKey={swapState.status}
            className="p-2"
          />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("YOU_SEND")}</span>
              <span className="text-muted-foreground">
                {swapState.amount} USDC
              </span>
            </div>
            {activeQuote && (
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_RECEIVE")}</span>
                <span className="text-muted-foreground">
                  ~{formatUnits(BigInt(activeQuote.outputAmount ?? "0"), 6)}{" "}
                  USDC
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const outputAmount =
    rangoQuote?.route &&
    swapState.amount &&
    Number(swapState.amount) > 0 &&
    !isQuoteLoading &&
    !isQuoteError
      ? formatUnits(BigInt(rangoQuote.route.outputAmount ?? "0"), 6)
      : null;

  const hasAmount = !!swapState.amount && Number(swapState.amount) > 0;

  return (
    <div className="flex flex-col gap-2">
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-1 flex-col items-start gap-1">
            <p className="px-2 font-medium text-sm">{t("YOU_SEND")}</p>
            <Input
              type="number"
              className="h-10 w-full border-none bg-transparent pl-2 font-bold text-2xl text-primary shadow-none placeholder:text-primary/50"
              placeholder="0.00"
              min={0}
              value={swapState.amount}
              onChange={(e) =>
                setSwapState((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
          </div>
          <div className="relative flex w-24 items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <div className="relative flex shrink-0 items-center">
              <ASSETS.ICONS.Usdc className="size-5" />
              {isBaseSource ? (
                <ASSETS.ICONS.NetworkBase className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
              ) : (
                <ASSETS.ICONS.NetworkSolana className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
              )}
            </div>
            <p className="font-medium text-muted-foreground text-sm">USDC</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center py-1">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-primary bg-primary p-2"
          onClick={toggleDirection}>
          <ArrowUpDown className="size-5 text-primary-foreground" />
        </Button>
      </div>

      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-1 flex-col items-start gap-1">
            <p className="px-2 font-medium text-sm">{t("YOU_RECEIVE")}</p>
            {hasAmount && isQuoteLoading && (
              <Skeleton className="ml-2 h-10 w-32" />
            )}
            {hasAmount && isQuoteError && (
              <p className="h-10 pl-2 text-destructive text-xs">
                {quoteError?.message ?? t("FAILED_TO_GET_QUOTE")}
              </p>
            )}
            {outputAmount && (
              <p className="h-10 border-none pl-2 font-bold text-2xl text-primary shadow-none">
                {outputAmount}
              </p>
            )}
            {!hasAmount && (
              <p className="h-10 border-none pl-2 font-bold text-2xl text-primary shadow-none">
                0.00
              </p>
            )}
          </div>
          <div className="relative flex w-24 items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <div className="relative flex shrink-0 items-center">
              <ASSETS.ICONS.Usdc className="size-5" />
              {isBaseSource ? (
                <ASSETS.ICONS.NetworkSolana className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
              ) : (
                <ASSETS.ICONS.NetworkBase className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
              )}
            </div>
            <p className="font-medium text-muted-foreground text-sm">USDC</p>
          </div>
        </CardContent>
      </Card>

      <Button
        className="mt-2 w-full p-6"
        disabled={
          !hasAmount ||
          !rangoQuote ||
          isQuoteLoading ||
          isQuoteError ||
          rangoSwap.isPending
        }
        onClick={handleSwap}>
        {rangoSwap.isPending || isQuoteLoading ? t("PROCESSING") : t("SWAP")}
      </Button>
    </div>
  );
}
