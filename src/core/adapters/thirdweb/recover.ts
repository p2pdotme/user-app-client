import { ResultAsync } from "neverthrow";
import type { Account } from "thirdweb/wallets";
import { privateKeyToAccount, smartWallet } from "thirdweb/wallets";
import { createAppError } from "@/lib/errors";
import {
  accountAbstraction,
  type ThirdwebAdapterError,
  thirdwebClient,
} from "./client";

/**
 * Connects the smart account controlled by a raw private key.
 *
 * The private key is the admin signer (the in-app wallet EOA). Wrapping it in
 * the SAME account-abstraction config the app uses (factory + chain) derives the
 * exact same smart wallet address, so funds can be recovered from it.
 *
 * The key is used only in-memory to sign; it is never persisted.
 */
export function connectSmartWalletFromPrivateKey(
  privateKey: string,
): ResultAsync<Account, ThirdwebAdapterError> {
  return ResultAsync.fromPromise(
    (async () => {
      const personalAccount = privateKeyToAccount({
        client: thirdwebClient,
        privateKey,
      });
      const wallet = smartWallet(accountAbstraction);
      return wallet.connect({ client: thirdwebClient, personalAccount });
    })(),
    (error) =>
      createAppError<"ThirdwebAdapter">(
        "Failed to connect smart wallet from private key",
        {
          domain: "ThirdwebAdapter",
          code: "TWRecoverConnectError",
          cause: error,
          context: {},
        },
      ),
  );
}
