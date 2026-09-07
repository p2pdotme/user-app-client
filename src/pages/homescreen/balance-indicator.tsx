import { ChevronDown, EqualApproximately } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CountryFlag } from "@/components/country-flag";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { useBalances } from "@/hooks";
import { formatFiatAmount, truncateAmount } from "@/lib/utils";
import { CurrencyDrawer } from "../settings/currency-drawer";

export function BalanceIndicator() {
  const { t } = useTranslation();
  const {
    settings: { currency },
  } = useSettings();
  const { balances, isBalancesLoading, isBalancesError, balancesError } =
    useBalances();

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <p className="text-md text-muted-foreground">{t("AVAILABLE_BALANCE")}</p>
      <div className="flex h-12 w-full items-center justify-center">
        {isBalancesLoading && <Skeleton className="w-full" />}
        {isBalancesError && (
          <p className="text-destructive">{balancesError?.message}</p>
        )}
        {balances && (
          <p className="font-bold text-4xl">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(truncateAmount(balances.usdc))}
          </p>
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
              {formatFiatAmount(balances.fiat, currency.currency)}
            </span>
          )}
          <CountryFlag flag={currency.flag} flagUrl={currency.flagUrl} />
          <ChevronDown className="size-4" />
        </button>
      </CurrencyDrawer>
    </div>
  );
}
