import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrderById } from "@/core/adapters/thirdweb";
import type { Order } from "@/core/adapters/thirdweb/validation";
import { useThirdweb } from "./use-thirdweb";

const ORDER_POLL_SECONDS = 10; // we refetch from contract every 10 seconds while waiting on merchant actions

export function useGetOrderById(orderId: number) {
  const { account } = useThirdweb();
  const queryClient = useQueryClient();

  const {
    data: order,
    isPending: isOrderPending,
    isError: isOrderError,
    error: orderError,
  } = useQuery({
    queryKey: ["order", "getOrderById", orderId],
    queryFn: async () => {
      return getOrderById({ orderId }).match(
        (value) => {
          console.log("[useGetOrderById] getOrderById success", value);
          queryClient.invalidateQueries({
            queryKey: ["subgraph", "getProcessingOrdersCollection"],
          });
          return value;
        },
        (error) => {
          console.error("[useGetOrderById] getOrderById error", error);
          throw error;
        },
      );
    },
    enabled: !!account,
    // Poll every 10s only while waiting on merchant actions
    refetchInterval: (query) => {
      const data = query.state.data as Order;
      if (!data) return false;

      if (data.status === "PLACED") {
        return 3000;
      }

      // Poll when waiting for merchant to complete their action (all order types when status is PAID)
      if (data.status === "PAID") {
        return ORDER_POLL_SECONDS * 1000;
      }

      return false;
    },
  });

  return {
    order,
    isOrderPending,
    isOrderError,
    orderError,
  };
}
