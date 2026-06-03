import {
  AlertTriangle,
  Loader2,
  Lock,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { parseUnits } from "viem";
import { Button } from "@/components/ui/button";
import {
  useP2PBoost,
  useStakeBoostMetrics,
  useStakeBoostPreview,
} from "@/hooks";
import { formatSecondsDuration, truncateAmount } from "@/lib/utils";

interface ConfirmP2pStakeProps {
  amount: string;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * ConfirmP2pStake — step 2 of the staking flow.
 *
 * Shows a summary of the pending stake (amount, unlocked limit, cost,
 * timing) and triggers the on-chain `p2pBoostStake` transaction via
 * `useP2PBoost`. The amount is converted from the human-readable string to
 * base units with `parseUnits(amount, 6)`. Disables both buttons while the
 * transaction is pending; advances to the success step on confirmation.
 */
export function ConfirmP2pStake({
  amount,
  onBack,
  onConfirm,
}: ConfirmP2pStakeProps) {
  const { t } = useTranslation();
  const { p2pBoostStakeMutation } = useP2PBoost();
  const { buyLimitBoost, sellLimitBoost, payLimitBoost, stakeBoostGlobals } =
    useStakeBoostPreview(amount);
  const { usdPerToken } = useStakeBoostMetrics(amount);
  const numericAmount = Number(amount) || 0;
  const isProcessing = p2pBoostStakeMutation.isPending;

  const cooldownLabel = formatSecondsDuration(
    stakeBoostGlobals?.normalCooldown,
    t,
  );

  const handleConfirm = () => {
    p2pBoostStakeMutation.mutate(
      { tokens: parseUnits(amount, 6) },
      { onSuccess: () => onConfirm() },
    );
  };

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
      {/* Staking amount card */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("P2P_STAKE_CONFIRM_STAKING")}
        </p>
        <p className="mt-1 font-bold text-4xl text-foreground tabular-nums tracking-tight">
          {truncateAmount(numericAmount)}{" "}
          <span className="text-muted-foreground text-2xl">$P2P</span>
        </p>

        <div className="my-4 h-px bg-border/60" />

        <dl className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t("P2P_STAKE_APPLIES")}</dt>
            <dd className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Zap className="size-3.5 text-primary" />
              {t("P2P_STAKE_INSTANTLY")}
            </dd>
          </div>
        </dl>
      </section>

      {/* Unlock preview — Buy / Sell / Pay tiles */}
      <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Sparkles className="size-3 text-primary" />
            </div>
            <p className="font-medium text-muted-foreground text-sm tracking-wider">
              {t("P2P_STAKE_YOU_UNLOCK_LIMIT")}
            </p>
          </div>
          {usdPerToken !== null &&
            Number.isFinite(usdPerToken) &&
            usdPerToken > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-background/60 px-2 py-0.5 text-foreground text-xs">
                <span className="font-semibold tabular-nums">1</span>
                <span className="text-muted-foreground">$P2P</span>
                <span className="text-muted-foreground">=</span>
                <span className="font-semibold tabular-nums">
                  {truncateAmount(usdPerToken)}
                </span>
                <span className="text-muted-foreground">{t("P2P_STAKE_USDC_LIMIT")}</span>
              </span>
            )}
        </div>

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
      </section>

      <FraudWarningBanner />

      {/* What you're agreeing to */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <div className="mb-3.5 flex items-center gap-2">
          <AlertTriangle className="size-3.5 text-amber-500" />
          <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            {t("P2P_STAKE_BEFORE_YOU_STAKE")}
          </p>
        </div>
        <ul className="flex flex-col divide-y divide-border/40">
          <li className="flex items-start gap-3 pb-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Lock className="size-4 text-amber-500" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-medium text-[15px] text-foreground leading-snug tracking-tight">
                {t("P2P_STAKE_COOLDOWN_TO_UNSTAKE", {
                  duration: cooldownLabel ?? "",
                })}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {t("P2P_STAKE_LOCKED_DURING_PERIOD")}
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 pt-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <TrendingDown className="size-4 text-amber-500" />
            </div>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-medium text-[15px] text-foreground leading-snug tracking-tight">
                {t("P2P_STAKE_BOOST_ENDS_ON_UNSTAKE")}
              </p>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {t("P2P_STAKE_LIMIT_RETURNS_DEFAULT")}
              </p>
            </div>
          </li>
        </ul>
      </section>

      <div className="mt-auto flex flex-col gap-2">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {t("CANCEL")}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="w-full rounded-2xl py-6 text-base font-semibold"
        >
          {isProcessing ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("CONFIRM")}
        </Button>
      </div>
    </main>
  );
}

function FraudWarningBanner() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-4">
      {/* Subtle accent bar */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-500 via-amber-500/70 to-amber-500/40"
      />
      {/* Subtle ambient glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 animate-pulse rounded-full bg-amber-500/10 blur-3xl"
      />
      {/* Shimmer sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-amber-500/[0.06] to-transparent"
      />
      <div className="relative flex items-start gap-3 pl-2">
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
          <span className="absolute inset-0 animate-ping rounded-xl bg-amber-500/15" />
          <ShieldAlert className="relative size-4 text-amber-500" />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-semibold text-[15px] text-foreground leading-snug tracking-tight">
            {t("P2P_STAKE_FRAUD_WARNING_TITLE")}
          </p>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {t("P2P_STAKE_FRAUD_WARNING_DESCRIPTION")}
          </p>
        </div>
      </div>
    </section>
  );
}
