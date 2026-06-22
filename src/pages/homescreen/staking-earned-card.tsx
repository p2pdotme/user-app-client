import { useTranslation } from "react-i18next";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { Card, CardTitle } from "@/components/ui/card";
import { useP2PTokenInfo, useUserStake } from "@/hooks";
import { truncateAmount } from "@/lib/utils";

export function StakingEarnedCard() {
  const { t } = useTranslation();
  const { userStake, isUserStakeLoading } = useUserStake();

  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 6))
    : 0;
  const status = userStake ? Number(userStake.status) : 0;
  const isActive = status === 1;

  const { tokenInfo } = useP2PTokenInfo();

  if (isUserStakeLoading) return null;
  if (!isActive || stakedAmount <= 0) return null;

  const marketPrice = tokenInfo?.market.usdPrice ?? null;
  const stakedUsd = marketPrice != null ? stakedAmount * marketPrice : null;

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <Card className="w-full border-none bg-primary/5 px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("MY_STAKE")}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ASSETS.ICONS.Logo className="size-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground text-lg">
              {truncateAmount(stakedAmount)} $P2P
            </span>
            {stakedUsd != null && (
              <span className="text-muted-foreground text-sm">
                ≈ ${stakedUsd.toFixed(3)}
              </span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
