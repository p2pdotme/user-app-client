import { ArrowUpDown, Clock } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useP2PBalance,
  useP2PSwapHistory,
  useP2PToUsdcSwap,
  useP2PToUsdcSwapQuote,
  useUsdcToP2PSwap,
  useUsdcToP2PSwapQuote,
  useUSDCBalance,
  useWormholeBridge,
} from "@/hooks";
import { P2P_TOKEN_DECIMALS } from "@/core/jupiter/config";
import { useThirdweb } from "@/hooks/use-thirdweb";
import { BaseBalances } from "./base-balances";
import { P2PSwapFooter } from "./footer";
import { FromPanel } from "./from-panel";
import { QuoteDetails } from "./quote-details";
import { SwapProgress } from "./swap-progress";
import { SwapResult } from "./swap-result";
import { ToPanel } from "./to-panel";
import type { SwapDirection } from "./shared";

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
      <ASSETS.ICONS.NetworkBase className="-right-1 -bottom-1 absolute size-3 rounded-full border border-background bg-background" />
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

  const { account } = useThirdweb();
  const { usdcBalance } = useUSDCBalance();

  const { p2pBalance: p2pBalanceData } = useP2PBalance();
  const usdcToP2P = useUsdcToP2PSwap();
  const p2pToUsdc = useP2PToUsdcSwap();
  const wormholeBridge = useWormholeBridge();
  const { saveEntry } = useP2PSwapHistory();
  const usdcToP2PQuote = useUsdcToP2PSwapQuote(isUsdcToP2P ? amount : "");
  const p2pToUsdcQuote = useP2PToUsdcSwapQuote(!isUsdcToP2P ? amount : "");
  const quote = isUsdcToP2P ? usdcToP2PQuote : p2pToUsdcQuote;

  // Active swap hook based on current direction
  const activeSwap = isUsdcToP2P ? usdcToP2P : p2pToUsdc;
  const { state, execute, reset, isPending } = activeSwap;

  useEffect(() => {
    if (
      (state.step === "completed" || state.step === "failed") &&
      (state.rangoRequestId || state.jupiterSignature)
    ) {
      saveEntry({
        direction: state.direction,
        inputAmount: state.inputAmount,
        rangoRequestId: state.rangoRequestId,
        jupiterSignature: state.jupiterSignature,
        jupiterOutputAmount: state.jupiterOutputAmount,
        rangoOutputAmount: state.rangoOutputAmount,
        finalStep: state.step,
        error: state.error,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  // After USDC→P2P completes, auto-trigger Wormhole bridge for the received P2P amount
  useEffect(() => {
    if (
      isUsdcToP2P &&
      usdcToP2P.state.step === "completed" &&
      usdcToP2P.state.jupiterOutputAmount &&
      account?.address &&
      wormholeBridge.state.step === "idle"
    ) {
      const humanAmount = formatUnits(
        BigInt(usdcToP2P.state.jupiterOutputAmount),
        P2P_TOKEN_DECIMALS,
      );
      wormholeBridge.bridge({
        amount: humanAmount,
        recipientEvmAddress: account.address,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usdcToP2P.state.step]);

  const balance: number | null = isUsdcToP2P
    ? (usdcBalance ?? null)
    : (p2pBalanceData ?? null);
  const outputAmount = quote.totalOutputAmount;
  const isQuoteLoading = quote.isLoading;
  const isQuoteError = quote.isError;
  const outputSymbol = isUsdcToP2P ? "P2P" : "USDC";

  const showQuoteDetails =
    hasAmount && !isQuoteLoading && !isQuoteError && !!outputAmount;

  const handlePercent = (pct: number) => {
    if (balance === null) return;
    setSelectedPct(pct);
    setAmount((balance * pct).toString());
  };

  const toggleDirection = () => {
    if (isPending) return;
    setDirection((prev) =>
      prev === "USDC_TO_P2P" ? "P2P_TO_USDC" : "USDC_TO_P2P",
    );
    setAmount("");
    setSelectedPct(null);
    if (isUsdcToP2P) wormholeBridge.reset();
  };

  const handleSwap = async () => {
    if (!hasAmount) {
      toast.error(t("PLEASE_ENTER_VALID_AMOUNT"));
      return;
    }
    await execute(amount);
  };

  const wormholeDone = ["completed", "failed"].includes(
    wormholeBridge.state.step,
  );

  // Map WormholeBridgeStep → P2PSwapStep for unified progress display
  const wormholeStepMap: Partial<
    Record<typeof wormholeBridge.state.step, typeof state.step>
  > = {
    locking: "wormhole_locking",
    awaiting_vaa: "wormhole_vaa",
    redeeming: "wormhole_redeeming",
  };

  // For USDC→P2P: after the Jupiter swap completes, Wormhole continues.
  // Map its step into P2PSwapStep so the unified progress list stays accurate.
  const isWormholeRunning =
    isUsdcToP2P && !wormholeDone && wormholeBridge.state.step !== "idle";
  const effectiveStep = isWormholeRunning
    ? (wormholeStepMap[wormholeBridge.state.step] ?? state.step)
    : state.step;
  // Show progress whenever the swap is in-flight OR Wormhole is still running.
  const showProgress = isPending || isWormholeRunning;

  // Only show the result when the full flow (including Wormhole) is done.
  const isFullyDone = isUsdcToP2P
    ? (state.step === "completed" || state.step === "failed") && wormholeDone
    : state.step === "completed" || state.step === "failed";

  if (isFullyDone) {
    return (
      <SwapResult
        state={state}
        onReset={() => {
          reset();
          if (isUsdcToP2P) wormholeBridge.reset();
        }}
      />
    );
  }

  const fromBadge = (
    <TokenBadge
      symbol={isUsdcToP2P ? "USDC" : "P2P"}
      icon={isUsdcToP2P ? <UsdcBaseIcon /> : <P2PSolanaIcon />}
    />
  );

  const toBadge = (
    <TokenBadge
      symbol={outputSymbol}
      icon={isUsdcToP2P ? <P2PSolanaIcon /> : <UsdcBaseIcon />}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      {account?.address && (
        <BaseBalances />
      )}

      <FromPanel
        amount={amount}
        onAmountChange={(v) => {
          setAmount(v);
          setSelectedPct(null);
        }}
        selectedPct={selectedPct}
        onPercent={handlePercent}
        balance={balance}
        disabled={isPending}
        showPctButtons={true}
        tokenBadge={fromBadge}
      />

      <div className="relative flex items-center justify-center">
        <Separator className="absolute w-full" />
        <Button
          variant="outline"
          size="icon"
          className="relative z-10 size-9 rounded-full border-border bg-background shadow-sm hover:bg-background"
          onClick={toggleDirection}
          disabled={isPending}
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

      <ToPanel
        outputAmount={outputAmount}
        isLoading={isQuoteLoading}
        isError={isQuoteError}
        hasAmount={hasAmount}
        tokenBadge={toBadge}
      />

      {showQuoteDetails && (
        <QuoteDetails quote={quote} outputSymbol={outputSymbol} direction={direction} />
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-warning/10 px-4 py-3">
        <Clock className="mt-0.5 size-4 shrink-0 text-warning" />
        <p className="text-foreground text-xs leading-relaxed">
          This swap takes <span className="font-semibold">~20 minutes</span> to complete. Keep this tab open and stay connected throughout the process.
        </p>
      </div>

      <Button
        className="mt-1 w-full rounded-2xl py-6 text-base font-semibold"
        disabled={
          isPending ||
          isWormholeRunning ||
          !hasAmount ||
          isQuoteLoading ||
          isQuoteError ||
          !outputAmount
        }
        onClick={handleSwap}
      >
        {isPending || isWormholeRunning || isQuoteLoading
          ? t("PROCESSING")
          : t("SWAP")}
      </Button>

      {showProgress && (
        <SwapProgress currentStep={effectiveStep} direction={direction} />
      )}

      <P2PSwapFooter />
    </div>
  );
}
