import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { toast } from "sonner";
import type { Address } from "thirdweb";
import { encodePacked, formatUnits, keccak256, toBytes } from "viem";
import { useSettings } from "@/contexts/settings";
import {
  claimRecommendation,
  claimRecommendationRevenue,
  getCmVotesPerEpoch,
  isCommunityManager as getIsCommunityManager,
  getRecommenderReward,
  getRecommenderRewardPercentageByCurrency,
  getVotedBy,
  getVotesBy,
  getVotesPerEpoch,
} from "@/core/adapters/thirdweb/actions/reputation-manager";
import {
  ReferralUrlParamsSchema,
  RewardSchema,
  VoteSchema,
} from "@/core/p2pdotme/shared/validation";
import { useAnalytics, useThirdweb } from "@/hooks";
import { EVENTS } from "@/lib/analytics";
import { parseContractError } from "@/lib/errors";
import { captureError, withSentrySpan } from "@/lib/sentry";
import {
  clearStoredParams,
  getStoredParams,
} from "@/lib/url-param-preservation";
import { truncateAmount } from "@/lib/utils";

interface UseReferralLinkReturn {
  generateLink: () => Promise<void>;
  shareUrl: string | null;
  isPending: boolean;
  copyReferralLink: () => void;
  shareReferralLink: () => void;
}

export function useReferralLink(
  userRp: number,
  recommenderAddress: string,
): UseReferralLinkReturn {
  const { t } = useTranslation();
  const { wallet, account } = useThirdweb();
  const { track } = useAnalytics();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Validate hook arguments
  // (If you want to move this to validation.ts, you can create a schema for the args as well)
  // For now, keep inline for simplicity
  // ... existing code ...

  const generateLink = useCallback(async () => {
    if (userRp < 150) {
      toast.info(t("NEED_ATLEAST_150_LIMIT_TO_GENERATE_LINK"));
      return;
    }
    if (!wallet) {
      toast.warning(t("WALLET_NOT_CONNECTED"));
      return;
    }
    try {
      setIsPending(true);
      const nonce = Math.floor(Math.random() * 1000000);
      const message = keccak256(
        encodePacked(
          ["address", "uint256"],
          [recommenderAddress, BigInt(nonce)],
        ),
      );
      if (!wallet) {
        throw new Error(t("NO_ACCOUNT_AVAILABLE"));
      }
      const signature = await wallet.getAccount()?.signMessage({
        message: { raw: toBytes(message) },
      });
      const url = `${window.location.origin}/recommend?address=${recommenderAddress}&nonce=${nonce}&signature=${signature}`;
      setShareUrl(url);
      track(EVENTS.REFERRAL, {
        status: "generated",
        userId: account?.address,
      });
    } catch (err) {
      console.error(t("FAILED_TO_GENERATE_REFERRAL_LINK_LOG"), err);
      toast.error(t("FAILED_TO_GENERATE_REFERRAL_LINK"));
    } finally {
      setIsPending(false);
    }
  }, [userRp, recommenderAddress, wallet, t, track, account?.address]);

  const copyReferralLink = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast.success(t("REFERRAL_LINK_COPIED"));
    track(EVENTS.REFERRAL, {
      status: "copied",
      userId: account?.address,
    });
  }, [shareUrl, t, track, account?.address]);

  const shareReferralLink = useCallback(() => {
    if (!shareUrl) return;
    if (navigator.share) {
      track(EVENTS.REFERRAL, {
        status: "shared",
        userId: account?.address,
      });
      navigator.share({ url: shareUrl });
    } else {
      copyReferralLink();
    }
  }, [shareUrl, copyReferralLink, track, account?.address]);

  return {
    generateLink,
    shareUrl,
    isPending,
    copyReferralLink,
    shareReferralLink,
  };
}

// Hook for fetching recommendations given by the user
export function useRecommendationsGiven() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const {
    data: recommendationsGiven,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommendations-given", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        throw new Error(t("NO_ACCOUNT_ADDRESS_AVAILABLE"));
      }
      return getVotesBy({
        voter: account.address as Address,
      }).match(
        (votesData) => {
          // Zod validation
          const parsed = VoteSchema.array().safeParse(votesData);
          if (!parsed.success) {
            console.error(
              t("USE_RECOMMENDATIONS_GIVEN_ERROR_VALIDATING_VOTES"),
              parsed.error,
            );
            throw parsed.error;
          }
          return parsed.data.map((vote, index) => ({
            id: index + 1,
            address: vote.voter,
            date: new Date(Number(vote.timestamp) * 1000).toLocaleDateString(),
            timestamp: vote.timestamp,
          }));
        },
        (error) => {
          console.error(
            t("USE_RECOMMENDATIONS_GIVEN_ERROR_FETCHING_VOTES"),
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });
  return {
    recommendationsGiven: recommendationsGiven || [],
    isPending,
    isError,
    error,
  };
}

// Hook for fetching current month recommendations given by the user
export function useCurrentMonthRecommendationsGiven() {
  const { recommendationsGiven, isPending, isError, error } =
    useRecommendationsGiven();

  // Filter recommendations to current month only
  const currentMonthRecommendations = recommendationsGiven.filter(
    (recommendation) => {
      const recommendationDate = new Date(
        Number(recommendation.timestamp) * 1000,
      );
      const now = new Date();

      return (
        recommendationDate.getMonth() === now.getMonth() &&
        recommendationDate.getFullYear() === now.getFullYear()
      );
    },
  );

  return {
    recommendationsGiven: currentMonthRecommendations,
    isPending,
    isError,
    error,
  };
}

// Hook for fetching recommendations received by the user
export function useRecommendationsReceived() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const {
    data: recommendationsReceived,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommendations-received", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        throw new Error(t("NO_ACCOUNT_ADDRESS_AVAILABLE"));
      }
      return getVotedBy({
        user: account.address as Address,
      }).match(
        (votesData) => {
          // Zod validation
          const parsed = VoteSchema.array().safeParse(votesData);
          if (!parsed.success) {
            console.error(
              t("USE_RECOMMENDATIONS_RECEIVED_ERROR_VALIDATING_VOTES"),
              parsed.error,
            );
            throw parsed.error;
          }
          // Return only the first record
          const firstVote = parsed.data[0];
          if (!firstVote) {
            return [];
          }
          return [
            {
              id: 1,
              address: firstVote.voter,
              date: new Date(
                Number(firstVote.timestamp) * 1000,
              ).toLocaleDateString(),
              timestamp: firstVote.timestamp,
            },
          ];
        },
        (error) => {
          console.error(
            t("USE_RECOMMENDATIONS_RECEIVED_ERROR_FETCHING_VOTES"),
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });
  return {
    recommendationsReceived: recommendationsReceived || [],
    isPending,
    isError,
    error,
  };
}

// Hook for claiming a recommendation
export function useClaimRecommendation() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["recommendation", "claimRecommendation"],
    mutationFn: async (params: {
      recommender: Address;
      recipient: Address;
      nonce: bigint;
      signature: string;
    }) => {
      if (!account) {
        throw new Error(t("WALLET_NOT_CONNECTED"));
      }

      return withSentrySpan(
        "referral.claim_recommendation",
        "Claim Recommendation",
        async () => {
          return claimRecommendation(params, account).match(
            (txReceipt) => {
              console.log("[useClaimRecommendation] Success", txReceipt);
              return txReceipt;
            },
            (error) => {
              console.error("[useClaimRecommendation] Error", error);

              captureError(error, {
                operation: "claim_recommendation",
                component: "useClaimRecommendation",
                userId: account.address,
                extra: {
                  recommender: params.recommender,
                  recipient: params.recipient,
                  nonce: params.nonce.toString(),
                },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations-received"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations-given"] });
      toast.success(t("RECOMMENDATION_CLAIMED_SUCCESSFULLY"));
    },
    onError: (error: unknown) => {
      console.error("[useClaimRecommendation] Mutation error", error);
      captureError(error, {
        operation: "claim_recommendation",
        component: "useClaimRecommendation",
        userId: account?.address,
      });
      toast.error(
        t(parseContractError(error) ?? "FAILED_TO_CLAIM_RECOMMENDATION"),
      );
    },
  });
  return mutation;
}

// Hook for handling recommendation URL parameters
export function useRecommendationUrlParams() {
  const location = useLocation();
  const [senderAddr, setSenderAddr] = useState<string>("");
  const [hasRecommendationParams, setHasRecommendationParams] = useState(false);
  const checkRecommendationParams = useCallback(() => {
    const searchParams = new URLSearchParams(location.search);
    let address = searchParams.get("address");
    let nonce = searchParams.get("nonce");
    let signature = searchParams.get("signature");

    // If we have URL parameters, use them and clear stored parameters
    if (address || nonce || signature) {
      // Clear stored parameters since we have URL parameters
      clearStoredParams();
    } else {
      // Only check stored parameters if no URL parameters exist
      const storedParams = getStoredParams();
      if (storedParams) {
        address = storedParams.address || null;
        nonce = storedParams.nonce || null;
        signature = storedParams.signature || null;
      }
    }

    const hasParams = !!(address && nonce && signature);
    setHasRecommendationParams(hasParams);
    if (address) {
      setSenderAddr(address);
    }
    // Zod validation
    const result = ReferralUrlParamsSchema.safeParse({
      address,
      nonce,
      signature,
    });
    if (!result.success) {
      return {
        address: undefined,
        nonce: undefined,
        signature: undefined,
        hasParams: false,
        error: result.error,
      };
    }
    return { ...result.data, hasParams };
  }, [location.search]);
  const clearUrlParams = useCallback(() => {
    window.history.replaceState(null, "", window.location.origin);
    // Also clear stored parameters
    clearStoredParams();
    setSenderAddr("");
    setHasRecommendationParams(false);
  }, []);
  return {
    senderAddr,
    hasRecommendationParams,
    checkRecommendationParams,
    clearUrlParams,
  };
}

// Hook for fetching recommender reward amount
export function useRecommenderReward() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const {
    data: recommenderReward,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["recommender-reward", account?.address],
    queryFn: async () => {
      if (!account?.address) {
        throw new Error(t("NO_ACCOUNT_ADDRESS_AVAILABLE"));
      }
      return getRecommenderReward({
        address: account.address as Address,
      }).match(
        (reward) => {
          // Zod validation
          const parsed = RewardSchema.safeParse(reward);
          if (!parsed.success) {
            console.error(
              "[useRecommenderReward] Error validating reward",
              parsed.error,
            );
            throw parsed.error;
          }
          const rewardInUsdc = formatUnits(parsed.data, 6);
          return truncateAmount(rewardInUsdc, 2);
        },
        (error) => {
          console.error("[useRecommenderReward] Error fetching reward", error);
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });
  return {
    recommenderReward: recommenderReward || 0,
    isPending,
    isError,
    error,
    refetch,
  };
}

// Hook for fetching recommender reward percentage by currency
export function useRecommenderRewardPercentage() {
  const {
    settings: { currency },
  } = useSettings();

  const {
    data: rewardPercentage,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommender-reward-percentage", currency.currency],
    queryFn: async () => {
      return getRecommenderRewardPercentageByCurrency({
        currency: currency.currency,
      }).match(
        (percentage) => {
          const parsed = RewardSchema.safeParse(percentage);
          if (!parsed.success) {
            console.error(
              "[useRecommenderRewardPercentage] Error validating percentage",
              parsed.error,
            );
            throw parsed.error;
          }
          return Number(parsed.data) / 10;
        },
        (error) => {
          console.error(
            "[useRecommenderRewardPercentage] Error fetching percentage",
            error,
          );
          throw error;
        },
      );
    },
  });
  return {
    rewardPercentage: rewardPercentage || 0,
    isPending,
    isError,
    error,
  };
}

// Hook for claiming recommendation revenue
export function useClaimRecommendationRevenue() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["recommendation", "claimRecommendationRevenue"],
    mutationFn: async () => {
      if (!account) {
        throw new Error(t("WALLET_NOT_CONNECTED"));
      }

      return withSentrySpan(
        "referral.claim_revenue",
        "Claim Recommendation Revenue",
        async () => {
          return claimRecommendationRevenue({}, account).match(
            (txReceipt) => {
              console.log("[useClaimRecommendationRevenue] Success", txReceipt);
              return txReceipt;
            },
            (error) => {
              console.error("[useClaimRecommendationRevenue] Error", error);

              captureError(error, {
                operation: "claim_recommendation_revenue",
                component: "useClaimRecommendationRevenue",
                userId: account.address,
                extra: {},
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommender-reward"] });
      queryClient.invalidateQueries({ queryKey: ["usdc", "balance"] });
      toast.success(t("RECOMMENDATION_REVENUE_CLAIMED_SUCCESSFULLY"));
    },
    onError: (error: unknown) => {
      console.error("[useClaimRecommendationRevenue] Mutation error", error);
      captureError(error, {
        operation: "claim_recommendation_revenue",
        component: "useClaimRecommendationRevenue",
        userId: account?.address,
      });
      toast.error(t("FAILED_TO_CLAIM_RECOMMENDATION_REVENUE"));
    },
  });
  return mutation;
}

// Hook for fetching votes per epoch (max recommendations for regular users)
export function useVotesPerEpoch() {
  const {
    data: votesPerEpoch,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["votes-per-epoch"],
    queryFn: async () => {
      return getVotesPerEpoch().match(
        (votes) => {
          // Should be a BigInt, return as number for convenience
          return Number(votes);
        },
        (error) => {
          console.error(
            "[useVotesPerEpoch] Error fetching votes per epoch",
            error,
          );
          throw error;
        },
      );
    },
  });
  return {
    votesPerEpoch: votesPerEpoch ?? 0,
    isPending,
    isError,
    error,
    refetch,
  };
}

// Hook for fetching CM votes per epoch (max recommendations for community managers)
export function useCmVotesPerEpoch() {
  const {
    data: cmVotesPerEpoch,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cm-votes-per-epoch"],
    queryFn: async () => {
      return getCmVotesPerEpoch().match(
        (votes) => {
          // Should be a BigInt, return as number for convenience
          return Number(votes);
        },
        (error) => {
          console.error(
            "[useCmVotesPerEpoch] Error fetching CM votes per epoch",
            error,
          );
          throw error;
        },
      );
    },
  });
  return {
    cmVotesPerEpoch: cmVotesPerEpoch ?? 0,
    isPending,
    isError,
    error,
    refetch,
  };
}

// Hook for fetching if the current user is a community manager
export function useIsCommunityManager() {
  const { account } = useThirdweb();
  const {
    data: isCommunityManager,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["is-community-manager", account?.address],
    queryFn: async () => {
      if (!account?.address) return false;
      return getIsCommunityManager({
        address: account.address as Address,
      }).match(
        (result) => result,
        (error) => {
          console.error("[useIsCommunityManager] Error fetching status", error);
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });
  return {
    isCommunityManager: !!isCommunityManager,
    isPending,
    isError,
    error,
    refetch,
  };
}
