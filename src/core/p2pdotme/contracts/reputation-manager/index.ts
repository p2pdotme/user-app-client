import { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { encodeFunctionData, stringToHex } from "viem";
import {
  type ClaimCampaignUsdcParams,
  type ClaimRecommendationParams,
  type ClaimRecommendationRevenueParams,
  type ClaimRewardParams,
  createP2PError,
  type GetRecommenderRewardPercentageByCurrencyParams,
  type GetUserTaskLedgerParams,
  type P2PError,
  type UserParams,
  validate,
  ZodBinanceRpParamsSchema,
  ZodBvnRpParamsSchema,
  ZodClaimCampaignUsdcParamsSchema,
  ZodClaimRecommendationParamsSchema,
  ZodClaimRecommendationRevenueParamsSchema,
  ZodClaimRewardParamsSchema,
  ZodCmVotesPerEpochParamsSchema,
  ZodCurrentEpochParamsSchema,
  ZodFacebookRpParamsSchema,
  ZodGetRecommenderRewardPercentageByCurrencyParamsSchema,
  ZodGetUserTaskLedgerParamsSchema,
  ZodGitHubRpParamsSchema,
  ZodInstagramRpParamsSchema,
  ZodLinkedInRpParamsSchema,
  ZodLivenessRpParamsSchema,
  ZodOnChainActivityRpParamsSchema,
  ZodUserParamsSchema,
  ZodVotesPerEpochParamsSchema,
  ZodXRpParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareGetRMUserArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "rmusers";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "rmusers" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetUserTaskLedgerArgs(
  params: GetUserTaskLedgerParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "getUserTaskLedger";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodGetUserTaskLedgerParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "getUserTaskLedger" as const,
      args: [validatedParams.userAddr],
    }),
  );
}

export function prepareGetOnChainActivityRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "onChainActivityRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodOnChainActivityRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "onChainActivityRp" as const,
    args: [],
  }));
}

export function prepareGetLinkedInRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "linkedInRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodLinkedInRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "linkedInRp" as const,
    args: [],
  }));
}

export function prepareGetGitHubRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "gitHubRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodGitHubRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "gitHubRp" as const,
    args: [],
  }));
}

export function prepareGetInstagramRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "instagramRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodInstagramRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "instagramRp" as const,
    args: [],
  }));
}

export function prepareGetXRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "xRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodXRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "xRp" as const,
    args: [],
  }));
}

export function prepareGetKycRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "kycRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodXRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "kycRp" as const,
    args: [],
  }));
}

export function prepareGetIsKycVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "kycVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "kycVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetBvnRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "bvnRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodBvnRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "bvnRp" as const,
    args: [],
  }));
}

export function prepareGetIsBvnVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "bvnVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "bvnVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetLivenessRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "livenessRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodLivenessRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "livenessRp" as const,
    args: [],
  }));
}

export function prepareGetIsLivenessVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "livenessVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "livenessVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetFacebookRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "facebookRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodFacebookRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "facebookRp" as const,
    args: [],
  }));
}

export function prepareGetBinanceRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "binanceRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodBinanceRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "binanceRp" as const,
    args: [],
  }));
}

export function prepareGetVotesPerEpochArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "votesPerEpoch";
    args: [];
  },
  P2PError
> {
  return validate(ZodVotesPerEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "votesPerEpoch" as const,
    args: [],
  }));
}

export function prepareGetCmVotesPerEpochArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "cmVotesPerEpoch";
    args: [];
  },
  P2PError
> {
  return validate(ZodCmVotesPerEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "cmVotesPerEpoch" as const,
    args: [],
  }));
}

export function prepareGetVotesByArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "getVotesBy";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "getVotesBy" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetVotedByArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "getVotedBy";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "getVotedBy" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsCommunityManagerArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isCommunityManager";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isCommunityManager" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetRecommenderRewardArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "recommenderReward";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "recommenderReward" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetRecommenderRewardPercentageByCurrencyArgs(
  params: GetRecommenderRewardPercentageByCurrencyParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "recommenderRewardPercentageByCurrency";
    args: [`0x${string}`];
  },
  P2PError
> {
  return validate(
    ZodGetRecommenderRewardPercentageByCurrencyParamsSchema,
    params,
  ).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "recommenderRewardPercentageByCurrency" as const,
    args: [stringToHex(validatedParams.currency, { size: 32 })],
  }));
}

export function prepareGetSocialVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "socialVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "socialVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetUserCampaignRewardArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "userCampaignReward";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "userCampaignReward" as const,
    args: [validatedParams.address],
  }));
}

export function prepareClaimCampaignUsdcTx(
  params: ClaimCampaignUsdcParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodClaimCampaignUsdcParamsSchema, params).andThen(() =>
    Result.fromThrowable(
      () => ({
        to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
        data: encodeFunctionData({
          abi: ABIS.REPUTATION_MANAGER,
          functionName: "claimCampaignUsdc",
          args: [],
        }),
      }),
      (error) =>
        createP2PError("Failed to prepare claimCampaignUsdc contract call", {
          domain: "reputation-manager",
          code: "P2PPrepareFunctionCallError",
          cause: error,
          context: {
            operation: "prepareClaimCampaignUsdcTx",
            timestamp: Math.floor(Date.now() / 1000),
          },
        }),
    )(),
  );
}

export function prepareClaimRecommendationTx(
  params: ClaimRecommendationParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodClaimRecommendationParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "claimRecommendation",
            args: [
              validatedParams.recommender,
              validatedParams.recipient,
              validatedParams.nonce,
              validatedParams.signature as `0x${string}`,
            ],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare claimRecommendation contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareClaimRecommendationTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareClaimRecommendationRevenueTx(
  params: ClaimRecommendationRevenueParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodClaimRecommendationRevenueParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "claimRecommendationRevenue",
            args: [],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare claimRecommendationRevenue contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareClaimRecommendationRevenueTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareClaimRewardTx(
  params: ClaimRewardParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodClaimRewardParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "claimReward",
            args: [
              BigInt(validatedParams.campaignId),
              validatedParams.usernameHash as `0x${string}`,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare claimReward contract call", {
            domain: "reputation-manager",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareClaimRewardTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareGetVolumeMilestoneOneArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "VOLUME_MILESTONE_1";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "VOLUME_MILESTONE_1" as const,
    args: [],
  }));
}

export function prepareGetVolumeMilestoneTwoArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "VOLUME_MILESTONE_2";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "VOLUME_MILESTONE_2" as const,
    args: [],
  }));
}

export function prepareGetVolumeMilestoneThreeArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "VOLUME_MILESTONE_3";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "VOLUME_MILESTONE_3" as const,
    args: [],
  }));
}

export function prepareGetVolumeMilestoneFourArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "VOLUME_MILESTONE_4";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "VOLUME_MILESTONE_4" as const,
    args: [],
  }));
}
