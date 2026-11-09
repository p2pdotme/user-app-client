import { useQuery } from "@tanstack/react-query";
import {
  getDisputeHistory,
  getSubgraphOrderById,
} from "@/core/p2pdotme/subgraph";

/**
 * The subgraph's row for one order. Used for fields the chain does not
 * expose after the fact, such as a settled dispute's fault type and time.
 */
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
