import { useQuery } from "@tanstack/react-query";
import { getAdditionalOrderDetails } from "@/core/adapters/thirdweb";

export function useOrderTip(orderId: number) {
  return useQuery({
    queryKey: ["order", "tip", orderId],
    queryFn: async () => {
      const result = await getAdditionalOrderDetails({ orderId });
      return result.match(
        (details) => {
          const typedDetails = details;
          return typedDetails.tipsPaid;
        },
        (error) => {
          console.error("Failed to get order tip:", error);
          throw error;
        },
      );
    },
    enabled: !!orderId && orderId > 0,
  });
}
