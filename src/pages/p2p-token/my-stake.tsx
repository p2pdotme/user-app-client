import { Clock, Loader2, Plus, Sparkles, Wallet } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatUnits, parseUnits } from "viem";
import { NonHomeHeader } from "@/components";
import { StakeBoostPreviewCard } from "@/components/p2p-token/stake-p2p-start";
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
  useStakeBoostMetrics,
  useStakeBoostPreview,
  useUserStake,
} from "@/hooks";
import { truncateAmount } from "@/lib/utils";

export function P2PMyStake() {
  const { t } = useTranslation();
  const { userStake, isUserStakeLoading } = useUserStake();
  const { p2pBoostRequestUnstakeMutation } = useP2PBoost();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // TODO: 18 decimal to 6
  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 18))
    : 0;
  const status = userStake ? Number(userStake.status) : 0;
  const cooldownEnd = userStake ? Number(userStake.cooldownEnd) : 0;
  const isActive = status === 1;
  const isCoolingDown = status === 2;

  const { maxBoostUsd, progressPct, tokensPerUsd, headroom } =
    useStakeBoostMetrics(String(stakedAmount));
  const { buyLimitBoost, sellLimitBoost, payLimitBoost } = useStakeBoostPreview(
    String(stakedAmount),
  );
  const isCapReached = progressPct >= 100;
  const stakedUsd =
    tokensPerUsd !== null && tokensPerUsd > 0 ? stakedAmount / tokensPerUsd : 0;
  const isUnstaking = p2pBoostRequestUnstakeMutation.isPending;

  const handleUnstake = () => {
    p2pBoostRequestUnstakeMutation.mutate();
  };

  return (
    <>
      <NonHomeHeader title={t("MY_STAKE_TITLE")} />
      <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-6 pb-8">
        {isUserStakeLoading ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : (
          <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-4">
            {/* Header: label + status pill */}
            <div className="flex items-center justify-between">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                {t("MY_STAKE_STAKED_LABEL")}
              </p>
            </div>

            {/* Staked amount + USD equivalent */}
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-bold text-4xl text-foreground tabular-nums tracking-tight">
                {truncateAmount(stakedAmount)}
              </span>
              <span className="text-muted-foreground text-base">$P2P</span>
            </div>
            {tokensPerUsd !== null && tokensPerUsd > 0 && (
              <p className="mt-1 text-muted-foreground text-xs tabular-nums">
                ≈ ${truncateAmount(stakedUsd)} at today's rate
              </p>
            )}

            {maxBoostUsd > 0 && (
              <>
                <div className="my-4 h-px bg-border/60" />

                {/* Section label */}
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Order Limit Boosted
                </p>

                {/* Buy / Sell / Pay tiles */}
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      Buy
                    </dt>
                    <dd className="mt-0.5 font-bold text-emerald-500 text-sm tabular-nums">
                      +${truncateAmount(buyLimitBoost ?? 0)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      Sell
                    </dt>
                    <dd className="mt-0.5 font-bold text-emerald-500 text-sm tabular-nums">
                      +${truncateAmount(sellLimitBoost ?? 0)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-background/60 px-2 py-1.5 text-center">
                    <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
                      Pay
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
                        Boost maxed out
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground tabular-nums">
                          ${truncateAmount(headroom)}
                        </span>{" "}
                        more limit to unlock
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {isCoolingDown && cooldownEnd > 0 && (
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-amber-500 text-xs">
                <span className="inline-flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="size-3" />
                  Unlocks
                </span>
                <span className="font-semibold tabular-nums">
                  {new Date(cooldownEnd * 1000).toLocaleString()}
                </span>
              </div>
            )}
          </section>
        )}

        {isActive && (
          <div className="flex gap-2">
            <Button
              onClick={() => setIsTopUpOpen(true)}
              disabled={isUnstaking || isCapReached}
              className="flex-1 rounded-2xl py-6 font-semibold text-base"
            >
              <Plus className="size-4" />
              {isCapReached ? "Boost Maxed Out" : t("MY_STAKE_TOPUP_BUTTON")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnstake}
              disabled={isUnstaking}
              hapticType="warning"
              className="flex-1 rounded-2xl py-6 font-semibold text-base"
            >
              {isUnstaking ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t("MY_STAKE_UNSTAKE_BUTTON")}...
                </span>
              ) : (
                t("UNSTAKE")
              )}
            </Button>
          </div>
        )}
      </main>

      <TopUpDrawer
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        stakedAmount={stakedAmount}
      />
    </>
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

  // TODO: 18 decimal to 6
  const p2pBalance = p2pBalanceRaw ? Number(formatUnits(p2pBalanceRaw, 18)) : 0;
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

  const handleAmountChange = (value: string) => {
    setAmount(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  };

  const handleConfirm = () => {
    p2pBoostTopUpMutation.mutate(
      { tokens: parseUnits(amount, 18) },
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
            Stake more $P2P to unlock higher order limits.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4">
          {/* Top-up amount card — mirrors stake-p2p-start input card */}
          <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                Amount
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
                aria-label={"amount"}
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
            {exceedsCap && remainingTopUpCap !== null && (
              <p className="mt-2 text-destructive text-xs">
                Max top-up is {truncateAmount(remainingTopUpCap)} $P2P
              </p>
            )}
          </section>

          {/* Boost preview for the combined (current + top-up) stake */}
          <StakeBoostPreviewCard
            amount={combinedAmountStr}
            label="Updated Unlock Limit"
          />

          <div className="flex flex-col gap-2 mt-8">
            <Button
              onClick={handleConfirm}
              disabled={!isValid || isProcessing}
              className="w-full rounded-2xl py-6 font-semibold text-base"
            >
              {isProcessing ? <Loader2 className="size-4 animate-spin" /> : null}
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
