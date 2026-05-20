import {
  ArrowUpDown,
  Clock,
  Loader2,
  RefreshCw,
  SendHorizonal,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { INTERNAL_HREFS } from "@/lib/constants";
import { toast } from "sonner";
import ASSETS from "@/assets";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useP2PBalance,
  useP2PSwapQuote,
  useP2PSwap,
  useUSDCBalance,
  useP2PSwapHistory,
} from "@/hooks";
import { SwapCard } from "@/pages/p2p-swap/history";
import { SendP2PDrawer } from "./send-p2p-drawer";

import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { cn, truncateAmount } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { formatUnits } from "viem";
import type { SwapDirection } from "@/core/p2p-swap";

export type { SwapDirection } from "@/core/p2p-swap";

export const PCT_OPTIONS = [
  { labelKey: "25%", pct: 0.25 },
  { labelKey: "50%", pct: 0.5 },
  { labelKey: "75%", pct: 0.75 },
  { labelKey: "MAX", pct: 1 },
] as const;

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
                )}
              >
                {labelKey === "MAX" ? t("MAX") : labelKey}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ToPanelProps {
  outputAmount: string | null;
  isLoading: boolean;
  isError: boolean;
  hasAmount: boolean;
  tokenBadge: React.ReactNode;
}

export function ToPanel({
  outputAmount,
  isLoading,
  isError,
  hasAmount,
  tokenBadge,
}: ToPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-none bg-primary/10 shadow-none">
      <CardContent className="p-4">
        <div className="mb-3">
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {t("YOU_RECEIVE")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            {hasAmount && isLoading && (
              <Skeleton className="h-9 w-32 bg-primary/30" />
            )}
            {hasAmount && isError && (
              <p className="font-bold text-2xl text-destructive">—</p>
            )}
            {outputAmount && !isLoading && (
              <p className="font-bold text-3xl text-foreground">
                {outputAmount}
              </p>
            )}
            {!isLoading && !outputAmount && !isError && (
              <p className="font-bold text-3xl text-muted-foreground/40">
                0.00
              </p>
            )}
          </div>
          {tokenBadge}
        </div>
      </CardContent>
    </Card>
  );
}

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

export const P2PSwapForm = ({
  onSwapSuccess,
}: {
  onSwapSuccess?: () => void;
}) => {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<SwapDirection>("USDC_TO_P2P");
  const [amount, setAmount] = useState("");
  const [selectedPct, setSelectedPct] = useState<number | null>(null);

  const { usdcBalance } = useUSDCBalance();
  const { p2pBalanceRaw } = useP2PBalance();
  const { outputAmount, isQuoteLoading, isQuoteError } = useP2PSwapQuote(
    direction,
    amount,
  );
  const { executeSwap, isSwapping } = useP2PSwap(direction, amount);

  const isUsdcToP2P = direction === "USDC_TO_P2P";
  const hasAmount = !!amount && Number(amount) > 0;
  const p2pBalance =
    p2pBalanceRaw != null
      ? Number(formatUnits(BigInt(String(p2pBalanceRaw)), 6))
      : null;
  const balance: number | null = isUsdcToP2P
    ? (usdcBalance ?? null)
    : p2pBalance;
  const outputSymbol = isUsdcToP2P ? "P2P" : "USDC";
  const fromSymbol = isUsdcToP2P ? "USDC" : "P2P";
  const isInsufficientBalance =
    balance !== null && hasAmount && Number(amount) > balance;

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

  const handleSwap = () => {
    if (!hasAmount) {
      toast.error(t("PLEASE_ENTER_VALID_AMOUNT"));
      return;
    }
    executeSwap(undefined, {
      onSuccess: () => {
        toast.success(t("SWAP_INITIATED_SUCCESS"));
        setAmount("");
        setSelectedPct(null);
        setTimeout(() => onSwapSuccess?.(), 2000);
      },
      onError: (error) => {
        const message =
          error instanceof Error &&
          error.message &&
          !error.message.trimStart().startsWith("[")
            ? error.message
            : t("SOMETHING_WENT_WRONG");
        toast.error(message);
      },
    });
  };

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
    <>
      <FromPanel
        amount={amount}
        onAmountChange={(v) => {
          setAmount(v);
          setSelectedPct(null);
        }}
        selectedPct={selectedPct}
        onPercent={handlePercent}
        balance={balance}
        disabled={false}
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
          disabled={isSwapping}
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
        outputAmount={String(outputAmount)}
        isLoading={isQuoteLoading}
        isError={isQuoteError}
        hasAmount={hasAmount}
        tokenBadge={toBadge}
      />

      <Button
        className="mt-1 w-full rounded-2xl py-6 text-base font-semibold"
        disabled={
          !hasAmount ||
          isQuoteLoading ||
          !outputAmount ||
          isSwapping ||
          isInsufficientBalance
        }
        onClick={handleSwap}
      >
        {isSwapping ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            {t("SWAPPING")}
          </span>
        ) : isInsufficientBalance ? (
          t("SWAP_INSUFFICIENT_BALANCE", { token: fromSymbol })
        ) : (
          t("SWAP")
        )}
      </Button>
    </>
  );
};

function P2PSwapBalances() {
  const { usdcBalance, isUsdcBalanceLoading, refetchUSDCBalance } =
    useUSDCBalance();
  const { p2pBalanceRaw, isP2PBalanceLoading, refetchP2PBalance } =
    useP2PBalance();
  const [spinning, setSpinning] = useState(false);

  const isLoading = isUsdcBalanceLoading || isP2PBalanceLoading;
  const p2pFormatted =
    p2pBalanceRaw != null
      ? Number(formatUnits(BigInt(String(p2pBalanceRaw) || 0), 6)).toFixed(3)
      : "—";

  const handleRefresh = () => {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 600);
    refetchUSDCBalance();
    refetchP2PBalance();
  };

  return (
    <div className="flex items-center justify-between px-1 py-1">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="relative flex shrink-0 items-center">
            <ASSETS.ICONS.Usdc className="size-4" />
            <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
          </div>
          {isUsdcBalanceLoading ? (
            <Skeleton className="h-4 w-14" />
          ) : (
            <span className="font-semibold text-sm">
              {truncateAmount(usdcBalance ?? 0)}{" "}
              <span className="font-normal text-muted-foreground text-xs">
                USDC
              </span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative flex shrink-0 items-center">
            <ASSETS.ICONS.Logo className="size-4" />
            <ASSETS.ICONS.NetworkBase className="-right-0.5 -bottom-0.5 absolute size-2.5 rounded-full border border-background bg-background" />
          </div>
          {isP2PBalanceLoading ? (
            <Skeleton className="h-4 w-14" />
          ) : (
            <span className="font-semibold text-sm">
              {p2pFormatted}{" "}
              <span className="font-normal text-muted-foreground text-xs">
                P2P
              </span>
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isLoading}
        className="flex cursor-pointer items-center justify-center rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        <RefreshCw
          className={cn("size-4", (isLoading || spinning) && "animate-spin")}
        />
      </button>
    </div>
  );
}

export const P2PSwapMain = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { swaps, refetch } = useP2PSwapHistory();
  const { refetchUSDCBalance } = useUSDCBalance();
  const { refetchP2PBalance } = useP2PBalance();

  const handleSwapSuccess = () => {
    refetch();
    refetchUSDCBalance();
    refetchP2PBalance();
  };

  const processingSwaps = swaps.filter(
    (s) => s.status === "processing" || s.status === "pending",
  );

  return (
    <>
      <P2PSwapBalances />
      <P2PSwapForm onSwapSuccess={handleSwapSuccess} />
      {processingSwaps.length > 0 && (
        <div className="mt-2 space-y-2">
          <p className="px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("IN_PROGRESS")}
          </p>
          {processingSwaps.map((swap) => (
            <SwapCard key={swap.id} swap={swap} />
          ))}
        </div>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <SendP2PDrawer>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
          >
            <SendHorizonal className="size-4" />
            {t("SEND_P2P")}
          </button>
        </SendP2PDrawer>
        <button
          type="button"
          onClick={() => navigate(INTERNAL_HREFS.P2P_SWAP_HISTORY)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
        >
          <Clock className="size-4" />
          {t("SWAP_HISTORY")}
        </button>
      </div>
    </>
  );
};
