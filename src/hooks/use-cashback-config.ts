import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { getCashbackConfig } from "@/core/adapters/thirdweb";

interface CashbackConfigSummary {
  cashbackToken: Address;
  quoterAddress: Address;
  quoterFee: number;
  cashbackPercentageBps: number;
  cashbackPercentagePercent: number;
}

type RawCashbackConfig =
  | {
      cashbackToken: Address;
      quoterAddress: Address;
      quoterFee: bigint | number;
      cashbackPercentage: bigint | number;
    }
  | readonly [Address, Address, bigint | number, bigint | number];

export function useCashbackConfig() {
  return useQuery<CashbackConfigSummary>({
    queryKey: ["cashback-config"],
    queryFn: async () => {
      const result = await getCashbackConfig();

      const config = (await result.match(
        (value) => value as RawCashbackConfig,
        (error) => {
          throw error;
        },
      )) as {
        cashbackToken: Address;
        quoterAddress: Address;
        quoterFee: number;
        cashbackPercentage: number;
      };

      const normalized = Array.isArray(config)
        ? {
            cashbackToken: config[0],
            quoterAddress: config[1],
            quoterFee: Number(config[2]),
            cashbackPercentage: Number(config[3]),
          }
        : {
            cashbackToken: config.cashbackToken,
            quoterAddress: config.quoterAddress,
            quoterFee: Number(config.quoterFee),
            cashbackPercentage: Number(config.cashbackPercentage),
          };

      const cashbackPercentageBps = normalized.cashbackPercentage ?? 0;
      const cashbackPercentagePercent = cashbackPercentageBps / 100;

      return {
        cashbackToken: normalized.cashbackToken,
        quoterAddress: normalized.quoterAddress,
        quoterFee: normalized.quoterFee,
        cashbackPercentageBps,
        cashbackPercentagePercent,
      };
    },
  });
}
