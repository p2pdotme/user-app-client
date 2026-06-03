import { ArrowLeftRight, ChevronRight, Sparkles, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStakeBoostMetrics, useP2PBalance } from "@/hooks";
import { useStakeBoostPreview } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";

interface StakeBoostPreviewCardProps {
  /** Human-readable P2P token amount the user intends to stake (e.g. "1000"). */
  amount: string;
  /** Header label shown above the Buy/Sell/Pay tiles. */
  label?: string;
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
export function StakeBoostPreviewCard({
  amount,
  label,
}: StakeBoostPreviewCardProps) {
  const { t } = useTranslation();
  const { buyLimitBoost, sellLimitBoost, payLimitBoost, stakeBoostConfig } =
    useStakeBoostPreview(amount);

  if (!stakeBoostConfig) return null;

  const { maxBoostUsd, usdPerToken, progressPct } =
    useStakeBoostMetrics(amount);
  const resolvedLabel = label ?? t("P2P_STAKE_YOU_UNLOCK_LIMIT");

  const unlocked = buyLimitBoost ?? 0;

  const isCapReached = progressPct >= 100;

  const hasRate =
    usdPerToken !== null && Number.isFinite(usdPerToken) && usdPerToken > 0;

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Sparkles className="size-3 text-primary" />
          </div>
          <p className="font-medium text-muted-foreground text-sm tracking-wider">
            {resolvedLabel}
          </p>
        </div>
        {hasRate && (
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-background/60 px-2 py-0.5 text-xs text-foreground">
            <span className="font-semibold tabular-nums">1</span>
            <span className="text-muted-foreground">$P2P</span>
            <span className="text-muted-foreground">=</span>
            <span className="font-semibold tabular-nums">
              {truncateAmount(usdPerToken ?? 0)}
            </span>
            <span className="text-muted-foreground">{t("P2P_STAKE_USDC_LIMIT")}</span>
          </span>
        )}
      </div>

      {/* Buy / Sell / Pay row */}
      <dl className="mt-2.5 flex items-stretch gap-2">
        <div className="flex-1 rounded-lg bg-background/60 px-2 py-1.5">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {t("P2P_STAKE_BUY_LIMIT")}
          </dt>
          <dd className="font-bold text-foreground text-sm tabular-nums">
            +{truncateAmount(buyLimitBoost ?? 0)}{" "}
            <span className="font-medium text-[10px] text-muted-foreground">
              USDC
            </span>
          </dd>
        </div>
        <div className="flex-1 rounded-lg bg-background/60 px-2 py-1.5">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {t("P2P_STAKE_SELL_LIMIT")}
          </dt>
          <dd className="font-bold text-foreground text-sm tabular-nums">
            +{truncateAmount(sellLimitBoost ?? 0)}{" "}
            <span className="font-medium text-[10px] text-muted-foreground">
              USDC
            </span>
          </dd>
        </div>
        <div className="flex-1 rounded-lg bg-background/60 px-2 py-1.5">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {t("P2P_STAKE_PAY_LIMIT")}
          </dt>
          <dd className="font-bold text-foreground text-sm tabular-nums">
            +{truncateAmount(payLimitBoost ?? 0)}{" "}
            <span className="font-medium text-[10px] text-muted-foreground">
              USDC
            </span>
          </dd>
        </div>
      </dl>

      {/* Country cap progress */}
      {maxBoostUsd > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {isCapReached ? (
                t("P2P_STAKE_CAP_REACHED")
              ) : (
                <>
                  {t("P2P_STAKE_UP_TO_PREFIX")}{" "}
                  <span className="tabular-nums">
                    {truncateAmount(maxBoostUsd)}
                  </span>{" "}
                  <span className="text-[10px]">USDC</span>
                </>
              )}
            </span>
            <span className="tabular-nums">
              <span className="font-semibold text-foreground">
                {truncateAmount(unlocked)}
              </span>
              <span className="text-muted-foreground">
                {" / "}
                {truncateAmount(maxBoostUsd)}
                <span className="ml-1 text-[10px]">USDC</span>
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

/**
 * NoP2pBalanceCta — call-to-action shown when the user has zero $P2P balance,
 * inviting them to swap into $P2P via the token swap flow.
 */
export function NoP2pBalanceCta() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(INTERNAL_HREFS.P2P_TOKEN_SWAP)}
      className="mt-auto flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-3 text-left transition-transform duration-150 ease-out active:scale-[0.99]"
    >
      <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
        <ArrowLeftRight className="relative size-4 animate-pulse text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground text-sm">
          {t("P2P_STAKE_NO_BALANCE_TITLE")}
        </p>
        <p className="text-muted-foreground text-xs">
          {t("P2P_STAKE_NO_BALANCE_DESCRIPTION")}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
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

  const p2pBalance = p2pBalanceRaw ? Number(formatUnits(p2pBalanceRaw, 6)) : 0;
  const hasNoBalance = !isP2PBalanceLoading && p2pBalance === 0;
  const parsedAmount = Number(amount);

  const { maxStakeForCap } = useStakeBoostMetrics(amount);

  const exceedsCap =
    maxStakeForCap !== null &&
    parsedAmount > 0 &&
    parsedAmount > maxStakeForCap;

  const isValid = parsedAmount > 0 && parsedAmount <= p2pBalance && !exceedsCap;

  const handleAmountChange = (value: string) => {
    onAmountChange(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  };

  const maxStakeable =
    maxStakeForCap !== null ? Math.min(p2pBalance, maxStakeForCap) : p2pBalance;
  const canMax = maxStakeable > 0;

  const handleMax = () => {
    onAmountChange(String(Math.floor(maxStakeable)));
  };

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
      {/* Page heading */}
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-bold text-2xl text-foreground tracking-tight">
          {t("P2P_STAKE_HEADING_PREFIX")}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {" "}
            {t("P2P_STAKE_HEADING_HIGHLIGHT")}
          </span>
        </h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          {t("P2P_STAKE_TAGLINE")}
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
            // biome-ignore lint/a11y/noAutofocus: amount input is the primary action on this step
            autoFocus
            placeholder="0"
            aria-label={t("P2P_STAKE_INPUT_LABEL")}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-bold text-4xl text-foreground tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
          <button
            type="button"
            onClick={handleMax}
            disabled={!canMax}
            className="shrink-0 rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary text-xs uppercase tracking-wider transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("MAX")}
          </button>
          <span className="font-semibold text-muted-foreground text-base">
            $P2P
          </span>
        </div>
        {exceedsCap && maxStakeForCap !== null && (
          <p className="mt-2 text-destructive text-xs">
            {t("P2P_STAKE_MAX_STAKE_IS", {
              amount: truncateAmount(maxStakeForCap),
            })}
          </p>
        )}
      </section>

      <StakeBoostPreviewCard amount={amount} />

      {hasNoBalance && <NoP2pBalanceCta />}

      <Button
        disabled={!isValid}
        onClick={onContinue}
        className={`w-full rounded-2xl py-6 text-base font-semibold ${hasNoBalance ? "" : "mt-auto"}`}
      >
        {t("CONTINUE")}
      </Button>
    </main>
  );
}
