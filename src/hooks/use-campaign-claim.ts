import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import type { Address } from "thirdweb";
import { stringToHex } from "viem";
import {
  claimCampaignUsdc,
  claimReward,
  getUserCampaignReward,
} from "@/core/adapters/thirdweb/actions/reputation-manager";
import {
  type CampaignUrlParams,
  type ClaimCampaignUsdcParams,
  type ClaimRewardParams,
  type GetUserCampaignRewardParams,
  ZodCampaignUrlParamsSchema,
  ZodClaimRewardParamsSchema,
  ZodGetUserCampaignRewardParamsSchema,
} from "@/core/p2pdotme/shared/validation";
import { useAnalytics } from "@/hooks/use-analytics";
import { getUserFacingErrorReasonKey, useThirdweb } from "@/hooks/use-thirdweb";
import { EVENTS } from "@/lib/analytics";
import { INTERNAL_HREFS } from "@/lib/constants";
import { parseContractError } from "@/lib/errors";
import { captureError, withSentrySpan } from "@/lib/sentry";
import {
  clearStoredParams,
  getStoredParams,
} from "@/lib/url-param-preservation";
import {
  getUserFacingErrorMessage,
  isUserCancellation,
} from "@/lib/user-facing-error";
import { safeParseWithResult } from "@/lib/zod-neverthrow";

export function useCampaignClaim() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { account } = useThirdweb();
  const { track } = useAnalytics();
  const queryClient = useQueryClient();
  const [campaignParams, setCampaignParams] =
    useState<CampaignUrlParams | null>(null);

  // Check for campaign URL parameters
  const checkCampaignParams = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    let manager = searchParams.get("manager");
    let id = searchParams.get("id");

    // If we have URL parameters, use them and clear stored parameters
    if (manager || id) {
      // Clear stored parameters since we have URL parameters
      clearStoredParams();
    } else {
      // Only check stored parameters if no URL parameters exist
      const storedParams = getStoredParams();
      if (storedParams) {
        manager = storedParams.manager || null;
        id = storedParams.id || null;
      }
    }

    if (!manager || !id) {
      return;
    }
    // Use Zod to validate params
    const parseResult = safeParseWithResult(ZodCampaignUrlParamsSchema, {
      manager,
      id,
    });
    if (parseResult.isErr()) {
      console.error(
        "[useCampaignClaim] Invalid campaign URL params:",
        parseResult.error,
      );
      return;
    }
    setCampaignParams(parseResult.value);
  }, [location.search]);

  useEffect(() => {
    checkCampaignParams();
  }, [checkCampaignParams]);

  const hasCampaignParams = !!campaignParams;

  // Get user campaign reward
  const userCampaignRewardQuery = useQuery({
    queryKey: ["user-campaign-reward", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        throw new Error(t("NO_ACCOUNT_ADDRESS_AVAILABLE"));
      }
      const params: GetUserCampaignRewardParams = {
        address: account.address as Address,
      };
      const parseResult = safeParseWithResult(
        ZodGetUserCampaignRewardParamsSchema,
        params,
      );
      if (parseResult.isErr()) {
        throw new Error(t("INVALID_USER_CAMPAIGN_REWARD_PARAMS"));
      }
      return getUserCampaignReward(params).match(
        (reward) => reward,
        (error) => {
          console.error(
            "[useCampaignClaim] Error fetching user campaign reward:",
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });

  // Claim campaign mutation
  const claimCampaignMutation = useMutation({
    mutationKey: ["campaign", "claimReward"],
    mutationFn: async () => {
      if (!account?.address || !campaignParams) {
        throw new Error(t("MISSING_ACCOUNT_OR_CAMPAIGN_PARAMETERS"));
      }
      const { manager, id } = campaignParams;
      if (!manager || !id) {
        throw new Error(t("INVALID_CAMPAIGN_PARAMETERS"));
      }
      const managerBytes32 = stringToHex(manager, { size: 32 });
      const params: ClaimRewardParams = {
        campaignId: parseInt(id, 10),
        usernameHash: managerBytes32,
      };
      const parseResult = safeParseWithResult(
        ZodClaimRewardParamsSchema,
        params,
      );
      if (parseResult.isErr()) {
        throw new Error(t("INVALID_USER_CAMPAIGN_REWARD_PARAMS"));
      }

      return withSentrySpan(
        "campaign.claim_reward",
        "Claim Campaign Reward",
        async () => {
          return claimReward(parseResult.value, account).match(
            (receipt) => receipt,
            (error) => {
              console.error(
                "[useCampaignClaim] Error claiming campaign reward:",
                error,
              );

              captureError(error, {
                operation: "claim_campaign_reward",
                component: "useCampaignClaim",
                userId: account.address,
                extra: {
                  campaignId: params.campaignId,
                  manager,
                },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      track(EVENTS.REFERRAL, {
        status: "campaign_claim_success",
        campaignId: campaignParams?.id,
      });
      toast.success(t("CAMPAIGN_REWARD_CLAIMED_SUCCESSFULLY"));
      clearUrlParams();
      queryClient.invalidateQueries({ queryKey: ["user-campaign-reward"] });
      queryClient.invalidateQueries({
        queryKey: ["user-campaign-reward-check"],
      });
      // The claim drawer promises "you'll be taken to your My Limits page",
      // which is where the reward is shown and claimed.
      navigate(INTERNAL_HREFS.LIMITS);
    },
    onError: (error: Error) => {
      console.error("[useCampaignClaim] Campaign claim failed:", error);
      captureError(error, {
        operation: "claim_campaign_reward",
        component: "useCampaignClaim",
        userId: account?.address,
      });
      if (isUserCancellation(error)) {
        track(EVENTS.REFERRAL, {
          status: "campaign_claim_cancelled",
          campaignId: campaignParams?.id,
        });
        return;
      }
      const contractErrorKey = parseContractError(error);
      track(EVENTS.REFERRAL, {
        status: "campaign_claim_failed",
        campaignId: campaignParams?.id,
        reason: contractErrorKey ?? getUserFacingErrorReasonKey(error),
      });
      toast.error(t("FAILED_TO_CLAIM_CAMPAIGN_REWARD"), {
        description: contractErrorKey
          ? t(contractErrorKey)
          : getUserFacingErrorMessage(t, error),
      });
    },
  });

  /**
   * Starts the claim. Never throws: on failure the mutation's error state is
   * set (and a friendly toast shown) so the drawer can stay open with Retry.
   */
  const claimCampaign = useCallback(async (): Promise<boolean> => {
    if (!account?.address) {
      toast.warning(t("WALLET_NOT_CONNECTED"));
      return false;
    }
    if (!campaignParams) {
      toast.warning(t("NO_CAMPAIGN_PARAMETERS_FOUND"));
      return false;
    }
    track(EVENTS.REFERRAL, {
      status: "campaign_claim_started",
      campaignId: campaignParams.id,
    });
    try {
      await claimCampaignMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [account?.address, campaignParams, claimCampaignMutation, t, track]);

  const clearUrlParams = useCallback(() => {
    window.history.replaceState(null, "", window.location.origin);
    // Also clear stored parameters
    clearStoredParams();
    setCampaignParams(null);
  }, []);

  return {
    hasCampaignParams,
    campaignParams,
    claimCampaign,
    clearUrlParams,
    claimCampaignMutation,
    userCampaignRewardQuery,
  };
}

export function useClaimCampaignUsdc() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const queryClient = useQueryClient();
  const claimCampaignUsdcMutation = useMutation({
    mutationKey: ["campaign", "claimCampaignUsdc"],
    mutationFn: async () => {
      if (!account?.address) {
        throw new Error(t("NO_ACCOUNT_ADDRESS_AVAILABLE"));
      }
      const params: ClaimCampaignUsdcParams = {};

      return withSentrySpan(
        "campaign.claim_usdc",
        "Claim Campaign USDC",
        async () => {
          return claimCampaignUsdc(params, account).match(
            (receipt) => receipt,
            (error) => {
              console.error(
                "[useClaimCampaignUsdc] Error claiming campaign USDC:",
                error,
              );

              captureError(error, {
                operation: "claim_campaign_usdc",
                component: "useClaimCampaignUsdc",
                userId: account.address,
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      toast.success(t("CAMPAIGN_USDC_CLAIMED_SUCCESSFULLY"));
      queryClient.invalidateQueries({
        queryKey: ["user-campaign-reward-check"],
      });
    },
    onError: (error: Error) => {
      console.error(
        "[useClaimCampaignUsdc] Campaign USDC claim failed:",
        error,
      );
      captureError(error, {
        operation: "claim_campaign_usdc",
        component: "useClaimCampaignUsdc",
        userId: account?.address,
      });
      if (isUserCancellation(error)) return;
      toast.error(t("FAILED_TO_CLAIM_CAMPAIGN_USDC"), {
        description: getUserFacingErrorMessage(t, error),
      });
    },
  });

  const claimCampaignUsdcReward = useCallback(async (): Promise<boolean> => {
    if (!account?.address) {
      toast.error(t("WALLET_NOT_CONNECTED"));
      return false;
    }
    try {
      await claimCampaignUsdcMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [account?.address, claimCampaignUsdcMutation, t]);

  return {
    claimCampaignUsdcReward,
    claimCampaignUsdcMutation,
  };
}

export function useHasUnclaimedCampaignRewards() {
  const { account } = useThirdweb();
  const userCampaignRewardQuery = useQuery({
    queryKey: ["user-campaign-reward-check", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        return BigInt(0);
      }
      const params: GetUserCampaignRewardParams = {
        address: account.address as Address,
      };
      const parseResult = safeParseWithResult(
        ZodGetUserCampaignRewardParamsSchema,
        params,
      );
      if (parseResult.isErr()) {
        return BigInt(0);
      }
      return getUserCampaignReward(parseResult.value).match(
        (reward) => reward,
        (error) => {
          console.error("[useHasUnclaimedCampaignRewards] Error:", error);
          return BigInt(0);
        },
      );
    },
    enabled: !!account?.address,
  });
  return {
    hasUnclaimedRewards:
      (userCampaignRewardQuery.data || BigInt(0)) > BigInt(0),
    rewardAmount: userCampaignRewardQuery.data || BigInt(0),
    isLoading: userCampaignRewardQuery.isLoading,
    error: userCampaignRewardQuery.error,
    userCampaignRewardQuery,
  };
}
