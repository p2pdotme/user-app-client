import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import type { Address } from "thirdweb";
import { getOrderFeeDetails } from "@/core/fees";
import type {
  OrdersCollectionWithDateFilterQueryParams,
  SubgraphOrder,
} from "@/core/p2pdotme/shared";
import { getOrdersCollectionWithDateFilter } from "@/core/p2pdotme/subgraph";
import { createAppError } from "@/lib/errors";
import { useThirdweb } from "./use-thirdweb";

const BATCH_SIZE = 1000; // Maximum transactions per query (subgraph limit)

interface TxnHistoryFilters {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

export function useTxnHistory(filters?: TxnHistoryFilters) {
  const { account } = useThirdweb();

  // Calculate timestamp for date range with proper start/end of day
  // Default to "this month" like SANE_DEFAULT_FILTERS
  const defaultFromDate = moment().startOf("month").startOf("day").toDate();
  const defaultToDate = moment().endOf("month").endOf("day").toDate();

  const fromDate = filters?.dateRange?.from
    ? moment(filters.dateRange.from).startOf("day").toDate()
    : defaultFromDate;
  const toDate = filters?.dateRange?.to
    ? moment(filters.dateRange.to).endOf("day").toDate()
    : defaultToDate;

  const dateRangeKey = filters?.dateRange
    ? `${Math.floor(fromDate.getTime() / 1000)}-${Math.floor(toDate.getTime() / 1000)}`
    : "thisMonth-default";

  const placedAtGte = Math.floor(fromDate.getTime() / 1000);
  const placedAtLte = Math.floor(toDate.getTime() / 1000);

  return useQuery({
    queryKey: ["subgraph", "txnHistory", account?.address, dateRangeKey],
    queryFn: async () => {
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

      // Helper to fetch all pages from a given fetcher
      async function fetchAllPages(
        fetcher: (
          params: OrdersCollectionWithDateFilterQueryParams,
        ) => ReturnType<typeof getOrdersCollectionWithDateFilter>,
      ): Promise<SubgraphOrder[]> {
        const transactions: SubgraphOrder[] = [];
        let skip = 0;
        let hasMore = true;

        while (hasMore) {
          const queryParams: Partial<OrdersCollectionWithDateFilterQueryParams> =
            {
              userAddress: account?.address as Address,
              first: BATCH_SIZE,
              skip,
              orderBy: "placedAt",
              orderDirection: "desc",
            };

          if (placedAtGte) {
            queryParams.placedAtGte = placedAtGte;
          }
          if (placedAtLte) {
            queryParams.placedAtLte = placedAtLte;
          }

          const batchResult = await fetcher(
            queryParams as OrdersCollectionWithDateFilterQueryParams,
          ).match(
            (value) => {
              console.log(
                `[useTxnHistory] Fetched batch ${Math.floor(skip / BATCH_SIZE) + 1}: ${value.length} transactions`,
              );
              return value;
            },
            (error) => {
              console.error(
                `[useTxnHistory] Batch error at skip ${skip}:`,
                error,
              );
              throw error;
            },
          );

          transactions.push(...batchResult);
          hasMore = batchResult.length === BATCH_SIZE;
          skip += BATCH_SIZE;
        }

        return transactions;
      }

      // Fetch from new subgraph
      const allTransactions = await fetchAllPages(
        getOrdersCollectionWithDateFilter,
      );

      console.log(
        `[useTxnHistory] Fetched ${allTransactions.length} total transactions from new subgraph for date range (${dateRangeKey})`,
      );

      // Fallback to old subgraph if new returned zero results
      if (allTransactions.length === 0 || allTransactions.length < 1000) {
        console.log(
          `[useTxnHistory] No data from new subgraph, falling back to old subgraph...`,
        );
      }

      // Enrich subgraph data with contract data for actual amounts
      if (allTransactions.length > 0) {
        console.log(
          `[useTxnHistory] Enriching ${allTransactions.length} transactions with contract data...`,
        );

        const enrichedTransactions = await Promise.all(
          allTransactions.map(async (order) => {
            try {
              const feeDetails = await getOrderFeeDetails(
                Number(order.orderId),
              ).match(
                (details) => details,
                (error) => {
                  console.warn(
                    `[useTxnHistory] Failed to get fee details for order ${order.orderId}:`,
                    error,
                  );
                  // Return order with null fee details if contract call fails
                  return {
                    ...order,
                    contractFeeDetails: null,
                  };
                },
              );

              return {
                ...order,
                contractFeeDetails: feeDetails,
              };
            } catch (error) {
              console.warn(
                `[useTxnHistory] Error enriching order ${order.orderId}:`,
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
          `[useTxnHistory] Successfully enriched transactions with contract data`,
        );
        return enrichedTransactions;
      }

      return allTransactions;
    },
    enabled: !!account?.address,
  });
}
