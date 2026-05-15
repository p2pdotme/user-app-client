import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, Loader2 } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { sendAndConfirmTransaction } from "thirdweb";
import { base } from "thirdweb/chains";
import { parseUnits } from "viem";
import { estimatedPrepareTransaction, thirdwebClient } from "@/core/adapters/thirdweb/client";
import { P2P_BRIDGE_FROM_DECIMALS, quoteP2pBridge, swapP2pBridge } from "@/core/rango";
import { rango } from "@/core/rango/sdkWrappers";
import { RangoTxStatus, RangoTxType } from "@/core/rango/types";
import { useSafeDynamicContext } from "@/contexts";
import { useRangoFetch, useSounds, useThirdweb, useUSDCBalance } from "@/hooks";
import { captureError } from "@/lib/sentry";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { Skeleton } from "./ui/skeleton";

// ---------------------------------------------------------------------------
// Balance card
// ---------------------------------------------------------------------------

function BalanceCard({
  label,
  balance,
  symbol,
  logo,
  isLoading,
}: {
  label: string;
  balance: string | number | undefined;
  symbol: string;
  logo?: string;
  isLoading: boolean;
}) {
  return (
    <Card className="flex-1 border-none bg-muted/40 shadow-none">
      <CardContent className="flex flex-col gap-1 pt-4">
        <span className="text-muted-foreground text-xs">{label}</span>
        {isLoading ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <div className="flex items-center gap-1.5">
            {logo && (
              <img src={logo} alt={symbol} className="size-4 rounded-full" />
            )}
            <span className="font-semibold text-base">
              {balance !== undefined ? Number(balance).toFixed(4) : "—"}
            </span>
            <span className="text-muted-foreground text-sm">{symbol}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Quote row
// ---------------------------------------------------------------------------

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BridgeStatus = "idle" | "approval" | "swapping" | "completed" | "failed";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function P2pBridge() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const { primaryWallet } = useSafeDynamicContext();
  const sounds = useSounds();

  const [amount, setAmount] = useState("");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>("idle");

  const deferredAmount = useDeferredValue(amount);
  const rawAmount =
    deferredAmount && Number(deferredAmount) > 0
      ? parseUnits(deferredAmount, P2P_BRIDGE_FROM_DECIMALS).toString()
      : "0";

  // ── Balances ──────────────────────────────────────────────────────────────

  const { usdcBalance, isUsdcBalanceLoading } = useUSDCBalance();

  // SOL balance from the connected Solana wallet via Rango
  const { rangoBalance: solanaTokens, isRangoBalanceLoading: isSolLoading } =
    useRangoFetch("SOLANA");
  const solBalance = solanaTokens?.find((t) => t.symbol === "SOL");

  // ── Quote ─────────────────────────────────────────────────────────────────

  const {
    data: quote,
    isLoading: isQuoteLoading,
    isError: isQuoteError,
  } = useQuery({
    queryKey: ["p2p-bridge", "quote", deferredAmount],
    queryFn: () =>
      quoteP2pBridge(rawAmount).match(
        (v) => v,
        (e) => { throw e; },
      ),
    enabled: Number(deferredAmount) > 0,
    staleTime: 30_000,
    gcTime: 60_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });

  const outputAmount = quote?.route?.outputAmount
    ? (Number(quote.route.outputAmount) / 1e6).toFixed(4)
    : null;
  const feeUSD = quote?.route?.feeUSD
    ? `$${Number(quote.route.feeUSD).toFixed(2)}`
    : null;
  const estimatedTime = quote?.route?.estimatedTimeInSeconds
    ? `~${Math.ceil(quote.route.estimatedTimeInSeconds / 60)} min`
    : null;
  const routeName = quote?.route?.swapper?.title ?? null;

  // ── Swap mutation ─────────────────────────────────────────────────────────

  const swapMutation = useMutation({
    mutationFn: async () => {
      const fromAddress = account?.address;
      const toAddress = primaryWallet?.address;

      if (!fromAddress) throw new Error("EVM wallet not connected");
      if (!toAddress) throw new Error("Solana wallet not connected");

      const swapRes = await swapP2pBridge(rawAmount, fromAddress, toAddress).match(
        (v) => v,
        (e) => { throw e; },
      );

      if (swapRes.error) throw new Error(swapRes.error);
      if (!swapRes.tx || swapRes.tx.type !== RangoTxType.EVM)
        throw new Error("Unexpected transaction type from Rango");

      const tx = swapRes.tx;

      // Approval step if required
      if (tx.approveData && tx.approveTo) {
        setBridgeStatus("approval");

        const approveTx = await estimatedPrepareTransaction({
          from: fromAddress,
          to: tx.approveTo as `0x${string}`,
          chain: base,
          client: thirdwebClient,
          data: tx.approveData as `0x${string}`,
        });

        if (approveTx.isErr()) throw approveTx.error;

        const { transactionHash: approveHash } = await sendAndConfirmTransaction({
          account: account!,
          transaction: approveTx.value,
        });

        // Poll until approved
        while (true) {
          await new Promise((r) => setTimeout(r, 2000));
          const approvalStatus = await rango.isApproved(
            swapRes.requestId,
            approveHash,
          );
          if (approvalStatus.isApproved) break;
          if (approvalStatus.txStatus === RangoTxStatus.FAILED)
            throw new Error("Approval transaction failed on-chain");
        }
      }

      // Main bridge transaction
      setBridgeStatus("swapping");

      const mainTx = await estimatedPrepareTransaction({
        from: fromAddress,
        to: tx.txTo as `0x${string}`,
        chain: base,
        client: thirdwebClient,
        data: tx.txData as `0x${string}`,
      });

      if (mainTx.isErr()) throw mainTx.error;

      const { transactionHash: mainTxHash } = await sendAndConfirmTransaction({
        account: account!,
        transaction: mainTx.value,
      });

      // Poll for bridge completion
      while (true) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await rango.status({
          requestId: swapRes.requestId,
          txId: mainTxHash,
        });
        if (status.status === RangoTxStatus.SUCCESS) return;
        if (status.status === RangoTxStatus.FAILED)
          throw new Error("Bridge transaction failed on-chain");
      }
    },
    onSuccess: () => {
      setBridgeStatus("completed");
      sounds.triggerSuccessSound();
      toast.success("USDC bridged to Solana successfully");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Bridge failed";

      if (message.includes("User rejected")) {
        toast.error(t("TRANSACTION_REJECTED"), {
          description: t("TRANSACTION_REJECTED_DESCRIPTION"),
        });
        setBridgeStatus("idle");
        return;
      }

      setBridgeStatus("failed");
      sounds.triggerFailureSound();
      toast.error("Bridge failed", { description: message });

      captureError(error, {
        operation: "p2p_bridge_swap",
        component: "P2pBridge",
        userId: account?.address,
      });
    },
  });

  const isInProgress =
    bridgeStatus === "approval" || bridgeStatus === "swapping";

  const canBridge =
    !!account?.address &&
    !!primaryWallet?.address &&
    Number(amount) > 0 &&
    !!quote &&
    !isQuoteLoading &&
    !isQuoteError &&
    !swapMutation.isPending;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "" || /^\d*\.?\d*$/.test(v)) setAmount(v);
  };

  const handleBridge = () => {
    setBridgeStatus("idle");
    swapMutation.mutate();
  };

  const handleReset = () => {
    setBridgeStatus("idle");
    setAmount("");
    swapMutation.reset();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Balances ── */}
      <div className="flex gap-3">
        <BalanceCard
          label="USDC · Base"
          balance={usdcBalance}
          symbol="USDC"
          logo="https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
          isLoading={isUsdcBalanceLoading}
        />
        <BalanceCard
          label="SOL · Solana"
          balance={solBalance?.balance}
          symbol="SOL"
          logo="https://assets.coingecko.com/coins/images/4128/small/solana.png"
          isLoading={isSolLoading}
        />
      </div>

      {/* ── Bridge form ── */}
      <Card className="border-none bg-muted/40 shadow-none">
        <CardContent className="flex flex-col gap-4 pt-4">
          {/* From */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              From · USDC on Base
            </span>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={isInProgress}
                className="pr-16 text-lg font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                USDC
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowDown className="size-4 text-muted-foreground" />
          </div>

          {/* To */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              To · USDC on Solana
            </span>
            <div
              className={cn(
                "flex items-center justify-between rounded-md border bg-background px-3 py-2 text-lg font-medium",
                !outputAmount && "text-muted-foreground",
              )}>
              <span>{outputAmount ?? "—"}</span>
              <span className="text-muted-foreground text-sm">USDC</span>
            </div>
          </div>

          {/* Quote details */}
          {isQuoteLoading && Number(deferredAmount) > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-3.5 animate-spin" />
              Fetching quote…
            </div>
          )}

          {quote && !isQuoteLoading && (
            <div className="flex flex-col gap-2">
              <Separator />
              {feeUSD && <QuoteRow label="Bridge fee" value={feeUSD} />}
              {estimatedTime && (
                <QuoteRow label="Estimated time" value={estimatedTime} />
              )}
              {routeName && <QuoteRow label="Route" value={routeName} />}
            </div>
          )}

          {/* In-progress status */}
          {bridgeStatus === "approval" && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              Approving USDC spend…
            </div>
          )}
          {bridgeStatus === "swapping" && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              Bridging — this may take a few minutes…
            </div>
          )}
          {bridgeStatus === "completed" && (
            <p className="text-center font-medium text-green-600 text-sm">
              Bridge complete — USDC arriving on Solana
            </p>
          )}
          {bridgeStatus === "failed" && (
            <p className="text-center text-destructive text-sm font-medium">
              Bridge failed. Please try again.
            </p>
          )}

          {/* Action button */}
          {bridgeStatus === "completed" || bridgeStatus === "failed" ? (
            <Button variant="outline" onClick={handleReset} className="w-full">
              {bridgeStatus === "completed" ? "Bridge again" : "Try again"}
            </Button>
          ) : (
            <Button
              className="w-full"
              disabled={!canBridge || isInProgress}
              onClick={handleBridge}>
              {isInProgress ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {bridgeStatus === "approval" ? "Approving…" : "Bridging…"}
                </span>
              ) : (
                "Bridge USDC → Solana"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
