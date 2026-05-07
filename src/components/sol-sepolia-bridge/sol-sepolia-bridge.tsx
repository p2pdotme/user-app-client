import { ArrowDown, Loader2 } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useSafeDynamicContext } from "@/contexts";
import { BridgeStatus } from "./bridge-status";
import { PendingTransfers } from "./pending-transfers";
import { useOutboundBridge } from "./use-outbound-bridge";

function isValidSolanaAddress(addr: string): boolean {
  try {
    // Base58 check: 32-44 chars, no 0/O/I/l
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
  } catch {
    return false;
  }
}

export function SolSepoliaBridge() {
  const { primaryWallet } = useSafeDynamicContext();

  const [amount, setAmount] = useState("");
  // Default recipient to connected Solana wallet address
  const [recipientSolana, setRecipientSolana] = useState(
    primaryWallet?.address ?? "",
  );

  const deferredAmount = useDeferredValue(amount);

  const {
    step,
    error,
    statusMsg,
    pollElapsedMs,
    activeBridgeId,
    pendingBridges,
    startBridge,
    redeemOnSolana,
    reset,
  } = useOutboundBridge();

  const isInProgress =
    step === "approving" ||
    step === "bridging" ||
    step === "wormhole_pending" ||
    step === "posting_vaa" ||
    step === "redeeming";

  const amountNum = Number(deferredAmount);

  const preflightError = (() => {
    if (!primaryWallet?.address) return "Connect your Solana wallet above";
    if (deferredAmount && amountNum <= 0) return "Enter a valid amount";
    if (recipientSolana && !isValidSolanaAddress(recipientSolana))
      return "Invalid Solana recipient address";
    return null;
  })();

  const canBridge =
    !preflightError &&
    amountNum > 0 &&
    isValidSolanaAddress(recipientSolana) &&
    step === "idle";

  const handleBridge = () => {
    if (!canBridge) return;
    startBridge(amount, recipientSolana);
  };

  const handleRedeem = () => {
    if (activeBridgeId) redeemOnSolana(activeBridgeId);
  };

  const handleReset = () => {
    reset();
    setAmount("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Network labels */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <span className="rounded bg-muted px-2 py-0.5">Eth Sepolia</span>
        <ArrowDown className="size-3" />
        <span className="rounded bg-muted px-2 py-0.5">Solana devnet</span>
      </div>

      <Card className="border-none bg-muted/40 shadow-none">
        <CardContent className="flex flex-col gap-4 pt-4">
          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              From · P2PGovToken on Eth Sepolia
            </span>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.000000"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || /^\d*\.?\d*$/.test(v)) setAmount(v);
                }}
                disabled={isInProgress}
                className="pr-20 text-lg font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                P2PGov
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowDown className="size-4 text-muted-foreground" />
          </div>

          {/* Output preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              To · SPL P2P on Solana devnet (1:1, 6 decimals)
            </span>
            <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-lg font-medium">
              <span className={!deferredAmount ? "text-muted-foreground" : ""}>
                {deferredAmount && amountNum > 0 ? amountNum.toFixed(6) : "—"}
              </span>
              <span className="text-muted-foreground text-sm">SPL P2P</span>
            </div>
          </div>

          {/* Solana recipient */}
          <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground text-xs">
              Solana recipient (devnet)
            </span>
            <Input
              type="text"
              placeholder="Solana base58 address…"
              value={recipientSolana}
              onChange={(e) => setRecipientSolana(e.target.value)}
              disabled={isInProgress}
              className="font-mono text-xs"
            />
          </div>

          <Separator />

          {/* Pre-flight error */}
          {preflightError && step === "idle" && (
            <p className="text-muted-foreground text-xs">{preflightError}</p>
          )}

          {/* Info note about MetaMask */}
          {step === "idle" && !preflightError && (
            <p className="text-muted-foreground text-xs">
              Requires MetaMask on Eth Sepolia for approval + bridge tx.
              Solana wallet (Phantom) for the VAA redemption step.
            </p>
          )}

          {/* Status */}
          <BridgeStatus
            step={step}
            error={error}
            statusMsg={statusMsg}
            activeBridgeId={activeBridgeId}
            pollElapsedMs={pollElapsedMs}
            onRedeem={handleRedeem}
            onReset={handleReset}
          />

          {/* Action button */}
          {step === "idle" && (
            <Button
              className="w-full"
              disabled={!canBridge}
              onClick={handleBridge}>
              {isInProgress ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Bridging…
                </span>
              ) : (
                "Bridge P2PGovToken → SPL P2P"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <PendingTransfers
        bridges={pendingBridges}
        activeBridgeId={activeBridgeId}
        onRedeem={redeemOnSolana}
      />
    </div>
  );
}
