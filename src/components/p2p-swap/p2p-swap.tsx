import { ArrowUpDown } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUSDCBalance } from "@/hooks";
import { cn } from "@/lib/utils";

type SwapDirection = "USDC_TO_P2P" | "P2P_TO_USDC";

const PCT_OPTIONS = [
  { labelKey: "25%", pct: 0.25 },
  { labelKey: "50%", pct: 0.5 },
  { labelKey: "75%", pct: 0.75 },
  { labelKey: "MAX", pct: 1 },
] as const;

function TokenBadge({
  symbol,
  icon,
}: {
  symbol: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
      {icon}
      <span className="font-semibold text-sm">{symbol}</span>
    </div>
  );
}

export function BaseUsdcToP2P() {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<SwapDirection>("USDC_TO_P2P");
  const [amount, setAmount] = useState("");
  const [selectedPct, setSelectedPct] = useState<number | null>(null);

  const isUsdcToP2P = direction === "USDC_TO_P2P";
  const hasAmount = !!amount && Number(amount) > 0;

  const { usdcBalance } = useUSDCBalance();

  // Placeholder — wire up real quote here
  const isQuoteLoading = false;
  const isQuoteError = false;
  const outputAmount: string | null = null;

  const balance: number | null = isUsdcToP2P ? (usdcBalance ?? null) : null;

  const handlePercent = (pct: number) => {
    if (balance === null) return;
    setSelectedPct(pct);
    setAmount((balance * pct).toString());
  };

  const toggleDirection = () => {
    setDirection((prev) =>
      prev === "USDC_TO_P2P" ? "P2P_TO_USDC" : "USDC_TO_P2P",
    );
    setAmount("");
    setSelectedPct(null);
  };

  const usdcIcon = (
    <div className="relative flex shrink-0 items-center">
      <ASSETS.ICONS.Usdc className="size-5" />
      <ASSETS.ICONS.NetworkBase className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
    </div>
  );

  const p2pIcon = (
    <div className="relative flex shrink-0 items-center">
      <ASSETS.ICONS.Logo className="size-5" />
      <ASSETS.ICONS.NetworkBase className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      {/* From panel */}
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
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
              onChange={(e) => {
                setAmount(e.target.value);
                setSelectedPct(null);
              }}
            />
            <TokenBadge
              symbol={isUsdcToP2P ? "USDC" : "P2P"}
              icon={isUsdcToP2P ? usdcIcon : p2pIcon}
            />
          </div>

          {/* Pct buttons */}
          <div className="mt-3 flex items-center justify-end gap-1.5">
            {PCT_OPTIONS.map(({ labelKey, pct }) => (
              <button
                key={labelKey}
                type="button"
                onClick={() => handlePercent(pct)}
                disabled={balance === null}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  "cursor-pointer disabled:cursor-not-allowed disabled:opacity-40",
                  selectedPct === pct
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground",
                )}>
                {labelKey === "MAX" ? t("MAX") : labelKey}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Toggle */}
      <div className="relative flex items-center justify-center">
        <Separator className="absolute w-full" />
        <Button
          variant="outline"
          size="icon"
          className="relative z-10 size-9 rounded-full border-border bg-background shadow-sm hover:bg-background"
          onClick={toggleDirection}
        >
          <motion.div
            key={direction}
            initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 180, scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ArrowUpDown className="size-4 text-foreground" />
          </motion.div>
        </Button>
      </div>

      {/* To panel */}
      <Card className="border-none bg-primary/10 shadow-none">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {t("YOU_RECEIVE")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              {hasAmount && isQuoteLoading && <Skeleton className="h-9 w-32" />}
              {hasAmount && isQuoteError && (
                <p className="font-bold text-2xl text-destructive">—</p>
              )}
              {outputAmount && (
                <p className="font-bold text-3xl text-foreground">
                  {outputAmount}
                </p>
              )}
              {(!hasAmount ||
                (!isQuoteLoading && !outputAmount && !isQuoteError)) && (
                <p className="font-bold text-3xl text-muted-foreground/40">
                  0.00
                </p>
              )}
            </div>
            <TokenBadge
              symbol={isUsdcToP2P ? "P2P" : "USDC"}
              icon={isUsdcToP2P ? p2pIcon : usdcIcon}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quote details */}
      {hasAmount && !isQuoteLoading && !isQuoteError && outputAmount && (
        <Card className="border-none bg-primary/10 shadow-none">
          <CardContent className="px-4 py-3">
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("PRICE_IMPACT")}
                </span>
                <span className="font-medium text-success">0.00%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("SLIPPAGE")}</span>
                <span className="font-medium">0.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("ROUTE")}</span>
                <span className="font-medium">Base</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="mt-1 w-full rounded-2xl py-6 text-base font-semibold"
        disabled={!hasAmount || isQuoteLoading || isQuoteError || !outputAmount}
      >
        {isQuoteLoading ? t("PROCESSING") : t("SWAP")}
      </Button>
    </div>
  );
}
