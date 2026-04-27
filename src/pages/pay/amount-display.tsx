import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { useUSDCBalance } from "@/hooks";
import { truncateAmount } from "@/lib/utils";

interface AmountDisplayProps {
  amount: {
    crypto: string;
    fiat: string;
  };
  denomination: "crypto" | "fiat";
  toggleCurrency: () => void;
  isPriceLoading: boolean;
  isPriceError: boolean;
}

export function AmountDisplay({
  amount,
  denomination,
  toggleCurrency,
  isPriceLoading,
  isPriceError,
}: AmountDisplayProps) {
  const {
    settings: { currency },
  } = useSettings();
  const { t } = useTranslation();
  const { usdcBalance, isUsdcBalanceLoading, isUsdcBalanceError } =
    useUSDCBalance();

  const displayAmount = amount[denomination] || "";
  const currencySymbol = denomination === "crypto" ? "USDC" : currency.currency;
  const secondaryCurrencySymbol =
    denomination === "crypto" ? currency.currency : "USDC";

  const secondaryAmount = amount[denomination === "crypto" ? "fiat" : "crypto"];
  const hasValue = displayAmount && displayAmount !== "0";

  const renderSecondaryAmount = () => {
    if (isPriceLoading) {
      return <Skeleton className="h-6 w-24" />;
    }
    if (isPriceError) {
      return (
        <span className="text-destructive text-sm">
          {t("ERROR_FETCHING_PRICE")}
        </span>
      );
    }
    return (
      <p className="font-medium text-md text-muted-foreground">
        {secondaryAmount || ""} {secondaryCurrencySymbol}
      </p>
    );
  };

  const renderBalance = () => {
    if (isUsdcBalanceLoading) {
      return <Skeleton className="h-4 w-32" />;
    }
    if (isUsdcBalanceError) {
      return <p className="text-destructive text-sm">Error fetching balance</p>;
    }
    return (
      <p className="text-muted-foreground text-sm">
        {t("AVAILABLE_BALANCE")}:{" "}
        <span className="text-primary">
          {truncateAmount(usdcBalance ?? 0)} USDC
        </span>
      </p>
    );
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-center font-bold text-5xl text-primary">
        {hasValue ? (
          <span>{displayAmount}</span>
        ) : (
          <span className="text-primary/50">0</span>
        )}
        <span className="font-medium text-muted-foreground text-sm">
          {" "}
          {currencySymbol}
        </span>
      </p>
      <Button
        type="button"
        variant="ghost"
        className="flex cursor-pointer items-center gap-2"
        onClick={toggleCurrency}
        aria-label={t("ARIA_SWITCH_CURRENCY")}>
        <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
          <ArrowUpDown className="size-4 text-primary" />
        </div>
        {renderSecondaryAmount()}
      </Button>
      <div className="flex min-h-6 items-center justify-center">
        {renderBalance()}
      </div>
    </div>
  );
}
