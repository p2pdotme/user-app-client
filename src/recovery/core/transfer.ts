import type { Wallet } from "thirdweb/wallets";
import { type Address, encodeFunctionData, type Hex } from "viem";
import { ENTRY_POINT_ABI, ERC20_ABI, SMART_ACCOUNT_ABI } from "./abis";
import {
  getInitCode,
  getPublicClient,
  isAccountDeployed,
  waitForAccountDeployment,
} from "./account";
import {
  bundlerRpc,
  getBundlerGasFees,
  getSubmissionBundler,
  prepareGasAndSponsorship,
} from "./bundler";
import { RECEIPT_POLL_ATTEMPTS, RECEIPT_POLL_DELAY_MS, sleep } from "./config";
import {
  DIRECT_GAS_LIMITS,
  getDirectGasFees,
  submitUserOpDirect,
} from "./direct";
import { RecoveryError, toRecoveryError } from "./errors";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "./networks";
import { getOwnerAddress, signUserOpHash } from "./signer";
import { isNativeToken } from "./tokens";
import {
  DUMMY_SIGNATURE,
  formatUserOpForBundler,
  getUserOpHash,
  type UserOperation,
} from "./user-op";

/** Default limits for bundler chains; estimation raises them where needed. */
const BUNDLER_GAS_LIMITS = {
  verificationGasLimit: 300_000n,
  /** Higher when the op also deploys the account. */
  deployVerificationGasLimit: 1_000_000n,
  preVerificationGas: 600_000n,
} as const;

const TRANSFER_CALL_GAS_LIMIT = 300_000n;
const DEPLOY_CALL_GAS_LIMIT = 100_000n;

export type UserOpResult =
  /** Mined. `txHash` can be missing when only the chain confirmed it. */
  | { status: "confirmed"; txHash?: Hex; userOpHash?: Hex }
  /** Submitted, but no receipt arrived in time. */
  | { status: "pending"; userOpHash: Hex };

type BundlerReceipt = {
  success?: boolean;
  receipt?: { transactionHash?: Hex };
} | null;

type ExecuteParams = {
  wallet: Wallet;
  network: RecoveryNetworkKey;
  smartAccount: Address;
  callData: Hex;
  callGasLimit: bigint;
};

/** Build, sponsor, sign and submit one UserOperation from the smart account. */
async function executeUserOp({
  wallet,
  network: key,
  smartAccount,
  callData,
  callGasLimit,
}: ExecuteParams): Promise<UserOpResult> {
  const network = RECOVERY_NETWORKS[key];
  const { bundlerUrl, entryPoint } = network;
  const chainId = network.chain.id;

  const [deployed, nonce, fees] = await Promise.all([
    isAccountDeployed(smartAccount, key),
    getPublicClient(key).readContract({
      address: entryPoint,
      abi: ENTRY_POINT_ABI,
      functionName: "getNonce",
      args: [smartAccount, 0n],
    }),
    bundlerUrl ? getBundlerGasFees(bundlerUrl) : getDirectGasFees(key),
  ]);

  const limits = bundlerUrl ? BUNDLER_GAS_LIMITS : DIRECT_GAS_LIMITS;
  const draft: UserOperation = {
    sender: smartAccount,
    nonce,
    // An undeployed account is created by its first operation
    initCode: deployed
      ? "0x"
      : getInitCode(network.factoryAddress, getOwnerAddress(wallet)),
    callData,
    callGasLimit: bundlerUrl ? callGasLimit : DIRECT_GAS_LIMITS.callGasLimit,
    verificationGasLimit: deployed
      ? limits.verificationGasLimit
      : limits.deployVerificationGasLimit,
    preVerificationGas: limits.preVerificationGas,
    ...fees,
    paymasterAndData: "0x",
    signature: DUMMY_SIGNATURE,
  };

  // Gas limits + Thirdweb sponsorship (falls back to user-paid gas)
  const prepared = bundlerUrl
    ? await prepareGasAndSponsorship(draft, entryPoint, chainId, bundlerUrl)
    : draft;
  const userOp: UserOperation = {
    ...prepared,
    signature: await signUserOpHash(
      wallet,
      getUserOpHash(prepared, entryPoint, chainId),
    ),
  };

  if (!bundlerUrl) {
    const { txHash } = await submitUserOpDirect(wallet, userOp, key);
    return { status: "confirmed", txHash };
  }

  const bundler = getSubmissionBundler(userOp, chainId, bundlerUrl);
  const userOpHash = await bundlerRpc<Hex>(
    "eth_sendUserOperation",
    [formatUserOpForBundler(userOp), entryPoint],
    bundler,
  );

  for (let attempt = 0; attempt < RECEIPT_POLL_ATTEMPTS; attempt++) {
    await sleep(RECEIPT_POLL_DELAY_MS);
    const receipt = await bundlerRpc<BundlerReceipt>(
      "eth_getUserOperationReceipt",
      [userOpHash],
      bundler,
    ).catch(() => null);
    if (!receipt) continue;
    if (receipt.success === false) {
      throw new RecoveryError(
        "ExecutionFailed",
        `UserOperation ${userOpHash} reverted`,
      );
    }
    return {
      status: "confirmed",
      txHash: receipt.receipt?.transactionHash,
      userOpHash,
    };
  }
  return { status: "pending", userOpHash };
}

export type RecoveryTransferParams = {
  wallet: Wallet;
  network: RecoveryNetworkKey;
  /** The smart account holding the funds. */
  smartAccount: Address;
  /** Token to move; NATIVE_TOKEN_ADDRESS for the native coin. */
  token: { address: Address };
  recipient: Address;
  /** Amount in the token's base units. */
  amount: bigint;
};

/** Calldata for the smart account to send `amount` of `token` to `recipient`. */
export function encodeTransferCall(
  token: { address: Address },
  recipient: Address,
  amount: bigint,
): Hex {
  const args = isNativeToken(token)
    ? ([recipient, amount, "0x"] as const)
    : ([
        token.address,
        0n,
        encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [recipient, amount],
        }),
      ] as const);
  return encodeFunctionData({
    abi: SMART_ACCOUNT_ABI,
    functionName: "execute",
    args,
  });
}

/**
 * Move tokens out of the user's smart account on a recovery network. Deploys
 * the account in the same operation if it does not exist there yet.
 */
export async function sendRecoveryTransfer({
  wallet,
  network,
  smartAccount,
  token,
  recipient,
  amount,
}: RecoveryTransferParams): Promise<UserOpResult> {
  try {
    return await executeUserOp({
      wallet,
      network,
      smartAccount,
      callData: encodeTransferCall(token, recipient, amount),
      callGasLimit: TRANSFER_CALL_GAS_LIMIT,
    });
  } catch (error) {
    throw toRecoveryError(error, smartAccount);
  }
}

/** Deploy the user's smart account on a recovery network, with no other call. */
export async function deploySmartAccount(
  wallet: Wallet,
  smartAccount: Address,
  network: RecoveryNetworkKey,
): Promise<UserOpResult> {
  if (await isAccountDeployed(smartAccount, network)) {
    throw new RecoveryError("AlreadyDeployed", "Account is already deployed");
  }
  try {
    const result = await executeUserOp({
      wallet,
      network,
      smartAccount,
      callData: "0x",
      callGasLimit: DEPLOY_CALL_GAS_LIMIT,
    });
    if (result.status === "confirmed") return result;
    // The bundler's receipt can lag behind inclusion; the chain is the source of truth
    const deployed = await waitForAccountDeployment(smartAccount, network, 5);
    return deployed
      ? { status: "confirmed", userOpHash: result.userOpHash }
      : result;
  } catch (error) {
    throw toRecoveryError(error, smartAccount);
  }
}
