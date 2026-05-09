import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PCT_OPTIONS } from "./shared";

interface FromPanelProps {
  amount: string;
  onAmountChange: (value: string) => void;
  selectedPct: number | null;
  onPercent: (pct: number) => void;
  balance: number | null;
  disabled: boolean;
  showPctButtons: boolean;
  tokenBadge: React.ReactNode;
}

export function FromPanel({
  amount,
  onAmountChange,
  selectedPct,
  onPercent,
  balance,
  disabled,
  showPctButtons,
  tokenBadge,
}: FromPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t("YOU_SEND")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            className="h-auto flex-1 border-none bg-transparent p-0 font-bold text-3xl text-foreground shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0"
            placeholder="0.00"
            value={amount}
            disabled={disabled}
            onChange={(e) => onAmountChange(e.target.value)}
          />
          {tokenBadge}
        </div>

        {showPctButtons && (
          <div className="mt-3 flex items-center justify-end gap-1.5">
            {PCT_OPTIONS.map(({ labelKey, pct }) => (
              <button
                key={labelKey}
                type="button"
                onClick={() => onPercent(pct)}
                disabled={balance === null || disabled}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                  selectedPct === pct
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:bg-background",
                )}>
                {labelKey === "MAX" ? t("MAX") : labelKey}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
