import { Copy, ExternalLink, Trash2 } from "lucide-react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { NonHomeHeader } from "@/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { P2P_TOKEN_DECIMALS } from "@/core/jupiter";
import { type P2PSwapHistoryEntry, useP2PSwapHistory } from "@/hooks";

function StatusBadge({ step }: { step: P2PSwapHistoryEntry["finalStep"] }) {
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

function HistoryCard({ entry }: { entry: P2PSwapHistoryEntry }) {
  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm">
              {entry.inputAmount} USDC
              {entry.jupiterOutputAmount && (
                <span className="font-normal text-muted-foreground">
                  {" "}→{" "}
                  {formatUnits(BigInt(entry.jupiterOutputAmount), P2P_TOKEN_DECIMALS)} P2P
                </span>
              )}
            </span>
            <span className="text-muted-foreground text-xs">
              {moment(entry.timestamp).format("MMM D, YYYY · h:mm A")}
            </span>
          </div>
          <StatusBadge step={entry.finalStep} />
        </div>

        {/* Error */}
        {entry.error && entry.finalStep === "failed" && (
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
                <CopyButton
                  value={entry.rangoRequestId}
                  label={entry.rangoRequestId}
                />
                <a
                  href={`https://explorer.rango.exchange/swap/${entry.rangoRequestId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary">
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          )}

          {entry.jupiterSignature && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">Solana Tx</span>
              <div className="flex items-center gap-2">
                <CopyButton
                  value={entry.jupiterSignature}
                  label={entry.jupiterSignature}
                />
                <a
                  href={`https://solscan.io/tx/${entry.jupiterSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary">
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function P2PSwapHistory() {
  const { history, clearHistory } = useP2PSwapHistory();

  return (
    <>
      <NonHomeHeader title="Swap History" showHelp={false} />

      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-3 overflow-y-auto py-6">
        {history.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive gap-1.5"
              onClick={clearHistory}>
              <Trash2 className="size-3.5" />
              Clear all
            </Button>
          </div>
        )}

        {history.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium text-muted-foreground">No swap history yet</p>
            <p className="text-muted-foreground text-sm">
              Your Base USDC → P2P swaps will appear here
            </p>
          </div>
        ) : (
          history.map((entry) => <HistoryCard key={entry.id} entry={entry} />)
        )}
      </main>
    </>
  );
}
