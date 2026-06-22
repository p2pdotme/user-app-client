import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { formatUnits } from "viem";
import ASSETS from "@/assets";
import { CardTitle } from "@/components/ui/card";
import { useP2PTokenInfo, useUserStake } from "@/hooks";
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

  const { tokenInfo } = useP2PTokenInfo();

  if (isUserStakeLoading) return null;
  if (!isActive || stakedAmount <= 0) return null;

  const marketPrice = tokenInfo?.market.usdPrice ?? null;
  const stakedUsd = marketPrice != null ? stakedAmount * marketPrice : null;

  const handleViewMyStake = () => navigate(INTERNAL_HREFS.P2P_TOKEN_MY_STAKE);

  return (
    <div className="flex w-full flex-col items-center justify-center py-4">
      <button
        type="button"
        onClick={handleViewMyStake}
        className="w-full rounded-xl bg-primary/5 px-6 py-4 text-left transition-colors hover:bg-primary/10">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{t("MY_STAKE")}</CardTitle>
          <div className="flex min-w-0 items-center gap-2">
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
      </button>
    </div>
  );
}
