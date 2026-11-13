import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveWallet } from "thirdweb/react";
import { type Address, isAddress, parseUnits } from "viem";
import {
  RecoveryError,
  type RecoveryNetworkKey,
  type RecoveryToken,
  sendRecoveryTransfer,
  type UserOpResult,
} from "@/recovery/core";
import { recoveryKeys } from "./use-recovery-account";

export type RecoveryTransferInput = {
  smartAccount: Address;
  token: RecoveryToken;
  recipient: string;
  /** Decimal amount as typed by the user, e.g. "12.5". */
  amount: string;
};

export type TransferValidation =
  | { ok: true; recipient: Address; amount: bigint }
  | {
      ok: false;
      reason: "InvalidRecipient" | "InvalidAmount" | "Insufficient";
    };

/**
 * Parses a typed amount into base units. Returns null if it is not a number or
 * has more decimals than the token: parseUnits would round those, and the
 * amount sent must be exactly the amount typed.
 */
export function parseTokenAmount(
  amount: string,
  decimals: number,
): bigint | null {
  const trimmed = amount.trim();
  if (!/^\d*\.?\d+$/.test(trimmed)) return null;
  const fraction = trimmed.split(".")[1] ?? "";
  if (fraction.length > decimals) return null;
  try {
    return parseUnits(trimmed, decimals);
  } catch {
    return null;
  }
}

/** Checks a transfer form against the token's balance, in exact base units. */
export function validateTransfer({
  token,
  recipient,
  amount,
}: Pick<
  RecoveryTransferInput,
  "token" | "recipient" | "amount"
>): TransferValidation {
  const to = recipient.trim();
  if (!isAddress(to)) return { ok: false, reason: "InvalidRecipient" };
  const units = parseTokenAmount(amount, token.decimals);
  if (units === null || units <= 0n) {
    return { ok: false, reason: "InvalidAmount" };
  }
  if (units > token.balance) return { ok: false, reason: "Insufficient" };
  return { ok: true, recipient: to, amount: units };
}

/**
 * Sends tokens out of the smart account on a recovery network.
 *
 * Rejects with a RecoveryError; `InsufficientGas` carries the `fundingAddress`
 * that needs native coin before retrying.
 */
export function useRecoveryTransfer(network: RecoveryNetworkKey) {
  const wallet = useActiveWallet();
  const queryClient = useQueryClient();
  return useMutation<UserOpResult, RecoveryError, RecoveryTransferInput>({
    mutationFn: async (input) => {
      if (!wallet) {
        throw new RecoveryError("WalletNotConnected", "Wallet not connected");
      }
      const validation = validateTransfer(input);
      if (!validation.ok) {
        throw new RecoveryError("Unknown", validation.reason);
      }
      return sendRecoveryTransfer({
        wallet,
        network,
        smartAccount: input.smartAccount,
        token: input.token,
        recipient: validation.recipient,
        amount: validation.amount,
      });
    },
    // Balances change, and a first transfer also deploys the account
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: recoveryKeys.all }),
  });
}
