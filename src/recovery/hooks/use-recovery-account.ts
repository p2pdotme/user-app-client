import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActiveWallet } from "thirdweb/react";
import type { Address } from "viem";
import {
  deployFactory,
  deploySmartAccount,
  deriveSmartAccountAddress,
  getOwnerAddress,
  isAccountDeployed,
  RecoveryError,
  type RecoveryNetworkKey,
  toRecoveryError,
  type UserOpResult,
  waitForAccountDeployment,
} from "@/recovery/core";

export const recoveryKeys = {
  all: ["recovery"] as const,
  account: (network: RecoveryNetworkKey, owner: Address | undefined) =>
    ["recovery", "account", network, owner] as const,
  tokens: (network: RecoveryNetworkKey, account: Address | undefined) =>
    ["recovery", "tokens", network, account] as const,
};

export type RecoveryAccount = {
  /** The user's smart account on the network (same address as on Base). */
  address: Address;
  /** Whether the account contract exists on this network yet. */
  isDeployed: boolean;
};

/** The EOA that owns the user's smart accounts, or undefined when logged out. */
export function useRecoveryOwner(): Address | undefined {
  const wallet = useActiveWallet();
  if (!wallet) return undefined;
  try {
    return getOwnerAddress(wallet);
  } catch {
    return undefined;
  }
}

/**
 * The user's smart account on a recovery network.
 *
 * `error.code === "FactoryNotDeployed"` means the account factory itself is
 * missing on the network and has to be deployed first (useDeployFactory).
 */
export function useRecoveryAccount(network: RecoveryNetworkKey) {
  const owner = useRecoveryOwner();
  return useQuery<RecoveryAccount, RecoveryError>({
    queryKey: recoveryKeys.account(network, owner),
    enabled: !!owner,
    staleTime: 60_000,
    // A missing factory will not appear by retrying
    retry: (count, error) => error.code === "DeriveFailed" && count < 1,
    queryFn: async () => {
      try {
        const address = await deriveSmartAccountAddress(
          owner as Address,
          network,
        );
        return {
          address,
          isDeployed: await isAccountDeployed(address, network),
        };
      } catch (error) {
        throw toRecoveryError(error);
      }
    },
  });
}

/** Deploys the account factory on a network where it is missing. */
export function useDeployFactory(network: RecoveryNetworkKey) {
  const wallet = useActiveWallet();
  const queryClient = useQueryClient();
  return useMutation<{ txHash?: string }, RecoveryError>({
    mutationFn: async () => {
      if (!wallet) {
        throw new RecoveryError("WalletNotConnected", "Wallet not connected");
      }
      try {
        return await deployFactory(wallet, network);
      } catch (error) {
        throw toRecoveryError(error);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: recoveryKeys.all }),
  });
}

/**
 * Deploys the user's smart account on a network. Optional: a transfer from an
 * undeployed account deploys it as a side effect.
 */
export function useDeploySmartAccount(network: RecoveryNetworkKey) {
  const wallet = useActiveWallet();
  const queryClient = useQueryClient();
  return useMutation<UserOpResult, RecoveryError, Address>({
    mutationFn: async (smartAccount) => {
      if (!wallet) {
        throw new RecoveryError("WalletNotConnected", "Wallet not connected");
      }
      try {
        const result = await deploySmartAccount(wallet, smartAccount, network);
        // The RPC may lag a block behind the bundler receipt
        if (result.status === "confirmed") {
          await waitForAccountDeployment(smartAccount, network);
        }
        return result;
      } catch (error) {
        throw toRecoveryError(error, smartAccount);
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: recoveryKeys.all }),
  });
}
