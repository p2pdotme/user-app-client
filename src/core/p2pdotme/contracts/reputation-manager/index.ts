import { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { encodeFunctionData, stringToHex } from "viem";
import {
  type AddOrUpdateCampaignManagerParams,
  type AnonAadharProofParams,
  type ClaimCampaignUsdcParams,
  type ClaimRecommendationParams,
  type ClaimRecommendationRevenueParams,
  type ClaimRewardParams,
  createP2PError,
  type EpochVotesParams,
  type GetRecommenderRewardPercentageByCurrencyParams,
  type GetUserTaskLedgerParams,
  type GetVotedByParams,
  type MarkUserBlacklistedParams,
  type OrderVolumeUpdateRpHookParams,
  type P2PError,
  type RecommenderRewardUpdateParams,
  type SettleDisputeRpHookParams,
  type SocialVerifyParams,
  type ToggleCampaignParams,
  type UpdateLyingUserRpParams,
  type UpdateReputationPointsParams,
  type UpdateSocialParamsParams,
  type UserParams,
  validate,
  type WhitelistContractParams,
  type ZkPassportRegisterParams,
  ZodAadhaarRpParamsSchema,
  ZodAddOrUpdateCampaignManagerParamsSchema,
  ZodAnonAadharProofParamsSchema,
  ZodBinanceRpParamsSchema,
  ZodClaimCampaignUsdcParamsSchema,
  ZodClaimRecommendationParamsSchema,
  ZodClaimRecommendationRevenueParamsSchema,
  ZodClaimRewardParamsSchema,
  ZodClaimVotingRewardsParamsSchema,
  ZodCmVotesPerEpochParamsSchema,
  ZodCreateCampaignParamsSchema,
  ZodCurrentEpochParamsSchema,
  ZodEpochVotesParamsSchema,
  ZodFacebookRpParamsSchema,
  ZodGetRecommenderRewardPercentageByCurrencyParamsSchema,
  ZodGetUserTaskLedgerParamsSchema,
  ZodGetVotedByParamsSchema,
  ZodGitHubRpParamsSchema,
  ZodInstagramRpParamsSchema,
  ZodLinkedInRpParamsSchema,
  ZodMarkUserBlacklistedParamsSchema,
  ZodMaxRpToBeVotedParamsSchema,
  ZodMinRpToVoteParamsSchema,
  ZodOnChainActivityBaseParamsSchema,
  ZodOnChainActivityRpParamsSchema,
  ZodOrderCompleteRpParamsSchema,
  ZodOrderVolumeUpdateRpHookParamsSchema,
  ZodRecommenderRewardUpdateParamsSchema,
  ZodSettleDisputeRpHookParamsSchema,
  ZodSocialVerifyParamsSchema,
  ZodToggleCampaignParamsSchema,
  ZodUpdateLyingUserRpParamsSchema,
  ZodUpdateReputationPointsParamsSchema,
  ZodUpdateSocialParamsParamsSchema,
  ZodUserParamsSchema,
  ZodVerificationRewardParamsSchema,
  ZodVoterSlashRpParamsSchema,
  ZodVotesPerEpochParamsSchema,
  ZodVotingRpParamsSchema,
  ZodWhitelistContractParamsSchema,
  ZodXRpParamsSchema,
  ZodZkPassportRegisterParamsSchema,
  ZodZkPassportRpParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareGetCurrentEpochArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "getCurrentEpoch";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "getCurrentEpoch" as const,
    args: [],
  }));
}

export function prepareGetEpochVotesArgs(params: EpochVotesParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "epochVotes";
    args: [Address, bigint];
  },
  P2PError
> {
  return validate(ZodEpochVotesParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "epochVotes" as const,
    args: [validatedParams.address, BigInt(validatedParams.currentEpoch)],
  }));
}

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

export function prepareGetNumTxnsArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "getNumTxns";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "getNumTxns" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetOrderCompleteRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "orderCompleteRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodOrderCompleteRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "orderCompleteRp" as const,
    args: [],
  }));
}

export function prepareGetVerificationRewardArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "verificationReward";
    args: [];
  },
  P2PError
> {
  return validate(ZodVerificationRewardParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "verificationReward" as const,
    args: [],
  }));
}

export function prepareGetTaskLedgerByIndexArgs(
  params: GetUserTaskLedgerParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "taskLedger";
    args: [Address, bigint];
  },
  P2PError
> {
  return validate(ZodGetUserTaskLedgerParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "taskLedger" as const,
      args: [validatedParams.userAddr, BigInt(0)], // Assuming task index 0, adjust as needed
    }),
  );
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

export function prepareGetIsAadharVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isAadharVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isAadharVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsLinkedInVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isLinkedInVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isLinkedInVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsXVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isXVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isXVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsPassportVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isPassportVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isPassportVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsGitHubVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isGitHubVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isGitHubVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsInstagramVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isInstagramVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isInstagramVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsFacebookVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isFacebookVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isFacebookVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetIsBinanceVerifiedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isBinanceVerified";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isBinanceVerified" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetVotingRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "votingRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodVotingRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "votingRp" as const,
    args: [],
  }));
}

export function prepareGetOnChainActivityBaseArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "onChainActivityBase";
    args: [];
  },
  P2PError
> {
  return validate(ZodOnChainActivityBaseParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "onChainActivityBase" as const,
    args: [],
  }));
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

export function prepareGetAadhaarRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "aadhaarRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodAadhaarRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "aadhaarRp" as const,
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

export function prepareGetPassportRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "passportRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodZkPassportRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "passportRp" as const,
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

export function prepareGetVoterSlashRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "voterSlashRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodVoterSlashRpParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "voterSlashRp" as const,
    args: [],
  }));
}

export function prepareGetMinRpToVoteArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "minRpToVote";
    args: [];
  },
  P2PError
> {
  return validate(ZodMinRpToVoteParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "minRpToVote" as const,
    args: [],
  }));
}

export function prepareGetMaxRpToBeVotedArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "maxRpToBeVoted";
    args: [];
  },
  P2PError
> {
  return validate(ZodMaxRpToBeVotedParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "maxRpToBeVoted" as const,
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

// Additional missing prepare functions for view operations
export function prepareGetScalingFactorArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "SCALING_FACTOR";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "SCALING_FACTOR" as const,
    args: [],
  }));
}

export function prepareGetUpgradeInterfaceVersionArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "UPGRADE_INTERFACE_VERSION";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "UPGRADE_INTERFACE_VERSION" as const,
    args: [],
  }));
}

export function prepareGetAadharProofArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "aadharProof";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "aadharProof" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetAccruedVotingRewardsArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "accruedVotingRewards";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "accruedVotingRewards" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetAdminVotingRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "adminVotingRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "adminVotingRp" as const,
    args: [],
  }));
}

export function prepareGetAnonAadhaarVerifierAddrArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "anonAadhaarVerifierAddr";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "anonAadhaarVerifierAddr" as const,
    args: [],
  }));
}

export function prepareGetCampaignActiveArgs(params: ClaimRewardParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "campaignActive";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodClaimRewardParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "campaignActive" as const,
      args: [BigInt(validatedParams.campaignId)],
    }),
  );
}

export function prepareGetCampaignManagersArgs(
  params: AddOrUpdateCampaignManagerParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "campaignManagers";
    args: [bigint, Address];
  },
  P2PError
> {
  return validate(ZodAddOrUpdateCampaignManagerParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "campaignManagers" as const,
      args: [BigInt(validatedParams.campaignId), validatedParams.manager],
    }),
  );
}

export function prepareGetCampaignUsernamesArgs(
  params: ClaimRewardParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "campaignUsernames";
    args: [string];
  },
  P2PError
> {
  return validate(ZodClaimRewardParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "campaignUsernames" as const,
      args: [validatedParams.usernameHash],
    }),
  );
}

export function prepareGetClaimedOnchainActivityArgs(
  params: GetUserTaskLedgerParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "claimedOnchainActivity";
    args: [Address, bigint];
  },
  P2PError
> {
  return validate(ZodGetUserTaskLedgerParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "claimedOnchainActivity" as const,
      args: [validatedParams.userAddr, BigInt(0)],
    }),
  );
}

export function prepareGetContractCreationTimeArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "contractCreationTime";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "contractCreationTime" as const,
    args: [],
  }));
}

export function prepareGetExchangeConfigArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "exchangeConfig";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "exchangeConfig" as const,
    args: [],
  }));
}

export function prepareGetGelatoAddressArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "gelatoAddress";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "gelatoAddress" as const,
    args: [],
  }));
}

export function prepareGetGitHubMinYearGapArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "githubMinYearGap";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "githubMinYearGap" as const,
    args: [],
  }));
}

export function prepareGetHasVerifiedArgs(params: ClaimRewardParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "hasVerified";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodClaimRewardParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "hasVerified" as const,
      args: [BigInt(validatedParams.campaignId)],
    }),
  );
}

export function prepareGetHasVerifiedUsernameArgs(
  params: ClaimRewardParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "hasVerifiedUsername";
    args: [string, string];
  },
  P2PError
> {
  return validate(ZodClaimRewardParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "hasVerifiedUsername" as const,
      args: ["", validatedParams.usernameHash], // Adjust social name as needed
    }),
  );
}

export function prepareGetInstagramMinYearGapArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "instagramMinYearGap";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "instagramMinYearGap" as const,
    args: [],
  }));
}

export function prepareGetIsWhitelistedArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "isWhitelisted";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "isWhitelisted" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetLyingUserRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "lyingUserRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "lyingUserRp" as const,
    args: [],
  }));
}

export function prepareGetNextCampaignIdArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "nextCampaignId";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "nextCampaignId" as const,
    args: [],
  }));
}

export function prepareGetOrderProcessorArgs(params: ClaimRewardParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "orderProcessor";
    args: [string];
  },
  P2PError
> {
  return validate(ZodClaimRewardParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "orderProcessor" as const,
      args: [validatedParams.usernameHash],
    }),
  );
}

export function prepareGetPrimaryRecommenderArgs(params: UserParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "primaryRecommender";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "primaryRecommender" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetProxiableUUIDArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "proxiableUUID";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "proxiableUUID" as const,
    args: [],
  }));
}

export function prepareGetReclaimAddressArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "reclaimAddress";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "reclaimAddress" as const,
    args: [],
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

export function prepareGetRecommenderRewardMappingArgs(
  params: UserParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "recommenderRewardMapping";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodUserParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "recommenderRewardMapping" as const,
    args: [validatedParams.address],
  }));
}

export function prepareGetRecommenderRewardPercentageArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "recommenderRewardPercentage";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "recommenderRewardPercentage" as const,
    args: [],
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

export function prepareGetRewardClaimedArgs(
  params: AddOrUpdateCampaignManagerParams,
): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "rewardClaimed";
    args: [bigint, Address];
  },
  P2PError
> {
  return validate(ZodAddOrUpdateCampaignManagerParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "rewardClaimed" as const,
      args: [BigInt(validatedParams.campaignId), validatedParams.manager],
    }),
  );
}

export function prepareGetSecondsInMonthArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "secondsInMonth";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "secondsInMonth" as const,
    args: [],
  }));
}

export function prepareGetSettleDisputeRpArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "settleDisputeRp";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "settleDisputeRp" as const,
    args: [],
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

export function prepareGetUsedNoncesArgs(params: ClaimRewardParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "usedNonces";
    args: [bigint];
  },
  P2PError
> {
  return validate(ZodClaimRewardParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "usedNonces" as const,
      args: [BigInt(validatedParams.campaignId)],
    }),
  );
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

export function prepareGetVotedToArgs(params: GetVotedByParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "votedTo";
    args: [Address, Address];
  },
  P2PError
> {
  return validate(ZodGetVotedByParamsSchema, params).map((validatedParams) => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "votedTo" as const,
    args: [validatedParams.user, "0x0000000000000000000000000000000000000000"], // Adjust voter address as needed
  }));
}

export function prepareGetVotesArgs(params: GetUserTaskLedgerParams): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "votes";
    args: [Address, bigint];
  },
  P2PError
> {
  return validate(ZodGetUserTaskLedgerParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
      abi: ABIS.REPUTATION_MANAGER,
      functionName: "votes" as const,
      args: [validatedParams.userAddr, BigInt(0)], // Assuming vote index 0, adjust as needed
    }),
  );
}

export function prepareGetUsdtContractArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "usdtContract";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "usdtContract" as const,
    args: [],
  }));
}

export function prepareGetXMinYearGapArgs(): Result<
  {
    to: Address;
    abi: typeof ABIS.REPUTATION_MANAGER;
    functionName: "xMinYearGap";
    args: [];
  },
  P2PError
> {
  return validate(ZodCurrentEpochParamsSchema, {}).map(() => ({
    to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
    abi: ABIS.REPUTATION_MANAGER,
    functionName: "xMinYearGap" as const,
    args: [],
  }));
}

// Write operation - keeping as transaction
export function prepareSubmitAnonAadharProofTx(
  params: AnonAadharProofParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodAnonAadharProofParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "submitAnonAadharProof",
            args: [
              validatedParams.nullifierSeed,
              validatedParams.nullifier,
              validatedParams.timestamp,
              validatedParams.signal,
              validatedParams.revealArray,
              validatedParams.packedGroth16Proof,
            ],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare submitAnonAadharProof contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareSubmitAnonAadharProofTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
                encodeFunctionDataArgs: {
                  abi: "ABIS.REPUTATION_MANAGER",
                  functionName: "submitAnonAadharProof",
                  args: [
                    validatedParams.nullifierSeed,
                    validatedParams.nullifier,
                    validatedParams.timestamp,
                    validatedParams.signal,
                    validatedParams.revealArray,
                    validatedParams.packedGroth16Proof,
                  ],
                },
              },
            },
          ),
      )(),
  );
}

// Additional write operations
export function prepareAddOrUpdateCampaignManagerTx(
  params: AddOrUpdateCampaignManagerParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodAddOrUpdateCampaignManagerParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "addOrUpdateCampaignManager",
            args: [
              BigInt(validatedParams.campaignId),
              validatedParams.manager,
              validatedParams.usernameHash as `0x${string}`,
              validatedParams.rpReward,
              validatedParams.usdcReward,
              validatedParams.active,
              validatedParams.requiresZk,
              validatedParams.claimLimit,
            ],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare addOrUpdateCampaignManager contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareAddOrUpdateCampaignManagerTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
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

export function prepareClaimVotingRewardsTx(): Result<
  { to: Address; data: `0x${string}` },
  P2PError
> {
  return validate(ZodClaimVotingRewardsParamsSchema, {}).andThen(() =>
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

export function prepareCreateCampaignTx(): Result<
  { to: Address; data: `0x${string}` },
  P2PError
> {
  return validate(ZodCreateCampaignParamsSchema, {}).andThen(() =>
    Result.fromThrowable(
      () => ({
        to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
        data: encodeFunctionData({
          abi: ABIS.REPUTATION_MANAGER,
          functionName: "createCampaign",
          args: [],
        }),
      }),
      (error) =>
        createP2PError("Failed to prepare createCampaign contract call", {
          domain: "reputation-manager",
          code: "P2PPrepareFunctionCallError",
          cause: error,
          context: {
            operation: "prepareCreateCampaignTx",
            timestamp: Math.floor(Date.now() / 1000),
          },
        }),
    )(),
  );
}

export function prepareMarkUserBlacklistedTx(
  params: MarkUserBlacklistedParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodMarkUserBlacklistedParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "markUserBlacklisted",
            args: [validatedParams.user],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare markUserBlacklisted contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareMarkUserBlacklistedTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareOrderVolumeUpdateRpHookTx(
  params: OrderVolumeUpdateRpHookParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodOrderVolumeUpdateRpHookParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "orderVolumeUpdateRpHook",
            args: [
              validatedParams.user as Address,
              validatedParams.userTotalVolume,
              validatedParams.reverse,
            ] as [Address, bigint, boolean],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare orderVolumeUpdateRpHook contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareOrderVolumeUpdateRpHookTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareRecommenderRewardUpdateTx(
  params: RecommenderRewardUpdateParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodRecommenderRewardUpdateParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "recommenderRewardUpdate",
            args: [
              validatedParams.recipient,
              validatedParams.merchant,
              validatedParams.amount,
              validatedParams.reverse,
            ],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare recommenderRewardUpdate contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareRecommenderRewardUpdateTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareSettleDisputeRpHookTx(
  params: SettleDisputeRpHookParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodSettleDisputeRpHookParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "settleDisputeRpHook",
            args: [validatedParams.user],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare settleDisputeRpHook contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareSettleDisputeRpHookTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareSocialVerifyTx(
  params: SocialVerifyParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodSocialVerifyParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "socialVerify",
            args: [
              validatedParams._socialName,
              validatedParams.proofs.map((proof) => ({
                ...proof,
                signedClaim: {
                  ...proof.signedClaim,
                  claim: {
                    ...proof.signedClaim.claim,
                    identifier: proof.signedClaim.claim
                      .identifier as `0x${string}`,
                  },
                  signatures: proof.signedClaim
                    .signatures as readonly `0x${string}`[],
                },
              })),
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare socialVerify contract call", {
            domain: "reputation-manager",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareSocialVerifyTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareToggleCampaignTx(
  params: ToggleCampaignParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodToggleCampaignParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "toggleCampaign",
            args: [BigInt(validatedParams.campaignId)],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare toggleCampaign contract call", {
            domain: "reputation-manager",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareToggleCampaignTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareUpdateLyingUserRpTx(
  params: UpdateLyingUserRpParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodUpdateLyingUserRpParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "updateLyingUserRp",
            args: [validatedParams.userAddr, validatedParams.reverse],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare updateLyingUserRp contract call", {
            domain: "reputation-manager",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareUpdateLyingUserRpTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareUpdateReputationPointsTx(
  params: UpdateReputationPointsParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodUpdateReputationPointsParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "updateReputationPoints",
            args: [validatedParams.userAddr, validatedParams.rpChange],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare updateReputationPoints contract call",
            {
              domain: "reputation-manager",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareUpdateReputationPointsTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
              },
            },
          ),
      )(),
  );
}

export function prepareUpdateSocialParamsTx(
  params: UpdateSocialParamsParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodUpdateSocialParamsParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "updateSocialParams",
            args: [
              validatedParams._socialName,
              validatedParams.newValue,
              validatedParams.isRpUpdate,
            ],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare updateSocialParams contract call", {
            domain: "reputation-manager",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareUpdateSocialParamsTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}

export function prepareWhitelistContractTx(
  params: WhitelistContractParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodWhitelistContractParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
          data: encodeFunctionData({
            abi: ABIS.REPUTATION_MANAGER,
            functionName: "whitelistContract",
            args: [validatedParams.contractAddress],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare whitelistContract contract call", {
            domain: "reputation-manager",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareWhitelistContractTx",
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

export function prepareZkPassportRegisterTx(
  params: ZkPassportRegisterParams,
): Result<{ to: Address; data: `0x${string}` }, P2PError> {
  return validate(ZodZkPassportRegisterParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => {
          // Extract from nested SolidityVerifierParameters structure
          const {
            proofVerificationData,
            serviceConfig,
            committedInputs,
            version,
          } = validatedParams.params;

          // Build the ProofVerificationParams struct to match the ABI
          const proofVerificationParams = {
            version: version as `0x${string}`,
            proofVerificationData: {
              vkeyHash: proofVerificationData.vkeyHash as `0x${string}`,
              proof: proofVerificationData.proof as `0x${string}`,
              publicInputs:
                proofVerificationData.publicInputs as `0x${string}`[],
            },
            committedInputs: committedInputs as `0x${string}`,
            serviceConfig: {
              validityPeriodInSeconds: BigInt(
                serviceConfig.validityPeriodInSeconds,
              ),
              domain: serviceConfig.domain,
              scope: serviceConfig.scope,
              devMode: serviceConfig.devMode,
            },
          };

          return {
            to: CONTRACT_ADDRESSES.REPUTATION_MANAGER,
            data: encodeFunctionData({
              abi: ABIS.REPUTATION_MANAGER,
              functionName: "zkPassportRegister",
              args: [proofVerificationParams, validatedParams.isIDCard],
            }),
          };
        },
        (error) =>
          createP2PError("Failed to prepare zkPassportRegister contract call", {
            domain: "reputation-manager",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareZkPassportRegisterTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: params,
              validatedParams,
            },
          }),
      )(),
  );
}
