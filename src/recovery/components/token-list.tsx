import {
  AlertTriangle,
  Inbox,
  Loader2,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { TokenIcon } from "@/components/token-icon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  RECOVERY_NETWORKS,
  type RecoveryNetworkKey,
  type RecoveryToken,
} from "@/recovery/core";
import { formatBalanceForDisplay } from "@/recovery/lib/format";

const SKELETON_ROWS = ["native", "usdc"] as const;

interface TokenListProps {
  network: RecoveryNetworkKey;
  tokens: RecoveryToken[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefreshing: boolean;
  /** Address of the token chosen for the transfer, if any. */
  selectedAddress: string | undefined;
  disabled: boolean;
  onSelect: (token: RecoveryToken) => void;
  onRefresh: () => void;
}

/** Balances of the smart account on the network; tap one to send it. */
export function TokenList({
  network,
  tokens,
  isLoading,
  isError,
  isRefreshing,
  selectedAddress,
  disabled,
  onSelect,
  onRefresh,
}: TokenListProps) {
  const { t } = useTranslation();
  const { label } = RECOVERY_NETWORKS[network];
  const hasAnyBalance = tokens?.some((token) => token.balance > 0n) ?? false;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium text-lg">{t("RECOVERY_TOKENS_TITLE")}</h2>
        {tokens && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={onRefresh}
            disabled={isRefreshing || disabled}>
            <RefreshCw className={cn(isRefreshing && "animate-spin")} />
            {t("RECOVERY_REFRESH")}
          </Button>
        )}
      </div>

      {isLoading && (
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          {SKELETON_ROWS.map((row) => (
            <Skeleton key={row} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && !tokens && (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-card p-4 text-center">
          <AlertTriangle className="size-8 text-destructive" />
          <p className="text-muted-foreground text-sm">
            {t("RECOVERY_TOKENS_ERROR", { network: label })}
          </p>
          <Button variant="outline" onClick={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            {t("RETRY")}
          </Button>
        </div>
      )}

      {tokens && tokens.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tokens.map((token) => {
            const isSelected = token.address === selectedAddress;
            const isEmpty = token.balance === 0n;
            return (
              <li key={token.address}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  disabled={isEmpty || disabled}
                  onClick={() => onSelect(token)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-muted px-3 py-3 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed",
                    isSelected &&
                      "border-primary bg-primary/10 hover:bg-primary/10",
                    isEmpty && "opacity-60 hover:bg-muted",
                  )}>
                  <TokenIcon symbol={token.symbol} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold text-sm">
                      {token.symbol}
                    </span>
                    <span className="truncate text-muted-foreground text-xs">
                      {token.name}
                    </span>
                  </span>
                  <span className="max-w-[50%] break-all text-right font-semibold text-sm tabular-nums">
                    {formatBalanceForDisplay(token.formatted)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {tokens && !hasAnyBalance && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-4 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Inbox className="size-6 text-primary" />
          </div>
          <p className="font-medium text-sm">
            {t("RECOVERY_TOKENS_EMPTY_TITLE", { network: label })}
          </p>
          <p className="text-muted-foreground text-sm">
            {t("RECOVERY_TOKENS_EMPTY_DESCRIPTION")}
          </p>
        </div>
      )}
    </section>
  );
}
