import { useProfile, useZkkyc } from "@p2pdotme/sdk/react";
import type {
  AnonAadharProofParams,
  SocialVerifyParams,
  ZkPassportRegisterParams,
} from "@p2pdotme/sdk/zkkyc";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { formatUnits } from "viem";
import { useSettings } from "@/contexts";
import { getSocialVerified, getUser } from "@/core/adapters/thirdweb";
import {
  getAadhaarRp,
  getFacebookRp,
  getGitHubRp,
  getInstagramRp,
  getLinkedInRp,
  getNumTxns,
  getOnChainActivityBase,
  getOnChainActivityRp,
  getPassportRp,
  getRMUser,
  getXRp,
  isAadharVerified,
  isPassportVerified,
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
          // result: [linkedIn, gitHub, x, instagram, facebook, passport]
          return {
            isLinkedInVerified: result[0],
            isGitHubVerified: result[1],
            isXVerified: result[2],
            isInstagramVerified: result[3],
            isFacebookVerified: result[4],
            isZkPassportVerified: result[5],
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

  const {
    data: isZkPassportVerifiedStatus,
    isLoading: isZkPassportStatusLoading,
    isError: isZkPassportStatusError,
    error: zkPassportStatusError,
    refetch: refetchZkPassportStatus,
  } = useQuery({
    queryKey: ["zk-passport-verification-status", account?.address],
    queryFn: async () => {
      if (!account?.address) throw new Error("No account connected");
      return isPassportVerified({ address: account.address as Address }).match(
        (result: boolean) => result,
        (error: unknown) => {
          console.error(
            "[useZkPassportVerificationStatus] Error fetching status",
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
    isZkPassportVerified: isZkPassportVerifiedStatus,
    isSocialStatusLoading,
    isZkPassportStatusLoading,
    isSocialStatusError,
    isZkPassportStatusError,
    socialStatusError,
    zkPassportStatusError,
    refetchSocialStatus,
    refetchZkPassportStatus,
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
    data: zkPassportRp,
    isLoading: isZkPassportRpLoading,
    isError: isZkPassportRpError,
    error: zkPassportRpError,
  } = useQuery({
    queryKey: ["social-rp-reward", "zkpassport"],
    queryFn: async () => {
      return getPassportRp().match(
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
    zkPassportRp,
    isLoading:
      isLinkedInRpLoading ||
      isGitHubRpLoading ||
      isInstagramRpLoading ||
      isXRpLoading ||
      isFacebookRpLoading ||
      isZkPassportRpLoading,
    isError:
      isLinkedInRpError ||
      isGitHubRpError ||
      isInstagramRpError ||
      isXRpError ||
      isFacebookRpError ||
      isZkPassportRpError,
    error:
      linkedInRpError ||
      gitHubRpError ||
      instagramRpError ||
      xRpError ||
      facebookRpError ||
      zkPassportRpError,
  };
}

export function useAadhaarVerificationStatus() {
  const { account } = useThirdweb();

  const {
    data: isAadhaarVerified,
    isLoading: isAadhaarStatusLoading,
    isError: isAadhaarStatusError,
    error: aadhaarStatusError,
    refetch: refetchAadhaarStatus,
  } = useQuery({
    queryKey: ["aadhaar-verification-status", account?.address],
    queryFn: async () => {
      if (!account?.address) throw new Error("No account connected");
      return isAadharVerified({ address: account.address as Address }).match(
        (result) => result,
        (error) => {
          console.error(
            "[useAadhaarVerificationStatus] Error fetching status",
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });

  return {
    isAadhaarVerified,
    isAadhaarStatusLoading,
    isAadhaarStatusError,
    aadhaarStatusError,
    refetchAadhaarStatus,
  };
}

export function useZkPassportVerificationStatus() {
  const { account } = useThirdweb();

  const {
    data: isZkPassportVerifiedStatus,
    isLoading: isZkPassportStatusLoading,
    isError: isZkPassportStatusError,
    error: zkPassportStatusError,
    refetch: refetchZkPassportStatus,
  } = useQuery({
    queryKey: ["zk-passport-verification-status", account?.address],
    queryFn: async (): Promise<boolean> => {
      if (!account?.address) throw new Error("No account connected");
      return isPassportVerified({ address: account.address as Address }).match(
        (result: boolean) => result,
        (error: unknown) => {
          console.error(
            "[useZkPassportVerificationStatus] Error fetching status",
            error,
          );
          throw error;
        },
      );
    },
    enabled: !!account?.address,
  });

  return {
    isZkPassportVerified: isZkPassportVerifiedStatus,
    isZkPassportStatusLoading,
    isZkPassportStatusError,
    zkPassportStatusError,
    refetchZkPassportStatus,
  };
}

export function useAadhaarRpReward() {
  const {
    data: aadhaarRp,
    isLoading: isAadhaarRpLoading,
    isError: isAadhaarRpError,
    error: aadhaarRpError,
  } = useQuery({
    queryKey: ["aadhaar-rp-reward"],
    queryFn: async () => {
      return getAadhaarRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  return {
    aadhaarRp,
    isAadhaarRpLoading,
    isAadhaarRpError,
    aadhaarRpError,
  };
}

export function useZkPassportRpReward() {
  const {
    data: zkPassportRp,
    isLoading: isZkPassportRpLoading,
    isError: isZkPassportRpError,
    error: zkPassportRpError,
  } = useQuery({
    queryKey: ["zk-passport-rp-reward"],
    queryFn: async () => {
      return getPassportRp().match(
        (value) => Number(value),
        (error) => {
          throw error;
        },
      );
    },
  });

  return {
    zkPassportRp,
    isZkPassportRpLoading,
    isZkPassportRpError,
    zkPassportRpError,
  };
}

export function useSubmitAnonAadhaarProof() {
  const { account } = useThirdweb();
  const zkkyc = useZkkyc();
  const mutation = useMutation({
    mutationFn: async (params: AnonAadharProofParams) => {
      if (!account) throw new Error("No account connected");
      return withSentrySpan(
        "limits.submit_anon_aadhaar_proof",
        "Submit Anon Aadhaar Proof",
        async () => {
          return sendPreparedTx(
            zkkyc.prepareSubmitAnonAadharProof(params),
            account,
            "submitAnonAadharProof",
          ).match(
            (txReceipt) => txReceipt,
            (error) => {
              captureError(error, {
                operation: "submit_anon_aadhaar_proof",
                component: "useSubmitAnonAadhaarProof",
                userId: account.address,
                extra: { ...params },
              });
              console.error(
                "[useSubmitAnonAadhaarProof] Error in submitAnonAadhaarProof",
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

export function useZkPassportRegister() {
  const { account } = useThirdweb();
  const zkkyc = useZkkyc();
  const mutation = useMutation({
    mutationFn: async (params: ZkPassportRegisterParams) => {
      if (!account) throw new Error("No account connected");
      return withSentrySpan(
        "limits.zk_passport_register",
        "ZKPassport Register",
        async () => {
          return sendPreparedTx(
            zkkyc.prepareZkPassportRegister(params),
            account,
            "zkPassportRegister",
          ).match(
            (txReceipt) => txReceipt,
            (error) => {
              captureError(error, {
                operation: "zk_passport_register",
                component: "useZkPassportRegister",
                userId: account.address,
                extra: { ...params },
              });
              console.error(
                "[useZkPassportRegister] Error in zkPassportRegister",
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
