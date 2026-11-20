import {
  type P2PError,
  type P2PErrorDomain,
  prepareClaimCampaignUsdcTx,
  prepareClaimRecommendationRevenueTx,
  prepareClaimRecommendationTx,
  prepareClaimRewardTx,
  prepareGetBinanceRpArgs,
  prepareGetBvnRpArgs,
  prepareGetCmVotesPerEpochArgs,
  prepareGetFacebookRpArgs,
  prepareGetGitHubRpArgs,
  prepareGetInstagramRpArgs,
  prepareGetIsBvnVerifiedArgs,
  prepareGetIsCommunityManagerArgs,
  prepareGetIsKycVerifiedArgs,
  prepareGetIsLivenessVerifiedArgs,
  prepareGetKycRpArgs,
  prepareGetLinkedInRpArgs,
  prepareGetLivenessRpArgs,
  prepareGetOnChainActivityRpArgs,
  prepareGetRecommenderRewardArgs,
  prepareGetRecommenderRewardPercentageByCurrencyArgs,
  prepareGetRMUserArgs,
  prepareGetSocialVerifiedArgs,
  prepareGetUserCampaignRewardArgs,
  prepareGetUserTaskLedgerArgs,
  prepareGetVolumeMilestoneFourArgs,
  prepareGetVolumeMilestoneOneArgs,
  prepareGetVolumeMilestoneThreeArgs,
  prepareGetVolumeMilestoneTwoArgs,
  prepareGetVotedByArgs,
  prepareGetVotesByArgs,
  prepareGetVotesPerEpochArgs,
  prepareGetXRpArgs,
} from "@p2pdotme";
import type { ZkkycError } from "@p2pdotme/sdk/zkkyc";
import { type Result, ResultAsync } from "neverthrow";
import { type Address, sendAndConfirmTransaction } from "thirdweb";
import type { TransactionReceipt } from "thirdweb/transaction";
import type { Account } from "thirdweb/wallets";
import type {
  ClaimCampaignUsdcParams,
  ClaimRecommendationParams,
  ClaimRecommendationRevenueParams,
  ClaimRewardParams,
  GetIsCommunityManagerParams,
  GetRecommenderRewardParams,
  GetRecommenderRewardPercentageByCurrencyParams,
  GetRMUserParams,
  GetUserCampaignRewardParams,
  GetUserTaskLedgerParams,
  GetVotedByParams,
  GetVotesByParams,
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
  // The SDK's zkkyc `prepare*` helpers type `to` as a plain string; it is
  // narrowed to `Address` below before use.
  prepResult: Result<{ to: string; data: `0x${string}` }, ZkkycError>,
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

export function getKycRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetKycRpArgs().asyncAndThen(({ to, functionName, abi, args }) =>
    ResultAsync.fromPromise(
      viemPublicClient.readContract({
        address: to,
        abi,
        functionName,
        args,
      }),
      (error) =>
        createAppError<"ThirdwebAdapter">(
          "Failed to read KYC RP from contract",
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

export function isKycVerified(params: {
  address: Address;
}): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsKycVerifiedArgs(params).asyncAndThen(
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
            "Failed to read KYC verification status from contract",
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

export function getBvnRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetBvnRpArgs().asyncAndThen(({ to, functionName, abi, args }) =>
    ResultAsync.fromPromise(
      viemPublicClient.readContract({
        address: to,
        abi,
        functionName,
        args,
      }),
      (error) =>
        createAppError<"ThirdwebAdapter">(
          "Failed to read BVN RP from contract",
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

export function getLivenessRp(): ResultAsync<
  bigint,
  ThirdwebAdapterError | P2PError
> {
  return prepareGetLivenessRpArgs().asyncAndThen(
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
            "Failed to read liveness RP from contract",
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

export function isLivenessVerified(params: {
  address: Address;
}): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsLivenessVerifiedArgs(params).asyncAndThen(
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
            "Failed to read liveness verification status from contract",
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

export function isBvnVerified(params: {
  address: Address;
}): ResultAsync<boolean, ThirdwebAdapterError | P2PError> {
  return prepareGetIsBvnVerifiedArgs(params).asyncAndThen(
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
            "Failed to read BVN verification status from contract",
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
            i18n.t(
              parseContractError(error) ??
                "Failed to read Binance RP from contract",
            ),
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
