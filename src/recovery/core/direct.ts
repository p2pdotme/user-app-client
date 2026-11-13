import { prepareTransaction, sendAndConfirmTransaction } from "thirdweb";
import type { Wallet } from "thirdweb/wallets";
import {
  type Address,
  encodeFunctionData,
  type Hex,
  parseEventLogs,
} from "viem";
import { thirdwebClient } from "@/core/adapters/thirdweb/client";
import { ENTRY_POINT_ABI } from "./abis";
import { getPublicClient } from "./account";
import type { GasFees } from "./bundler";
import { RecoveryError } from "./errors";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "./networks";
import { getDirectSenderAccount } from "./signer";
import type { UserOperation } from "./user-op";

/**
 * Gas limits for direct EntryPoint submission (no bundler estimation
 * available). Generous because zkSync Era runs EVM bytecode through its
 * emulator.
 */
export const DIRECT_GAS_LIMITS = {
  callGasLimit: 1_500_000n,
  verificationGasLimit: 1_500_000n,
  deployVerificationGasLimit: 4_000_000n,
  preVerificationGas: 0n,
} as const;

/** Gas prices for chains without a bundler, read from the chain RPC. */
export async function getDirectGasFees(
  key: RecoveryNetworkKey,
): Promise<GasFees> {
  const gasPrice = await getPublicClient(key).getGasPrice();
  // 2x headroom; the EntryPoint only charges the gas actually used
  return { maxFeePerGas: gasPrice * 2n, maxPriorityFeePerGas: gasPrice * 2n };
}

/**
 * Submit a signed UserOperation straight to the EntryPoint. Used on chains with
 * no ERC-4337 bundler (e.g. zkSync Era, X Layer). If the smart account can't
 * cover the prefund, the sender tops up its EntryPoint deposit first.
 */
export async function submitUserOpDirect(
  wallet: Wallet,
  userOp: UserOperation,
  key: RecoveryNetworkKey,
): Promise<{ txHash: Hex }> {
  const network = RECOVERY_NETWORKS[key];
  const chain = network.thirdwebChain;
  const account = await getDirectSenderAccount(wallet, key);
  const publicClient = getPublicClient(key);

  const requiredPrefund =
    (userOp.callGasLimit +
      userOp.verificationGasLimit +
      userOp.preVerificationGas) *
    userOp.maxFeePerGas;
  const [deposit, accountBalance] = await Promise.all([
    publicClient.readContract({
      address: network.entryPoint,
      abi: ENTRY_POINT_ABI,
      functionName: "balanceOf",
      args: [userOp.sender],
    }),
    publicClient.getBalance({ address: userOp.sender }),
  ]);

  if (deposit + accountBalance < requiredPrefund) {
    try {
      await sendAndConfirmTransaction({
        account,
        transaction: prepareTransaction({
          client: thirdwebClient,
          chain,
          to: network.entryPoint,
          value: requiredPrefund - deposit - accountBalance,
          data: encodeFunctionData({
            abi: ENTRY_POINT_ABI,
            functionName: "depositTo",
            args: [userOp.sender],
          }),
        }),
      });
    } catch (cause) {
      throw new RecoveryError(
        "InsufficientGas",
        `Send a small amount of ${network.chain.nativeCurrency.symbol} on ${network.chain.name} to ${account.address} to cover gas`,
        { cause, fundingAddress: account.address },
      );
    }
  }

  const receipt = await sendAndConfirmTransaction({
    account,
    transaction: prepareTransaction({
      client: thirdwebClient,
      chain,
      to: network.entryPoint,
      data: encodeFunctionData({
        abi: ENTRY_POINT_ABI,
        functionName: "handleOps",
        args: [[userOp], account.address as Address],
      }),
    }),
  });

  if (receipt.status !== "success") {
    throw new RecoveryError(
      "ExecutionFailed",
      `EntryPoint transaction reverted: ${receipt.transactionHash}`,
    );
  }
  // handleOps succeeds even when the account's call reverts, so check the op's own result
  const [opEvent] = parseEventLogs({
    abi: ENTRY_POINT_ABI,
    eventName: "UserOperationEvent",
    logs: receipt.logs,
  });
  if (!opEvent?.args.success) {
    throw new RecoveryError(
      "ExecutionFailed",
      `UserOperation execution failed in transaction ${receipt.transactionHash}`,
    );
  }
  return { txHash: receipt.transactionHash };
}
