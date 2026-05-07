import { ArrowDown, Loader2, RefreshCw } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSafeDynamicContext } from "@/contexts";
import { useThirdweb } from "@/hooks";
import { AmountInput } from "./amount-input";
import { BridgeStatus } from "./bridge-status";
import { PendingTransfers } from "./pending-transfers";
import { useWormholeBridge } from "./use-wormhole-bridge";
import { useSplP2pBalance } from "./use-spl-balance";
import { useGovBaseBalance } from "./use-gov-base-balance";

export function P2pSolBridge() {
  const { primaryWallet } = useSafeDynamicContext();
  const { account } = useThirdweb();

  const [amount, setAmount] = useState("");
  // EVM recipient defaults to the connected EVM wallet address
  const [recipientEvm, setRecipientEvm] = useState(account?.address ?? "");

  const deferredAmount = useDeferredValue(amount);

  const {
    step,
    error,
    pollElapsedMs,
    activeBridgeId,
    pendingBridges,
    startBridge,
    redeem,
    reset,
  } = useWormholeBridge();

  const { data: splBalance, isLoading: isBalanceLoading } = useSplP2pBalance(
    primaryWallet?.address,
  );

  const {
    data: govBaseBalance,
    isLoading: isGovBaseLoading,
    refetch: refetchGovBase,
  } = useGovBaseBalance(account?.address);

  const isInProgress =
    step === "sending" ||
    step === "wormhole_pending" ||
    step === "redeeming";

  const amountNum = Number(deferredAmount);
  const rawBalance = splBalance?.raw ?? 0n;
  const rawAmount =
    deferredAmount && amountNum > 0
      ? BigInt(Math.floor(amountNum * 1_000_000))
      : 0n;

  const preflightError = (() => {
    if (!primaryWallet?.address) return "Connect your Solana wallet above";
    if (!account?.address) return "Connect your EVM wallet";
    if (splBalance && !splBalance.exists) return "You don't hold SPL P2P — acquire it first on Solana devnet";
    if (deferredAmount && amountNum <= 0) return "Enter a valid amount";
    if (rawAmount > 0n && rawBalance > 0n && rawAmount > rawBalance)
      return "Amount exceeds SPL P2P balance";
    if (recipientEvm && !/^0x[0-9a-fA-F]{40}$/.test(recipientEvm))
      return "Invalid EVM recipient address";
    return null;
  })();

  const canBridge =
    !preflightError &&
    amountNum > 0 &&
    recipientEvm.length === 42 &&
    step === "idle";

  const handleBridge = () => {
    if (!canBridge) return;
    startBridge(amount, recipientEvm);
  };

  const handleRedeem = () => {
    if (activeBridgeId) redeem(activeBridgeId);
  };

  const handleReset = () => {
    reset();
    setAmount("");
    refetchGovBase();
  };

  // Keep recipient in sync with EVM wallet if user hasn't manually changed it
  const evmAddress = account?.address ?? "";

  return (
    <div className="flex flex-col gap-4">
      {/* Balance cards */}
      <div className="flex gap-3">
        {/* SPL P2P balance */}
        <div className="flex flex-1 flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2.5">
          <span className="text-muted-foreground text-xs">SPL P2P · Solana</span>
          {isBalanceLoading ? (
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <span className="font-semibold text-sm">
              {splBalance?.exists ? Number(splBalance.ui).toFixed(4) : "0.0000"}
            </span>
          )}
        </div>

        {/* P2PGovBase balance */}
        <div className="flex flex-1 flex-col gap-0.5 rounded-lg bg-muted/40 px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">P2PGovBase · Base</span>
            <button
              type="button"
              onClick={() => refetchGovBase()}
              className="text-muted-foreground hover:text-foreground">
              <RefreshCw className="size-3" />
            </button>
          </div>
          {isGovBaseLoading ? (
            <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <span className="font-semibold text-sm">
              {govBaseBalance ? Number(govBaseBalance).toFixed(4) : "—"}
            </span>
          )}
        </div>
      </div>

      <Card className="border-none bg-muted/40 shadow-none">
        <CardContent className="flex flex-col gap-4 pt-4">
          {/* Amount input */}
          <AmountInput
            amount={amount}
            onChange={setAmount}
            balance={splBalance?.ui}
            balanceExists={splBalance?.exists ?? false}
            isBalanceLoading={isBalanceLoading}
            disabled={isInProgress}
          />

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowDown className="size-4 text-muted-foreground" />
          </div>

          {/* Output preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              To · P2PGovBase on Base Sepolia (1:1, 6 decimals)
            </span>
            <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-lg font-medium">
              <span className={!deferredAmount ? "text-muted-foreground" : ""}>
                {deferredAmount && amountNum > 0 ? amountNum.toFixed(6) : "—"}
              </span>
              <span className="text-muted-foreground text-sm">P2PGovBase</span>
            </div>
          </div>

          {/* EVM recipient address */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              EVM recipient (Base Sepolia)
            </span>
            <Input
              type="text"
              placeholder="0x..."
              value={recipientEvm || evmAddress}
              onChange={(e) => setRecipientEvm(e.target.value)}
              disabled={isInProgress}
              className="font-mono text-xs"
            />
          </div>

          <Separator />

          {/* Pre-flight error */}
          {preflightError && step === "idle" && (
            <p className="text-muted-foreground text-xs">{preflightError}</p>
          )}

          {/* Bridge status (sending / polling / ready / done / failed) */}
          <BridgeStatus
            step={step}
            error={error}
            activeBridgeId={activeBridgeId}
            pollElapsedMs={pollElapsedMs}
            onRedeem={handleRedeem}
            onReset={handleReset}
          />

          {/* Main action button — only shown when idle */}
          {step === "idle" && (
            <Button
              className="w-full"
              disabled={!canBridge || isBalanceLoading}
              onClick={handleBridge}>
              {isBalanceLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Loading balance…
                </span>
              ) : (
                "Bridge SPL P2P → Base Sepolia"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Resumable / recent transfers */}
      <PendingTransfers
        bridges={pendingBridges}
        activeBridgeId={activeBridgeId}
        onRedeem={redeem}
      />
    </div>
  );
}
