import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/contexts";
import type { Currency } from "@/core";
import { getRewardsConfig } from "@/core/adapters/thirdweb";
import { bpsToPercent } from "@/lib/utils";

interface RewardsConfigSummary {
  merchantRewardPercent: string;
  circleAdminRewardPercent: string;
  circleStakerRewardPercent: string;
  delegatedStakeMerchantSharePercent: string;
  delegatedStakeAdminSharePercent: string;
  delegatedStakePoolSharePercent: string;
}

export function useRewardsConfig(currencySymbol?: Currency["currency"]) {
  const {
    settings: { currency },
  } = useSettings();

  const {
    data: rewardsConfig,
    isLoading: isRewardsConfigLoading,
    isError: isRewardsConfigError,
    error: rewardsConfigError,
  } = useQuery<RewardsConfigSummary>({
    queryKey: ["rewardsConfig", currencySymbol || currency.currency],
    queryFn: async () => {
      return getRewardsConfig(currencySymbol || currency.currency).match(
        (value) => ({
          merchantRewardPercent: bpsToPercent(String(value.merchantRewardBps)),
          circleAdminRewardPercent: bpsToPercent(
            String(value.circleAdminRewardBps),
          ),
          circleStakerRewardPercent: bpsToPercent(
            String(value.circleStakerRewardBps),
          ),
          delegatedStakeMerchantSharePercent: bpsToPercent(
            String(value.delegatedStakeMerchantShareBps),
          ),
          delegatedStakeAdminSharePercent: bpsToPercent(
            String(value.delegatedStakeAdminShareBps),
          ),
          delegatedStakePoolSharePercent: bpsToPercent(
            String(value.delegatedStakePoolShareBps),
          ),
        }),
        (error) => {
          throw error;
        },
      );
    },
    enabled: !!currency.currency,
  });

  return {
    rewardsConfig,
    isRewardsConfigLoading,
    isRewardsConfigError,
    rewardsConfigError,
  };
}
