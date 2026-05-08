import { ArrowUpDown } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useP2PSwap, useP2PSwapQuote, useUSDCBalance } from "@/hooks";
import { FromPanel } from "./from-panel";
import { QuoteDetails } from "./quote-details";
import { SwapProgress } from "./swap-progress";
import { SwapResult } from "./swap-result";
import { ToPanel } from "./to-panel";
import type { SwapDirection } from "./shared";

function TokenBadge({ symbol, icon }: { symbol: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
      {icon}
      <span className="font-semibold text-sm">{symbol}</span>
    </div>
  );
}

function UsdcBaseIcon() {
  return (
    <div className="relative flex shrink-0 items-center">
      <ASSETS.ICONS.Usdc className="size-5" />
      <ASSETS.ICONS.NetworkBase className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
    </div>
  );
}

function P2PSolanaIcon() {
  return (
    <div className="relative flex shrink-0 items-center">
      <ASSETS.ICONS.Logo className="size-5" />
      <ASSETS.ICONS.NetworkSolana className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
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
  const { state, execute, reset, isPending } = useP2PSwap();
  const quote = useP2PSwapQuote(isUsdcToP2P ? amount : "");

  const balance: number | null = isUsdcToP2P ? (usdcBalance ?? null) : null;
  const outputAmount = isUsdcToP2P ? quote.totalOutputAmount : null;
  const isQuoteLoading = isUsdcToP2P && quote.isLoading;
  const isQuoteError = isUsdcToP2P && quote.isError;

  const showQuoteDetails =
    isUsdcToP2P && hasAmount && !isQuoteLoading && !isQuoteError && !!outputAmount;

  const handlePercent = (pct: number) => {
    if (balance === null) return;
    setSelectedPct(pct);
    setAmount((balance * pct).toString());
  };

  const toggleDirection = () => {
    if (isPending) return;
    setDirection((prev) => (prev === "USDC_TO_P2P" ? "P2P_TO_USDC" : "USDC_TO_P2P"));
    setAmount("");
    setSelectedPct(null);
  };

  const handleSwap = async () => {
    if (!isUsdcToP2P) {
      toast.info("P2P → USDC coming soon");
      return;
    }
    if (!hasAmount) {
      toast.error(t("PLEASE_ENTER_VALID_AMOUNT"));
      return;
    }
    await execute(amount);
  };

  if (state.step === "completed" || state.step === "failed") {
    return <SwapResult state={state} onReset={reset} />;
  }

  const fromBadge = (
    <TokenBadge
      symbol={isUsdcToP2P ? "USDC" : "P2P"}
      icon={isUsdcToP2P ? <UsdcBaseIcon /> : <P2PSolanaIcon />}
    />
  );

  const toBadge = (
    <TokenBadge
      symbol={isUsdcToP2P ? "P2P" : "USDC"}
      icon={isUsdcToP2P ? <P2PSolanaIcon /> : <UsdcBaseIcon />}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <FromPanel
        amount={amount}
        onAmountChange={(v) => { setAmount(v); setSelectedPct(null); }}
        selectedPct={selectedPct}
        onPercent={handlePercent}
        balance={balance}
        disabled={isPending}
        showPctButtons={isUsdcToP2P}
        tokenBadge={fromBadge}
      />

      <div className="relative flex items-center justify-center">
        <Separator className="absolute w-full" />
        <Button
          variant="outline"
          size="icon"
          className="relative z-10 size-9 rounded-full border-border bg-background shadow-sm hover:bg-background"
          onClick={toggleDirection}
          disabled={isPending}>
          <motion.div
            key={direction}
            initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 180, scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}>
            <ArrowUpDown className="size-4 text-foreground" />
          </motion.div>
        </Button>
      </div>

      <ToPanel
        outputAmount={outputAmount}
        isLoading={isQuoteLoading}
        isError={isQuoteError}
        hasAmount={hasAmount}
        tokenBadge={toBadge}
      />

      {showQuoteDetails && <QuoteDetails quote={quote} />}

      <Button
        className="mt-1 w-full rounded-2xl py-6 text-base font-semibold"
        disabled={
          isPending ||
          (isUsdcToP2P && (!hasAmount || isQuoteLoading || isQuoteError || !outputAmount))
        }
        onClick={handleSwap}>
        {isPending || isQuoteLoading ? t("PROCESSING") : t("SWAP")}
      </Button>

      {isPending && <SwapProgress currentStep={state.step} />}
    </div>
  );
}
