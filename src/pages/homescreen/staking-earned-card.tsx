import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { CollapsibleCard } from "@/components/collapsible-card";
import { Button } from "@/components/ui/button";
import { useP2PTokenInfo, useStakeBoostPreview, useUserStake } from "@/hooks";
import { INTERNAL_HREFS } from "@/lib/constants";
import { truncateAmount } from "@/lib/utils";

export function StakingEarnedCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userStake, isUserStakeLoading } = useUserStake();

  const stakedAmount = userStake
    ? Number(formatUnits(userStake.stakedAmount, 6))
    : 0;
  const status = userStake ? Number(userStake.status) : 0;
  const isActive = status === 1;

  const { unlockedUSD } = useStakeBoostPreview(String(stakedAmount));
  const { tokenInfo } = useP2PTokenInfo();

  if (isUserStakeLoading) return null;
  if (!isActive || stakedAmount <= 0) return null;

  const marketPrice = tokenInfo?.market.usdPrice ?? null;
  const stakedUsd = marketPrice != null ? stakedAmount * marketPrice : null;

  const handleViewMyStake = () => {
    navigate(INTERNAL_HREFS.P2P_TOKEN_MY_STAKE);
  };

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <CollapsibleCard title={t("MY_STAKE")} storageKey="card-collapse:staking">
        <div className="flex w-full flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ASSETS.ICONS.Logo className="size-5 text-primary" />
              </div>
              <span className="font-medium text-foreground text-lg">
                {truncateAmount(stakedAmount)} $P2P
              </span>
            </div>
            {stakedUsd != null && (
              <span className="text-muted-foreground text-sm">
                ≈ ${stakedUsd.toFixed(3)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              {t("MY_STAKE_ORDER_LIMIT_BOOSTED")}
            </span>
            <span className="font-medium text-foreground text-sm tabular-nums">
              +${truncateAmount(unlockedUSD ?? 0)} {t("P2P_STAKE_USDC_LIMIT")}
            </span>
          </div>
          <Button
            variant="link"
            onClick={handleViewMyStake}
            className="h-auto self-start p-0 no-underline hover:no-underline">
            {t("VIEW_MY_STAKE")}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CollapsibleCard>
    </div>
  );
}
