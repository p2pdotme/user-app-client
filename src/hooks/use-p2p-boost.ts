import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  p2pBoostClaimUnstake as p2pBoostClaimUnstakeTx,
  p2pBoostRequestUnstake as p2pBoostRequestUnstakeTx,
  p2pBoostStake as p2pBoostStakeTx,
  p2pBoostTopUp as p2pBoostTopUpTx,
} from "@/core/adapters/thirdweb";
import { useThirdweb } from "@/hooks";
import { captureError, withSentrySpan } from "@/lib/sentry";

export function useP2PBoost() {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();

  // STAKE
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
          return p2pBoostStakeTx(params, account).match(
            (value) => {
              console.log("[useP2PBoost] p2pBoostStake success", value);
              return value;
            },
            (error) => {
              console.error("[useP2PBoost] p2pBoostStake error", error);

              captureError(error, {
                operation: "p2p_boost_stake",
                component: "useP2PBoost",
                userId: account.address,
                extra: { tokens: params.tokens.toString() },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-balance"] });
    },
  });

  // TOP UP
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
          return p2pBoostTopUpTx(params, account).match(
            (value) => {
              console.log("[useP2PBoost] p2pBoostTopUp success", value);
              return value;
            },
            (error) => {
              console.error("[useP2PBoost] p2pBoostTopUp error", error);

              captureError(error, {
                operation: "p2p_boost_top_up",
                component: "useP2PBoost",
                userId: account.address,
                extra: { tokens: params.tokens.toString() },
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-balance"] });
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
          return p2pBoostRequestUnstakeTx(account).match(
            (value) => {
              console.log(
                "[useP2PBoost] p2pBoostRequestUnstake success",
                value,
              );
              return value;
            },
            (error) => {
              console.error(
                "[useP2PBoost] p2pBoostRequestUnstake error",
                error,
              );

              captureError(error, {
                operation: "p2p_boost_request_unstake",
                component: "useP2PBoost",
                userId: account.address,
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
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
          return p2pBoostClaimUnstakeTx(account).match(
            (value) => {
              console.log("[useP2PBoost] p2pBoostClaimUnstake success", value);
              return value;
            },
            (error) => {
              console.error("[useP2PBoost] p2pBoostClaimUnstake error", error);

              captureError(error, {
                operation: "p2p_boost_claim_unstake",
                component: "useP2PBoost",
                userId: account.address,
              });

              throw error;
            },
          );
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["p2p-boost"] });
      queryClient.invalidateQueries({ queryKey: ["p2p-balance"] });
    },
  });

  return {
    p2pBoostStakeMutation,
    p2pBoostTopUpMutation,
    p2pBoostRequestUnstakeMutation,
    p2pBoostClaimUnstakeMutation,
  };
}
