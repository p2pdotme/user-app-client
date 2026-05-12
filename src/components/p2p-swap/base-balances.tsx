import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useP2PBalance, useUSDCBalance } from "@/hooks";
import { cn } from "@/lib/utils";
import ASSETS from "@/assets";

export function BaseBalances() {
  const { usdcBalance, isUsdcBalanceLoading } = useUSDCBalance();
  const { p2pBalance, p2pBalanceRaw, isP2PBalanceLoading, isP2PBalanceFetching, refetchP2PBalance } = useP2PBalance();

  const isLoading = isUsdcBalanceLoading || isP2PBalanceLoading;

  return (
    <div className="flex items-center justify-between px-1 py-1">
      <div className="flex items-center gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </>
        ) : (
          <>
            {/* USDC */}
            <div className="flex items-center gap-1.5">
              <ASSETS.ICONS.Usdc className="size-3.5 shrink-0" />
              <span className={cn(
                "text-xs font-semibold tabular-nums",
                usdcBalance && usdcBalance > 0 ? "text-foreground" : "text-muted-foreground",
              )}>
                {usdcBalance?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? "—"}
              </span>
              <span className="text-[10px] text-muted-foreground">USDC</span>
            </div>

            <div className="h-3 w-px bg-border" />

            {/* P2P */}
            <div className="flex items-center gap-1.5">
              <ASSETS.ICONS.Logo className="size-3.5 shrink-0" />
              <span className={cn(
                "text-xs font-semibold tabular-nums",
                p2pBalanceRaw && p2pBalanceRaw > 0n ? "text-foreground" : "text-muted-foreground",
              )}>
                {p2pBalance?.toLocaleString(undefined, { maximumFractionDigits: 4 }) ?? "—"}
              </span>
              <span className="text-[10px] text-muted-foreground">P2P</span>
            </div>
          </>
        )}
      </div>

      {/* Chain label + refresh */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <ASSETS.ICONS.NetworkBase className="size-3 shrink-0" />
          <span className="text-[10px] text-muted-foreground">Base</span>
        </div>
        <button
          type="button"
          onClick={() => refetchP2PBalance()}
          disabled={isP2PBalanceFetching}
          className="cursor-pointer rounded p-0.5 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw className={cn("size-3", isP2PBalanceFetching && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}
