import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, Clock, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { NonHomeHeader } from "@/components";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDateTime, formatTokenAmount, truncateAddress } from "@/lib/utils";
import { useP2PSwapHistory } from "@/hooks";
import ASSETS from "@/assets";
import type {
  SwapRecord,
  JupiterStep,
  RangoStep,
  WormholeStep,
} from "@/core/p2p-swap";

function CopyHash({ value }: { value: string }) {
  const { t } = useTranslation();
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(t("DEV_TOASTS_COPIED_TO_CLIPBOARD"));
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>{truncateAddress(value, 8)}</span>
      <Copy className="size-3 shrink-0" />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    completed: "bg-green-500/15 text-green-600 dark:text-green-400",
    success: "bg-green-500/15 text-green-600 dark:text-green-400",
    redeemed: "bg-green-500/15 text-green-600 dark:text-green-400",
    failed: "bg-destructive/15 text-destructive",
    error: "bg-destructive/15 text-destructive",
    processing: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  };
  const color =
    colorMap[status.toLowerCase()] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        color,
      )}
    >
      {status}
    </span>
  );
}

function JupiterStepRow({ step }: { step: JupiterStep }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
        {t("SWAP_STEP_JUPITER")}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">{t("SWAP_STEP_INPUT")}</span>
        <span className="text-right font-medium">
          {formatTokenAmount(step.inputAmount)}
        </span>
        <span className="text-muted-foreground">{t("SWAP_STEP_OUTPUT")}</span>
        <span className="text-right font-medium">
          {formatTokenAmount(step.outputAmount)}
        </span>
        <span className="text-muted-foreground">{t("STATUS")}</span>
        <span className="flex justify-end">
          <StatusBadge status={step.status} />
        </span>
        {step.signature && (
          <>
            <span className="text-muted-foreground">
              {t("SWAP_STEP_SIGNATURE")}
            </span>
            <span className="flex justify-end">
              <CopyHash value={step.signature} />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function RangoStepRow({ step }: { step: RangoStep }) {
  const { t } = useTranslation();
  const route =
    step.fromChain && step.toChain ? `${step.fromChain} → ${step.toChain}` : "";
  const tokenRoute =
    step.fromToken && step.toToken
      ? `${step.fromToken} → ${step.toToken}`
      : "—";
  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
        Rango{route ? ` (${route})` : ""}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">{t("SWAP_STEP_ROUTE")}</span>
        <span className="text-right font-medium">{tokenRoute}</span>
        <span className="text-muted-foreground">{t("SWAP_STEP_INPUT")}</span>
        <span className="text-right font-medium">
          {formatTokenAmount(step.inputAmount)}
        </span>
        <span className="text-muted-foreground">{t("SWAP_STEP_OUTPUT")}</span>
        <span className="text-right font-medium">
          {formatTokenAmount(step.outputAmount)}
        </span>
        <span className="text-muted-foreground">{t("STATUS")}</span>
        <span className="flex justify-end">
          <StatusBadge status={step.finalStatus ?? step.status} />
        </span>
        {step.txHash && (
          <>
            <span className="text-muted-foreground">
              {t("SWAP_STEP_TX_HASH")}
            </span>
            <span className="flex justify-end">
              <CopyHash value={step.txHash} />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function WormholeStepRow({ step }: { step: WormholeStep }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1.5">
      <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
        {t("SWAP_STEP_WORMHOLE")}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-muted-foreground">
          {t("SWAP_STEP_DIRECTION")}
        </span>
        <span className="text-right font-medium capitalize">
          {step.direction?.replace(/_/g, " ") ?? "—"}
        </span>
        <span className="text-muted-foreground">{t("SWAP_STEP_AMOUNT")}</span>
        <span className="text-right font-medium">
          {formatTokenAmount(step.amount)}
        </span>
        <span className="text-muted-foreground">{t("STATUS")}</span>
        <span className="flex justify-end">
          <StatusBadge status={step.status} />
        </span>
        {step.initiateTxHash && (
          <>
            <span className="text-muted-foreground">
              {t("SWAP_STEP_INITIATE_TX")}
            </span>
            <span className="flex justify-end">
              <CopyHash value={step.initiateTxHash} />
            </span>
          </>
        )}
        {step.redeemTxHash && (
          <>
            <span className="text-muted-foreground">
              {t("SWAP_STEP_REDEEM_TX")}
            </span>
            <span className="flex justify-end">
              <CopyHash value={step.redeemTxHash} />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function SwapCard({ swap }: { swap: SwapRecord }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isUsdcToP2P = swap.swapType === "usdc_to_p2p";

  const fromSymbol = isUsdcToP2P ? "USDC" : "P2P";
  const toSymbol = isUsdcToP2P ? "P2P" : "USDC";

  const FromIcon = isUsdcToP2P
    ? () => (
        <div className="relative flex shrink-0 items-center">
          <ASSETS.ICONS.Usdc className="size-4" />
          <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
        </div>
      )
    : () => (
        <div className="relative flex shrink-0 items-center">
          <ASSETS.ICONS.Logo className="size-4" />
          <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
        </div>
      );

  const ToIcon = isUsdcToP2P
    ? () => (
        <div className="relative flex shrink-0 items-center">
          <ASSETS.ICONS.Logo className="size-4" />
          <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
        </div>
      )
    : () => (
        <div className="relative flex shrink-0 items-center">
          <ASSETS.ICONS.Usdc className="size-4" />
          <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
        </div>
      );

  const date = formatDateTime(swap.createdAt);

  const hasSteps =
    swap.steps.jupiter.length > 0 ||
    swap.steps.rango.length > 0 ||
    swap.steps.wormhole.length > 0;

  return (
    <div className="rounded-2xl bg-primary/5 p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">
            {t("SWAP_NUMBER", { id: swap.id })}
          </span>
          <StatusBadge status={swap.status} />
        </div>
        <span className="text-muted-foreground text-xs">{date}</span>
      </div>

      {/* Amount row */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <FromIcon />
            <span className="font-bold text-lg leading-none">
              {formatTokenAmount(swap.inputAmount)}
            </span>
            <span className="text-muted-foreground text-sm">{fromSymbol}</span>
          </div>
          <div className="pl-1 text-muted-foreground text-xs">↓</div>
          <div className="flex items-center gap-1.5">
            <ToIcon />
            <span className="font-bold text-lg leading-none">
              {formatTokenAmount(swap.outputAmount)}
            </span>
            <span className="text-muted-foreground text-sm">{toSymbol}</span>
          </div>
        </div>
        {swap.userTxnHash && (
          <div className="shrink-0 text-right">
            <p className="mb-0.5 text-muted-foreground text-xs">{t("SWAP_USER_TX")}</p>
            <CopyHash value={swap.userTxnHash} />
          </div>
        )}
      </div>

      {/* Estimated delivery */}
      {swap.estimatedCompletedAt &&
        swap.status !== "completed" &&
        swap.status !== "failed" && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Clock className="size-3.5 shrink-0" />
            <span>
              {t("SWAP_EST_DELIVERY")}:{" "}
              {formatDateTime(swap.estimatedCompletedAt)}
            </span>
          </div>
        )}

      {/* Steps toggle */}
      {hasSteps && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex w-full items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>{expanded ? t("SWAP_HIDE_STEPS") : t("SWAP_VIEW_STEPS")}</span>
          {expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      )}

      {/* Steps details */}
      {expanded && (
        <div className="mt-3 space-y-4">
          {isUsdcToP2P ? (
            <>
              {swap.steps.rango.map((step, i) => (
                <RangoStepRow key={step.id ?? `rango-${i}`} step={step} />
              ))}
              {swap.steps.jupiter.map((step, i) => (
                <JupiterStepRow key={step.id ?? `jupiter-${i}`} step={step} />
              ))}
              {swap.steps.wormhole.map((step, i) => (
                <WormholeStepRow key={step.id ?? `wormhole-${i}`} step={step} />
              ))}
            </>
          ) : (
            <>
              {swap.steps.wormhole.map((step, i) => (
                <WormholeStepRow key={step.id ?? `wormhole-${i}`} step={step} />
              ))}
              {swap.steps.jupiter.map((step, i) => (
                <JupiterStepRow key={step.id ?? `jupiter-${i}`} step={step} />
              ))}
              {swap.steps.rango.map((step, i) => (
                <RangoStepRow key={step.id ?? `rango-${i}`} step={step} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SwapCardSkeleton() {
  return (
    <div className="rounded-2xl bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-6 w-36" />
      </div>
    </div>
  );
}

export function P2PSwapHistory() {
  const { t } = useTranslation();
  const { swaps, isLoading, isError, refetch } = useP2PSwapHistory();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
    refetch();
  };

  return (
    <>
      <NonHomeHeader title={t("SWAP_HISTORY")} showHelp={false} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-3 overflow-y-auto py-6">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex cursor-pointer items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw
              className={cn(
                "size-4",
                (isLoading || spinning) && "animate-spin",
              )}
            />
          </button>
        </div>
        {isLoading && (
          <>
            <SwapCardSkeleton />
            <SwapCardSkeleton />
            <SwapCardSkeleton />
          </>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-muted-foreground text-sm">
              {t("ERROR_LOADING_DATA")}
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-primary text-sm underline"
            >
              {t("RETRY")}
            </button>
          </div>
        )}

        {!isLoading && !isError && swaps.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium text-foreground">{t("NO_SWAPS_YET")}</p>
            <p className="text-muted-foreground text-sm">
              {t("NO_SWAPS_YET_DESC")}
            </p>
          </div>
        )}

        {!isLoading &&
          swaps.map((swap) => <SwapCard key={swap.id} swap={swap} />)}
      </main>
    </>
  );
}
