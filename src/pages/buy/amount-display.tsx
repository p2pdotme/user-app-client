import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts";
import { useHapticInteractions } from "@/hooks";

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
  const { onCurrencyToggle } = useHapticInteractions();
  const { t } = useTranslation();

  const displayAmount = amount[denomination] || "";
  const currencySymbol = denomination === "crypto" ? "USDC" : currency.currency;
  const secondaryCurrencySymbol =
    denomination === "crypto" ? currency.currency : "USDC";

  const secondaryAmount = amount[denomination === "crypto" ? "fiat" : "crypto"];
  const hasValue = displayAmount && displayAmount !== "0";

  const handleToggleCurrency = () => {
    onCurrencyToggle(); // Haptic feedback for currency toggle
    toggleCurrency();
  };

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

  return (
    <div className="flex flex-col items-center gap-4">
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
        onClick={handleToggleCurrency}
        aria-label={t("ARIA_SWITCH_CURRENCY")}>
        <div className="flex size-6 items-center justify-center rounded-full bg-primary/20">
          <ArrowUpDown className="size-4 text-primary" />
        </div>
        {renderSecondaryAmount()}
      </Button>
    </div>
  );
}
