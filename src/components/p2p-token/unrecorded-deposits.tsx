import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ASSETS from "@/assets";
import { useThirdweb } from "@/hooks";
import { cn, formatTokenAmount, truncateAddress } from "@/lib/utils";
import {
  initiateUsdcToP2PSwap,
  initiateP2PToUsdcSwap,
  fetchUnrecordedDeposits,
  getBackendErrorKey,
} from "@/core/p2p-swap";
import type { UnrecordedTransfer } from "@/core/p2p-swap";

function FromIcon({ token }: { token: string }) {
  const Icon = token === "USDC" ? ASSETS.ICONS.Usdc : ASSETS.ICONS.Logo;
  return (
    <div className="relative flex shrink-0 items-center">
      <Icon className="size-4" />
      <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
    </div>
  );
}

function ToIcon({ token }: { token: string }) {
  const Icon = token === "USDC" ? ASSETS.ICONS.Logo : ASSETS.ICONS.Usdc;
  return (
    <div className="relative flex shrink-0 items-center">
      <Icon className="size-4" />
      <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
    </div>
  );
}

function CopyHash({ value }: { value: string }) {
  const { t } = useTranslation();
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      toast.success(t("ADDRESS_COPIED"));
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

function StatusBadge() {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        "bg-destructive/15 text-destructive",
      )}
    >
      {t("P2P_SWAP_STATUS_FAILED", { defaultValue: "Failed" })}
    </span>
  );
}

function UnrecordedDepositSkeleton() {
  return (
    <div className="rounded-2xl bg-primary/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-6 w-36" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );
}

function UnrecordedDepositCard({
  transfer,
  userAddress,
  onSuccess,
}: {
  transfer: UnrecordedTransfer;
  userAddress: string;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [isRetrying, setIsRetrying] = useState(false);

  const fromSymbol = transfer.token;
  const toSymbol = transfer.token === "USDC" ? "P2P" : "USDC";

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (transfer.token === "USDC") {
        await initiateUsdcToP2PSwap(transfer.txHash, userAddress);
      } else if (transfer.token === "P2P") {
        await initiateP2PToUsdcSwap(transfer.txHash, userAddress);
      } else {
        toast.error(t("SOMETHING_WENT_WRONG"));
        return;
      }
      toast.success(t("SWAP_INITIATED_SUCCESS"));
      onSuccess();
    } catch (error) {
      const raw = error instanceof Error ? error.message : "";
      const key = raw ? getBackendErrorKey(raw) : undefined;
      toast.error(key ? t(key) : raw || t("SOMETHING_WENT_WRONG"));
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="rounded-2xl bg-primary/5 p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <StatusBadge />
        {transfer.txHash && (
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-muted-foreground text-xs">
              {t("SWAP_USER_TX")}
            </span>
            <CopyHash value={transfer.txHash} />
          </div>
        )}
      </div>

      {/* Amount row */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <FromIcon token={transfer.token} />
            <span className="font-bold text-lg leading-none tabular-nums">
              {Number(formatTokenAmount(transfer.amountRaw ?? null, 6) ?? "0")?.toFixed(3)}
            </span>
            <span className="text-muted-foreground text-sm">{fromSymbol}</span>
          </div>
          <div className="pl-1 text-muted-foreground text-xs">↓</div>
          <div className="flex items-center gap-1.5">
            <ToIcon token={transfer.token} />
            <span className="font-bold text-lg leading-none text-muted-foreground">
              —
            </span>
            <span className="text-muted-foreground text-sm">{toSymbol}</span>
          </div>
        </div>
      </div>

      {/* Retry action */}
      <div className="mt-3 border-t border-border/50 pt-3">
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full rounded-xl"
        >
          {isRetrying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {t("RETRY")}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <RefreshCw className="size-4" />
              {t("RETRY")}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

export function UnrecordedDeposits() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const userAddress = account?.address;
  const queryClient = useQueryClient();

  const queryKey = ["p2p-swap", "unrecorded-deposits", userAddress];

  const { data: transfers, isLoading } = useQuery({
    queryKey,
    enabled: !!userAddress,
    refetchOnMount: "always",
    queryFn: () => fetchUnrecordedDeposits(userAddress!),
  });

  if (!userAddress) return null;
  if (!isLoading && (!transfers || transfers.length === 0)) return null;

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({
      queryKey: ["p2p-swap", "history", userAddress],
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {!isLoading && (
        <p className="px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {t("FAILED_SWAPS")}
        </p>
      )}
      {isLoading ? (
        <UnrecordedDepositSkeleton />
      ) : (
        transfers?.map((transfer) => (
          <UnrecordedDepositCard
            key={transfer.txHash}
            transfer={transfer}
            userAddress={userAddress}
            onSuccess={handleSuccess}
          />
        ))
      )}
    </div>
  );
}
