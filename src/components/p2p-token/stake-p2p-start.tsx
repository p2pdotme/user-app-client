import { Sparkles, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useP2PBalance } from "@/hooks";
import { useStakeBoostPreview } from "@/hooks";
import { truncateAmount } from "@/lib/utils";

interface StakeBoostPreviewCardProps {
  /** Human-readable P2P token amount the user intends to stake (e.g. "1000"). */
  amount: string;
}

/**
 * StakeBoostPreviewCard — visualises the per-transaction USD limit unlocked
 * by staking `amount` P2P tokens.
 *
 * Shows the headline unlocked USD, a Buy/Sell/Pay breakdown (all equal, but
 * displayed explicitly), and a progress bar against the country cap
 * (`maxBoostUsd` from `getStakeBoostConfig`).
 *
 * Renders nothing until the on-chain stake-boost config is loaded.
 */
function StakeBoostPreviewCard({ amount }: StakeBoostPreviewCardProps) {
  const { buyLimitBoost, sellLimitBoost, payLimitBoost, stakeBoostConfig } =
    useStakeBoostPreview(amount);

  if (!stakeBoostConfig) return null;

  const maxBoostUsd = Number(
    formatUnits(BigInt(stakeBoostConfig.maxBoostUsd), 6),
  );
  const unlocked = buyLimitBoost ?? 0;
  const progressPct =
    maxBoostUsd > 0 ? Math.min(100, (unlocked / maxBoostUsd) * 100) : 0;

  const isCapReached = progressPct >= 100;

  const tokensPerUsd =
    Number(stakeBoostConfig.tokensPerUsdNumerator) /
    Number(stakeBoostConfig.tokensPerUsdDenominator);
  const hasRate = Number.isFinite(tokensPerUsd) && tokensPerUsd > 0;

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="size-3 text-primary" />
          </div>
          <p className="font-medium text-muted-foreground text-sm tracking-wider">
            You Unlock Limit
          </p>
        </div>
        {hasRate && (
          <span className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-xs text-foreground">
            <span className="font-semibold tabular-nums">
              {truncateAmount(tokensPerUsd)}
            </span>
            <span className="text-muted-foreground">$P2P</span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold tabular-nums">$1</span>
            <span className="text-muted-foreground">limit</span>
          </span>
        )}
      </div>

      {/* Buy / Sell / Pay row */}
      <dl className="mt-2.5 flex items-stretch gap-2">
        <div className="flex-1 rounded-lg bg-background/60 px-2 py-1.5">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            Buy Limit
          </dt>
          <dd className="font-bold text-foreground text-sm tabular-nums">
            +${truncateAmount(buyLimitBoost ?? 0)}
          </dd>
        </div>
        <div className="flex-1 rounded-lg bg-background/60 px-2 py-1.5">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            Sell Limit
          </dt>
          <dd className="font-bold text-foreground text-sm tabular-nums">
            +${truncateAmount(sellLimitBoost ?? 0)}
          </dd>
        </div>
        <div className="flex-1 rounded-lg bg-background/60 px-2 py-1.5">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            Pay Limit
          </dt>
          <dd className="font-bold text-foreground text-sm tabular-nums">
            +${truncateAmount(payLimitBoost ?? 0)}
          </dd>
        </div>
      </dl>

      {/* Country cap progress */}
      {maxBoostUsd > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {isCapReached
                ? "Stake Cap Reached"
                : `Up to $${truncateAmount(maxBoostUsd)}`}
            </span>
            <span className="tabular-nums">
              <span className="font-semibold text-foreground">
                ${truncateAmount(unlocked)}
              </span>
              <span className="text-muted-foreground">
                {" / "}${truncateAmount(maxBoostUsd)}
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-primary/15">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}

interface StakeP2pStartProps {
  amount: string;
  onAmountChange: (value: string) => void;
  onContinue: () => void;
}

/**
 * StakeP2pStart — step 1 of the staking flow.
 *
 * Renders the amount input card, the user's available $P2P balance, the
 * 25% / 50% / MAX quick-pick buttons, the live boost preview, and the
 * Continue CTA. The input is digit-only and leading zeros are stripped.
 * Continue is enabled only when the entered amount is > 0 and ≤ the user's
 * $P2P balance.
 */
export function StakeP2pStart({
  amount,
  onAmountChange,
  onContinue,
}: StakeP2pStartProps) {
  const { t } = useTranslation();
  const { p2pBalanceRaw, isP2PBalanceLoading } = useP2PBalance();
  const { stakeBoostConfig } = useStakeBoostPreview(amount);

  // TODO:
  const p2pBalance = p2pBalanceRaw ? Number(formatUnits(p2pBalanceRaw, 18)) : 0;
  const parsedAmount = Number(amount);

  // Conversion rate: {tokensPerUsd} $P2P = $1 limit
  const tokensPerUsd = stakeBoostConfig
    ? Number(stakeBoostConfig.tokensPerUsdNumerator) /
      Number(stakeBoostConfig.tokensPerUsdDenominator)
    : null;

  // Max stake that fully consumes the country cap (maxBoostUsd in dollars × tokensPerUsd)
  const maxBoostUsd = stakeBoostConfig
    ? Number(formatUnits(BigInt(stakeBoostConfig.maxBoostUsd), 6))
    : null;
  const maxStakeForCap =
    tokensPerUsd !== null && maxBoostUsd !== null
      ? maxBoostUsd * tokensPerUsd
      : null;
  const exceedsCap =
    maxStakeForCap !== null &&
    parsedAmount > 0 &&
    parsedAmount > maxStakeForCap;

  const isValid = parsedAmount > 0 && parsedAmount <= p2pBalance && !exceedsCap;

  const handleAmountChange = (value: string) => {
    onAmountChange(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  };

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
      {/* Page heading */}
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-bold text-2xl text-foreground tracking-tight">
          Get Higher
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {" "}
            Order Limits
          </span>
        </h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          The more $P2P you stake, the bigger each order can be.
        </p>
      </header>

      {/* Stake amount card */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {t("P2P_STAKE_INPUT_LABEL")}
          </p>
          {isP2PBalanceLoading ? (
            <Skeleton className="h-6 w-24 rounded-full" />
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-foreground text-xs">
              <Wallet className="size-3 text-muted-foreground" />
              <span className="font-semibold tabular-nums">
                {truncateAmount(p2pBalance)}
              </span>
              <span className="font-normal text-muted-foreground">$P2P</span>
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            aria-label={t("P2P_STAKE_INPUT_LABEL")}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-bold text-4xl text-foreground tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
          <span className="font-semibold text-muted-foreground text-base">
            $P2P
          </span>
        </div>
        <p className="mt-1 text-muted-foreground text-xs tabular-nums">
          ≈ 0.00 USDC
        </p>
        {exceedsCap && maxStakeForCap !== null && (
          <p className="mt-2 text-destructive text-xs">
            Max stake is {truncateAmount(maxStakeForCap)} $P2P
          </p>
        )}
      </section>

      <StakeBoostPreviewCard amount={amount} />

      <Button
        disabled={!isValid}
        onClick={onContinue}
        className="mt-auto w-full rounded-2xl py-6 text-base font-semibold"
      >
        {t("CONTINUE")}
      </Button>
    </main>
  );
}
