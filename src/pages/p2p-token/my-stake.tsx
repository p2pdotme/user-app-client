import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  LockOpen,
  Plus,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { formatUnits, parseUnits } from "viem";
import ASSETS from "@/assets";
import { NonHomeHeader } from "@/components";
import {
  NoP2pBalanceCta,
  StakeBoostPreviewCard,
} from "@/components/p2p-token/stake-p2p-start";
import { OrderLimitCard } from "@/components/p2p-token/success-p2p-stake";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useP2PBalance,
  useP2PBoost,
  useP2PTokenInfo,
  useStakeBoostGlobals,
  useStakeBoostMetrics,
  useStakeBoostPreview,
  useUserP2PStakeActivities,
  useUserStake,
} from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { formatSecondsDuration, truncateAmount } from "@/lib/utils";

export function P2PMyStake() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userStake, isUserStakeLoading } = useUserStake();
  const { p2pBalanceRaw, isP2PBalanceLoading } = useP2PBalance();
  const { tokenInfo } = useP2PTokenInfo();
  const { p2pBoostRequestUnstakeMutation } = useP2PBoost();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isUnstakeOpen, setIsUnstakeOpen] = useState(false);

  const p2pBalance = p2pBalanceRaw ? Number(formatUnits(p2pBalanceRaw, 6)) : 0;

  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 6))
    : 0;
  const status = userStake ? Number(userStake.status) : 0;
  const cooldownEnd = userStake ? Number(userStake.cooldownEnd) : 0;
  const isActive = status === 1;
  const isCoolingDown = status === 2;

  const { maxBoostUsd, progressPct, usdPerToken, headroom } =
    useStakeBoostMetrics(String(stakedAmount));
  const { buyLimitBoost, sellLimitBoost, payLimitBoost } = useStakeBoostPreview(
    String(stakedAmount),
  );
  const isCapReached = progressPct >= 100;
  const marketPrice = tokenInfo?.market.usdPrice ?? null;
  const stakedUsd = marketPrice != null ? stakedAmount * marketPrice : null;
  const isUnstaking = p2pBoostRequestUnstakeMutation.isPending;

  return (
    <>
      <NonHomeHeader title={t("MY_STAKE_TITLE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
        <div className="flex justify-end">
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

        {isUserStakeLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : (
          <section className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-4">
            {/* Header: label + status pill */}
            <div className="flex items-center justify-between">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {t("MY_STAKE_STAKED_LABEL")}
              </p>
              <StakeStatusPill status={status} />
            </div>

            {/* Staked amount + USD equivalent */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-bold text-4xl text-foreground tabular-nums tracking-tight">
                {truncateAmount(stakedAmount)}
              </span>
              <span className="text-muted-foreground text-base">$P2P</span>
            </div>
            {stakedUsd != null && (
              <p className="mt-1 font-medium text-muted-foreground text-sm tabular-nums">
                ≈{" "}
                <span className="text-foreground">{stakedUsd.toFixed(3)}</span>{" "}
                USDC
              </p>
            )}

            {isActive && maxBoostUsd > 0 && (
              <>
                <div className="my-4 h-px bg-border/60" />

                {/* Section label + rate */}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">
                    {t("MY_STAKE_ORDER_LIMIT_BOOSTED")}
                  </p>
                  {usdPerToken !== null && usdPerToken > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-background/60 px-2 py-0.5 text-foreground text-xs">
                      <span className="font-semibold tabular-nums">1</span>
                      <span className="text-muted-foreground">$P2P</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="font-semibold tabular-nums">
                        {truncateAmount(usdPerToken)}
                      </span>
                      <span className="text-muted-foreground">
                        {t("P2P_STAKE_USDC_LIMIT")}
                      </span>
                    </span>
                  )}
                </div>

                {/* Buy / Sell / Pay tiles */}
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      {t("BUY")}
                    </dt>
                    <dd className="mt-0.5 font-bold text-emerald-500 text-sm tabular-nums">
                      +${truncateAmount(buyLimitBoost ?? 0)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      {t("SELL")}
                    </dt>
                    <dd className="mt-0.5 font-bold text-emerald-500 text-sm tabular-nums">
                      +${truncateAmount(sellLimitBoost ?? 0)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      {t("PAY")}
                    </dt>
                    <dd className="mt-0.5 font-bold text-emerald-500 text-sm tabular-nums">
                      +${truncateAmount(payLimitBoost ?? 0)}
                    </dd>
                  </div>
                </dl>

                {/* Headroom progress bar */}
                <div className="mt-4">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-primary/15">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    {isCapReached ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-500">
                        <Sparkles className="size-3" />
                        {t("MY_STAKE_BOOST_MAXED_OUT")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground tabular-nums">
                          ${truncateAmount(headroom)}
                        </span>{" "}
                        {t("MY_STAKE_MORE_LIMIT_TO_UNLOCK")}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {isCoolingDown && cooldownEnd > 0 && (
          <CooldownCard cooldownEnd={cooldownEnd} stakedAmount={stakedAmount} />
        )}

        {!isUserStakeLoading && stakedAmount === 0 && (
          <>
            <OrderLimitCard label={t("MY_STAKE_YOUR_ORDER_LIMIT")} />

            <Button
              onClick={() =>
                navigate(INTERNAL_HREFS.P2P_TOKEN_STAKE, { replace: true })
              }
              className="w-full rounded-2xl py-6 font-semibold text-base"
            >
              <Sparkles className="size-4" />
              {t("MY_STAKE_STAKE_NOW")}
            </Button>
          </>
        )}

        {isActive && (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsTopUpOpen(true)}
              disabled={isUnstaking || isCapReached}
              className="flex-1 rounded-2xl py-6 font-semibold text-xs sm:text-base leading-tight whitespace-normal text-center"
            >
              <Plus className="size-4 shrink-0" />
              {isCapReached
                ? t("MY_STAKE_BOOST_MAXED_OUT_BUTTON")
                : t("MY_STAKE_TOPUP_BUTTON")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsUnstakeOpen(true)}
              disabled={isUnstaking}
              hapticType="warning"
              className="flex-1 rounded-2xl py-6 font-semibold text-xs sm:text-base leading-tight whitespace-normal text-center"
            >
              <LockOpen className="size-4 shrink-0" />
              {t("MY_STAKE_UNSTAKE_BUTTON")}
            </Button>
          </div>
        )}

        <StakeActivityList />
      </main>

      <TopUpDrawer
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        stakedAmount={stakedAmount}
      />

      <UnstakeDrawer
        isOpen={isUnstakeOpen}
        onClose={() => setIsUnstakeOpen(false)}
        stakedAmount={stakedAmount}
      />
    </>
  );
}

interface UnstakeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stakedAmount: number;
}

function UnstakeDrawer({ isOpen, onClose, stakedAmount }: UnstakeDrawerProps) {
  const { t } = useTranslation();
  const { stakeBoostGlobals } = useStakeBoostGlobals();
  const { p2pBoostRequestUnstakeMutation } = useP2PBoost();

  const normalCooldownLabel =
    formatSecondsDuration(stakeBoostGlobals?.normalCooldown, t) ?? "";
  const blacklistCooldownLabel =
    formatSecondsDuration(stakeBoostGlobals?.blacklistCooldown, t) ?? "";
  const isProcessing = p2pBoostRequestUnstakeMutation.isPending;
  const stakedAmountStr = truncateAmount(stakedAmount);

  const handleConfirm = () => {
    p2pBoostRequestUnstakeMutation.mutate(undefined, {
      onSuccess: () => onClose(),
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="container-narrow mx-auto pb-8">
        <DrawerHeader>
          <DrawerTitle className="sr-only">
            {t("MY_STAKE_UNSTAKE_DRAWER_TITLE")}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {t("MY_STAKE_UNSTAKE_HEADING")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4">
          {/* Warning icon + heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative flex size-14 items-center justify-center rounded-full bg-amber-500/15">
              <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
              <AlertTriangle className="relative size-6 text-amber-500" />
            </div>
            <h2 className="font-bold text-xl text-foreground tracking-tight">
              {t("MY_STAKE_UNSTAKE_HEADING")}
            </h2>
          </div>

          {/* What happens card */}
          <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <p className="mb-3.5 font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              {t("MY_STAKE_UNSTAKE_WHAT_HAPPENS")}
            </p>
            <ul className="flex flex-col divide-y divide-border/40">
              <li className="flex items-center gap-3 pb-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <Clock className="size-4 text-destructive" />
                </div>
                <p className="font-regular tracking-wider text-[15px] text-foreground leading-snug tracking-tight">
                  {t("MY_STAKE_UNSTAKE_RIGHT_NOW", {
                    amount: stakedAmountStr,
                    duration: normalCooldownLabel,
                  })}
                </p>
              </li>
              <li className="flex items-center gap-3 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <TrendingDown className="size-4 text-destructive" />
                </div>
                <p className="font-regular tracking-wide text-[15px] text-foreground leading-snug tracking-tight">
                  {t("MY_STAKE_UNSTAKE_YOUR_LIMITS")}
                </p>
              </li>
              <li className="flex items-center gap-3 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                </div>
                <p className="font-regular tracking-wide text-[15px] text-foreground leading-snug tracking-tight">
                  {t("MY_STAKE_UNSTAKE_IN_DAYS", {
                    amount: stakedAmountStr,
                    duration: normalCooldownLabel,
                  })}
                </p>
              </li>
              <li className="flex items-center gap-3 pt-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                  <ShieldAlert className="size-4 text-amber-500" />
                </div>
                <p className="font-regular tracking-wide text-[15px] text-foreground leading-snug tracking-tight">
                  {t("MY_STAKE_UNSTAKE_IF_FLAGGED", {
                    duration: blacklistCooldownLabel,
                  })}
                </p>
              </li>
            </ul>
          </section>

          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isProcessing}
              className="w-full rounded-2xl py-6 font-semibold text-base"
            >
              {t("CANCEL")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isProcessing}
              hapticType="warning"
              className="w-full rounded-2xl py-6 font-semibold text-base"
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t("MY_STAKE_UNSTAKE_BUTTON")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface TopUpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stakedAmount: number;
}

function TopUpDrawer({ isOpen, onClose, stakedAmount }: TopUpDrawerProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const { p2pBalanceRaw, isP2PBalanceLoading } = useP2PBalance();
  const { p2pBoostTopUpMutation } = useP2PBoost();

  const p2pBalance = p2pBalanceRaw ? Number(formatUnits(p2pBalanceRaw, 6)) : 0;
  const hasNoBalance = !isP2PBalanceLoading && p2pBalance === 0;
  const parsedAmount = Number(amount);
  const combinedAmount = stakedAmount + (parsedAmount || 0);
  const combinedAmountStr = String(combinedAmount);

  const { maxStakeForCap } = useStakeBoostMetrics(combinedAmountStr);
  const remainingTopUpCap =
    maxStakeForCap !== null ? Math.max(0, maxStakeForCap - stakedAmount) : null;
  const exceedsCap =
    remainingTopUpCap !== null &&
    parsedAmount > 0 &&
    parsedAmount > remainingTopUpCap;

  const isValid = parsedAmount > 0 && parsedAmount <= p2pBalance && !exceedsCap;
  const isProcessing = p2pBoostTopUpMutation.isPending;

  const maxTopUp =
    remainingTopUpCap !== null
      ? Math.min(p2pBalance, remainingTopUpCap)
      : p2pBalance;
  const canMax = maxTopUp > 0;

  const handleAmountChange = (value: string) => {
    setAmount(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  };

  const handleMax = () => {
    setAmount(String(Math.floor(maxTopUp)));
  };

  const handleConfirm = () => {
    p2pBoostTopUpMutation.mutate(
      { tokens: parseUnits(amount, 6) },
      {
        onSuccess: () => {
          setAmount("");
          onClose();
        },
      },
    );
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isProcessing) {
      setAmount("");
      onClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="container-narrow mx-auto pb-8">
        <DrawerHeader>
          <DrawerTitle>{t("MY_STAKE_TOPUP_TITLE")}</DrawerTitle>
          <DrawerDescription>
            {t("MY_STAKE_TOPUP_DESCRIPTION")}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4">
          {/* Top-up amount card — mirrors stake-p2p-start input card */}
          <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {t("MY_STAKE_AMOUNT_LABEL")}
              </p>
              {isP2PBalanceLoading ? (
                <Skeleton className="h-6 w-24 rounded-full" />
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-foreground text-xs">
                  <Wallet className="size-3 text-muted-foreground" />
                  <span className="font-semibold tabular-nums">
                    {truncateAmount(p2pBalance)}
                  </span>
                  <span className="font-normal text-muted-foreground">
                    $P2P
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                // biome-ignore lint/a11y/noAutofocus: amount input is the primary action in this drawer
                autoFocus
                placeholder="0"
                aria-label={t("MY_STAKE_AMOUNT_LABEL")}
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
            {exceedsCap && remainingTopUpCap !== null && (
              <p className="mt-2 text-destructive text-xs">
                {t("MY_STAKE_MAX_TOPUP_IS", {
                  amount: truncateAmount(remainingTopUpCap),
                })}
              </p>
            )}
          </section>

          {/* Boost preview for the combined (current + top-up) stake */}
          <StakeBoostPreviewCard
            amount={combinedAmountStr}
            label={t("MY_STAKE_UPDATED_UNLOCK_LIMIT")}
          />

          <div className="mt-6">{hasNoBalance && <NoP2pBalanceCta />}</div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleConfirm}
              disabled={!isValid || isProcessing}
              className="w-full rounded-2xl py-6 font-semibold text-base"
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {t("MY_STAKE_TOPUP_CONFIRM")}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isProcessing}
              className="w-full rounded-2xl py-6 font-semibold text-base"
            >
              {t("CANCEL")}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

interface CooldownCardProps {
  cooldownEnd: number;
  stakedAmount: number;
}

function CooldownCard({ cooldownEnd, stakedAmount }: CooldownCardProps) {
  const { t } = useTranslation();
  const { p2pBoostClaimUnstakeMutation } = useP2PBoost();
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = window.setInterval(
      () => setNow(Math.floor(Date.now() / 1000)),
      30_000,
    );
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, cooldownEnd - now);
  const isReadyToClaim = remaining === 0;
  const days = Math.floor(remaining / 86_400);
  const hours = Math.floor((remaining % 86_400) / 3_600);
  const minutes = Math.floor((remaining % 3_600) / 60);

  const pad2 = (n: number) => n.toString().padStart(2, "0");
  const isClaiming = p2pBoostClaimUnstakeMutation.isPending;

  if (isReadyToClaim) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="text-center font-medium text-muted-foreground text-sm">
          {t("MY_STAKE_CLAIM_READY_HEADING")}
        </p>

        <div className="mt-3 flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/15">
            <ASSETS.ICONS.Logo className="size-7 text-primary" />
          </div>
          <p className="font-bold text-2xl text-primary tabular-nums tracking-tight">
            {truncateAmount(stakedAmount)}{" "}
            <span className="text-muted-foreground text-base">$P2P</span>
          </p>
        </div>

        <Button
          onClick={() => p2pBoostClaimUnstakeMutation.mutate()}
          disabled={isClaiming}
          hapticType="success"
          className="mt-4 w-full rounded-2xl py-6 font-semibold text-base"
        >
          {isClaiming ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("P2P_UNSTAKE_CLAIM_BUTTON")}
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <p className="text-center font-medium text-muted-foreground text-sm">
        {t("MY_STAKE_COOLDOWN_HEADING")}
      </p>

      <div className="mt-3 rounded-xl bg-primary/5 p-4">
        <p className="text-center font-medium text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
          {t("MY_STAKE_COOLDOWN_TIME_REMAINING")}
        </p>
        <div className="mt-2 flex items-baseline justify-center gap-4 font-bold text-3xl text-primary tabular-nums tracking-tight">
          <span>
            {days}
            <span className="ml-1 text-xl text-primary/70">d</span>
          </span>
          <span className="text-primary/40">·</span>
          <span>
            {pad2(hours)}
            <span className="ml-1 text-xl text-primary/70">h</span>
          </span>
          <span className="text-primary/40">·</span>
          <span>
            {pad2(minutes)}
            <span className="ml-1 text-xl text-primary/70">m</span>
          </span>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground tabular-nums">
          {new Date(cooldownEnd * 1000).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>
    </section>
  );
}

const STAKE_STATUS_STYLES: Record<
  number,
  { labelKey: string; className: string }
> = {
  1: {
    labelKey: "STAKE_STATUS_ACTIVE",
    className: "bg-emerald-500/15 text-emerald-500",
  },
  2: {
    labelKey: "STAKE_STATUS_COOLDOWN",
    className: "bg-amber-500/15 text-amber-500",
  },
  3: {
    labelKey: "STAKE_STATUS_SEIZED",
    className: "bg-destructive/15 text-destructive",
  },
};

function StakeStatusPill({ status }: { status: number }) {
  const { t } = useTranslation();
  const style = STAKE_STATUS_STYLES[status];
  if (!style) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-[11px] uppercase tracking-wider ${style.className}`}
    >
      {t(style.labelKey)}
    </span>
  );
}

const ACTIVITY_LABEL_KEYS: Record<string, string> = {
  STAKED: "MY_STAKE_ACTIVITY_STAKED",
  TOPPED_UP: "MY_STAKE_ACTIVITY_TOPPED_UP",
  UNSTAKE_REQUESTED: "MY_STAKE_ACTIVITY_UNSTAKE_REQUESTED",
  UNSTAKE_CLAIMED: "MY_STAKE_ACTIVITY_UNSTAKE_CLAIMED",
  COOLDOWN_EXTENDED: "MY_STAKE_ACTIVITY_COOLDOWN_EXTENDED",
  SEIZED: "MY_STAKE_ACTIVITY_SEIZED",
};

const ACTIVITY_ICONS: Record<
  string,
  { Icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  STAKED: { Icon: ASSETS.ICONS.Logo, className: "bg-primary/15 text-primary" },
  TOPPED_UP: {
    Icon: ASSETS.ICONS.Logo,
    className: "bg-primary/15 text-primary",
  },
  UNSTAKE_REQUESTED: {
    Icon: LockOpen,
    className: "bg-amber-500/15 text-amber-500",
  },
  UNSTAKE_CLAIMED: {
    Icon: CheckCircle2,
    className: "bg-emerald-500/15 text-emerald-500",
  },
  COOLDOWN_EXTENDED: {
    Icon: Clock,
    className: "bg-amber-500/15 text-amber-500",
  },
  SEIZED: {
    Icon: ShieldAlert,
    className: "bg-destructive/15 text-destructive",
  },
};

const ACTIVITY_PAGE_SIZE = 10;

const ACTIVITIES_WITH_AMOUNT = new Set([
  "STAKED",
  "TOPPED_UP",
  "UNSTAKE_REQUESTED",
  "UNSTAKE_CLAIMED",
  "SEIZED",
]);

function formatActivityTimestamp(tsSeconds: number) {
  return new Date(tsSeconds * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function StakeActivityList() {
  const { t } = useTranslation();
  const {
    data: activitiesData,
    isLoading,
    isError,
  } = useUserP2PStakeActivities();
  const [visibleCount, setVisibleCount] = useState(ACTIVITY_PAGE_SIZE);

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("MY_STAKE_ACTIVITY_TITLE")}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {t("MY_STAKE_ACTIVITY_TITLE")}
        </p>
        <p className="mt-3 text-center text-destructive text-sm">
          {t("MY_STAKE_ACTIVITY_FAILED")}
        </p>
      </section>
    );
  }

  const activities = activitiesData ?? [];
  if (activities.length === 0) {
    return null;
  }

  const visibleActivities = activities.slice(0, visibleCount);
  const hasMore = activities.length > visibleCount;

  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
      <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {t("MY_STAKE_ACTIVITY_TITLE")}
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {visibleActivities.map((a) => {
          const meta = ACTIVITY_ICONS[a.activityType] ?? ACTIVITY_ICONS.STAKED;
          const Icon = meta.Icon;
          const labelKey = ACTIVITY_LABEL_KEYS[a.activityType];
          const label = labelKey ? t(labelKey) : a.activityType;
          const showAmount = ACTIVITIES_WITH_AMOUNT.has(a.activityType);
          const amount = showAmount
            ? Number(formatUnits(BigInt(a.amount), 6))
            : null;
          const ts = Number(a.timestamp);
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-background/60 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${meta.className}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground text-sm">
                    {label}
                  </p>
                  <p className="text-muted-foreground text-[11px] tabular-nums">
                    {formatActivityTimestamp(ts)}
                  </p>
                </div>
              </div>
              {amount !== null && (
                <p className="shrink-0 font-bold text-foreground text-sm tabular-nums">
                  {a.activityType === "SEIZED" ||
                  a.activityType === "UNSTAKE_CLAIMED"
                    ? "−"
                    : a.activityType === "UNSTAKE_REQUESTED"
                      ? ""
                      : "+"}
                  {truncateAmount(amount)}{" "}
                  <span className="font-medium text-[10px] text-muted-foreground">
                    $P2P
                  </span>
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <Button
          variant="outline"
          onClick={() => setVisibleCount((c) => c + ACTIVITY_PAGE_SIZE)}
          className="mt-3 w-full rounded-xl"
        >
          {t("SHOW_MORE")}
        </Button>
      )}
    </section>
  );
}
