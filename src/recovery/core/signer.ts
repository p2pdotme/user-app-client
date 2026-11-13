import { isZkSyncChain } from "thirdweb/utils";
import { type Account, smartWallet, type Wallet } from "thirdweb/wallets";
import type { Address, Hex } from "viem";
import { thirdwebClient } from "@/core/adapters/thirdweb/client";
import { RecoveryError } from "./errors";
import { RECOVERY_NETWORKS, type RecoveryNetworkKey } from "./networks";

/**
 * The account that controls the user's smart accounts: the in-app wallet's
 * admin signer (an EOA). A wallet that is not a smart wallet is its own owner.
 */
export function getOwnerAccount(wallet: Wallet): Account {
  const owner = wallet.getAdminAccount?.() ?? wallet.getAccount();
  if (!owner) {
    throw new RecoveryError("WalletNotConnected", "Wallet not connected");
  }
  return owner;
}

export function getOwnerAddress(wallet: Wallet): Address {
  return getOwnerAccount(wallet).address as Address;
}

/** Raw (EIP-191) signature of a UserOperation hash by the account owner. */
export async function signUserOpHash(
  wallet: Wallet,
  userOpHash: Hex,
): Promise<Hex> {
  return getOwnerAccount(wallet).signMessage({ message: { raw: userOpHash } });
}

/**
 * Account to send a plain transaction from on the given network.
 *
 * The app's active wallet is a smart wallet bound to Base, and it must stay
 * there, so it is never switched to the recovery network. Instead:
 * - on networks without a bundler, the owner EOA sends the transaction itself
 *   and pays the gas;
 * - elsewhere (and on zkSync chains, whose smart wallets send ordinary
 *   transactions) a detached smart wallet for that network relays it, with gas
 *   sponsored where Thirdweb supports the chain.
 */
export async function getDirectSenderAccount(
  wallet: Wallet,
  key: RecoveryNetworkKey,
): Promise<Account> {
  const owner = getOwnerAccount(wallet);
  // Not a smart wallet: the connected account is a plain signer already
  if (!wallet.getAdminAccount?.()) return owner;

  const { bundlerUrl, thirdwebChain } = RECOVERY_NETWORKS[key];
  if (bundlerUrl === null && !(await isZkSyncChain(thirdwebChain))) {
    return owner;
  }
  return smartWallet({ chain: thirdwebChain, sponsorGas: true }).connect({
    client: thirdwebClient,
    personalAccount: owner,
  });
}
