import { CheckCircle2, Clock, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WORMHOLE } from "./constants";
import type { PendingBridge } from "./types";

function formatAmount(raw: string): string {
  return (Number(raw) / 10 ** WORMHOLE.SPL_DECIMALS).toFixed(4);
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Props = {
  bridges: PendingBridge[];
  activeBridgeId: string | null;
  onRedeem: (id: string) => void;
};

export function PendingTransfers({ bridges, activeBridgeId, onRedeem }: Props) {
  // Show only in-flight and recent completed (last 24h)
  const visible = bridges.filter(
    (b) =>
      b.status !== "redeemed" ||
      Date.now() - b.createdAt < 24 * 60 * 60 * 1000,
  );

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs font-medium">
        Transfers
      </span>
      {visible.map((bridge) => (
        <Card key={bridge.id} className="border-none bg-muted/40 shadow-none">
          <CardContent className="flex flex-col gap-2 pt-3 pb-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">
                {formatAmount(bridge.amount)} P2P → P2PGovBase
              </span>
              <span className="text-muted-foreground text-xs">
                {timeAgo(bridge.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <StatusBadge bridge={bridge} isActive={activeBridgeId === bridge.id} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`https://explorer.solana.com/tx/${bridge.txSig}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary text-xs hover:underline">
                Solana tx
                <ExternalLink className="size-3" />
              </a>
              <a
                href={`https://wormholescan.io/#/tx/${bridge.txSig}?network=Testnet`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-primary text-xs hover:underline">
                Wormholescan
                <ExternalLink className="size-3" />
              </a>
              {bridge.redeemTxHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${bridge.redeemTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary text-xs hover:underline">
                  Base tx
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            {bridge.status === "ready_to_redeem" && activeBridgeId !== bridge.id && (
              <Button
                size="sm"
                className="w-full"
                onClick={() => onRedeem(bridge.id)}>
                Complete on Base Sepolia
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({
  bridge,
  isActive,
}: {
  bridge: PendingBridge;
  isActive: boolean;
}) {
  if (bridge.status === "redeemed") {
    return (
      <span className="flex items-center gap-1 text-green-600 text-xs">
        <CheckCircle2 className="size-3" />
        Completed
      </span>
    );
  }
  if (bridge.status === "ready_to_redeem") {
    return (
      <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
        <Clock className="size-3" />
        Ready to redeem
      </span>
    );
  }
  if (bridge.status === "wormhole_pending") {
    return (
      <span className="flex items-center gap-1 text-muted-foreground text-xs">
        {isActive ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <Clock className="size-3" />
        )}
        Waiting for guardians
      </span>
    );
  }
  if (bridge.status === "failed") {
    return (
      <span className="text-destructive text-xs">Failed</span>
    );
  }
  return null;
}
