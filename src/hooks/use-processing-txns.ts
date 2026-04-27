import { useInfiniteQuery } from "@tanstack/react-query";
import moment from "moment";
import type { Address } from "thirdweb";
import { getOrderFeeDetails } from "@/core/fees";
import { getProcessingOrdersCollection } from "@/core/p2pdotme/subgraph";
import { createAppError } from "@/lib/errors";
import { useThirdweb } from "./use-thirdweb";

const PAGE_SIZE = 25; // Fetch 25 transactions per page

export function useProcessingTxns() {
  const { account } = useThirdweb();

  return useInfiniteQuery({
    queryKey: ["subgraph", "getProcessingOrdersCollection", account?.address],
    queryFn: async ({ pageParam = 0 }) => {
      if (!account?.address) {
        throw createAppError("ACCOUNT_ADDRESS_NOT_AVAILABLE", {
          domain: "Subgraph",
          code: "AccountAddressNotAvailable",
          cause: {
            address: account?.address,
          },
          context: {
            account,
          },
        });
      }

      const subgraphResult = await getProcessingOrdersCollection({
        userAddress: account.address as Address,
        first: PAGE_SIZE,
        skip: pageParam,
        orderBy: "placedAt",
        orderDirection: "desc",
        oneHourAgo: moment().subtract(1, "hour").unix(),
      }).match(
        (value) => value,
        (error) => {
          console.error(
            "[useProcessingTxns] getProcessingOrdersCollection error",
            error,
          );
          throw error;
        },
      );

      // Enrich subgraph data with contract data for actual amounts
      if (subgraphResult.length > 0) {
        console.log(
          `[useProcessingTxns] Enriching page ${pageParam / PAGE_SIZE} with ${subgraphResult.length} transactions...`,
        );

        const enrichedTransactions = await Promise.all(
          subgraphResult.map(async (order) => {
            try {
              const feeDetails = await getOrderFeeDetails(
                Number(order.orderId),
              ).match(
                (details) => details,
                (error) => {
                  console.warn(
                    `[useProcessingTxns] Failed to get fee details for order ${order.orderId}:`,
                    error,
                  );
                  return null;
                },
              );

              return {
                ...order,
                contractFeeDetails: feeDetails,
              };
            } catch (error) {
              console.warn(
                `[useProcessingTxns] Error enriching order ${order.orderId}:`,
                error,
              );
              return {
                ...order,
                contractFeeDetails: null,
              };
            }
          }),
        );

        console.log(
          `[useProcessingTxns] Successfully enriched page ${pageParam / PAGE_SIZE}`,
        );
        return {
          data: enrichedTransactions,
          nextPage:
            subgraphResult.length === PAGE_SIZE
              ? pageParam + PAGE_SIZE
              : undefined,
        };
      }

      return {
        data: subgraphResult,
        nextPage:
          subgraphResult.length === PAGE_SIZE
            ? pageParam + PAGE_SIZE
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!account?.address,
  });
}
