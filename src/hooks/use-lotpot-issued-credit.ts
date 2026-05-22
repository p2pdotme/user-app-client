import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { formatUnits, zeroAddress } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { useThirdweb } from "./use-thirdweb";

const INTEGRATOR_ABI = [
  {
    type: "function",
    name: "issuedCredit",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// Cashback credit is denominated in USDC (6 decimals) per the V2 integrator's
// design. Settlement happens at ticket-purchase time from the configured vaults.
const USDC_DECIMALS = 6;

interface LotpotIssuedCreditSummary {
  hasCredit: boolean;
  rawAmount: bigint;
  formattedAmount: string;
  displayAmount: string;
}

/**
 * Reads the user's accumulated LotPot ticket-purchase credit from the V2
 * LotPot integrator's `issuedCredit(user)` ledger. Set `VITE_LOTPOT_INTEGRATOR_ADDRESS`
 * to the deployed V2 integrator address; if unset, the query stays disabled
 * and the consuming card renders nothing.
 */
export function useLotpotIssuedCredit() {
  const { account } = useThirdweb();
  const integratorAddress = import.meta.env.VITE_LOTPOT_INTEGRATOR_ADDRESS as
    | Address
    | undefined;
  const userAddress = account?.address as Address | undefined;

  return useQuery<LotpotIssuedCreditSummary>({
    queryKey: ["lotpot-issued-credit", userAddress, integratorAddress],
    enabled:
      !!userAddress &&
      !!integratorAddress &&
      integratorAddress.toLowerCase() !== zeroAddress.toLowerCase(),
    queryFn: async () => {
      const rawAmount = (await viemPublicClient.readContract({
        address: integratorAddress as Address,
        abi: INTEGRATOR_ABI,
        functionName: "issuedCredit",
        args: [userAddress as Address],
      })) as bigint;

      const formattedAmount = formatUnits(rawAmount, USDC_DECIMALS);
      const amountNumber = Number(formattedAmount);
      const displayAmount =
        Number.isFinite(amountNumber) && amountNumber > 0
          ? amountNumber.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : "0";

      return {
        hasCredit: rawAmount > 0n,
        rawAmount,
        formattedAmount,
        displayAmount,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
