import type { Address, Hex } from "viem";
import { toHex } from "viem";
import { thirdwebClient } from "@/core/adapters/thirdweb/client";
import { getThirdwebBundlerUrl } from "./config";
import {
  DUMMY_SIGNATURE,
  formatUserOpForBundler,
  isSponsored,
  type UserOperation,
} from "./user-op";

/** A bundler JSON-RPC endpoint plus any auth headers it needs. */
export type BundlerEndpoint = { url: string; headers?: Record<string, string> };

export type GasFees = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };

export type EstimatedGas = {
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
};

/**
 * Paymaster response. The gas limits are part of what the paymaster signed, so
 * when present they must replace the UserOperation's own values before signing.
 */
export type PaymasterData = { paymasterAndData: Hex } & Partial<EstimatedGas>;

type RpcQuantity = string | number | undefined | null;

const NOT_SPONSORED: PaymasterData = { paymasterAndData: "0x" };

/** Used when the bundler cannot quote a gas price. 1.5 gwei. */
const FALLBACK_GAS_FEES: GasFees = {
  maxFeePerGas: 1_500_000_000n,
  maxPriorityFeePerGas: 1_500_000_000n,
};

/**
 * Bundlers simulate estimation with the UserOp's own fee values, so a smart
 * account that holds no native token fails with "AA21 didn't pay prefund"
 * before a paymaster is even attached. Overriding the sender's balance for the
 * simulation lets estimation succeed.
 */
const ESTIMATION_BALANCE_OVERRIDE = toHex(10n ** 21n);

/**
 * Thirdweb's bundler, the only one its paymaster accepts ops from (the same
 * endpoint the SDK uses).
 */
export function getThirdwebBundler(chainId: number): BundlerEndpoint {
  return {
    url: getThirdwebBundlerUrl(chainId),
    headers: { "x-client-id": thirdwebClient.clientId },
  };
}

/**
 * Sponsored ops must be submitted through Thirdweb's bundler: its paymaster
 * reverts with BundlerNotAllowed(tx.origin) for any other relayer, which
 * bundlers report as "AA33 reverted (or OOG)".
 */
export function getSubmissionBundler(
  userOp: { paymasterAndData: Hex },
  chainId: number,
  bundlerUrl: string,
): BundlerEndpoint {
  return isSponsored(userOp)
    ? getThirdwebBundler(chainId)
    : { url: bundlerUrl };
}

export async function bundlerRpc<T = unknown>(
  method: string,
  params: readonly unknown[],
  bundler: BundlerEndpoint,
): Promise<T> {
  const response = await fetch(bundler.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...bundler.headers },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data: { result?: T; error?: unknown } = await response.json();
  if (data.error) {
    throw new Error(`Bundler RPC Error: ${JSON.stringify(data.error)}`);
  }
  return data.result as T;
}

const toBigInt = (value: RpcQuantity): bigint => BigInt(value ?? 0);

/** Missing fields come back as 0n so callers can apply their own floors. */
export async function estimateUserOpGas(
  userOp: UserOperation,
  entryPoint: Address,
  bundler: BundlerEndpoint,
): Promise<EstimatedGas> {
  const estimate = await bundlerRpc<Record<
    keyof EstimatedGas,
    RpcQuantity
  > | null>(
    "eth_estimateUserOperationGas",
    [
      formatUserOpForBundler(userOp),
      entryPoint,
      { [userOp.sender]: { balance: ESTIMATION_BALANCE_OVERRIDE } },
    ],
    bundler,
  );
  return {
    callGasLimit: toBigInt(estimate?.callGasLimit),
    verificationGasLimit: toBigInt(estimate?.verificationGasLimit),
    preVerificationGas: toBigInt(estimate?.preVerificationGas),
  };
}

/** Gas price quote from the chain's bundler, with a fixed fallback. */
export async function getBundlerGasFees(bundlerUrl: string): Promise<GasFees> {
  try {
    const prices = await bundlerRpc<{
      standard: Record<keyof GasFees, RpcQuantity>;
    }>("pimlico_getUserOperationGasPrice", [], { url: bundlerUrl });
    return {
      maxFeePerGas: BigInt(prices.standard.maxFeePerGas ?? 0),
      maxPriorityFeePerGas: BigInt(prices.standard.maxPriorityFeePerGas ?? 0),
    };
  } catch {
    return FALLBACK_GAS_FEES;
  }
}

/**
 * Fee values Thirdweb's bundler will accept. The paymaster signs over them, so
 * they must be fixed before sponsorship is requested.
 */
async function getThirdwebGasFees(chainId: number): Promise<GasFees> {
  const fees = await bundlerRpc<Record<keyof GasFees, RpcQuantity>>(
    "thirdweb_getUserOperationGasPrice",
    [],
    getThirdwebBundler(chainId),
  );
  return {
    maxFeePerGas: toBigInt(fees.maxFeePerGas),
    maxPriorityFeePerGas: toBigInt(fees.maxPriorityFeePerGas),
  };
}

/** Asks Thirdweb's paymaster to sponsor the op. Never throws. */
export async function getThirdwebPaymasterData(
  userOp: UserOperation,
  entryPoint: Address,
  chainId: number,
): Promise<PaymasterData> {
  if (!thirdwebClient.clientId) return NOT_SPONSORED;
  try {
    const result = await bundlerRpc<
      | ({ paymasterAndData?: Hex } & Record<keyof EstimatedGas, RpcQuantity>)
      | null
    >(
      "pm_sponsorUserOperation",
      // Same op shape thirdweb's own SDK sends: dummy signature, no paymaster yet
      [
        formatUserOpForBundler({
          ...userOp,
          paymasterAndData: "0x",
          signature: DUMMY_SIGNATURE,
        }),
        entryPoint,
      ],
      getThirdwebBundler(chainId),
    );
    if (!result?.paymasterAndData) return NOT_SPONSORED;
    const { callGasLimit, verificationGasLimit, preVerificationGas } = result;
    return {
      paymasterAndData: result.paymasterAndData,
      ...(callGasLimit ? { callGasLimit: BigInt(callGasLimit) } : {}),
      ...(verificationGasLimit
        ? { verificationGasLimit: BigInt(verificationGasLimit) }
        : {}),
      ...(preVerificationGas
        ? { preVerificationGas: BigInt(preVerificationGas) }
        : {}),
    };
  } catch {
    return NOT_SPONSORED;
  }
}

/** Apply a bundler estimate, keeping the op's own values as floors/fallbacks. */
function withEstimate(
  userOp: UserOperation,
  estimate: EstimatedGas,
): UserOperation {
  return {
    ...userOp,
    callGasLimit:
      estimate.callGasLimit > userOp.callGasLimit
        ? estimate.callGasLimit
        : userOp.callGasLimit,
    verificationGasLimit:
      estimate.verificationGasLimit || userOp.verificationGasLimit,
    preVerificationGas:
      estimate.preVerificationGas || userOp.preVerificationGas,
  };
}

async function estimateOrKeep(
  userOp: UserOperation,
  entryPoint: Address,
  bundler: BundlerEndpoint,
): Promise<UserOperation> {
  try {
    return withEstimate(
      userOp,
      await estimateUserOpGas(userOp, entryPoint, bundler),
    );
  } catch {
    // Estimation is best-effort; the op's defaults are generous
    return userOp;
  }
}

/**
 * Resolve gas limits and sponsorship the way thirdweb's SDK does
 * (wallets/smart/lib/userop.ts):
 * 1. ask the paymaster with zero limits and Thirdweb's own fee values so it can
 *    size the op;
 * 2. if it returns no limits, estimate on Thirdweb's bundler with the paymaster
 *    attached (its validation runs inside verificationGasLimit, and no other
 *    bundler may simulate it);
 * 3. the paymaster signed over the old limits, so it must sign again over the
 *    new ones.
 * A sponsored op must then be submitted through Thirdweb's bundler (see
 * getSubmissionBundler). If sponsorship is unavailable the op keeps its own
 * fees and is estimated on the chain's bundler.
 */
export async function prepareGasAndSponsorship(
  userOp: UserOperation,
  entryPoint: Address,
  chainId: number,
  bundlerUrl: string,
): Promise<UserOperation> {
  const thirdwebFees = await getThirdwebGasFees(chainId).catch(() => null);
  const forSponsorship: UserOperation = { ...userOp, ...thirdwebFees };

  const paymaster = await getThirdwebPaymasterData(
    {
      ...forSponsorship,
      callGasLimit: 0n,
      verificationGasLimit: 0n,
      preVerificationGas: 0n,
    },
    entryPoint,
    chainId,
  );

  if (!isSponsored(paymaster)) {
    return estimateOrKeep(userOp, entryPoint, { url: bundlerUrl });
  }

  if (
    paymaster.callGasLimit &&
    paymaster.verificationGasLimit &&
    paymaster.preVerificationGas
  ) {
    return { ...forSponsorship, ...paymaster };
  }

  const estimated = await estimateOrKeep(
    { ...forSponsorship, paymasterAndData: paymaster.paymasterAndData },
    entryPoint,
    getThirdwebBundler(chainId),
  );

  const resigned = await getThirdwebPaymasterData(
    estimated,
    entryPoint,
    chainId,
  );
  if (!isSponsored(resigned)) {
    // Paymaster declined the estimated limits: the user pays gas instead
    return { ...userOp, paymasterAndData: "0x" };
  }
  return { ...estimated, ...resigned };
}
