import { useQuery } from "@tanstack/react-query";
import {
  getDisputeHistory,
  getSubgraphOrderById,
} from "@/core/p2pdotme/subgraph";

/**
 * The subgraph's row for one order. Used for fields the chain does not
 * expose after the fact, such as a settled dispute's fault type and time.
 */
// The chain reports a dispute as settled as soon as the tx lands; the indexer
// writes the settle time and fault a few seconds later. Without a refetch, a
// page opened in that gap kept an empty date and "Default" fault until reload.
const SETTLE_INDEX_POLL_MS = 5_000;
const SETTLE_INDEX_MAX_POLLS = 24; // ~2 minutes, then stop

export function useSubgraphOrder(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ["subgraph", "orderById", orderId],
    queryFn: async () =>
      getSubgraphOrderById({ orderId }).match(
        (order) => order,
        (error) => {
          console.error("[useSubgraphOrder] query failed", error);
          throw error;
        },
      ),
    enabled: enabled && /^\d+$/.test(orderId),
    // Callers enable this only for settled disputes, so keep asking until the
    // indexer has caught up with the settle.
    refetchInterval: (query) =>
      query.state.data?.disputeSettledAt ||
      query.state.dataUpdateCount >= SETTLE_INDEX_MAX_POLLS
        ? false
        : SETTLE_INDEX_POLL_MS,
  });
}

/** The indexed dispute ladder steps for one order, oldest first. */
export function useDisputeHistory(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ["subgraph", "disputeHistory", orderId],
    queryFn: async () =>
      getDisputeHistory({ orderId }).match(
        (steps) => steps,
        (error) => {
          console.error("[useDisputeHistory] query failed", error);
          throw error;
        },
      ),
    enabled: enabled && /^\d+$/.test(orderId),
    refetchInterval: 60_000,
  });
}
