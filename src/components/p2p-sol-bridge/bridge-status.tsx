import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BridgeStep } from "./types";

type Props = {
  step: BridgeStep;
  error: string | null;
  activeBridgeId: string | null;
  pollElapsedMs: number;
  onRedeem: () => void;
  onReset: () => void;
};

function ElapsedTime({ ms }: { ms: number }) {
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const label = mins > 0 ? `${mins}m ${secs % 60}s` : `${secs}s`;
  return <span className="text-muted-foreground text-xs">{label} elapsed</span>;
}

export function BridgeStatus({
  step,
  error,
  activeBridgeId,
  pollElapsedMs,
  onRedeem,
  onReset,
}: Props) {
  if (step === "idle") return null;

  if (step === "sending") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <span>
          Locking SPL P2P on Solana — approve the transaction in your wallet…
        </span>
      </div>
    );
  }

  if (step === "wormhole_pending") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          <span>Waiting for Wormhole guardians to sign the VAA…</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <ElapsedTime ms={pollElapsedMs} />
          <span className="text-muted-foreground">~30s–5min on testnet</span>
        </div>
        {activeBridgeId && (
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://explorer.solana.com/tx/${activeBridgeId}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-primary text-xs hover:underline">
              Solana Explorer
              <ExternalLink className="size-3" />
            </a>
            <a
              href={`https://wormholescan.io/#/tx/${activeBridgeId}?network=Testnet`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-primary text-xs hover:underline">
              Wormholescan
              <ExternalLink className="size-3" />
            </a>
          </div>
        )}
      </div>
    );
  }

  if (step === "ready_to_redeem") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-green-600">
          VAA ready — complete your bridge on Eth Sepolia
        </p>
        <Button onClick={onRedeem} className="w-full">
          Complete on Eth Sepolia
        </Button>
      </div>
    );
  }

  if (step === "redeeming") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        <span>Minting P2PGovBase on Eth Sepolia…</span>
      </div>
    );
  }

  if (step === "completed") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <CheckCircle2 className="size-4 shrink-0" />
          Bridge complete — P2PGovBase minted to your wallet
        </div>
        <Button variant="outline" onClick={onReset} className="w-full">
          Bridge again
        </Button>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 text-destructive text-sm">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error ?? "Bridge failed. Please try again."}</span>
        </div>
        <Button variant="outline" onClick={onReset} className="w-full">
          Try again
        </Button>
      </div>
    );
  }

  return null;
}
