import type { SolidityVerifierParameters } from "@zkpassport/sdk";
import { err, ok, type Result } from "neverthrow";
import { type Address, type Hex, isAddress } from "thirdweb";
import { formatUnits, hexToString } from "viem";
import { type ZodSchema, type ZodType, z } from "zod";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { createP2PError, type P2PError } from "./errors";

/**
 * Validates data using a Zod schema and returns a Neverthrow Result
 * containing either the validated data or a structured ZodError.
 *
 * @param schema The Zod schema to use for validation.
 * @param data The unknown data to validate.
 * @returns An `Ok` with the validated data if successful, or an `Err` with a structured `ZodError`.
 */
export function validate<S extends ZodSchema | ZodType>(
  schema: S,
  data: unknown,
): Result<z.infer<S>, P2PError> {
  const validationResult = schema.safeParse(data);
  if (validationResult.success) {
    return ok(validationResult.data as z.infer<S>);
  }
  return err(
    createP2PError<"validation">(z.prettifyError(validationResult.error), {
      domain: "validation",
      code: "P2PValidateError",
      cause: validationResult.error,
      context: {
        schema,
        data,
      },
    }),
  );
}

// SCHEMAS
// USDC
const ZodAddressSchema = z
  .string()
  .refine((s): s is Address => isAddress(s), {
    message: "Invalid Ethereum address",
  })
  .transform((s) => s as Address);
const ZodCurrencySchema = z.enum(SUPPORTED_CURRENCIES);
export const ZodUSDCBalanceParamsSchema = z.object({
  address: ZodAddressSchema,
});
export const ZodUSDCAllowanceParamsSchema = z.object({
  address: ZodAddressSchema,
  diamondAddress: ZodAddressSchema,
});
export const ZodUSDCTransferParamsSchema = z.object({
  address: ZodAddressSchema,
  amount: z.bigint(),
});
export const ZodUSDCApproveParamsSchema = z.object({
  address: ZodAddressSchema,
  amount: z.bigint(),
});
export type USDCBalanceParams = z.infer<typeof ZodUSDCBalanceParamsSchema>;
export type USDCAllowanceParams = z.infer<typeof ZodUSDCAllowanceParamsSchema>;
export type USDCTransferParams = z.infer<typeof ZodUSDCTransferParamsSchema>;
export type USDCApproveParams = z.infer<typeof ZodUSDCApproveParamsSchema>;

// ORDER
export const ZodTxLimitParamsSchema = z.object({
  address: ZodAddressSchema,
  currency: ZodCurrencySchema,
});
export const ZodUserParamsSchema = z.object({
  address: ZodAddressSchema,
});
export const ZodOrderByIdParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});
export const ZodRPPerUsdLimitParamsSchema = z.object({
  currency: ZodCurrencySchema,
});
export const ZodSmallOrderThresholdParamsSchema = z.object({
  currency: ZodCurrencySchema,
});
export const ZodSmallOrderFixedFeeParamsSchema = z.object({
  currency: ZodCurrencySchema,
});
export const ZodOrderFixedFeePaidParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});
export const ZodOrderAdditionalDetailsParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});
export const ZodOrderCashbackParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});
export const ZodOrderActualUsdtAmountParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});
export const ZodOrderActualFiatAmountParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});
export type TxLimitParams = z.infer<typeof ZodTxLimitParamsSchema>;
export type UserParams = z.infer<typeof ZodUserParamsSchema>;
export type OrderByIdParams = z.infer<typeof ZodOrderByIdParamsSchema>;
export type RPPerUsdLimitParams = z.infer<typeof ZodRPPerUsdLimitParamsSchema>;
export type SmallOrderThresholdParams = z.infer<
  typeof ZodSmallOrderThresholdParamsSchema
>;
export type SmallOrderFixedFeeParams = z.infer<
  typeof ZodSmallOrderFixedFeeParamsSchema
>;
export type OrderFixedFeePaidParams = z.infer<
  typeof ZodOrderFixedFeePaidParamsSchema
>;
export type OrderAdditionalDetailsParams = z.infer<
  typeof ZodOrderAdditionalDetailsParamsSchema
>;
export type OrderCashbackParams = z.infer<typeof ZodOrderCashbackParamsSchema>;
export type OrderActualUsdtAmountParams = z.infer<
  typeof ZodOrderActualUsdtAmountParamsSchema
>;
export type OrderActualFiatAmountParams = z.infer<
  typeof ZodOrderActualFiatAmountParamsSchema
>;

// P2P-CONFIG
export const ZodPriceConfigParamsSchema = z.object({
  currency: ZodCurrencySchema,
});
export const ZodProcessingTimeParamsSchema = z.object({});
export const ZodCashbackConfigParamsSchema = z.object({});
export const ZodCashbackPercentageParamsSchema = z.object({});
export type PriceConfigParams = z.infer<typeof ZodPriceConfigParamsSchema>;
export type ProcessingTimeParams = z.infer<
  typeof ZodProcessingTimeParamsSchema
>;
export type CashbackConfigParams = z.infer<
  typeof ZodCashbackConfigParamsSchema
>;
export type CashbackPercentageParams = z.infer<
  typeof ZodCashbackPercentageParamsSchema
>;

// PROTOCOL-CONFIG
export const ZodRewardsConfigParamsSchema = z.object({
  currency: ZodCurrencySchema,
});
export type RewardsConfigParams = z.infer<typeof ZodRewardsConfigParamsSchema>;

// ORDER
export const ZodExchangeFiatBalanceParamsSchema = z.object({
  currency: ZodCurrencySchema,
});
export type ExchangeFiatBalanceParams = z.infer<
  typeof ZodExchangeFiatBalanceParamsSchema
>;

// REPUTATION-MANAGER
export const ZodEpochVotesParamsSchema = z.object({
  address: ZodAddressSchema,
  currentEpoch: z.number().int(),
});
export const ZodAnonAadharProofParamsSchema = z.object({
  nullifierSeed: z.bigint(),
  nullifier: z.bigint(),
  timestamp: z.bigint(),
  signal: z.bigint(),
  revealArray: z.tuple([z.bigint(), z.bigint(), z.bigint(), z.bigint()]),
  packedGroth16Proof: z.tuple([
    z.bigint(),
    z.bigint(),
    z.bigint(),
    z.bigint(),
    z.bigint(),
    z.bigint(),
    z.bigint(),
    z.bigint(),
  ]),
});
export const ZodCurrentEpochParamsSchema = z.object({});
export const ZodContractVersionParamsSchema = z.object({});
export const ZodOrderCompleteRpParamsSchema = z.object({});
export const ZodVerificationRewardParamsSchema = z.object({});
export const ZodVotingRpParamsSchema = z.object({});
export const ZodOnChainActivityBaseParamsSchema = z.object({});
export const ZodOnChainActivityRpParamsSchema = z.object({});
export const ZodAadhaarRpParamsSchema = z.object({});
export const ZodLinkedInRpParamsSchema = z.object({});
export const ZodGitHubRpParamsSchema = z.object({});
export const ZodInstagramRpParamsSchema = z.object({});
export const ZodXRpParamsSchema = z.object({});
export const ZodFacebookRpParamsSchema = z.object({});
export const ZodZkPassportRpParamsSchema = z.object({});
export const ZodVotesPerEpochParamsSchema = z.object({});
export const ZodCmVotesPerEpochParamsSchema = z.object({});
export const ZodVoterSlashRpParamsSchema = z.object({});
export const ZodMinRpToVoteParamsSchema = z.object({});
export const ZodMaxRpToBeVotedParamsSchema = z.object({});

export type EpochVotesParams = z.infer<typeof ZodEpochVotesParamsSchema>;
export type AnonAadharProofParams = z.infer<
  typeof ZodAnonAadharProofParamsSchema
>;
export type CurrentEpochParams = z.infer<typeof ZodCurrentEpochParamsSchema>;
export type OrderCompleteRpParams = z.infer<
  typeof ZodOrderCompleteRpParamsSchema
>;
export type VerificationRewardParams = z.infer<
  typeof ZodVerificationRewardParamsSchema
>;
export type VotingRpParams = z.infer<typeof ZodVotingRpParamsSchema>;
export type OnChainActivityBaseParams = z.infer<
  typeof ZodOnChainActivityBaseParamsSchema
>;
export type OnChainActivityRpParams = z.infer<
  typeof ZodOnChainActivityRpParamsSchema
>;
export type AadhaarRpParams = z.infer<typeof ZodAadhaarRpParamsSchema>;
export type LinkedInRpParams = z.infer<typeof ZodLinkedInRpParamsSchema>;
export type GitHubRpParams = z.infer<typeof ZodGitHubRpParamsSchema>;
export type InstagramRpParams = z.infer<typeof ZodInstagramRpParamsSchema>;
export type XRpParams = z.infer<typeof ZodXRpParamsSchema>;
export type FacebookRpParams = z.infer<typeof ZodFacebookRpParamsSchema>;
export type ZkPassportRpParams = z.infer<typeof ZodZkPassportRpParamsSchema>;
export type VotesPerEpochParams = z.infer<typeof ZodVotesPerEpochParamsSchema>;
export type CmVotesPerEpochParams = z.infer<
  typeof ZodCmVotesPerEpochParamsSchema
>;
export type VoterSlashRpParams = z.infer<typeof ZodVoterSlashRpParamsSchema>;
export type MinRpToVoteParams = z.infer<typeof ZodMinRpToVoteParamsSchema>;
export type MaxRpToBeVotedParams = z.infer<
  typeof ZodMaxRpToBeVotedParamsSchema
>;

// Additional ORDER schemas for missing functions
export const ZodUserBuyLimitParamsSchema = z.object({
  address: ZodAddressSchema,
  currency: ZodCurrencySchema,
});

export const ZodUserSellLimitParamsSchema = z.object({
  address: ZodAddressSchema,
  currency: ZodCurrencySchema,
});

export const ZodMerchantRiskCategoryParamsSchema = z.object({
  merchantAddress: ZodAddressSchema,
});

export const ZodOrderAssignedMerchantsParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
  merchant: ZodAddressSchema,
});

export const ZodPlaceOrderParamsSchema = z.object({
  pubKey: z.string(),
  amount: z.bigint(),
  recipientAddr: ZodAddressSchema,
  orderType: z.number().int().min(0).max(2), // 0 for BUY, 1 for SELL, 2 for PAY
  userUpi: z.string(),
  userPubKey: z.string(),
  currency: ZodCurrencySchema,
  preferredPaymentChannelConfigId: z.bigint(),
  circleId: z.bigint(),
  fiatAmountLimit: z.bigint(),
});

export const ZodAcceptOrderParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
  userEncUpi: z.string(),
  pubKey: z.string(),
});

export const ZodPaidBuyOrderParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});

export const ZodCompleteOrderParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
  merchantUpi: z.string(),
});

export const ZodCancelOrderParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});

export const ZodAssignMerchantsParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});

export const ZodSellOrderUserCompletedParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
});

export const ZodSetSellOrderUpiParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
  userEncUpi: z.string(),
  updatedAmount: z.bigint(),
});

export const ZodFetchMerchantOrdersParamsSchema = z.object({
  merchant: ZodAddressSchema,
});

export const ZodFetchMerchantAssignedOrdersParamsSchema = z.object({
  merchant: ZodAddressSchema,
});

export const ZodAdminSettleDisputeParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
  userFault: z.boolean(),
});

export const ZodFailSafeParamsSchema = z.object({
  amount: z.bigint(),
});

export const ZodRaiseDisputeParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
  redactTransId: z.bigint(),
});

export const ZodReduceExchangeFiatBalanceParamsSchema = z.object({
  nativeCurrency: ZodCurrencySchema,
  amount: z.bigint(),
});

export const ZodReleaseMerchantFundsParamsSchema = z.object({
  merchant: ZodAddressSchema,
  amount: z.bigint(),
});

export const ZodTipMerchantParamsSchema = z.object({
  orderId: z.number().int().nonnegative(),
  tipAmount: z.bigint(),
});

export const ZodReleaseRevenueShareParamsSchema = z.object({
  user: ZodAddressSchema,
  amount: z.bigint(),
});

export const ZodSetReputationManagerParamsSchema = z.object({
  addr: ZodAddressSchema,
});

export const ZodUpdateRpPerUsdtLimitParamsSchema = z.object({
  newLimit: z.bigint(),
  nativeCurrency: ZodCurrencySchema,
});

// Export types for the new schemas
export type UserBuyLimitParams = z.infer<typeof ZodUserBuyLimitParamsSchema>;
export type UserSellLimitParams = z.infer<typeof ZodUserSellLimitParamsSchema>;
export type MerchantRiskCategoryParams = z.infer<
  typeof ZodMerchantRiskCategoryParamsSchema
>;
export type OrderAssignedMerchantsParams = z.infer<
  typeof ZodOrderAssignedMerchantsParamsSchema
>;
export type PlaceOrderParams = z.infer<typeof ZodPlaceOrderParamsSchema>;
export type AcceptOrderParams = z.infer<typeof ZodAcceptOrderParamsSchema>;
export type PaidBuyOrderParams = z.infer<typeof ZodPaidBuyOrderParamsSchema>;
export type CompleteOrderParams = z.infer<typeof ZodCompleteOrderParamsSchema>;
export type CancelOrderParams = z.infer<typeof ZodCancelOrderParamsSchema>;
export type AssignMerchantsParams = z.infer<
  typeof ZodAssignMerchantsParamsSchema
>;
export type SellOrderUserCompletedParams = z.infer<
  typeof ZodSellOrderUserCompletedParamsSchema
>;
export type SetSellOrderUpiParams = z.infer<
  typeof ZodSetSellOrderUpiParamsSchema
>;
export type FetchMerchantOrdersParams = z.infer<
  typeof ZodFetchMerchantOrdersParamsSchema
>;
export type FetchMerchantAssignedOrdersParams = z.infer<
  typeof ZodFetchMerchantAssignedOrdersParamsSchema
>;
export type AdminSettleDisputeParams = z.infer<
  typeof ZodAdminSettleDisputeParamsSchema
>;
export type FailSafeParams = z.infer<typeof ZodFailSafeParamsSchema>;
export type RaiseDisputeParams = z.infer<typeof ZodRaiseDisputeParamsSchema>;
export type ReduceExchangeFiatBalanceParams = z.infer<
  typeof ZodReduceExchangeFiatBalanceParamsSchema
>;
export type ReleaseMerchantFundsParams = z.infer<
  typeof ZodReleaseMerchantFundsParamsSchema
>;
export type TipMerchantParams = z.infer<typeof ZodTipMerchantParamsSchema>;
export type ReleaseRevenueShareParams = z.infer<
  typeof ZodReleaseRevenueShareParamsSchema
>;
export type SetReputationManagerParams = z.infer<
  typeof ZodSetReputationManagerParamsSchema
>;
export type UpdateRpPerUsdtLimitParams = z.infer<
  typeof ZodUpdateRpPerUsdtLimitParamsSchema
>;

// Additional REPUTATION-MANAGER schemas for missing functions
export const ZodAddOrUpdateCampaignManagerParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  manager: ZodAddressSchema,
  usernameHash: z.string(),
  rpReward: z.bigint(),
  usdcReward: z.bigint(),
  active: z.boolean(),
  requiresZk: z.boolean(),
  claimLimit: z.bigint(),
});

export const ZodClaimCampaignUsdcParamsSchema = z.object({});

export const ZodClaimRecommendationParamsSchema = z.object({
  recommender: ZodAddressSchema,
  recipient: ZodAddressSchema,
  nonce: z.bigint(),
  signature: z.string(),
});

export const ZodClaimRecommendationRevenueParamsSchema = z.object({});

export const ZodClaimRewardParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  usernameHash: z.string(),
});

export const ZodClaimVotingRewardsParamsSchema = z.object({});

export const ZodCreateCampaignParamsSchema = z.object({});

export const ZodGetUserTaskLedgerParamsSchema = z.object({
  userAddr: ZodAddressSchema,
});

export const ZodTaskSchema = z.object({
  taskType: z.number().int().min(0).max(255), // enum RpStorage.TaskType
  rp: z.bigint(),
  timestamp: z.bigint(),
});

export const ZodGetVotedByParamsSchema = z.object({
  user: ZodAddressSchema,
});

export const ZodGetVotesByParamsSchema = z.object({
  voter: ZodAddressSchema,
});

export const ZodGetIsAadharVerifiedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetIsGitHubVerifiedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetIsInstagramVerifiedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetIsFacebookVerifiedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetIsLinkedInVerifiedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetIsXVerifiedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetIsZkPassportVerifiedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodMarkUserBlacklistedParamsSchema = z.object({
  user: ZodAddressSchema,
});

export const ZodOrderVolumeUpdateRpHookParamsSchema = z.object({
  user: ZodAddressSchema,
  userTotalVolume: z.bigint(),
  reverse: z.boolean(),
});

export const ZodRecommenderRewardUpdateParamsSchema = z.object({
  recipient: ZodAddressSchema,
  merchant: ZodAddressSchema,
  amount: z.bigint(),
  reverse: z.boolean(),
});

export const ZodSettleDisputeRpHookParamsSchema = z.object({
  user: ZodAddressSchema,
});

export const ZodSocialVerifyParamsSchema = z.object({
  _socialName: z.string(),
  proofs: z.array(
    z.object({
      claimInfo: z.object({
        provider: z.string(),
        parameters: z.string(),
        context: z.string(),
      }),
      signedClaim: z.object({
        claim: z.object({
          identifier: z.string(),
          owner: ZodAddressSchema,
          timestampS: z.number(),
          epoch: z.number(),
        }),
        signatures: z.array(z.string()),
      }),
    }),
  ),
});

export const ZodToggleCampaignParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
});

export const ZodUpdateLyingUserRpParamsSchema = z.object({
  userAddr: ZodAddressSchema,
  reverse: z.boolean(),
});

export const ZodUpdateReputationPointsParamsSchema = z.object({
  userAddr: ZodAddressSchema,
  rpChange: z.bigint(),
});

export const ZodUpdateSocialParamsParamsSchema = z.object({
  _socialName: z.string(),
  newValue: z.bigint(),
  isRpUpdate: z.boolean(),
});

export const ZodWhitelistContractParamsSchema = z.object({
  contractAddress: ZodAddressSchema,
});

// Schema matching SolidityVerifierParameters from @zkpassport/sdk
export const ZodSolidityVerifierParametersSchema = z.object({
  version: z.string().refine((val) => val.startsWith("0x"), {
    message: "Version must be a hex string",
  }),
  proofVerificationData: z.object({
    vkeyHash: z.string().refine((val) => /^0x[a-fA-F0-9]{64}$/.test(val), {
      message: "Invalid bytes32 hex string",
    }),
    proof: z.string().refine((val) => val.startsWith("0x"), {
      message: "Proof must be a hex string",
    }),
    publicInputs: z.array(
      z.string().refine((val) => /^0x[a-fA-F0-9]{64}$/.test(val), {
        message: "Each public input must be a valid bytes32 hex string",
      }),
    ),
  }),
  committedInputs: z.string().refine((val) => val.startsWith("0x"), {
    message: "Committed inputs must be a hex string",
  }),
  serviceConfig: z.object({
    validityPeriodInSeconds: z.number().int().nonnegative(),
    domain: z.string(),
    scope: z.string(),
    devMode: z.boolean(),
  }),
}) satisfies z.ZodType<SolidityVerifierParameters>;

export const ZodZkPassportRegisterParamsSchema = z.object({
  params: ZodSolidityVerifierParametersSchema,
  isIDCard: z.boolean(),
});

// Additional schemas for missing functions
export const ZodGetCampaignActiveParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  usernameHash: z.string(),
});

export const ZodGetCampaignManagersParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  manager: ZodAddressSchema,
  usernameHash: z.string(),
  rpReward: z.bigint(),
  usdcReward: z.bigint(),
  active: z.boolean(),
  requiresZk: z.boolean(),
  claimLimit: z.bigint(),
});

export const ZodGetCampaignUsernamesParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  usernameHash: z.string(),
});

export const ZodGetHasVerifiedParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  usernameHash: z.string(),
});

export const ZodGetHasVerifiedUsernameParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  usernameHash: z.string(),
});

export const ZodGetOrderProcessorParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  usernameHash: z.string(),
});

export const ZodGetRewardClaimedParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  manager: ZodAddressSchema,
  usernameHash: z.string(),
  rpReward: z.bigint(),
  usdcReward: z.bigint(),
  active: z.boolean(),
  requiresZk: z.boolean(),
  claimLimit: z.bigint(),
});

export const ZodGetUsedNoncesParamsSchema = z.object({
  campaignId: z.number().int().nonnegative(),
  usernameHash: z.string(),
});

export const ZodGetVotedToParamsSchema = z.object({
  user: ZodAddressSchema,
});

export const ZodGetVotesParamsSchema = z.object({
  userAddr: ZodAddressSchema,
});

export const ZodGetRMUserParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetNumTxnsParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetTaskLedgerByIndexParamsSchema = z.object({
  userAddr: ZodAddressSchema,
});

export const ZodGetIsCommunityManagerParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetAadharProofParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetAccruedVotingRewardsParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetPrimaryRecommenderParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetRecommenderRewardParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetRecommenderRewardMappingParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetUserCampaignRewardParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetIsWhitelistedParamsSchema = z.object({
  address: ZodAddressSchema,
});

export const ZodGetClaimedOnchainActivityParamsSchema = z.object({
  userAddr: ZodAddressSchema,
});

// Export types for the new reputation manager schemas
export type AddOrUpdateCampaignManagerParams = z.infer<
  typeof ZodAddOrUpdateCampaignManagerParamsSchema
>;
export type ClaimCampaignUsdcParams = z.infer<
  typeof ZodClaimCampaignUsdcParamsSchema
>;
export type ClaimRecommendationParams = z.infer<
  typeof ZodClaimRecommendationParamsSchema
>;
export type ClaimRecommendationRevenueParams = z.infer<
  typeof ZodClaimRecommendationRevenueParamsSchema
>;
export type ClaimRewardParams = z.infer<typeof ZodClaimRewardParamsSchema>;
export type ClaimVotingRewardsParams = z.infer<
  typeof ZodClaimVotingRewardsParamsSchema
>;
export type CreateCampaignParams = z.infer<
  typeof ZodCreateCampaignParamsSchema
>;
export type GetUserTaskLedgerParams = z.infer<
  typeof ZodGetUserTaskLedgerParamsSchema
>;

export type Task = z.infer<typeof ZodTaskSchema>;
export type GetVotedByParams = z.infer<typeof ZodGetVotedByParamsSchema>;
export type GetVotesByParams = z.infer<typeof ZodGetVotesByParamsSchema>;
export type GetIsAadharVerifiedParams = z.infer<
  typeof ZodGetIsAadharVerifiedParamsSchema
>;
export type GetIsGitHubVerifiedParams = z.infer<
  typeof ZodGetIsGitHubVerifiedParamsSchema
>;
export type GetIsInstagramVerifiedParams = z.infer<
  typeof ZodGetIsInstagramVerifiedParamsSchema
>;
export type GetIsFacebookVerifiedParams = z.infer<
  typeof ZodGetIsFacebookVerifiedParamsSchema
>;
export type GetIsLinkedInVerifiedParams = z.infer<
  typeof ZodGetIsLinkedInVerifiedParamsSchema
>;
export type GetIsXVerifiedParams = z.infer<
  typeof ZodGetIsXVerifiedParamsSchema
>;
export type GetIsZkPassportVerifiedParams = z.infer<
  typeof ZodGetIsZkPassportVerifiedParamsSchema
>;
export type MarkUserBlacklistedParams = z.infer<
  typeof ZodMarkUserBlacklistedParamsSchema
>;
export type OrderVolumeUpdateRpHookParams = z.infer<
  typeof ZodOrderVolumeUpdateRpHookParamsSchema
>;
export type RecommenderRewardUpdateParams = z.infer<
  typeof ZodRecommenderRewardUpdateParamsSchema
>;
export type SettleDisputeRpHookParams = z.infer<
  typeof ZodSettleDisputeRpHookParamsSchema
>;
export type SocialVerifyParams = z.infer<typeof ZodSocialVerifyParamsSchema>;
export type ToggleCampaignParams = z.infer<
  typeof ZodToggleCampaignParamsSchema
>;
export type UpdateLyingUserRpParams = z.infer<
  typeof ZodUpdateLyingUserRpParamsSchema
>;
export type UpdateReputationPointsParams = z.infer<
  typeof ZodUpdateReputationPointsParamsSchema
>;
export type UpdateSocialParamsParams = z.infer<
  typeof ZodUpdateSocialParamsParamsSchema
>;
export type WhitelistContractParams = z.infer<
  typeof ZodWhitelistContractParamsSchema
>;

export type ZkPassportRegisterParams = z.infer<
  typeof ZodZkPassportRegisterParamsSchema
>;

// Export types for the additional schemas
export type GetCampaignActiveParams = z.infer<
  typeof ZodGetCampaignActiveParamsSchema
>;
export type GetCampaignManagersParams = z.infer<
  typeof ZodGetCampaignManagersParamsSchema
>;
export type GetCampaignUsernamesParams = z.infer<
  typeof ZodGetCampaignUsernamesParamsSchema
>;
export type GetHasVerifiedParams = z.infer<
  typeof ZodGetHasVerifiedParamsSchema
>;
export type GetHasVerifiedUsernameParams = z.infer<
  typeof ZodGetHasVerifiedUsernameParamsSchema
>;
export type GetOrderProcessorParams = z.infer<
  typeof ZodGetOrderProcessorParamsSchema
>;
export type GetRewardClaimedParams = z.infer<
  typeof ZodGetRewardClaimedParamsSchema
>;
export type GetUsedNoncesParams = z.infer<typeof ZodGetUsedNoncesParamsSchema>;
export type GetVotedToParams = z.infer<typeof ZodGetVotedToParamsSchema>;
export type GetVotesParams = z.infer<typeof ZodGetVotesParamsSchema>;
export type GetRMUserParams = z.infer<typeof ZodGetRMUserParamsSchema>;
export type GetNumTxnsParams = z.infer<typeof ZodGetNumTxnsParamsSchema>;
export type GetTaskLedgerByIndexParams = z.infer<
  typeof ZodGetTaskLedgerByIndexParamsSchema
>;
export type GetIsCommunityManagerParams = z.infer<
  typeof ZodGetIsCommunityManagerParamsSchema
>;
export type GetAadharProofParams = z.infer<
  typeof ZodGetAadharProofParamsSchema
>;
export type GetAccruedVotingRewardsParams = z.infer<
  typeof ZodGetAccruedVotingRewardsParamsSchema
>;
export type GetPrimaryRecommenderParams = z.infer<
  typeof ZodGetPrimaryRecommenderParamsSchema
>;
export type GetRecommenderRewardParams = z.infer<
  typeof ZodGetRecommenderRewardParamsSchema
>;
export type GetRecommenderRewardMappingParams = z.infer<
  typeof ZodGetRecommenderRewardMappingParamsSchema
>;
export type GetUserCampaignRewardParams = z.infer<
  typeof ZodGetUserCampaignRewardParamsSchema
>;
export type GetIsWhitelistedParams = z.infer<
  typeof ZodGetIsWhitelistedParamsSchema
>;
export type GetClaimedOnchainActivityParams = z.infer<
  typeof ZodGetClaimedOnchainActivityParamsSchema
>;

// CAMPAIGN URL PARAMS
export const ZodCampaignUrlParamsSchema = z.object({
  manager: z.string().optional(),
  id: z.string().optional(),
});
export type CampaignUrlParams = z.infer<typeof ZodCampaignUrlParamsSchema>;

// CIRCLES (for order routing)
export const ZodCircleScoreStateSchema = z.object({
  activeMerchantsCount: z.coerce.number(),
});

export const ZodCircleMetricsForRoutingSchema = z.object({
  circleScore: z.coerce.number(),
  circleStatus: z.string(),
  scoreState: ZodCircleScoreStateSchema,
});

export const ZodCircleForRoutingSchema = z.object({
  circleId: z.string(),
  currency: z.string(),
  metrics: ZodCircleMetricsForRoutingSchema,
});

export const ZodCheckCircleEligibilityParamsSchema = z.object({
  circleId: z.bigint(),
  currency: z.string(),
  user: ZodAddressSchema,
  usdtAmount: z.bigint(),
  fiatAmount: z.bigint(),
  orderType: z.bigint(),
  preferredPCConfigId: z.bigint(),
});

export const ZodCirclesForRoutingResponseSchema = z.object({
  circles: z.array(ZodCircleForRoutingSchema),
});

export type CircleForRouting = z.infer<typeof ZodCircleForRoutingSchema>;
export type CheckCircleEligibilityParams = z.infer<
  typeof ZodCheckCircleEligibilityParamsSchema
>;

// SUBGRAPH
export const ZodSubgraphQueryParamsSchema = z.object({
  query: z.string().min(1, { error: "GraphQL query cannot be empty" }),
  variables: z.record(z.string(), z.unknown()).optional(),
});

export const ZodOrdersCollectionQueryParamsSchema = z.object({
  userAddress: ZodAddressSchema,
  first: z.number().int().min(1).max(1000).optional().default(100),
  skip: z.number().int().min(0).optional().default(0),
  orderBy: z.enum(["placedAt", "orderId"]).optional().default("placedAt"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const ZodOrdersCollectionWithDateFilterQueryParamsSchema = z.object({
  userAddress: ZodAddressSchema,
  first: z.number().int().min(1).max(1000).optional().default(100),
  skip: z.number().int().min(0).optional().default(0),
  orderBy: z.enum(["placedAt", "orderId"]).optional().default("placedAt"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  placedAtGte: z.number().optional(),
  placedAtLte: z.number().optional(),
});

export const ZodProcessingOrdersCollectionQueryParamsSchema = z.object({
  userAddress: ZodAddressSchema,
  first: z.number().int().min(1).max(1000).optional().default(100),
  skip: z.number().int().min(0).optional().default(0),
  orderBy: z.enum(["placedAt", "orderId"]).optional().default("placedAt"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
  oneHourAgo: z.number(),
});

export type SubgraphQueryParams = z.infer<typeof ZodSubgraphQueryParamsSchema>;
export type OrdersCollectionQueryParams = z.infer<
  typeof ZodOrdersCollectionQueryParamsSchema
>;
export type OrdersCollectionWithDateFilterQueryParams = z.infer<
  typeof ZodOrdersCollectionWithDateFilterQueryParamsSchema
>;
export type ProcessingOrdersCollectionQueryParams = z.infer<
  typeof ZodProcessingOrdersCollectionQueryParamsSchema
>;

export const ZodSubgraphOrderSchema = z.object({
  orderId: z.string(),
  type: z
    .number()
    .refine((val) => val >= 0 && val <= 2, {
      error: "Order type must be between 0 and 2",
    })
    .transform((val) => {
      switch (val) {
        case 0:
          return "BUY";
        case 1:
          return "SELL";
        case 2:
          return "PAY";
        default:
          throw new Error(`Invalid order type value: ${val}`);
      }
    }),
  status: z
    .number()
    .refine((val) => val >= 0 && val <= 4, {
      error: "Order status must be between 0 and 4",
    })
    .transform((val) => {
      switch (val) {
        case 0:
          return "PLACED";
        case 1:
          return "ACCEPTED";
        case 2:
          return "PAID";
        case 3:
          return "COMPLETED";
        case 4:
          return "CANCELLED";
        default:
          throw new Error(`Invalid order status value: ${val}`);
      }
    }),
  placedAt: z.string(),
  usdcAmount: z.string().transform((val) => formatUnits(BigInt(val), 6)),
  fiatAmount: z.string().transform((val) => formatUnits(BigInt(val), 6)),
  currency: z
    .string()
    .transform((val) => hexToString(val as Hex, { size: 32 })),
  disputeStatus: z
    .number()
    .transform((val) => {
      switch (val) {
        case 0:
          return "DEFAULT";
        case 1:
          return "RAISED";
        case 2:
          return "SETTLED";
        default:
          return "DEFAULT";
      }
    })
    .optional()
    .default("DEFAULT"),
  disputeRedactTransId: z.string().optional().nullable(),
  disputeAccountNumber: z.string().optional().nullable(),
  disputeSettledByAddr: z.string().optional().nullable(),
});

export type SubgraphOrder = z.infer<typeof ZodSubgraphOrderSchema>;

export interface ContractFeeDetails {
  fixedFeePaid: number;
  actualUsdtAmount: number;
  actualFiatAmount: number;
}

export interface EnrichedSubgraphOrder extends SubgraphOrder {
  contractFeeDetails: ContractFeeDetails | null;
}

export const ZodOrdersCollectionSchema = z.object({
  orders_collection: z.array(ZodSubgraphOrderSchema),
});

export type SubgraphOrdersCollection = z.infer<
  typeof ZodOrdersCollectionSchema
>;

// Add and export ReferralUrlParamsSchema, VoteSchema, and RewardSchema
export const ReferralUrlParamsSchema = z.object({
  address: z.string().min(1, "Address is required"),
  nonce: z.string().regex(/^\d+$/, "Nonce must be a number as string"),
  signature: z.string().min(1, "Signature is required"),
});

export const VoteSchema = z.object({
  voter: z.string(),
  timestamp: z.bigint(),
});

export const RewardSchema = z.bigint();

export const ZodGetRecommenderRewardPercentageByCurrencyParamsSchema = z.object(
  {
    currency: ZodCurrencySchema,
  },
);
export type GetRecommenderRewardPercentageByCurrencyParams = z.infer<
  typeof ZodGetRecommenderRewardPercentageByCurrencyParamsSchema
>;
