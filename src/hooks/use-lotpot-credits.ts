import { useQuery } from "@tanstack/react-query";
import type { Address } from "thirdweb";
import { formatUnits, zeroAddress } from "viem";
import { viemPublicClient } from "@/core/adapters/thirdweb";
import { CONTRACT_ADDRESSES } from "@/core/p2pdotme/contracts/abis";
import { lotpotIntegratorAbi } from "@/core/p2pdotme/contracts/abis/lotpot-integrator";
import { useThirdweb } from "./use-thirdweb";

const USDC_DECIMALS = 6;

interface LotpotCreditsSummary {
  hasCredits: boolean;
  rawAmount: bigint;
  formattedAmount: string;
  displayAmount: string;
  usdValue: number;
  formattedUsdValue: string;
}

export function useLotpotCredits() {
  const { account } = useThirdweb();
  const userAddress = account?.address as Address | undefined;
  const integratorAddress = CONTRACT_ADDRESSES.LOTPOT_INTEGRATOR;

  return useQuery<LotpotCreditsSummary>({
    queryKey: ["lotpot-credits", userAddress, integratorAddress],
    enabled:
      !!userAddress &&
      !!integratorAddress &&
      integratorAddress.toLowerCase() !== zeroAddress.toLowerCase(),
    queryFn: async () => {
      if (!userAddress || !integratorAddress) {
        return {
          hasCredits: false,
          rawAmount: 0n,
          formattedAmount: "0",
          displayAmount: "0",
          usdValue: 0,
          formattedUsdValue: "$0",
        };
      }

      const credits = await viemPublicClient.readContract({
        address: integratorAddress,
        abi: lotpotIntegratorAbi,
        functionName: "issuedCredit",
        args: [userAddress],
      });

      const formattedAmount = formatUnits(credits, USDC_DECIMALS);
      const amountNumber = Number(formattedAmount);

      const displayAmount =
        Number.isFinite(amountNumber) && amountNumber > 0
          ? amountNumber.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: amountNumber < 1 ? 4 : 2,
            })
          : "0";

      const formattedUsdValue =
        amountNumber > 0
          ? `~$${amountNumber.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: amountNumber < 1 ? 2 : 0,
            })}`
          : "$0";

      return {
        hasCredits: credits > 0n,
        rawAmount: credits,
        formattedAmount,
        displayAmount,
        usdValue: amountNumber,
        formattedUsdValue,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
