import { useProfile, useZkkyc } from "@p2pdotme/sdk/react";
import type {
  SimpleKycSubmitParams,
  SocialVerifyParams,
} from "@p2pdotme/sdk/zkkyc";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { formatUnits } from "viem";
import { useSettings } from "@/contexts";
import { getSocialVerified, getUser } from "@/core/adapters/thirdweb";
import {
  getMaxBuyTxLimit,
  getMaxSellTxLimit,
} from "@/core/adapters/thirdweb/actions/p2p-config";
import {
  getBinanceRp,
  getFacebookRp,
  getGitHubRp,
  getInstagramRp,
  getKycRp,
  getLinkedInRp,
  getNumTxns,
  getOnChainActivityBase,
  getOnChainActivityRp,
  getRMUser,
  getXRp,
  isKycVerified,
  sendPreparedTx,
} from "@/core/adapters/thirdweb/actions/reputation-manager";
import { captureError, withSentrySpan } from "@/lib/sentry";
import { useThirdweb } from "./use-thirdweb";

export function useTxLimits() {
  const { account } = useThirdweb();
  const {
    settings: { currency },
  } = useSettings();
  const profile = useProfile();

  const {
    data: txLimit,
    isLoading: isTxLimitLoading,
    isError: isTxLimitError,
    error: txLimitError,
  } = useQuery({
    queryKey: ["tx-limit", currency.currency],
    queryFn: async () => {
      return profile
        .getTxLimits({
          address: account?.address as Address,
          currency: currency.currency,
        })
        .match(
          (txLimitData) => {
            console.log("[useTxLimits] Tx limit data", txLimitData);
            return txLimitData;
          },
          (error) => {
            console.error("[useTxLimits] Error fetching tx limit", error);
            throw error;
          },
        );
    },
    enabled: !!account?.address,
  });

  return {
    txLimit,
    isTxLimitLoading,
    isTxLimitError,
    txLimitError,
  };
}

export function useSocialVerificationStatus() {
  const { account } = useThirdweb();

  const {
    data: socialStatus,
    isLoading: isSocialStatusLoading,
    isError: isSocialStatusError,
    error: socialStatusError,
    refetch: refetchSocialStatus,
  } = useQuery({
    queryKey: ["social-verification-status", account?.address],
    queryFn: async () => {
      if (!account?.address) throw new Error("No account connected");
      return getSocialVerified({ address: account.address as Address }).match(
        (result) => {
          // result: [linkedIn, gitHub, x, instagram, facebook, passport, binance]
          return {
            isLinkedInVerified: result[0],
            isGitHubVerified: result[1],
            isXVerified: result[2],
            isInstagramVerified: result[3],
            isFacebookVerified: result[4],
            isBinanceVerified: result[6],
          };
        },
        (error) => {
          console.error(
            "[useSocialVerificationStatus] Error fetching status",
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });

  return {
    ...socialStatus,
    isSocialStatusLoading,
    isSocialStatusError,
    socialStatusError,
    refetchSocialStatus,
  };
}

export function useSocialVerify() {
  const { account } = useThirdweb();
  const zkkyc = useZkkyc();

  const mutation = useMutation({
    mutationFn: async (params: SocialVerifyParams) => {
      if (!account) throw new Error("No account connected");
      return withSentrySpan(
        "limits.social_verify",
        "Social Verification",
        async () => {
          return sendPreparedTx(
            zkkyc.prepareSocialVerify(params),
            account,
            "socialVerify",
          ).match(
            (txReceipt) => txReceipt,
            (error) => {
              captureError(error, {
                operation: "social_verify",
                component: "useSocialVerify",
                userId: account.address,
                extra: { ...params },
              });
              console.error("[useSocialVerify] Error in socialVerify", error);
              throw error;
            },
          );
        },
      );
    },
  });

  return mutation;
}

export function useSocialRpRewards() {
  const {
    data: linkedInRp,
    isLoading: isLinkedInRpLoading,
    isError: isLinkedInRpError,
    error: linkedInRpError,
  } = useQuery({
    queryKey: ["social-rp-reward", "linkedin"],
    queryFn: async () => {
      return getLinkedInRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  const {
    data: gitHubRp,
    isLoading: isGitHubRpLoading,
    isError: isGitHubRpError,
    error: gitHubRpError,
  } = useQuery({
    queryKey: ["social-rp-reward", "github"],
    queryFn: async () => {
      return getGitHubRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  const {
    data: instagramRp,
    isLoading: isInstagramRpLoading,
    isError: isInstagramRpError,
    error: instagramRpError,
  } = useQuery({
    queryKey: ["social-rp-reward", "instagram"],
    queryFn: async () => {
      return getInstagramRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  const {
    data: xRp,
    isLoading: isXRpLoading,
    isError: isXRpError,
    error: xRpError,
  } = useQuery({
    queryKey: ["social-rp-reward", "x"],
    queryFn: async () => {
      return getXRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  const {
    data: facebookRp,
    isLoading: isFacebookRpLoading,
    isError: isFacebookRpError,
    error: facebookRpError,
  } = useQuery({
    queryKey: ["social-rp-reward", "facebook"],
    queryFn: async () => {
      return getFacebookRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  const {
    data: binanceRp,
    isLoading: isBinanceRpLoading,
    isError: isBinanceRpError,
    error: binanceRpError,
  } = useQuery({
    queryKey: ["social-rp-reward", "binance"],
    queryFn: async () => {
      return getBinanceRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  return {
    linkedInRp,
    gitHubRp,
    instagramRp,
    xRp,
    facebookRp,
    binanceRp,
    isLoading:
      isLinkedInRpLoading ||
      isGitHubRpLoading ||
      isInstagramRpLoading ||
      isXRpLoading ||
      isFacebookRpLoading ||
      isBinanceRpLoading,
    isError:
      isLinkedInRpError ||
      isGitHubRpError ||
      isInstagramRpError ||
      isXRpError ||
      isFacebookRpError ||
      isBinanceRpError,
    error:
      linkedInRpError ||
      gitHubRpError ||
      instagramRpError ||
      xRpError ||
      facebookRpError ||
      binanceRpError,
  };
}

export function useKycRpReward() {
  const {
    data: kycRp,
    isLoading: isKycRpLoading,
    isError: isKycRpError,
    error: kycRpError,
  } = useQuery({
    queryKey: ["kyc-rp-reward"],
    queryFn: async () => {
      return getKycRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  return { kycRp, isKycRpLoading, isKycRpError, kycRpError };
}

export function useKycVerificationStatus() {
  const { account } = useThirdweb();

  const {
    data: isKycVerifiedStatus,
    isLoading: isKycStatusLoading,
    isError: isKycStatusError,
    error: kycStatusError,
    refetch: refetchKycStatus,
  } = useQuery({
    queryKey: ["kyc-verification-status", account?.address],
    queryFn: async () => {
      if (!account?.address) throw new Error("No account connected");
      return isKycVerified({ address: account.address as Address }).match(
        (result) => result,
        (error) => {
          console.error(
            "[useKycVerificationStatus] Error fetching status",
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });

  return {
    isKycVerified: isKycVerifiedStatus,
    isKycStatusLoading,
    isKycStatusError,
    kycStatusError,
    refetchKycStatus,
  };
}

export function useSubmitKycAttestation() {
  const { account } = useThirdweb();
  const zkkyc = useZkkyc();
  const mutation = useMutation({
    mutationFn: async (params: SimpleKycSubmitParams) => {
      if (!account) throw new Error("No account connected");
      return withSentrySpan(
        "limits.submit_kyc_attestation",
        "Submit KYC Attestation",
        async () => {
          return sendPreparedTx(
            zkkyc.prepareSubmitKycAttestation(params),
            account,
            "submitKycAttestation",
          ).match(
            (txReceipt) => txReceipt,
            (error) => {
              captureError(error, {
                operation: "submit_kyc_attestation",
                component: "useSubmitKycAttestation",
                userId: account.address,
              });
              console.error(
                "[useSubmitKycAttestation] Error in submitKycAttestation",
                error,
              );
              throw error;
            },
          );
        },
      );
    },
  });
  return mutation;
}

export function useUserOrderProgress() {
  const { account } = useThirdweb();

  const {
    data: userOrderProgress,
    isLoading: isUserOrderProgressLoading,
    isError: isUserOrderProgressError,
    error: userOrderProgressError,
  } = useQuery({
    queryKey: ["user-order-progress", account?.address],
    queryFn: async () => {
      if (!account?.address) throw new Error("No account connected");
      return getUser({ address: account.address as Address })
        .andThen((user) => {
          return getNumTxns({ address: account.address as Address }).map(
            (txnCount) => ({
              numOrdersPlaced: Number(user.numOrdersPlaced),
              numOrdersCompleted: Number(txnCount),
            }),
          );
        })
        .match(
          (result) => result,
          (error) => {
            console.error(
              "[useUserOrderProgress] Error fetching user order progress",
              error,
            );
            throw error;
          },
        );
    },
    enabled: !!account?.address,
  });

  return {
    ...userOrderProgress,
    isUserOrderProgressLoading,
    isUserOrderProgressError,
    userOrderProgressError,
  };
}

export function useUserOrderVolume() {
  const { account } = useThirdweb();

  const {
    data: userOrderVolume,
    isLoading: isUserOrderVolumeLoading,
    isError: isUserOrderVolumeError,
    error: userOrderVolumeError,
  } = useQuery({
    queryKey: ["user-order-volume", account?.address],
    queryFn: async () => {
      if (!account?.address) throw new Error("No account connected");
      return getUser({ address: account.address as Address })
        .map((user) => ({
          totalVolume: Number(formatUnits(user.usdtVolume, 6)),
        }))
        .match(
          (result) => result,
          (error) => {
            console.error(
              "[useUserOrderVolume] Error fetching user order volume",
              error,
            );
            throw error;
          },
        );
    },
    enabled: !!account?.address,
  });

  return {
    ...userOrderVolume,
    isUserOrderVolumeLoading,
    isUserOrderVolumeError,
    userOrderVolumeError,
  };
}

export function useOnChainActivityBase() {
  const {
    data: onChainActivityBase,
    isLoading: isOnChainActivityBaseLoading,
    isError: isOnChainActivityBaseError,
    error: onChainActivityBaseError,
  } = useQuery({
    queryKey: ["on-chain-activity-base"],
    queryFn: async () => {
      return getOnChainActivityBase().match(
        (value) => Number(value),
        (error) => {
          console.error("[useOnChainActivityBase] Error fetching base", error);
          throw error;
        },
      );
    },
  });

  return {
    onChainActivityBase,
    isOnChainActivityBaseLoading,
    isOnChainActivityBaseError,
    onChainActivityBaseError,
  };
}

export function useOnChainActivityRp() {
  const {
    data: onChainActivityRp,
    isLoading: isOnChainActivityRpLoading,
    isError: isOnChainActivityRpError,
    error: onChainActivityRpError,
  } = useQuery({
    queryKey: ["on-chain-activity-rp"],
    queryFn: async () => {
      return getOnChainActivityRp().match(
        (value) => Number(value),
        (error) => {
          console.error("[useOnChainActivityRp] Error fetching RP", error);
          throw error;
        },
      );
    },
  });

  return {
    onChainActivityRp,
    isOnChainActivityRpLoading,
    isOnChainActivityRpError,
    onChainActivityRpError,
  };
}

export function useUserRp() {
  const { account } = useThirdweb();

  const {
    data: userRp,
    isLoading: isUserRpLoading,
    isError: isUserRpError,
    error: userRpError,
  } = useQuery({
    queryKey: ["user-rp", account?.address],
    queryFn: async () => {
      if (!account?.address) throw new Error("No account connected");
      return getRMUser({ address: account.address as Address }).match(
        (rmUser) => {
          // rmUser returns [reputationPoints, voteCount, isBlacklisted]
          return Number(rmUser[0]);
        },
        (error) => {
          console.error("[useUserRp] Error fetching user RP", error);
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });

  return {
    userRp: userRp ?? 0,
    isUserRpLoading,
    isUserRpError,
    userRpError,
  };
}

export function useMaxBuyTxLimit() {
  const {
    settings: { currency },
  } = useSettings();

  const {
    data: maxBuyTxLimit,
    isLoading: isMaxBuyTxLimitLoading,
    isError: isMaxBuyTxLimitError,
    error: maxBuyTxLimitError,
  } = useQuery({
    queryKey: ["max-buy-tx-limit", currency.currency],
    queryFn: async () => {
      return getMaxBuyTxLimit(currency.currency).match(
        (value) => value,
        (error) => {
          console.error(
            "[useMaxBuyTxLimit] Error fetching max buy tx limit",
            error,
          );
          throw error;
        },
      );
    },
  });

  return {
    maxBuyTxLimit,
    isMaxBuyTxLimitLoading,
    isMaxBuyTxLimitError,
    maxBuyTxLimitError,
  };
}

export function useMaxSellTxLimit() {
  const {
    settings: { currency },
  } = useSettings();

  const {
    data: maxSellTxLimit,
    isLoading: isMaxSellTxLimitLoading,
    isError: isMaxSellTxLimitError,
    error: maxSellTxLimitError,
  } = useQuery({
    queryKey: ["max-sell-tx-limit", currency.currency],
    queryFn: async () => {
      return getMaxSellTxLimit(currency.currency).match(
        (value) => value,
        (error) => {
          console.error(
            "[useMaxSellTxLimit] Error fetching max sell tx limit",
            error,
          );
          throw error;
        },
      );
    },
  });

  return {
    maxSellTxLimit,
    isMaxSellTxLimitLoading,
    isMaxSellTxLimitError,
    maxSellTxLimitError,
  };
}
