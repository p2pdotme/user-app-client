import { ChevronDown, EqualApproximately, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CountryFlag } from "@/components/country-flag";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { useBalances, useBalanceVisibility } from "@/hooks";
import { formatFiatAmount, truncateAmount } from "@/lib/utils";
import { CurrencyDrawer } from "../settings/currency-drawer";

const MASKED_BALANCE = "••••••";

export function BalanceIndicator() {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const { balances, isBalancesLoading, isBalancesError, balancesError } =
    useBalances();
  const { isHidden, toggle } = useBalanceVisibility();
  const VisibilityIcon = isHidden ? EyeOff : Eye;

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
        {isBalancesError && (
          <p className="text-destructive">{balancesError?.message}</p>
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
          {isBalancesError && (
            <span className="text-destructive">{balancesError?.message}</span>
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
