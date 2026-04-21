import {
  type P2PError,
  type P2PErrorDomain,
  prepareAddOrUpdateCampaignManagerTx,
  prepareClaimCampaignUsdcTx,
  prepareClaimRecommendationRevenueTx,
  prepareClaimRecommendationTx,
  prepareClaimRewardTx,
  prepareClaimVotingRewardsTx,
  prepareCreateCampaignTx,
  prepareGetAadhaarRpArgs,
  prepareGetAadharProofArgs,
  prepareGetAccruedVotingRewardsArgs,
  prepareGetAdminVotingRpArgs,
  prepareGetAnonAadhaarVerifierAddrArgs,
  prepareGetBinanceRpArgs,
  prepareGetCampaignActiveArgs,
  prepareGetCampaignManagersArgs,
  prepareGetCampaignUsernamesArgs,
  prepareGetClaimedOnchainActivityArgs,
  prepareGetCmVotesPerEpochArgs,
  prepareGetContractCreationTimeArgs,
  prepareGetCurrentEpochArgs,
  prepareGetEpochVotesArgs,
  prepareGetExchangeConfigArgs,
  prepareGetFacebookRpArgs,
  prepareGetGelatoAddressArgs,
  prepareGetGitHubMinYearGapArgs,
  prepareGetGitHubRpArgs,
  prepareGetHasVerifiedArgs,
  prepareGetHasVerifiedUsernameArgs,
  prepareGetInstagramMinYearGapArgs,
  prepareGetInstagramRpArgs,
  prepareGetIsAadharVerifiedArgs,
  prepareGetIsBinanceVerifiedArgs,
  prepareGetIsCommunityManagerArgs,
  prepareGetIsFacebookVerifiedArgs,
  prepareGetIsGitHubVerifiedArgs,
  prepareGetIsInstagramVerifiedArgs,
  prepareGetIsLinkedInVerifiedArgs,
  prepareGetIsPassportVerifiedArgs,
  prepareGetIsWhitelistedArgs,
  prepareGetIsXVerifiedArgs,
  prepareGetLinkedInRpArgs,
  prepareGetLyingUserRpArgs,
  prepareGetMaxRpToBeVotedArgs,
  prepareGetMinRpToVoteArgs,
  prepareGetNextCampaignIdArgs,
  prepareGetNumTxnsArgs,
  prepareGetOnChainActivityBaseArgs,
  prepareGetOnChainActivityRpArgs,
  prepareGetOrderCompleteRpArgs,
  prepareGetOrderProcessorArgs,
  prepareGetPassportRpArgs,
  prepareGetPrimaryRecommenderArgs,
  prepareGetProxiableUUIDArgs,
  prepareGetReclaimAddressArgs,
  prepareGetRecommenderRewardArgs,
  prepareGetRecommenderRewardMappingArgs,
  prepareGetRecommenderRewardPercentageArgs,
  prepareGetRecommenderRewardPercentageByCurrencyArgs,
  prepareGetRewardClaimedArgs,
  prepareGetRMUserArgs,
  prepareGetScalingFactorArgs,
  prepareGetSecondsInMonthArgs,
  prepareGetSettleDisputeRpArgs,
  prepareGetSocialVerifiedArgs,
  prepareGetTaskLedgerByIndexArgs,
  prepareGetUpgradeInterfaceVersionArgs,
  prepareGetUsdtContractArgs,
  prepareGetUsedNoncesArgs,
  prepareGetUserCampaignRewardArgs,
  prepareGetUserTaskLedgerArgs,
  prepareGetVerificationRewardArgs,
  prepareGetVolumeMilestoneFourArgs,
  prepareGetVolumeMilestoneOneArgs,
  prepareGetVolumeMilestoneThreeArgs,
  prepareGetVolumeMilestoneTwoArgs,
  prepareGetVotedByArgs,
  prepareGetVotedToArgs,
  prepareGetVoterSlashRpArgs,
  prepareGetVotesArgs,
  prepareGetVotesByArgs,
  prepareGetVotesPerEpochArgs,
  prepareGetVotingRpArgs,
  prepareGetXMinYearGapArgs,
  prepareGetXRpArgs,
  prepareMarkUserBlacklistedTx,
  prepareOrderVolumeUpdateRpHookTx,
  prepareRecommenderRewardUpdateTx,
  prepareSettleDisputeRpHookTx,
  prepareToggleCampaignTx,
  prepareUpdateLyingUserRpTx,
  prepareUpdateReputationPointsTx,
  prepareUpdateSocialParamsTx,
  prepareWhitelistContractTx,
} from "@p2pdotme";
import type { ZkkycError } from "@p2pdotme/sdk/zkkyc";
import { type Result, ResultAsync } from "neverthrow";
import { type Address, sendAndConfirmTransaction } from "thirdweb";
import type { TransactionReceipt } from "thirdweb/transaction";
import type { Account } from "thirdweb/wallets";
import type {
  AddOrUpdateCampaignManagerParams,
  ClaimCampaignUsdcParams,
  ClaimRecommendationParams,
  ClaimRecommendationRevenueParams,
  ClaimRewardParams,
  EpochVotesParams,
  GetAadharProofParams,
  GetAccruedVotingRewardsParams,
  GetCampaignActiveParams,
  GetCampaignManagersParams,
  GetCampaignUsernamesParams,
  GetClaimedOnchainActivityParams,
  GetHasVerifiedParams,
  GetHasVerifiedUsernameParams,
  GetIsAadharVerifiedParams,
  GetIsBinanceVerifiedParams,
  GetIsCommunityManagerParams,
  GetIsFacebookVerifiedParams,
  GetIsGitHubVerifiedParams,
  GetIsInstagramVerifiedParams,
  GetIsLinkedInVerifiedParams,
  GetIsWhitelistedParams,
  GetIsXVerifiedParams,
  GetIsZkPassportVerifiedParams,
  GetNumTxnsParams,
  GetOrderProcessorParams,
  GetPrimaryRecommenderParams,
  GetRecommenderRewardMappingParams,
  GetRecommenderRewardParams,
  GetRecommenderRewardPercentageByCurrencyParams,
  GetRewardClaimedParams,
  GetRMUserParams,
  GetTaskLedgerByIndexParams,
  GetUsedNoncesParams,
  GetUserCampaignRewardParams,
  GetUserTaskLedgerParams,
  GetVotedByParams,
  GetVotedToParams,
  GetVotesByParams,
  GetVotesParams,
  MarkUserBlacklistedParams,
  OrderVolumeUpdateRpHookParams,
  RecommenderRewardUpdateParams,
  SettleDisputeRpHookParams,
  ToggleCampaignParams,
  UpdateLyingUserRpParams,
  UpdateReputationPointsParams,
  UpdateSocialParamsParams,
  WhitelistContractParams,
} from "@/core/p2pdotme/shared/validation";
import { createAppError, parseContractError } from "@/lib/errors";
import { i18n } from "@/lib/i18n";
import { chain } from "../chain";
import {
  estimatedPrepareTransaction,
  type ThirdwebAdapterError,
  thirdwebClient,
  viemPublicClient,
} from "../client";

export function sendPreparedTx(
  prepResult: Result<{ to: Address; data: `0x${string}` }, ZkkycError>,
  account: Account,
  operationName: string,
): ResultAsync<TransactionReceipt, ThirdwebAdapterError | ZkkycError> {
  return prepResult
    .asyncAndThen(({ to, data }) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: to as Address,
        chain,
        client: thirdwebClient,
        data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({ account, transaction: preppedTx }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                `Failed to sendAndConfirm ${operationName} transaction`,
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
}

// READ OPERATIONS - Using readContract with function signatures

export function getCurrentEpoch(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetCurrentEpochArgs()
    .asyncAndThen(({ to, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName: "getCurrentEpoch" as never,
          args,
        } as Parameters<typeof viemPublicClient.readContract>[0]),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read current epoch from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
    )
    .map((r) => r as bigint);
}

export function getEpochVotes(
  params: EpochVotesParams,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetEpochVotesArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read epoch votes from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getRMUser(params: GetRMUserParams) {
  return prepareGetRMUserArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read RM user from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getNumTxns(
  params: GetNumTxnsParams,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetNumTxnsArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read number of transactions from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getOrderCompleteRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetOrderCompleteRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read order complete RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVerificationReward(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVerificationRewardArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read verification reward from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getTaskLedgerByIndex(params: GetTaskLedgerByIndexParams) {
  return prepareGetTaskLedgerByIndexArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read task ledger from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getUserTaskLedger(params: GetUserTaskLedgerParams) {
  return prepareGetUserTaskLedgerArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read user task ledger from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isAadharVerified(
  params: GetIsAadharVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsAadharVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Aadhar verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isLinkedInVerified(
  params: GetIsLinkedInVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsLinkedInVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read LinkedIn verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isXVerified(
  params: GetIsXVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsXVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read X verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isPassportVerified(
  params: GetIsZkPassportVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsPassportVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Passport verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isGitHubVerified(
  params: GetIsGitHubVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsGitHubVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read GitHub verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isInstagramVerified(
  params: GetIsInstagramVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsInstagramVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Instagram verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isFacebookVerified(
  params: GetIsFacebookVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsFacebookVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Facebook verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isBinanceVerified(
  params: GetIsBinanceVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsBinanceVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Binance verification status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getVotingRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVotingRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read voting RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getOnChainActivityBase(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetOnChainActivityBaseArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read on-chain activity base from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getOnChainActivityRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetOnChainActivityRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read on-chain activity RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getAadhaarRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetAadhaarRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Aadhaar RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getLinkedInRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetLinkedInRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read LinkedIn RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getGitHubRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetGitHubRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read GitHub RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getInstagramRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetInstagramRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Instagram RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getXRp(): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetXRpArgs().asyncAndThen(({ to, functionName, abi, args }) =>
    ResultAsync.fromPromise(
      viemPublicClient.readContract({
        address: to,
        abi,
        functionName,
        args,
      }),
      (error) =>
        createAppError<"ThirdwebAdapter">("Failed to read X RP from contract", {
          domain: "ThirdwebAdapter",
          code: "TWReadContractError",
          cause: error,
          context: { to, args },
        }),
    ),
  );
}

export function getPassportRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetPassportRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Passport RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getFacebookRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetFacebookRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Facebook RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getBinanceRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetBinanceRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Binance RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVotesPerEpoch(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVotesPerEpochArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read votes per epoch from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getCmVotesPerEpoch(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetCmVotesPerEpochArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read CM votes per epoch from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVoterSlashRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVoterSlashRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read voter slash RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getMinRpToVote(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetMinRpToVoteArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read min RP to vote from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getMaxRpToBeVoted(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetMaxRpToBeVotedArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read max RP to be voted from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVotesBy(params: GetVotesByParams) {
  const preparedParams = { address: params.voter };
  return prepareGetVotesByArgs(preparedParams).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read votes by from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getVotedBy(params: GetVotedByParams) {
  const preparedParams = { address: params.user };
  return prepareGetVotedByArgs(preparedParams).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read voted by from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function isCommunityManager(
  params: GetIsCommunityManagerParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsCommunityManagerArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read community manager status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getScalingFactor(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetScalingFactorArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read scaling factor from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVolumeMilestoneOne(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVolumeMilestoneOneArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read volume milestone one from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVolumeMilestoneTwo(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVolumeMilestoneTwoArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read volume milestone two from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVolumeMilestoneThree(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVolumeMilestoneThreeArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read volume milestone three from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getVolumeMilestoneFour(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetVolumeMilestoneFourArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read volume milestone four from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getUpgradeInterfaceVersion(): ResultAsync<
  string,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetUpgradeInterfaceVersionArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read upgrade interface version from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getAadharProof(
  params: GetAadharProofParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetAadharProofArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Aadhar proof from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getAccruedVotingRewards(
  params: GetAccruedVotingRewardsParams,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetAccruedVotingRewardsArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read accrued voting rewards from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getAdminVotingRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetAdminVotingRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read admin voting RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getAnonAadhaarVerifierAddr(): ResultAsync<
  string,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetAnonAadhaarVerifierAddrArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read anon Aadhaar verifier address from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getCampaignActive(
  params: GetCampaignActiveParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetCampaignActiveArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read campaign active status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getCampaignManagers(params: GetCampaignManagersParams) {
  return prepareGetCampaignManagersArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read campaign managers from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getCampaignUsernames(
  params: GetCampaignUsernamesParams,
): ResultAsync<string, ThirdwebAdapterError | P2PError> {
  return prepareGetCampaignUsernamesArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args: args as readonly [Address],
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read campaign usernames from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getClaimedOnchainActivity(
  params: GetClaimedOnchainActivityParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetClaimedOnchainActivityArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read claimed onchain activity from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getContractCreationTime(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetContractCreationTimeArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read contract creation time from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getExchangeConfig() {
  return prepareGetExchangeConfigArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read exchange config from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getGelatoAddress() {
  return prepareGetGelatoAddressArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Gelato address from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getGitHubMinYearGap(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetGitHubMinYearGapArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read GitHub min year gap from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getHasVerified(
  params: GetHasVerifiedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetHasVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read has verified status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getHasVerifiedUsername(
  params: GetHasVerifiedUsernameParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetHasVerifiedUsernameArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args: args as readonly [string, Address],
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read has verified username status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getInstagramMinYearGap(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetInstagramMinYearGapArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read Instagram min year gap from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function isWhitelisted(
  params: GetIsWhitelistedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsWhitelistedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read whitelist status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getLyingUserRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetLyingUserRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read lying user RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getNextCampaignId(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetNextCampaignIdArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read next campaign ID from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getOrderProcessor(params: GetOrderProcessorParams) {
  return prepareGetOrderProcessorArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args: args as readonly [Address],
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read order processor from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getPrimaryRecommender(params: GetPrimaryRecommenderParams) {
  return prepareGetPrimaryRecommenderArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read primary recommender from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getProxiableUUID(): ResultAsync<
  string,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetProxiableUUIDArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read proxiable UUID from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getReclaimAddress() {
  return prepareGetReclaimAddressArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read reclaim address from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getRecommenderReward(
  params: GetRecommenderRewardParams,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetRecommenderRewardArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read recommender reward from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getRecommenderRewardMapping(
  params: GetRecommenderRewardMappingParams,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetRecommenderRewardMappingArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read recommender reward mapping from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getRecommenderRewardPercentage(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetRecommenderRewardPercentageArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read recommender reward percentage from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getRecommenderRewardPercentageByCurrency(
  params: GetRecommenderRewardPercentageByCurrencyParams,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetRecommenderRewardPercentageByCurrencyArgs(
    params,
  ).asyncAndThen(({ to, functionName, abi, args }) =>
    ResultAsync.fromPromise(
      viemPublicClient.readContract({
        address: to,
        abi,
        functionName,
        args,
      }) as Promise<bigint>,
      (error) =>
        createAppError<"ThirdwebAdapter">(
          "Failed to read recommender reward percentage by currency from contract",
          {
            domain: "ThirdwebAdapter",
            code: "TWReadContractError",
            cause: error,
            context: { to, args },
          },
        ),
    ),
  );
}

export function getRewardClaimed(
  params: GetRewardClaimedParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetRewardClaimedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read reward claimed status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getSecondsInMonth(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetSecondsInMonthArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read seconds in month from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getSettleDisputeRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetSettleDisputeRpArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read settle dispute RP from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getSocialVerified(params: {
  address: Address;
}): ResultAsync<
  readonly [boolean, boolean, boolean, boolean, boolean, boolean, boolean],
  ThirdwebAdapterError | P2PError
> {
  return prepareGetSocialVerifiedArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }) as Promise<
          readonly [
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
            boolean,
          ]
        >,
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read social verified status from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getUsedNonces(
  params: GetUsedNoncesParams,
): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetUsedNoncesArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read used nonces from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getUserCampaignReward(
  params: GetUserCampaignRewardParams,
): ResultAsync<bigint, ThirdwebAdapterError | P2PError> {
  return prepareGetUserCampaignRewardArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read user campaign reward from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getVotedTo(params: GetVotedToParams) {
  return prepareGetVotedToArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read voted to from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getVotes(params: GetVotesParams) {
  return prepareGetVotesArgs(params).asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read votes from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { params, to, args },
            },
          ),
      ),
  );
}

export function getUsdtContract() {
  return prepareGetUsdtContractArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read USDT contract from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

export function getXMinYearGap(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetXMinYearGapArgs().asyncAndThen(
    ({ to, functionName, abi, args }) =>
      ResultAsync.fromPromise(
        viemPublicClient.readContract({
          address: to,
          abi,
          functionName,
          args,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            "Failed to read X min year gap from contract",
            {
              domain: "ThirdwebAdapter",
              code: "TWReadContractError",
              cause: error,
              context: { to, args },
            },
          ),
      ),
  );
}

// WRITE OPERATIONS - Using sendAndConfirmTransaction

export const addOrUpdateCampaignManager = (
  params: AddOrUpdateCampaignManagerParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareAddOrUpdateCampaignManagerTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm addOrUpdateCampaignManager transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const claimCampaignUsdc = (
  params: ClaimCampaignUsdcParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareClaimCampaignUsdcTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm claimCampaignUsdc transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const claimRecommendation = (
  params: ClaimRecommendationParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareClaimRecommendationTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm claimRecommendation transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const claimRecommendationRevenue = (
  params: ClaimRecommendationRevenueParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareClaimRecommendationRevenueTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm claimRecommendationRevenue transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const claimReward = (
  params: ClaimRewardParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareClaimRewardTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm claimReward transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const claimVotingRewards = (
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareClaimVotingRewardsTx()
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm claimVotingRewards transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const createCampaign = (
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareCreateCampaignTx()
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm createCampaign transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const markUserBlacklisted = (
  params: MarkUserBlacklistedParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareMarkUserBlacklistedTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm markUserBlacklisted transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const orderVolumeUpdateRpHook = (
  params: OrderVolumeUpdateRpHookParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareOrderVolumeUpdateRpHookTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm orderVolumeUpdateRpHook transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const recommenderRewardUpdate = (
  params: RecommenderRewardUpdateParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareRecommenderRewardUpdateTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm recommenderRewardUpdate transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const settleDisputeRpHook = (
  params: SettleDisputeRpHookParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareSettleDisputeRpHookTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm settleDisputeRpHook transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const toggleCampaign = (
  params: ToggleCampaignParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareToggleCampaignTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm toggleCampaign transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const updateLyingUserRp = (
  params: UpdateLyingUserRpParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareUpdateLyingUserRpTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm updateLyingUserRp transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const updateReputationPoints = (
  params: UpdateReputationPointsParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareUpdateReputationPointsTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm updateReputationPoints transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const updateSocialParams = (
  params: UpdateSocialParamsParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareUpdateSocialParamsTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm updateSocialParams transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};

export const whitelistContract = (
  params: WhitelistContractParams,
  account: Account,
): ResultAsync<
  TransactionReceipt,
  ThirdwebAdapterError | P2PError<P2PErrorDomain>
> => {
  return prepareWhitelistContractTx(params)
    .asyncAndThen((tx) =>
      estimatedPrepareTransaction({
        from: account.address as Address,
        to: tx.to as Address,
        chain,
        client: thirdwebClient,
        data: tx.data,
      }),
    )
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({
          account,
          transaction: preppedTx,
        }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(
              parseContractError(error) ??
                "Failed to sendAndConfirm whitelistContract transaction",
            ),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    );
};
