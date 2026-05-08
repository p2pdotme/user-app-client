import { isSolanaWallet } from "@dynamic-labs/solana";
import { useQuery } from "@tanstack/react-query";
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
import {
  JUPITER_SLIPPAGE_BPS,
  type JupiterSwapDirection,
  orderJupiterP2PToUsdc,
  orderJupiterUsdcToP2P,
  P2P_TOKEN_DECIMALS,
  SOLANA_USDC_DECIMALS,
} from "@/core/jupiter";
import { useJupiterSwap, useSounds } from "@/hooks";

type SwapStatus = "idle" | "swapping" | "completed" | "failed";

const SWAP_PROGRESS_STEPS = [
  { key: "swapping", activeTextKey: "SWAPPING", completedTextKey: "SWAPPED" },
] as const;

const TOKEN_CONFIG = {
  USDC_TO_P2P: {
    inputSymbol: "USDC",
    outputSymbol: "P2P",
    inputDecimals: SOLANA_USDC_DECIMALS,
    outputDecimals: P2P_TOKEN_DECIMALS,
    orderFn: orderJupiterUsdcToP2P,
  },
  P2P_TO_USDC: {
    inputSymbol: "P2P",
    outputSymbol: "USDC",
    inputDecimals: P2P_TOKEN_DECIMALS,
    outputDecimals: SOLANA_USDC_DECIMALS,
    orderFn: orderJupiterP2PToUsdc,
  },
} as const;

export function SolanaUsdcToP2P() {
  const { t } = useTranslation();
  const { primaryWallet } = useSafeDynamicContext();
  const sounds = useSounds();

  const [direction, setDirection] = useState<JupiterSwapDirection>("USDC_TO_P2P");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [swapOutAmount, setSwapOutAmount] = useState<string | null>(null);

  const jupiterSwap = useJupiterSwap();
  const config = TOKEN_CONFIG[direction];

  const isSolana = !!primaryWallet && isSolanaWallet(primaryWallet);
  const hasAmount = !!amount && Number(amount) > 0;
  const amountInUnits = hasAmount
    ? parseUnits(amount, config.inputDecimals).toString()
    : "0";

  const {
    data: preview,
    isLoading: isQuoteLoading,
    isError: isQuoteError,
    error: quoteError,
  } = useQuery({
    queryKey: ["jupiter", "order", direction, amountInUnits, primaryWallet?.address],
    queryFn: () =>
      config.orderFn(amountInUnits, primaryWallet!.address).match(
        (value) => value,
        (error) => { throw error; },
      ),
    enabled: hasAmount && isSolana,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: false,
  });

  const outputAmount =
    preview && !isQuoteLoading && !isQuoteError
      ? formatUnits(BigInt(preview.outAmount), config.outputDecimals)
      : null;

  const priceImpact =
    preview?.priceImpactPct != null
      ? Number(preview.priceImpactPct).toFixed(4)
      : null;

  const reset = () => {
    setAmount("");
    setStatus("idle");
    setTxSignature(null);
    setSwapOutAmount(null);
  };

  const toggleDirection = () => {
    setDirection((prev) =>
      prev === "USDC_TO_P2P" ? "P2P_TO_USDC" : "USDC_TO_P2P",
    );
    setAmount("");
    setSwapOutAmount(null);
  };

  const handleSwap = async () => {
    if (!hasAmount) {
      toast.error(t("PLEASE_ENTER_VALID_AMOUNT"));
      return;
    }
    if (!isSolana) {
      toast.error(t("CONNECT_YOUR_SOLANA_WALLET"));
      return;
    }

    setStatus("swapping");

    try {
      const result = await jupiterSwap.mutateAsync({ amount: amountInUnits, direction });
      setTxSignature(result.signature);
      setSwapOutAmount(result.outAmount);
      setStatus("completed");
      sounds.triggerSuccessSound();
    } catch (error) {
      setStatus("failed");
      sounds.triggerFailureSound();
      const err = error as Error;
      if (err.message?.includes("User rejected")) {
        toast.error(t("TRANSACTION_REJECTED"), {
          description: t("TRANSACTION_REJECTED_DESCRIPTION"),
        });
      } else {
        toast.error(t("SWAP_FAILED"), { description: err.message });
      }
    }
  };

  if (status === "completed") {
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
                {amount} {config.inputSymbol}
              </span>
            </div>
            {swapOutAmount && (
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_RECEIVED")}</span>
                <span className="text-muted-foreground">
                  {formatUnits(BigInt(swapOutAmount), config.outputDecimals)}{" "}
                  {config.outputSymbol}
                </span>
              </div>
            )}
          </div>
          {txSignature && (
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{t("TRANSACTION_SIGNATURE")}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-sm border-none p-1 shadow-none"
                  onClick={() => {
                    navigator.clipboard.writeText(txSignature);
                    toast.success(t("COPIED_TO_CLIPBOARD"));
                  }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <span className="truncate text-muted-foreground text-xs">
                {txSignature}
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

  if (status === "failed") {
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
                {amount} {config.inputSymbol}
              </span>
            </div>
          </div>
          <Button className="w-full" variant="outline" onClick={reset}>
            {t("DONE")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "swapping") {
    return (
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("SWAP_IN_PROGRESS")}</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderProgress
            steps={SWAP_PROGRESS_STEPS}
            currentStepKey={status}
            className="p-2"
          />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t("YOU_SEND")}</span>
              <span className="text-muted-foreground">
                {amount} {config.inputSymbol}
              </span>
            </div>
            {outputAmount && (
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("YOU_RECEIVE")}</span>
                <span className="text-muted-foreground">
                  ~{outputAmount} {config.outputSymbol}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* From */}
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-1 flex-col items-start gap-1">
            <p className="px-2 font-medium text-sm">{t("YOU_SEND")}</p>
            <Input
              type="number"
              className="h-10 w-full border-none bg-transparent pl-2 font-bold text-2xl text-primary shadow-none placeholder:text-primary/50"
              placeholder="0.00"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="relative flex w-24 items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            {direction === "USDC_TO_P2P" ? (
              <>
                <div className="relative flex shrink-0 items-center">
                  <ASSETS.ICONS.Usdc className="size-5" />
                  <ASSETS.ICONS.NetworkSolana className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
                </div>
                <p className="font-medium text-muted-foreground text-sm">USDC</p>
              </>
            ) : (
              <>
                <ASSETS.ICONS.NetworkSolana className="size-5" />
                <p className="font-medium text-muted-foreground text-sm">P2P</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Direction toggle */}
      <div className="flex items-center justify-center py-1">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full border-primary bg-primary p-2"
          onClick={toggleDirection}>
          <ArrowUpDown className="size-5 text-primary-foreground" />
        </Button>
      </div>

      {/* To */}
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex flex-1 flex-col items-start gap-1">
            <p className="px-2 font-medium text-sm">{t("YOU_RECEIVE")}</p>
            {hasAmount && isSolana && isQuoteLoading && (
              <Skeleton className="ml-2 h-10 w-32" />
            )}
            {hasAmount && isSolana && isQuoteError && (
              <p className="h-10 pl-2 text-destructive text-xs">
                {(quoteError as Error)?.message ?? t("FAILED_TO_GET_QUOTE")}
              </p>
            )}
            {outputAmount && (
              <p className="h-10 border-none pl-2 font-bold text-2xl text-primary shadow-none">
                {outputAmount}
              </p>
            )}
            {(!hasAmount || !isSolana) && (
              <p className="h-10 border-none pl-2 font-bold text-2xl text-primary shadow-none">
                0.00
              </p>
            )}
          </div>
          <div className="relative flex w-24 items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            {direction === "USDC_TO_P2P" ? (
              <>
                <ASSETS.ICONS.NetworkSolana className="size-5" />
                <p className="font-medium text-muted-foreground text-sm">P2P</p>
              </>
            ) : (
              <>
                <div className="relative flex shrink-0 items-center">
                  <ASSETS.ICONS.Usdc className="size-5" />
                  <ASSETS.ICONS.NetworkSolana className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
                </div>
                <p className="font-medium text-muted-foreground text-sm">USDC</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quote details */}
      {preview && !isQuoteLoading && !isQuoteError && (
        <div className="flex flex-col gap-1 px-2 text-muted-foreground text-xs">
          {priceImpact && (
            <div className="flex items-center justify-between">
              <span>{t("PRICE_IMPACT")}</span>
              <span className={Number(priceImpact) > 1 ? "text-warning" : "text-success"}>
                {priceImpact}%
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>{t("SLIPPAGE")}</span>
            <span>{JUPITER_SLIPPAGE_BPS / 100}%</span>
          </div>
          {preview.routePlan && preview.routePlan.length > 0 && (
            <div className="flex items-center justify-between">
              <span>{t("ROUTE")}</span>
              <span>
                {preview.routePlan.map((r) => r.swapInfo.label).join(" → ")}
              </span>
            </div>
          )}
        </div>
      )}

      <Button
        className="mt-2 w-full p-6"
        disabled={
          !hasAmount ||
          !isSolana ||
          !preview ||
          isQuoteLoading ||
          isQuoteError ||
          jupiterSwap.isPending
        }
        onClick={handleSwap}>
        {jupiterSwap.isPending || isQuoteLoading ? t("PROCESSING") : t("SWAP")}
      </Button>
    </div>
  );
}
