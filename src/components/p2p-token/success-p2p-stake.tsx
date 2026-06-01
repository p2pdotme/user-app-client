import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Sparkles, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { Skeleton } from "@/components/ui/skeleton";
import { useStakeBoostPreview, useTxLimits, useUserStake } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";

interface OrderLimitCardProps {
  /** Header label shown above the Buy and Sell/Pay tiles. */
  label: string;
  /** Optional Buy limit boost (USD) shown as a +$X chip beneath the value. */
  buyBoost?: number;
  /** Optional Sell/Pay limit boost (USD) shown as a +$X chip beneath the value. */
  sellBoost?: number;
}

/**
 * OrderLimitCard — displays the user's current per-transaction Buy and
 * Sell/Pay USD limits in a two-tile layout.
 *
 * Reads `txLimit` from `useTxLimits` and renders skeletons while loading.
 * If `buyBoost` or `sellBoost` is provided and > 0, an emerald "+$X" chip is
 * shown under the corresponding limit to indicate the unlock from a new
 * stake.
 */
export function OrderLimitCard({
  label,
  buyBoost = 0,
  sellBoost = 0,
}: OrderLimitCardProps) {
  const { t } = useTranslation();
  const { txLimit, isTxLimitLoading, isTxLimitError } = useTxLimits();

  const buyLimit = txLimit?.buyLimit ?? 0;
  const sellLimit = txLimit?.sellLimit ?? 0;

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-3">
      <div className="flex items-center gap-2">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="size-3 text-primary" />
        </div>
        <p className="font-medium text-muted-foreground text-sm tracking-wider">
          {label}
        </p>
      </div>

      <dl className="mt-2.5 flex items-stretch gap-2">
        <div className="flex-1 rounded-lg bg-background/60 px-3 py-2">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {t("BUY")}
          </dt>
          {isTxLimitLoading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <dd className="font-bold text-foreground text-lg tabular-nums">
              {isTxLimitError ? (
                "—"
              ) : (
                <>
                  {truncateAmount(buyLimit, 0)}{" "}
                  <span className="font-medium text-[10px] text-muted-foreground">
                    USDC
                  </span>
                </>
              )}
            </dd>
          )}
          {buyBoost > 0 && (
            <p className="mt-0.5 inline-flex items-center gap-0.5 font-medium text-[11px] text-emerald-500 tabular-nums">
              <TrendingUp className="size-3" />+{truncateAmount(buyBoost)}{" "}
              <span className="font-medium text-[10px] text-muted-foreground">
                USDC
              </span>
            </p>
          )}
        </div>
        <div className="flex-1 rounded-lg bg-background/60 px-3 py-2">
          <dt className="text-muted-foreground text-[10px] uppercase tracking-wider">
            {t("SELL")} / {t("PAY")}
          </dt>
          {isTxLimitLoading ? (
            <Skeleton className="mt-1 h-6 w-16" />
          ) : (
            <dd className="font-bold text-foreground text-lg tabular-nums">
              {isTxLimitError ? (
                "—"
              ) : (
                <>
                  {truncateAmount(sellLimit, 0)}{" "}
                  <span className="font-medium text-[10px] text-muted-foreground">
                    USDC
                  </span>
                </>
              )}
            </dd>
          )}
          {sellBoost > 0 && (
            <p className="mt-0.5 inline-flex items-center gap-0.5 font-medium text-[11px] text-emerald-500 tabular-nums">
              <TrendingUp className="size-3" />+{truncateAmount(sellBoost)}{" "}
              <span className="font-medium text-[10px] text-muted-foreground">
                USDC
              </span>
            </p>
          )}
        </div>
      </dl>
    </section>
  );
}

interface SuccessP2pStakeProps {
  /** Amount the user just staked, in human-readable $P2P. */
  amount: string;
}

/**
 * SuccessP2pStake — step 3 (final) of the staking flow.
 *
 * Confirmation screen shown after the stake transaction succeeds. Reads the
 * user's current on-chain stake via `useUserStake` and displays the total
 * staked $P2P amount. Also shows the new per-transaction Buy and Sell/Pay
 * limits (from `useTxLimits`) along with the boost just unlocked from this
 * stake (`useStakeBoostPreview(amount)`).
 */
export function SuccessP2pStake({ amount }: SuccessP2pStakeProps) {
  const { userStake, isUserStakeLoading } = useUserStake();
  const { buyLimitBoost, sellLimitBoost } = useStakeBoostPreview(amount);

  // TODO: 18 decimal to 6
  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 18))
    : 0;

  const buyBoost = buyLimitBoost ?? 0;
  const sellBoost = sellLimitBoost ?? 0;

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col gap-4 overflow-y-auto px-4 pt-2 pb-8">
      {/* Hero — animation + status */}
      <section className="flex flex-col items-center text-center">
        <div className="relative -mb-2 overflow-hidden">
          <DotLottieReact
            className="h-40 w-80 origin-center scale-200"
            src={ASSETS.ANIMATIONS.COMPLETED}
            autoplay
          />
        </div>
        <h2 className="font-bold text-2xl text-foreground tracking-tight">
          Staked Successfully
        </h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Your boost is now active.
        </p>
      </section>

      {/* Total staked card */}
      <section className="rounded-2xl border border-border/60 bg-card/40 p-4">
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
          Total Staked
        </p>
        {isUserStakeLoading ? (
          <Skeleton className="mt-1.5 h-10 w-40" />
        ) : (
          <p className="mt-1 font-bold text-4xl text-foreground tabular-nums tracking-tight">
            {truncateAmount(stakedAmount)}{" "}
            <span className="text-muted-foreground text-2xl">$P2P</span>
          </p>
        )}
      </section>

      <OrderLimitCard
        label="Your New Limits"
        buyBoost={buyBoost}
        sellBoost={sellBoost}
      />

      <p className="mt-auto px-2 text-center text-muted-foreground text-xs leading-relaxed">
        You can increase your stake or unstake anytime from{" "}
        <Link
          to={INTERNAL_HREFS.LIMITS}
          replace
          className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
        >
          My Limits
        </Link>
        .
      </p>
    </main>
  );
}
