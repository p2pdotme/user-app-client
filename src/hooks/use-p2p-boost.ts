import { useStake } from "@p2pdotme/sdk/react";
import type {
  GetStakeBoostConfigParams,
  StakeStatus,
} from "@p2pdotme/sdk/stake";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ResultAsync } from "neverthrow";
import { sendAndConfirmTransaction } from "thirdweb";
import type { Account } from "thirdweb/wallets";
import { formatUnits, parseUnits } from "viem";
import {
  approveP2PToken as approveP2PTokenTx,
  getP2PTokenAllowance,
} from "@/core/adapters/thirdweb";
import { chain } from "@/core/adapters/thirdweb/chain";
import {
  estimatedPrepareTransaction,
  thirdwebClient,
} from "@/core/adapters/thirdweb/client";
import { CONTRACT_ADDRESSES } from "@/core/p2pdotme/contracts";
import { useThirdweb } from "@/hooks";
import { createAppError, parseContractError } from "@/lib/errors";
import { i18n } from "@/lib/i18n";
import { captureError, withSentrySpan } from "@/lib/sentry";
import { useSettings } from "@/contexts";

// Map SDK string status back to the numeric status that existing consumers expect.
const STATUS_TO_NUMBER: Record<StakeStatus, number> = {
  none: 0,
  active: 1,
  cooldown: 2,
  seized: 3,
};

// Submits a prepared `{ to, data, value }` tx via thirdweb's account-based flow.
async function submitPrepared(
  prepared: { to: `0x${string}`; data: `0x${string}` },
  account: Account,
  errorLabel: string,
) {
  return estimatedPrepareTransaction({
    from: account.address as `0x${string}`,
    to: prepared.to,
    chain,
    client: thirdwebClient,
    data: prepared.data,
  })
    .andThen((preppedTx) =>
      ResultAsync.fromPromise(
        sendAndConfirmTransaction({ account, transaction: preppedTx }),
        (error) =>
          createAppError<"ThirdwebAdapter">(
            i18n.t(parseContractError(error) ?? errorLabel),
            {
              domain: "ThirdwebAdapter",
              code: "TWSendAndConfirmTransactionError",
              cause: error,
              context: { account, transaction: preppedTx },
            },
          ),
      ),
    )
    .match(
      (v) => v,
      (e) => {
        throw e;
      },
    );
}

export function useP2PBoost() {
  const { t } = useTranslation();
  const { account } = useThirdweb();
  const queryClient = useQueryClient();
  const stake = useStake();

  // STAKE (approves P2P token to Diamond first, then stakes)
  const p2pBoostStakeMutation = useMutation({
    mutationKey: ["p2pBoostStake"],
    mutationFn: async (params: { tokens: bigint }) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.p2p_boost_stake",
        "P2P Boost Stake Transaction",
        async () => {
          // 1. Check current allowance; approve only if insufficient
          const currentAllowance = await getP2PTokenAllowance({
            owner: account.address as `0x${string}`,
            spender: CONTRACT_ADDRESSES.DIAMOND,
          }).match(
            (value) => value,
            (error) => {
              console.error("[useP2PBoost] getP2PTokenAllowance error", error);
              captureError(error, {
                operation: "p2p_token_allowance",
                component: "useP2PBoost",
                userId: account.address,
              });
              throw error;
            },
          );

          if (currentAllowance < params.tokens) {
            await approveP2PTokenTx(
              { spender: CONTRACT_ADDRESSES.DIAMOND, amount: params.tokens },
              account,
            ).match(
              (value) => {
                console.log("[useP2PBoost] approveP2PToken success", value);
                return value;
              },
              (error) => {
                console.error("[useP2PBoost] approveP2PToken error", error);

                captureError(error, {
                  operation: "p2p_token_approve",
                  component: "useP2PBoost",
                  userId: account.address,
                  extra: { tokens: params.tokens.toString() },
                });

                throw error;
              },
            );
          } else {
            console.log(
              "[useP2PBoost] sufficient allowance, skipping approve",
              { currentAllowance: currentAllowance.toString() },
            );
          }

          // 2. Stake — encode via SDK, submit via thirdweb
          const prepared = await stake.stake
            .prepare({ tokens: params.tokens })
            .match(
              (v) => v,
              (error) => {
                console.error("[useP2PBoost] sdk stake.prepare error", error);
                captureError(error, {
                  operation: "p2p_boost_stake_prepare",
                  component: "useP2PBoost",
                  userId: account.address,
                  extra: { tokens: params.tokens.toString() },
                });
                throw error;
              },
            );

          return submitPrepared(
            prepared,
            account,
            "Failed to sendAndConfirm p2pBoostStake transaction",
          );
        },
      );
    },
    onSuccess: () => {
      toast.success(t("P2P_STAKE_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
      queryClient.invalidateQueries({ queryKey: ["p2p", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-user-stake"] });
    },
    onError: (error) => {
      toast.error(t(parseContractError(error) ?? "SOMETHING_WENT_WRONG"));
    },
  });

  // TOP UP (approves P2P token to Diamond first if needed, then top-ups)
  const p2pBoostTopUpMutation = useMutation({
    mutationKey: ["p2pBoostTopUp"],
    mutationFn: async (params: { tokens: bigint }) => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.p2p_boost_top_up",
        "P2P Boost Top Up Transaction",
        async () => {
          // 1. Check current allowance; approve only if insufficient
          const currentAllowance = await getP2PTokenAllowance({
            owner: account.address as `0x${string}`,
            spender: CONTRACT_ADDRESSES.DIAMOND,
          }).match(
            (value) => value,
            (error) => {
              console.error("[useP2PBoost] getP2PTokenAllowance error", error);
              captureError(error, {
                operation: "p2p_token_allowance",
                component: "useP2PBoost",
                userId: account.address,
              });
              throw error;
            },
          );

          if (currentAllowance < params.tokens) {
            await approveP2PTokenTx(
              { spender: CONTRACT_ADDRESSES.DIAMOND, amount: params.tokens },
              account,
            ).match(
              (value) => value,
              (error) => {
                console.error("[useP2PBoost] approveP2PToken error", error);
                captureError(error, {
                  operation: "p2p_token_approve",
                  component: "useP2PBoost",
                  userId: account.address,
                  extra: { tokens: params.tokens.toString() },
                });
                throw error;
              },
            );
          }

          // 2. Top up — encode via SDK, submit via thirdweb
          const prepared = await stake.topUp
            .prepare({ tokens: params.tokens })
            .match(
              (v) => v,
              (error) => {
                console.error("[useP2PBoost] sdk topUp.prepare error", error);
                captureError(error, {
                  operation: "p2p_boost_top_up_prepare",
                  component: "useP2PBoost",
                  userId: account.address,
                  extra: { tokens: params.tokens.toString() },
                });
                throw error;
              },
            );

          return submitPrepared(
            prepared,
            account,
            "Failed to sendAndConfirm p2pBoostTopUp transaction",
          );
        },
      );
    },
    onSuccess: () => {
      toast.success(t("P2P_TOPUP_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
      queryClient.invalidateQueries({ queryKey: ["p2p", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-user-stake"] });
    },
    onError: (error) => {
      toast.error(t(parseContractError(error) ?? "SOMETHING_WENT_WRONG"));
    },
  });

  // REQUEST UNSTAKE
  const p2pBoostRequestUnstakeMutation = useMutation({
    mutationKey: ["p2pBoostRequestUnstake"],
    mutationFn: async () => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.p2p_boost_request_unstake",
        "P2P Boost Request Unstake Transaction",
        async () => {
          const prepared = await stake.requestUnstake.prepare().match(
            (v) => v,
            (error) => {
              console.error(
                "[useP2PBoost] sdk requestUnstake.prepare error",
                error,
              );
              captureError(error, {
                operation: "p2p_boost_request_unstake_prepare",
                component: "useP2PBoost",
                userId: account.address,
              });
              throw error;
            },
          );

          return submitPrepared(
            prepared,
            account,
            "Failed to sendAndConfirm p2pBoostRequestUnstake transaction",
          );
        },
      );
    },
    onSuccess: () => {
      toast.success(t("P2P_UNSTAKE_REQUEST_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-user-stake"] });
    },
    onError: (error) => {
      toast.error(t(parseContractError(error) ?? "SOMETHING_WENT_WRONG"));
    },
  });

  // CLAIM UNSTAKE
  const p2pBoostClaimUnstakeMutation = useMutation({
    mutationKey: ["p2pBoostClaimUnstake"],
    mutationFn: async () => {
      if (!account) {
        throw new Error("WALLET_NOT_CONNECTED");
      }

      return withSentrySpan(
        "transaction.p2p_boost_claim_unstake",
        "P2P Boost Claim Unstake Transaction",
        async () => {
          const prepared = await stake.claimUnstake.prepare().match(
            (v) => v,
            (error) => {
              console.error(
                "[useP2PBoost] sdk claimUnstake.prepare error",
                error,
              );
              captureError(error, {
                operation: "p2p_boost_claim_unstake_prepare",
                component: "useP2PBoost",
                userId: account.address,
              });
              throw error;
            },
          );

          return submitPrepared(
            prepared,
            account,
            "Failed to sendAndConfirm p2pBoostClaimUnstake transaction",
          );
        },
      );
    },
    onSuccess: () => {
      toast.success(t("P2P_UNSTAKE_CLAIM_SUCCESS"));
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
      queryClient.invalidateQueries({ queryKey: ["p2p", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-user-stake"] });
    },
    onError: (error) => {
      toast.error(t(parseContractError(error) ?? "SOMETHING_WENT_WRONG"));
    },
  });

  return {
    p2pBoostStakeMutation,
    p2pBoostTopUpMutation,
    p2pBoostRequestUnstakeMutation,
    p2pBoostClaimUnstakeMutation,
  };
}

export function useUserStake() {
  const { account } = useThirdweb();
  const stake = useStake();
  const userAddress = account?.address as `0x${string}` | undefined;

  const query = useQuery({
    queryKey: ["p2p-user-stake", userAddress],
    enabled: !!userAddress,
    staleTime: 10_000,
    queryFn: async () => {
      if (!userAddress) {
        throw new Error("WALLET_NOT_CONNECTED");
      }
      const userStake = await stake
        .getUserStake({ user: userAddress })
        .match(
          (value) => value,
          (error) => {
            console.error("[useUserStake] getUserStake error", error);
            captureError(error, {
              operation: "p2p_get_user_stake",
              component: "useUserStake",
              userId: userAddress,
            });
            throw error;
          },
        );

      // Preserve the legacy numeric `status` shape expected by consumers.
      return {
        stakedAmount: userStake.stakedAmount,
        cooldownEnd: userStake.cooldownEnd,
        status: STATUS_TO_NUMBER[userStake.status],
      };
    },
  });

  return {
    userStake: query.data ?? null,
    isUserStakeLoading: query.isLoading,
    refetchUserStake: query.refetch,
  };
}

/**
 * Reads the per-currency stake-boost configuration from the Diamond.
 * Cached for ~5 minutes — config rarely changes and the values are used
 * for client-side preview math, so a stale value is acceptable.
 */
export function useStakeBoostConfig(currency: string | undefined) {
  const stake = useStake();

  const query = useQuery({
    queryKey: ["p2p-stake-boost-config", currency],
    enabled: !!currency,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!currency) throw new Error("CURRENCY_REQUIRED");

      return stake
        .getStakeBoostConfig({
          currency: currency as GetStakeBoostConfigParams["currency"],
        })
        .match(
        (v) => v,
        (e) => {
          console.error("[useStakeBoostConfig] error", e);
          captureError(e, {
            operation: "p2p_get_stake_boost_config",
            component: "useStakeBoostConfig",
            extra: { currency },
          });
          throw e;
        },
      );
    },
  });

  return {
    stakeBoostConfig: query.data ?? null,
    isStakeBoostConfigLoading: query.isLoading,
  };
}

/**
 * Reads global stake parameters (token decimals, caps, cooldowns) from the
 * Diamond. Cached for ~5 minutes — these almost never change.
 */
export function useStakeBoostGlobals() {
  const stake = useStake();

  const query = useQuery({
    queryKey: ["p2p-stake-boost-globals"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const globals = await stake.getStakeBoostGlobals().match(
        (v) => v,
        (e) => {
          console.error("[useStakeBoostGlobals] error", e);
          captureError(e, {
            operation: "p2p_get_stake_boost_globals",
            component: "useStakeBoostGlobals",
          });
          throw e;
        },
      );

      return {
        ...globals,
        normalCooldown: Number(globals.normalCooldown),
        blacklistCooldown: Number(globals.blacklistCooldown),
      };
    },
  });

  return {
    stakeBoostGlobals: query.data ?? null,
    isStakeBoostGlobalsLoading: query.isLoading,
  };
}

/**
 * Computes the per-transaction USD limit unlocked by staking `stakeAmount`
 * P2P tokens (human-readable units) for the user's selected currency.
 *
 * Formula (per contract):
 *   usd6 = (tokens * 1_000_000 * den) / (num * 10^tokenDecimals)
 *   if (usd6 > maxBoostUsd) usd6 = maxBoostUsd
 *   unlockedUSD = usd6 / 1_000_000
 *
 * The same unlocked USD value applies to BUY, SELL, and PAY limits.
 */
export function useStakeBoostPreview(stakeAmount: string | undefined) {
  const {
    settings: { currency },
  } = useSettings();
  const { stakeBoostGlobals, isStakeBoostGlobalsLoading } =
    useStakeBoostGlobals();
  const { stakeBoostConfig, isStakeBoostConfigLoading } = useStakeBoostConfig(
    currency.currency,
  );

  const unlockedUSD = useMemo(() => {
    if (!stakeBoostGlobals || !stakeBoostConfig) return null;
    if (!stakeAmount || Number(stakeAmount) <= 0) return 0;

    const { tokenDecimals } = stakeBoostGlobals;
    const num = BigInt(stakeBoostConfig.tokensPerUsdNumerator);
    const den = BigInt(stakeBoostConfig.tokensPerUsdDenominator);
    const maxBoostUsd = BigInt(stakeBoostConfig.maxBoostUsd);

    if (num === 0n) return 0;

    let tokens: bigint;
    try {
      tokens = parseUnits(stakeAmount, tokenDecimals);
    } catch {
      return 0;
    }

    const usd6 =
      (tokens * 1_000_000n * den) / (num * 10n ** BigInt(tokenDecimals));
    const clamped = usd6 > maxBoostUsd ? maxBoostUsd : usd6;
    return Number(formatUnits(clamped, 6));
  }, [stakeAmount, stakeBoostGlobals, stakeBoostConfig]);

  return {
    stakeBoostGlobals,
    stakeBoostConfig,
    unlockedUSD,
    buyLimitBoost: unlockedUSD,
    sellLimitBoost: unlockedUSD,
    payLimitBoost: unlockedUSD,
    isLoading: isStakeBoostGlobalsLoading || isStakeBoostConfigLoading,
  };
}

/**
 * stakeBoostMetrics — derives the cap-related metrics from the
 * stake-boost preview for a given `amount` of P2P tokens.
 *
 * Returns:
 *  - `maxStakeForCap`: maximum stake (in P2P) that fully consumes the
 *    country cap (`maxBoostUsd * tokensPerUsd`). `null` until config loads.
 *  - `progressPct`: percentage (0–100) of the country cap unlocked by
 *    the current `amount`.
 */
export const useStakeBoostMetrics = (amount: string) => {
  const { stakeBoostConfig, unlockedUSD } = useStakeBoostPreview(amount);

  const tokensPerUsd = stakeBoostConfig
    ? Number(stakeBoostConfig.tokensPerUsdNumerator) /
      Number(stakeBoostConfig.tokensPerUsdDenominator)
    : null;

  // USDC limit unlocked per 1 P2P token (= 1 / tokensPerUsd).
  const usdPerToken =
    tokensPerUsd !== null && tokensPerUsd > 0 ? 1 / tokensPerUsd : null;

  const maxBoostUsd = stakeBoostConfig
    ? Number(formatUnits(BigInt(stakeBoostConfig.maxBoostUsd), 6))
    : 0;

  const maxStakeForCap =
    tokensPerUsd !== null && maxBoostUsd !== null
      ? maxBoostUsd * tokensPerUsd
      : null;

  const progressPct =
    maxBoostUsd !== null && maxBoostUsd > 0
      ? Math.min(100, ((unlockedUSD ?? 0) / maxBoostUsd) * 100)
      : 0;

  const headroom = Math.max(0, (maxBoostUsd ?? 0) - (unlockedUSD ?? 0));

  return {
    maxStakeForCap,
    progressPct,
    tokensPerUsd,
    usdPerToken,
    maxBoostUsd,
    headroom,
  };
};
