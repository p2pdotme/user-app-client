import { Result } from "neverthrow";
import type { Address } from "thirdweb";
import { encodeFunctionData, type Hex } from "viem";
import {
  createP2PError,
  type P2PError,
  type P2pBoostClaimUnstakeParams,
  type P2pBoostRequestUnstakeParams,
  type P2pBoostStakeParams,
  type P2pBoostTopUpParams,
  validate,
  ZodP2pBoostClaimUnstakeParamsSchema,
  ZodP2pBoostGetUserStakeParamsSchema,
  ZodP2pBoostRequestUnstakeParamsSchema,
  ZodP2pBoostStakeParamsSchema,
  ZodP2pBoostTopUpParamsSchema,
} from "../../shared";
import { ABIS, CONTRACT_ADDRESSES } from "../abis";

export function prepareGetUserStakeArgs(params: unknown): Result<
  {
    to: Address;
    abi: typeof ABIS.DIAMOND;
    functionName: "getUserStake";
    args: [Address];
  },
  P2PError
> {
  return validate(ZodP2pBoostGetUserStakeParamsSchema, params).map(
    (validatedParams) => ({
      to: CONTRACT_ADDRESSES.DIAMOND,
      abi: ABIS.DIAMOND,
      functionName: "getUserStake" as const,
      args: [validatedParams.user],
    }),
  );
}

export function prepareP2pBoostStakeTx(
  params: P2pBoostStakeParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodP2pBoostStakeParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.FACETS.P2P_STAKE_BOOST,
            functionName: "p2pBoostStake",
            args: [validatedParams.tokens],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare p2pBoostStake transaction", {
            domain: "p2p-stake-boost",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareP2pBoostStakeTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: { tokens: params.tokens.toString() },
              validatedParams: { tokens: validatedParams.tokens.toString() },
              encodeFunctionDataArgs: {
                abi: "ABIS.FACETS.P2P_STAKE_BOOST",
                functionName: "p2pBoostStake",
                args: [validatedParams.tokens.toString()],
              },
            },
          }),
      )(),
  );
}

export function prepareP2pBoostTopUpTx(
  params: P2pBoostTopUpParams,
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodP2pBoostTopUpParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.FACETS.P2P_STAKE_BOOST,
            functionName: "p2pBoostTopUp",
            args: [validatedParams.tokens],
          }),
        }),
        (error) =>
          createP2PError("Failed to prepare p2pBoostTopUp transaction", {
            domain: "p2p-stake-boost",
            code: "P2PPrepareFunctionCallError",
            cause: error,
            context: {
              operation: "prepareP2pBoostTopUpTx",
              timestamp: Math.floor(Date.now() / 1000),
              rawParams: { tokens: params.tokens.toString() },
              validatedParams: { tokens: validatedParams.tokens.toString() },
              encodeFunctionDataArgs: {
                abi: "ABIS.FACETS.P2P_STAKE_BOOST",
                functionName: "p2pBoostTopUp",
                args: [validatedParams.tokens.toString()],
              },
            },
          }),
      )(),
  );
}

export function prepareP2pBoostRequestUnstakeTx(
  params: P2pBoostRequestUnstakeParams = {},
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodP2pBoostRequestUnstakeParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.FACETS.P2P_STAKE_BOOST,
            functionName: "p2pBoostRequestUnstake",
            args: [],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare p2pBoostRequestUnstake transaction",
            {
              domain: "p2p-stake-boost",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareP2pBoostRequestUnstakeTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
                encodeFunctionDataArgs: {
                  abi: "ABIS.FACETS.P2P_STAKE_BOOST",
                  functionName: "p2pBoostRequestUnstake",
                  args: [],
                },
              },
            },
          ),
      )(),
  );
}

export function prepareP2pBoostClaimUnstakeTx(
  params: P2pBoostClaimUnstakeParams = {},
): Result<{ to: Address; data: Hex }, P2PError> {
  return validate(ZodP2pBoostClaimUnstakeParamsSchema, params).andThen(
    (validatedParams) =>
      Result.fromThrowable(
        () => ({
          to: CONTRACT_ADDRESSES.DIAMOND,
          data: encodeFunctionData({
            abi: ABIS.FACETS.P2P_STAKE_BOOST,
            functionName: "p2pBoostClaimUnstake",
            args: [],
          }),
        }),
        (error) =>
          createP2PError(
            "Failed to prepare p2pBoostClaimUnstake transaction",
            {
              domain: "p2p-stake-boost",
              code: "P2PPrepareFunctionCallError",
              cause: error,
              context: {
                operation: "prepareP2pBoostClaimUnstakeTx",
                timestamp: Math.floor(Date.now() / 1000),
                rawParams: params,
                validatedParams,
                encodeFunctionDataArgs: {
                  abi: "ABIS.FACETS.P2P_STAKE_BOOST",
                  functionName: "p2pBoostClaimUnstake",
                  args: [],
                },
              },
            },
          ),
      )(),
  );
}
