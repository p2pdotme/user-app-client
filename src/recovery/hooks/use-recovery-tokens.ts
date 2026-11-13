import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import {
  fetchRecoveryTokens,
  type RecoveryNetworkKey,
  type RecoveryToken,
} from "@/recovery/core";
import { recoveryKeys } from "./use-recovery-account";

/**
 * Tokens the smart account holds on a network: native coin first, then USDC,
 * then anything else found. Idle until the account address is known.
 */
export function useRecoveryTokens(
  network: RecoveryNetworkKey,
  smartAccount: Address | undefined,
) {
  return useQuery<RecoveryToken[], Error>({
    queryKey: recoveryKeys.tokens(network, smartAccount),
    enabled: !!smartAccount,
    staleTime: 30_000,
    retry: 1,
    queryFn: () => fetchRecoveryTokens(network, smartAccount as Address),
  });
}
