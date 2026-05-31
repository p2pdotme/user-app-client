import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStake } from "@/hooks";
import { truncateAmount } from "@/lib/utils";

/**
 * SuccessP2pStake — step 3 (final) of the staking flow.
 *
 * Confirmation screen shown after the stake transaction succeeds. Reads the
 * user's current on-chain stake via `useUserStake` and displays the total
 * staked $P2P amount (formatted from 18-decimal base units).
 */
export function SuccessP2pStake() {
  const { t } = useTranslation();
  const { userStake, isUserStakeLoading } = useUserStake();

  // TODO: 18 decimal to 6
  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 18))
    : 0;

  return (
    <main className="no-scrollbar container-narrow flex h-full w-full flex-col items-center justify-center gap-4 overflow-y-auto px-4 py-6 pb-28 text-center">
      <CheckCircle2 className="size-16 text-emerald-500" />
      <h2 className="font-bold text-2xl text-foreground">
        {t("P2P_STAKE_SUCCESS")}
      </h2>
      {isUserStakeLoading ? (
        <Skeleton className="h-8 w-40 rounded-full" />
      ) : (
        <p className="font-semibold text-3xl text-foreground tabular-nums tracking-tight">
          {truncateAmount(stakedAmount)}{" "}
          <span className="text-muted-foreground">$P2P</span>
        </p>
      )}
    </main>
  );
}
