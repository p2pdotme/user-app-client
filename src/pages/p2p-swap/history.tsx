import { Copy, ExternalLink, PlayCircle } from "lucide-react";
import moment from "moment";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { NonHomeHeader } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WormholeSteps } from "@/components/p2p-swap/swap-progress";
import { P2P_TOKEN_DECIMALS } from "@/core/jupiter";
import { useWormholeBridge, useBaseToSolanaBridge } from "@/hooks/use-wormhole-bridge";
import { type P2PSwapHistoryEntry, updateHistoryEntry, useP2PSwapHistory } from "@/hooks";


// ── Wormhole resume sections ───────────────────────────────────────────────────

/**
 * USDC→P2P: Wormhole runs Solana→Base after Jupiter.
 * Lock tx = Solana tx. Resume via useWormholeBridge (resumeSolanaToEvm).
 */
function SolanaToBaseResume({ entry, onComplete }: { entry: P2PSwapHistoryEntry; onComplete: () => void }) {
  const { state, resume } = useWormholeBridge();

  useEffect(() => {
    if (state.step === "completed" && state.evmTxHash) {
      updateHistoryEntry(entry.id, { wormholeRedeemTxHash: state.evmTxHash, currentStep: "completed" });
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  if (state.step === "idle") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 self-start"
        onClick={() => resume(entry.wormholeLockTxHash!)}
      >
        <PlayCircle className="size-3.5" />
        Resume Bridge
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <WormholeSteps state={state} indexOffset={0} direction="solana-to-base" />
      {state.step === "failed" && state.error && (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-destructive text-xs">{state.error}</p>
      )}
    </div>
  );
}

/**
 * P2P→USDC: Wormhole runs Base→Solana first.
 * Lock tx = Base EVM tx. Resume via useBaseToSolanaBridge (resumeEvmToSolana).
 */
function BaseToSolanaResume({ entry, onComplete }: { entry: P2PSwapHistoryEntry; onComplete: () => void }) {
  const { state, resume } = useBaseToSolanaBridge();

  useEffect(() => {
    if (state.step === "completed") {
      const redeemTx = state.solanaTxIds[state.solanaTxIds.length - 1] ?? null;
      if (redeemTx) {
        updateHistoryEntry(entry.id, { wormholeRedeemTxHash: redeemTx, currentStep: "wormhole_redeeming" });
      }
      onComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  if (state.step === "idle") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 self-start"
        onClick={() => resume(entry.wormholeLockTxHash!)}
      >
        <PlayCircle className="size-3.5" />
        Resume Bridge
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <WormholeSteps state={state} indexOffset={0} direction="base-to-solana" />
      {state.step === "failed" && state.error && (
        <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-destructive text-xs">{state.error}</p>
      )}
    </div>
  );
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

function StatusBadge({ step }: { step: P2PSwapHistoryEntry["currentStep"] }) {
  if (step === "completed") {
    return <Badge className="bg-success/10 text-success hover:bg-success/10">Completed</Badge>;
  }
  if (step === "failed") {
    return <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/10">Failed</Badge>;
  }
  return (
    <Badge variant="secondary" className="capitalize">
      {step.replace(/_/g, " ")}
    </Badge>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success(t("COPIED_TO_CLIPBOARD"));
      }}>
      <span className="max-w-[140px] truncate font-mono text-xs">{label}</span>
      <Copy className="size-3 shrink-0" />
    </button>
  );
}

// ── HistoryCard ───────────────────────────────────────────────────────────────

function HistoryCard({ entry, onBridgeComplete }: { entry: P2PSwapHistoryEntry; onBridgeComplete: () => void }) {
  const canResumeWormhole = !!entry.wormholeLockTxHash && !entry.wormholeRedeemTxHash;

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">
              {entry.inputAmount} {entry.direction === "USDC_TO_P2P" ? "USDC" : "P2P"}
              {entry.jupiterOutputAmount && entry.direction === "USDC_TO_P2P" && (
                <span className="font-normal text-muted-foreground">
                  {" "}→{" "}
                  {formatUnits(BigInt(entry.jupiterOutputAmount), P2P_TOKEN_DECIMALS)} P2P
                </span>
              )}
              {entry.rangoOutputAmount && entry.direction === "P2P_TO_USDC" && (
                <span className="font-normal text-muted-foreground">
                  {" "}→{" "}
                  {formatUnits(BigInt(entry.rangoOutputAmount), 6)} USDC
                </span>
              )}
            </span>
            <span className="text-muted-foreground text-xs">
              {moment(entry.timestamp).format("MMM D, YYYY · h:mm A")}
            </span>
          </div>
          <StatusBadge step={entry.currentStep} />
        </div>

        {/* Error */}
        {entry.error && entry.currentStep === "failed" && (
          <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-destructive text-xs">
            {entry.error}
          </p>
        )}

        {/* TX IDs */}
        <div className="flex flex-col gap-1.5">
          {entry.rangoRequestId && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">Rango ID</span>
              <div className="flex items-center gap-2">
                <CopyButton value={entry.rangoRequestId} label={entry.rangoRequestId} />
                <a href={`https://explorer.rango.exchange/swap/${entry.rangoRequestId}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          )}

          {entry.jupiterSignature && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">Jupiter Tx</span>
              <div className="flex items-center gap-2">
                <CopyButton value={entry.jupiterSignature} label={entry.jupiterSignature} />
                <a href={`https://solscan.io/tx/${entry.jupiterSignature}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          )}

          {entry.wormholeLockTxHash && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">Wormhole Lock</span>
              <div className="flex items-center gap-2">
                <CopyButton value={entry.wormholeLockTxHash} label={entry.wormholeLockTxHash} />
                <a href={`https://wormholescan.io/#/tx/${entry.wormholeLockTxHash}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          )}

          {entry.wormholeRedeemTxHash && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">Wormhole Redeem</span>
              <div className="flex items-center gap-2">
                <CopyButton value={entry.wormholeRedeemTxHash} label={entry.wormholeRedeemTxHash} />
                <a href={`https://wormholescan.io/#/tx/${entry.wormholeRedeemTxHash}`} target="_blank" rel="noopener noreferrer" className="text-primary">
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Wormhole resume section */}
        {canResumeWormhole && (
          entry.direction === "USDC_TO_P2P"
            ? <SolanaToBaseResume entry={entry} onComplete={onBridgeComplete} />
            : <BaseToSolanaResume entry={entry} onComplete={onBridgeComplete} />
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function P2PSwapHistory() {
  const { history, refreshHistory } = useP2PSwapHistory();

  return (
    <>
      <NonHomeHeader title="P2P Swap History" showHelp={false} />

      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-3 overflow-y-auto py-6">

        {history.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium text-muted-foreground">No swap history yet</p>
            <p className="text-muted-foreground text-sm">
              Your P2P swap attempts will appear here in real-time
            </p>
          </div>
        ) : (
          history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} onBridgeComplete={refreshHistory} />
          ))
        )}
      </main>
    </>
  );
}
