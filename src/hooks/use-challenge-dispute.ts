import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResultAsync } from "neverthrow";
import {
  appealDispute as appealDisputeTx,
  finalizeDispute as finalizeDisputeTx,
  getDisputeDecision,
  getDisputeTier,
} from "@/core/adapters/thirdweb";
import type {
  AppealDisputeParams,
  FinalizeDisputeParams,
} from "@/core/p2pdotme/shared/validation";
import { useThirdweb } from "@/hooks/use-thirdweb";
import {
  type DisputeEscalation,
  parseDisputeEscalation,
} from "@/lib/dispute-escalation";
import { captureError, withSentrySpan } from "@/lib/sentry";

export const DISPUTE_ESCALATION_QUERY_KEY = "dispute-escalation";

// Deadlines move on the order of hours, so a minute between refetches keeps
// the "challenge until" copy honest without hammering the RPC.
const ESCALATION_REFETCH_MS = 60_000;

/**
 * Reads a raised dispute's tier + pending decision from the Diamond.
 * Pass `enabled: false` for orders without a RAISED dispute — the contract
 * returns all-zero tuples for them, which is not an interesting state.
 */
export function useDisputeEscalation(orderId: string, enabled = true) {
  return useQuery<DisputeEscalation>({
    queryKey: [DISPUTE_ESCALATION_QUERY_KEY, orderId],
    queryFn: async () => {
      const id = parseInt(orderId, 10);
      return ResultAsync.combine([
        getDisputeTier({ orderId: id }),
        getDisputeDecision({ orderId: id }),
      ]).match(
        ([tier, decision]) => parseDisputeEscalation(tier, decision),
        (error) => {
          console.error("[useDisputeEscalation] read failed", error);
          throw error;
        },
      );
    },
    enabled: enabled && orderId.length > 0,
    refetchInterval: ESCALATION_REFETCH_MS,
  });
}

/** appealDispute / finalizeDispute mutations with Sentry + cache invalidation. */
export function useChallengeDispute() {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();

  const invalidateDisputeState = () => {
    queryClient.invalidateQueries({ queryKey: [DISPUTE_ESCALATION_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: ["subgraph", "txnHistory"] });
    queryClient.invalidateQueries({ queryKey: ["order", "getOrderById"] });
  };

  const appealDisputeMutation = useMutation({
    mutationKey: ["appealDispute"],
    mutationFn: async (params: AppealDisputeParams) => {
      if (!account) throw new Error("WALLET_NOT_CONNECTED");
      return withSentrySpan(
        "transaction.appeal_dispute",
        "Appeal Dispute Transaction",
        async () =>
          appealDisputeTx(params, account).match(
            (value) => value,
            (error) => {
              captureError(error, {
                operation: "appeal_dispute",
                component: "useChallengeDispute",
                userId: account.address,
                extra: { orderId: params.orderId },
              });
              throw error;
            },
          ),
      );
    },
    onSuccess: invalidateDisputeState,
  });

  const finalizeDisputeMutation = useMutation({
    mutationKey: ["finalizeDispute"],
    mutationFn: async (params: FinalizeDisputeParams) => {
      if (!account) throw new Error("WALLET_NOT_CONNECTED");
      return withSentrySpan(
        "transaction.finalize_dispute",
        "Finalize Dispute Transaction",
        async () =>
          finalizeDisputeTx(params, account).match(
            (value) => value,
            (error) => {
              captureError(error, {
                operation: "finalize_dispute",
                component: "useChallengeDispute",
                userId: account.address,
                extra: { orderId: params.orderId },
              });
              throw error;
            },
          ),
      );
    },
    onSuccess: invalidateDisputeState,
  });

  return { appealDisputeMutation, finalizeDisputeMutation };
}
