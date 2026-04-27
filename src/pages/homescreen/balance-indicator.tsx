import { EqualApproximately } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { useBalances } from "@/hooks";
import { formatFiatAmount, truncateAmount } from "@/lib/utils";

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
      <div className="flex items-center gap-1 text-muted-foreground">
        <EqualApproximately className="size-3" />
        {isBalancesLoading && <Skeleton className="h-4" />}
        {isBalancesError && (
          <p className="text-destructive">{balancesError?.message}</p>
        )}
        {balances && (
          <p className="text-md">
            {formatFiatAmount(balances.fiat, currency.currency)}
          </p>
        )}
      </div>
    </div>
  );
}
