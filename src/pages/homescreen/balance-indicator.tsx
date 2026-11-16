import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronDown,
  EqualApproximately,
  Eye,
  EyeOff,
  RotateCw,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CountryFlag } from "@/components/country-flag";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { useAnalytics, useBalances, useBalanceVisibility } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { formatFiatAmount, truncateAmount } from "@/lib/utils";
import { CurrencyDrawer } from "../settings/currency-drawer";

const MASKED_BALANCE = "••••••";

export function BalanceIndicator() {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const { balances, isBalancesLoading, isBalancesError } = useBalances();
  const { isHidden, toggle } = useBalanceVisibility();
  const VisibilityIcon = isHidden ? EyeOff : Eye;
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  useEffect(() => {
    if (isBalancesError) {
      track(EVENTS.FEATURE, {
        status: "load_error_shown",
        location: "homescreen",
        section: "balance",
      });
    }
  }, [isBalancesError, track]);

  // Raw SDK/RPC errors are never shown; a short message + Retry instead.
  const handleRetry = () => {
    queryClient.refetchQueries({ queryKey: ["balances"] });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isHidden}
        aria-label={t(isHidden ? "SHOW_BALANCE" : "HIDE_BALANCE")}
        className="flex items-center gap-1.5 text-md text-muted-foreground transition-transform active:scale-95">
        <span>{t("AVAILABLE_BALANCE")}</span>
        <VisibilityIcon className="size-4" />
      </button>
      <div className="flex h-12 w-full items-center justify-center">
        {isBalancesLoading && <Skeleton className="w-full" />}
        {isBalancesError && !balances && (
          <div role="alert" className="flex items-center gap-2 text-sm">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <span className="text-destructive">
              {t("ONB_BALANCE_LOAD_ERROR")}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-9 px-3"
              onClick={handleRetry}>
              <RotateCw className="size-3.5" />
              {t("RETRY")}
            </Button>
          </div>
        )}
        {balances && (
          <button
            type="button"
            onClick={toggle}
            aria-pressed={isHidden}
            aria-label={t(isHidden ? "SHOW_BALANCE" : "HIDE_BALANCE")}
            className="font-bold text-4xl transition-transform active:scale-95">
            {isHidden
              ? MASKED_BALANCE
              : new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(truncateAmount(balances.usdc))}
          </button>
        )}
      </div>
      <CurrencyDrawer>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-muted-foreground transition-colors hover:bg-muted active:scale-95"
          aria-label={t("SELECT_CURRENCY")}>
          <EqualApproximately className="size-3" />
          {isBalancesLoading && (
            <span className="h-4 w-20 animate-pulse rounded-md bg-accent" />
          )}
          {isBalancesError && !balances && (
            <span className="text-muted-foreground">--</span>
          )}
          {balances && (
            <span className="text-md">
              {isHidden
                ? MASKED_BALANCE
                : formatFiatAmount(balances.fiat, currency.currency)}
            </span>
          )}
          <CountryFlag flag={currency.flag} flagUrl={currency.flagUrl} />
          <ChevronDown className="size-4" />
        </button>
      </CurrencyDrawer>
    </div>
  );
}
